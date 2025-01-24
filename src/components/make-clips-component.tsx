'use client';
import { useRef, useState } from 'react';
import { useMediaProcessing } from '@/hooks/useMediaProcessing';
import { useMediaSettings } from '@/hooks/useMediaSettings';
import MediaUploader from '@/components/media-uploader';
import RightSideProcess from '@/components/right-side-process';
import { ImageHistoryModal } from './history-modal';
import ActionButtons from '@/components/action-buttons';
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
import { Atom } from 'lucide-react';
import { useProcess } from '@/hooks/useProcess';
import { usePollingHandling } from '@/hooks/usePollingHandling';
import { samplePollingResponse, SETTINGS_MAP, STATUS_MAP } from '@/constants';
import {
    APIResponse,
    MongoSaveOutput,
    pollingResponse,
    SettingsType,
} from '@/types';
import { WAIT_TIMES, INITIAL_SETTINGS } from '@/constants';
import { delay } from '@/utils/utilFunctions';

export default function ImageTransformer() {
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [uploadCareCdnUrl, setUploadCareCdnUrl] = useState<string | null>(
        'https://res.cloudinary.com/cloudinarymohit/video/upload/v1737657302/task_4_AI_Generated_Clips_Original/pqpnylg1sfxqirtvydeh.mp4'
    );
    /* persistent states */
    const cloudinaryUrlRef = useRef<string | null>(null);
    const projectIdRef = useRef<number | null>(null);

    /* To Store the final output */
    const [output, setOutput] = useState<pollingResponse | null>(
        samplePollingResponse
    );

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
        console.log('SETTINGS : ', settings);
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
                updateSetting,
                cloudinaryUrlRef,
                startProcessingMedia,
            };

            /* upload the image to cloudinary and start the prediction */
            console.log('Calling the startProcess');
            const projectId = await startProcess(args);
            console.log(`ProjectID : ${projectId}`);

            if (projectId) {
                setProjectId(projectId);
                projectIdRef.current = projectId;
                try {
                    if (cloudinaryUrlRef.current) {
                        updateSetting(
                            SETTINGS_MAP.VIDEO_URL,
                            cloudinaryUrlRef.current
                        );
                        console.log('Before Inputdata save ', settings);
                        await saveInputData(
                            projectId,
                            settings,
                            cloudinaryUrlRef.current
                        );
                        console.log(
                            'Input data saved successfully in database'
                        );
                    } else {
                        console.error('Cloudinary URL is not stored anywhere');
                    }
                } catch (error) {
                    console.error(`Error while storing input data : ${error}`);
                }
                await delay(10000);
                console.log(
                    `Calling the polling results function for the first time with ${projectId}`
                );
                handlePollingResults(projectId);
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

        try {
            if (isSuccess) {
                try {
                    /* let's first set the output for the UI */
                    const input_ui = {
                        code: finalData.data.code,
                        projectId: project_id,
                        videos: finalData?.data?.videos || [],
                    } as pollingResponse;

                    setOutput(input_ui);
                    setStatus(STATUS_MAP.SUCCEEDED);

                    /* Saving clips information to Database */
                    const input = {
                        project_id,
                        videos: finalData?.data?.videos || [],
                    } as MongoSaveOutput;

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
                    setStatus(STATUS_MAP.FAILED);
                    await updateStatus(project_id, STATUS_MAP.FAILED);
                    console.info(
                        `Project ${project_id} status updated to ${STATUS_MAP.FAILED}`
                    );
                    toast.error('Failed', {
                        description: `Process Failed ${finalData.message}`,
                        duration: 3000,
                    });
                } catch (error) {
                    console.error(`Status update operation failed: ${error}`);
                }
            }
        } catch (error) {
            console.error(`Unexpected error during process handling: ${error}`);
        }
    };

    const handlePollingResults = async (projectId: number) => {
        while (true) {
            try {
                console.info(`Project ID : ${projectId}`);

                const pollingData = await pollPredictionStatus(projectId);
                console.log({ pollingData });

                if (pollingData.data.code == 2000) {
                    /* handle the success case here */
                    handleProcessEnd(pollingData);
                    return;
                } else if (pollingData.data.code == 1000) {
                    // Default case (handles processing and any other status)
                    setStatus(STATUS_MAP.PROCESSING);
                    await delay(WAIT_TIMES.POLLING_SERVICE);
                } else {
                    handleProcessEnd(pollingData);
                    return;
                    /* TODO : update the data of project in db as failed */
                }
            } catch (error) {
                console.error('Error during prediction polling:', error);
                await delay(WAIT_TIMES.POLLING_SERVICE);
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
