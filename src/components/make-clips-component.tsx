'use client';
import { useRef, useState } from 'react';
import { useMediaProcessing } from '@/hooks/useMediaProcessing';
import { useMediaSettings } from '@/hooks/useMediaSettings';
import MediaUploader from '@/components/media-uploader';
import RightSideProcess from '@/components/right-side-process';
import { ImageHistoryModal } from './history-modal';
import ActionButtons from '@/components/action-buttons';
import Statistics from '@/components/statistics';
import AdvancedSettings from '@/components/advanced-settings';
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
    Button,
} from '@/imports/Shadcn_imports';
import { Atom, History } from 'lucide-react';
import { useProcess } from '@/hooks/useProcess';
import { usePredictionHandling } from '@/hooks/usePredictionHandling';
import { RETRIES, RETRY_CONFIG, STATUS_MAP } from '@/constants';
import { SettingsType } from '@/types';
import { WAIT_TIMES, LANGUAGE_MAP } from '@/constants';
import { delay, calculateBackoff } from '@/utils/utilFunctions';

export default function ImageTransformer() {
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [uploadCareCdnUrl, setUploadCareCdnUrl] = useState<string | null>(
        null
    );

    const [hasFailed, setHasFailed] = useState(false);
    const { settings, setSettings, updateSetting } = useMediaSettings();

    /* persistent states */
    const cloudinaryUrlRef = useRef<string | null>(null);
    const isRetryingRef = useRef(false);
    const projectIdRef = useRef<number | null>(null);

    /* Custom Hooks */

    const {
        status,
        setStatus,
        cloudinaryOriginalUrl,
        setCloudinaryOriginalUrl,
        output,
        setOutput,
        setProjectId,
        startProcessingMedia,
    } = useMediaProcessing();

    const { pollPredictionStatus, savePredictionData } =
        usePredictionHandling();
    const { handleProcessingImage } = useProcess();

    /* To remove the image from the state */
    const handleRemoveImage = () => {
        setOutput(null);
        setProjectId(null);
        setStatus(STATUS_MAP.DEFAULT);
        setUploadCareCdnUrl(null);
        setCloudinaryOriginalUrl(null);
        cloudinaryUrlRef.current = null;
        retryAttemptsRef.current = 0;
        isRetryingRef.current = false;
        setIsRetrying(false);
        setSettings(null);
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
            const projectId = await handleProcessingImage(args);

            if (projectId) {
                setProjectId(projectId);
                projectIdRef.current = projectId;
                handlePredictionResults(projectId);
            } else {
                throw new Error('Failed to get prediction ID');
            }
        } catch (error) {
            console.error('Error in startProcessingImage:', error);
            toast.error('Error', {
                description: `Error in startProcessingImage`,
                duration: 3000,
            });
            setStatus(STATUS_MAP.ERROR);
        }
    };

    /* handle prediction success */
    const handlePredictionFinalResult = async (
        data: PredictionResponse,
        outputUrl?: string
    ) => {
        const isSuccess = data.status === STATUS_MAP.SUCCEEDED;
        await savePredictionData(data, outputUrl);
        setStatus(isSuccess ? STATUS_MAP.SUCCEEDED : STATUS_MAP.FAILED);
        setFinalResponse(data);
        setOutput(outputUrl ? outputUrl : null);

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

    // const handlePredictionResults = async (projectId: string) => {
    while (true && !hasFailed) {
        if (isRetryingRef.current) {
            // console.log('Retry already in progress, skipping...');
            await delay(5000);
            continue;
        }

        try {
            console.info(`Prediction ID : ${projectId}`);

            const predictionData = await pollPredictionStatus(projectId);

            if (!predictionData) {
                throw new Error('No prediction data received');
            }

            const outputUrl = predictionData.output_url
                ? JSON.parse(predictionData.output_url)
                : null;

            if (predictionData.status === STATUS_MAP.SUCCEEDED) {
                // Reset retry attempts on success
                retryAttemptsRef.current = 0;
                isRetryingRef.current = false;
                setIsRetrying(false);
                await handlePredictionFinalResult(predictionData, outputUrl);
                return;
            } else if (predictionData.status === STATUS_MAP.FAILED) {
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
                    setStatus(STATUS_MAP.PROCESSING);

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
                setStatus(STATUS_MAP.PROCESSING);
                await delay(WAIT_TIMES.PREDICTION_SERVICE);
            }
        } catch (error) {
            console.error('Error during prediction polling:', error);
            await delay(1000);
        }
    }
}

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
                            <MediaUploader
                                uploadCareCdnUrl={uploadCareCdnUrl}
                                onUploadSuccess={setUploadCareCdnUrl}
                                onRemoveImage={handleRemoveImage}
                            />

                            <Separator className="my-2" />

                            {/* Enter the target age  */}
                            <AdvancedSettings
                                settings={settings}
                                onUpdateSetting={handleSettingsUpdate}
                                onMaskUpload={() => {}}
                                uploadMaskKey={0}
                            />

                            <Separator className="my-2" />

                            {/* <ActionButtons
                                    status={status}
                                    onProcess={startProcessingImage}
                                    onHistory={() => setHistoryModalOpen(true)}
                                /> */}

                            <Button
                                className="flex-1 rounded-lg"
                                onClick={() => setHistoryModalOpen(true)}
                            >
                                <History className="w-4 h-4 mr-2" />
                                View History
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side */}
                {/* <div className="flex flex-col lg:w-[65%] h-full lg:border-none lg:rounded-md mt-14 lg:mt-0 w-[95%]  mx-auto">
                        <RightSideProcess
                            status={status}
                            transformedGIFUrl={output}
                            onRetry={startProcessingImage}
                        />

                        {(status === STATUS_MAP.SUCCEEDED ||
                            status === STATUS_MAP.FAILED) && (
                            <Statistics data={finalResponse} />
                        )}
                    </div> */}
            </div>

            <ImageHistoryModal
                open={historyModalOpen}
                onOpenChange={setHistoryModalOpen}
            />
        </div>
    </div>
);
