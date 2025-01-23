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
} from '@/imports/Shadcn_imports';
import { Atom, History } from 'lucide-react';
import { useProcess } from '@/hooks/useProcess';
import { usePollingHandling } from '@/hooks/usePollingHandling';
import { RETRIES, RETRY_CONFIG, STATUS_MAP } from '@/constants';
import { APIResponse, MongoSaveOutput, SettingsType } from '@/types';
import { WAIT_TIMES, LANGUAGE_MAP, INITIAL_SETTINGS } from '@/constants';
import { delay, calculateBackoff } from '@/utils/utilFunctions';
import { databaseService } from '@/services/api';

export default function ImageTransformer() {
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [uploadCareCdnUrl, setUploadCareCdnUrl] = useState<string | null>(
        null
    );
    /* persistent states */
    const cloudinaryUrlRef = useRef<string | null>(null);
    const projectIdRef = useRef<number | null>(null);

    /* Custom Hooks */
    const { settings, setSettings, updateSetting } = useMediaSettings();

    const {
        pollPredictionStatus,
        saveInputData,
        saveOutputData,
        updateStatus,
    } = usePollingHandling();

    const { startProcess } = useProcess();

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

    /* To remove the image from the state */
    const onRemoveMedia = () => {
        setOutput(null);
        setProjectId(null);
        setStatus(STATUS_MAP.DEFAULT);
        setUploadCareCdnUrl(null);
        setCloudinaryOriginalUrl(null);
        cloudinaryUrlRef.current = null;
        setSettings(INITIAL_SETTINGS);
    };

    /* Start processing image */
    const onProcess = async () => {
        console.log(settings);
        try {
            if (!uploadCareCdnUrl) {
                toast.error('Error', {
                    description: 'No image URL provided',
                    duration: 3000,
                });
                return;
            }

            if (settings.videoType === 1 && settings.ext === '') {
                toast.error('Error', {
                    description: 'If videoType is 1, ext needs to be set.',
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
                startProcess,
                cloudinaryUrlRef,
                startProcessingMedia,
            };

            /* upload the image to cloudinary and start the prediction */
            const projectId = await startProcess(args);

            if (projectId) {
                setProjectId(projectId);
                projectIdRef.current = projectId;
                handlePredictionResults(projectId);

                try {
                    await saveInputData(projectId, settings);
                    console.log('Input data saved successfully in database');
                } catch (error) {
                    console.error(`Error while storing input data : ${error}`);
                }
            } else {
                throw new Error('Failed to get prediction ID');
            }
        } catch (error) {
            console.error('Error in startProcess:', error);
            toast.error('Error', {
                description: `Error in startProcess`,
                duration: 3000,
            });
            setStatus(STATUS_MAP.ERROR);
        }
    };

    /* handle prediction success */
    const handleProcessEnd = async (finalData: APIResponse) => {
        const isSuccess = finalData?.data?.status === STATUS_MAP.SUCCEEDED;
        const project_id = projectIdRef.current as number;
        setStatus(isSuccess ? STATUS_MAP.SUCCEEDED : STATUS_MAP.FAILED);

        try {
            if (isSuccess) {
                const input: MongoSaveOutput = {
                    project_id,
                    outputs: finalData?.data?.videos || [],
                };

                /* Saving clips information to Database */
                try {
                    await saveOutputData(input);
                    console.log('Clips Saved into database');
                    toast.success('Enjoy Your clips', {
                        description: 'Process completed Successfully',
                        duration: 3000,
                    });
                } catch (error) {
                    console.error(`Database save operation failed: ${error}`);
                }
            } else {
                try {
                    await updateStatus(project_id, STATUS_MAP.FAILED);
                    console.info(
                        `Project ${project_id} status updated to ${STATUS_MAP.FAILED}`
                    );
                } catch (error) {
                    console.error(`Status update operation failed: ${error}`);
                }

                toast.error('Failed', {
                    description: 'Process Failed! Please try again',
                    duration: 3000,
                });
            }
        } catch (error) {
            console.error(`Unexpected error during process handling: ${error}`);
        }
    };

    const handlePredictionResults = async (projectId: number) => {
        while (true) {
            try {
                console.info(`Project ID : ${projectId}`);

                const pollingData = await pollPredictionStatus(projectId);
                if (!pollingData.success) {
                    throw new Error(
                        `Clips making failed : ${pollingData.message}`
                    );
                }

                if (pollingData.data.code == 2000) {
                    /* handle the success case here */
                    return;
                } else if (pollingData.data.code == 1000) {
                    // Default case (handles processing and any other status)
                    setStatus(STATUS_MAP.PROCESSING);
                    await delay(WAIT_TIMES.PREDICTION_SERVICE);
                } else {
                    setStatus(STATUS_MAP.FAILED);
                    toast.error('Error', {
                        description: `Process Failed ${pollingData.message}`,
                        duration: 3000,
                    });

                    /* update the data of project in db as failed */
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
                            AI Generated Clips
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
                                    onRemoveMedia={onRemoveMedia}
                                />

                                <Separator className="my-2" />

                                {/* Settings  */}
                                <AdvancedSettings
                                    settings={settings}
                                    onUpdateSetting={updateSetting}
                                />

                                <Separator className="my-2" />

                                <ActionButtons
                                    status={status}
                                    onProcess={onProcess}
                                    onHistory={() => setHistoryModalOpen(true)}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side */}
                    <div className="flex flex-col lg:w-[65%] h-full lg:border-none lg:rounded-md mt-14 lg:mt-0 w-[95%]  mx-auto">
                        <RightSideProcess
                            status={status}
                            output={output}
                            onRetry={onProcess}
                        />

                        {(status === STATUS_MAP.SUCCEEDED ||
                            status === STATUS_MAP.FAILED) && (
                            <Statistics data={output} />
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
