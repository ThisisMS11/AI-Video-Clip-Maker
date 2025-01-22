'use client';
import { useRef, useState } from 'react';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import ImageUploader from '@/components/image-uploader';
import RightSideProcess from '@/components/right-side-process';
import { ImageHistoryModal } from './history-modal';
import ActionButtons from '@/components/action-buttons';
import Statistics from '@/components/statistics';
import {
    Card,
    CardContent,
    Separator,
    Tabs,
    TabsTrigger,
    TabsList,
    toast,
    Label,
    Input,
} from '@/imports/Shadcn_imports';
import { Atom } from 'lucide-react';
import { useImageTransformingHandler } from '@/hooks/useImageTransformingHandler';
import { usePredictionHandling } from '@/hooks/usePredictionHandling';
import { RETRIES, STATUS_MAP } from '@/constants';
import { PredictionResponse, ModelSettings } from '@/types';
import { WAIT_TIMES } from '@/constants';
import { delay } from '@/utils/utilFunctions';

// Separate retry configuration
const RETRY_CONFIG = {
    MAX_RETRIES: RETRIES.REPLICATE_SERVICE,
    BASE_DELAY: WAIT_TIMES.REPLICATE_SERVICE_RETRY,
    MAX_DELAY: 32000,
    JITTER_FACTOR: 0.2, // Add 20% random jitter
};

const calculateBackoff = (retryCount: number): number => {
    const exponentialDelay = RETRY_CONFIG.BASE_DELAY * Math.pow(2, retryCount);
    const maxDelay = Math.min(exponentialDelay, RETRY_CONFIG.MAX_DELAY);
    const jitter = maxDelay * RETRY_CONFIG.JITTER_FACTOR * Math.random();
    return maxDelay + jitter;
};

export default function ImageTransformer() {
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [uploadCareCdnUrl, setUploadCareCdnUrl] = useState<string | null>(
        null
    );

    const [_isRetrying, setIsRetrying] = useState(false);
    const [hasFailed , setHasFailed] = useState(false);

    const [settings, setSettings] = useState<ModelSettings>({
        image_url: '',
        target_age: 'default',
    });

    /* persistent states */
    const retryAttemptsRef = useRef(0);
    const cloudinaryUrlRef = useRef<string | null>(null);
    const isRetryingRef = useRef(false);
    const predictionIdRef = useRef<string | null>(null);

    /* Custom Hooks */

    const {
        status,
        setStatus,
        cloudinaryOriginalUrl,
        setCloudinaryOriginalUrl,
        enhancedImageUrl,
        setEnhancedImageUrl,
        setPredictionId,
        finalResponse,
        setFinalResponse,
        startTransformingImage,
    } = useImageProcessing();

    const { pollPredictionStatus, savePredictionData } =
        usePredictionHandling();
    const { handleProcessingImage } = useImageTransformingHandler();

    /* To remove the image from the state */
    const handleRemoveImage = () => {
        setEnhancedImageUrl(null);
        setPredictionId(null);
        setStatus(STATUS_MAP.default);
        setUploadCareCdnUrl(null);
        setCloudinaryOriginalUrl(null);
        cloudinaryUrlRef.current = null;
        retryAttemptsRef.current = 0;
        isRetryingRef.current = false;
        setIsRetrying(false);
        setSettings({
            image_url: undefined,
            target_age: 'default',
        });
    };

    /* Start processing image */
    const startProcessingImage = async () => {
        try {
            if (!uploadCareCdnUrl) {
                toast.error('Error', {
                    description: 'No image URL provided',
                    duration: 3000,
                });
                return;
            }

            if (
                settings.target_age !== 'default' &&
                (Number(settings.target_age) > 300 ||
                    Number(settings.target_age) < 0)
            ) {
                toast.error('Error', {
                    description: 'Please enter valid age (below <=300)',
                    duration: 3000,
                });
                return;
            }

            const args = {
                uploadCareCdnUrl,
                cloudinaryOriginalUrl,
                setCloudinaryOriginalUrl,
                setStatus,
                settings,
                setSettings,
                startTransformingImage,
                cloudinaryUrlRef,
            };

            /* upload the image to cloudinary and start the prediction */
            const predictionId = await handleProcessingImage(args);

            if (predictionId) {
                setPredictionId(predictionId);
                predictionIdRef.current = predictionId;
                handlePredictionResults(predictionId);
            } else {
                throw new Error('Failed to get prediction ID');
            }
        } catch (error) {
            console.error('Error in startProcessingImage:', error);
            toast.error('Error', {
                description: `Error in startProcessingImage`,
                duration: 3000,
            });
            setStatus(STATUS_MAP.error);
        }
    };

    /* handle prediction success */
    const handlePredictionFinalResult = async (
        data: PredictionResponse,
        outputUrl?: string
    ) => {
        const isSuccess = data.status === STATUS_MAP.succeeded;
        await savePredictionData(data, outputUrl);
        setStatus(isSuccess ? STATUS_MAP.succeeded : STATUS_MAP.failed);
        setFinalResponse(data);
        setEnhancedImageUrl(outputUrl ? outputUrl : null);

        if (isSuccess) {
            toast.success('Image Transformed Successfully', {
                description: 'Image Transformed Successfully',
                duration: 3000,
            });
        } else {
            toast.error('Failed to transform the image', {
                description: 'Please try again',
                duration: 3000,
            });
        }
    };

    const handlePredictionResults = async (predictionId: string) => {
        while (true && !hasFailed) {
            if (isRetryingRef.current) {
                // console.log('Retry already in progress, skipping...');
                await delay(5000);
                continue;
            }

            try {
                console.info(`Prediction ID : ${predictionId}`);

                const predictionData = await pollPredictionStatus(predictionId);

                if (!predictionData) {
                    throw new Error('No prediction data received');
                }

                const outputUrl = predictionData.output_url
                    ? JSON.parse(predictionData.output_url)
                    : null;

                if (predictionData.status === STATUS_MAP.succeeded) {
                    // Reset retry attempts on success
                    retryAttemptsRef.current = 0;
                    isRetryingRef.current = false;
                    setIsRetrying(false);
                    await handlePredictionFinalResult(
                        predictionData,
                        outputUrl
                    );
                    return;
                } else if (predictionData.status === STATUS_MAP.failed) {
                    if (
                        retryAttemptsRef.current < RETRY_CONFIG.MAX_RETRIES &&
                        !isRetryingRef.current
                    ) {
                        isRetryingRef.current = true;
                        setIsRetrying(true);
                        retryAttemptsRef.current += 1;

                        console.log(
                            `Initiating retry ${retryAttemptsRef.current}/${RETRY_CONFIG.MAX_RETRIES}`
                        );
                        setStatus(STATUS_MAP.processing);

                        const backoffDelay = calculateBackoff(
                            retryAttemptsRef.current - 1
                        );
                        // console.log({ backoffDelay });
                        await delay(backoffDelay);

                        // Use existing cloudinary URL
                        if (cloudinaryUrlRef.current) {
                            const updatedSettings = {
                                ...settings,
                                image_url: cloudinaryUrlRef.current,
                            };
                            setSettings(updatedSettings);
                        }

                        await startProcessingImage();

                        /* this is to let replicate start processing the image again */
                        await delay(10000);

                        // console.log('I am still not printed');
                        isRetryingRef.current = false;
                        setIsRetrying(false);
                    } else {
                        console.log(
                            `Failed after ${retryAttemptsRef.current} retries or retry in progress`
                        );
                        // Reset for future attempts
                        isRetryingRef.current = false;
                        setIsRetrying(false);
                        setHasFailed(true);
                        await handlePredictionFinalResult(predictionData);
                        return;
                    }
                } else {
                    // Default case (handles processing and any other status)
                    setStatus(STATUS_MAP.processing);
                    await delay(WAIT_TIMES.PREDICTION_SERVICE);
                }
            } catch (error) {
                console.error('Error during prediction polling:', error);
                await delay(1000);
            }
        }
    };

    return (
        <div className="flex flex-col h-full rounded-sm p-2 lg:w-[80%] w-[90%] items-center">
            <div className="w-full h-full">
                <Tabs defaultValue="text" className="mb-1 h-[4%] w-full">
                    <TabsList className="grid w-full grid-cols-1">
                        <TabsTrigger value="text" className="flex gap-2">
                            <Atom className="w-4 h-4" />
                            AI Age Transformation
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex w-full lg:h-[93%] mt-4 gap-2 flex-col lg:flex-row ">
                    {/* Left Side */}
                    <div className="flex-1 p-1 border-r lg:w-[35%] h-full ">
                        <Card className="h-full">
                            <CardContent className="p-2  h-full">
                                <ImageUploader
                                    uploadCareCdnUrl={uploadCareCdnUrl}
                                    onUploadSuccess={setUploadCareCdnUrl}
                                    onRemoveImage={handleRemoveImage}
                                />

                                <Separator className="my-2" />

                                {/* Enter the target age  */}
                                <div className="p-2 h-[43%]">
                                    <h2 className="text-xl mb-4">Settings</h2>

                                    <div className="space-y-2">
                                        <Label>Target Age (Optional)</Label>
                                        <Input
                                            type="number"
                                            value={settings.target_age}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setSettings((prev) => ({
                                                    ...prev,
                                                    target_age:
                                                        value === ''
                                                            ? 'default'
                                                            : value,
                                                }));
                                            }}
                                            placeholder="Random"
                                            min={0}
                                            max={300}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Age of the output image, when left
                                            blank a gif for age from 0, 10,
                                            20,...,to 100 will be displayed
                                        </p>
                                    </div>
                                </div>

                                <Separator className="my-2" />

                                <ActionButtons
                                    status={status}
                                    onProcess={startProcessingImage}
                                    onHistory={() => setHistoryModalOpen(true)}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side */}
                    <div className="flex flex-col lg:w-[65%] h-full lg:border-none lg:rounded-md mt-14 lg:mt-0 w-[95%]  mx-auto">
                        <RightSideProcess
                            status={status}
                            transformedGIFUrl={enhancedImageUrl}
                            onRetry={startProcessingImage}
                        />

                        {(status === STATUS_MAP.succeeded ||
                            status === STATUS_MAP.failed) && (
                            <Statistics data={finalResponse} />
                        )}
                    </div>
                </div>

                <ImageHistoryModal
                    open={historyModalOpen}
                    onOpenChange={setHistoryModalOpen}
                />
            </div>
        </div>
    );
}
