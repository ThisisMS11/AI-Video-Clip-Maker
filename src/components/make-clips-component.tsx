'use client';
import { useState } from 'react';
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
import { APIResponse, MongoSaveOutput, pollingResponse } from '@/types';
import { WAIT_TIMES, INITIAL_SETTINGS } from '@/constants';
import {
    delay,
    getErrorMessage,
    checkVideoTypeSetting,
} from '@/utils/utilFunctions';

export default function ImageTransformer() {
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [userMediaLink, setUserMediaLink] = useState<string | null>(null);
    /* persistent states */
    const [isPublicUrl, setIsPublicUrl] = useState<boolean | null>(null);

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

    const {
        status,
        setStatus,
        setCloudinaryOriginalUrl,
        setProjectId,
        projectIdRef,
        cloudinaryUrlRef,
        startProcess,
    } = useProcess();

    /* To remove the image from the state */
    const onRemoveMedia = () => {
        setOutput(null);
        setProjectId(null);
        setStatus(STATUS_MAP.DEFAULT);
        setUserMediaLink(null);
        setCloudinaryOriginalUrl(null);
        cloudinaryUrlRef.current = null;
        setSettings(INITIAL_SETTINGS);
        setIsPublicUrl(null);
    };

    /* Start processing image */
    const onProcess = async () => {
        // console.log('SETTINGS : ', settings);
        try {
            if (!userMediaLink) {
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

            if (!checkVideoTypeSetting(userMediaLink, settings.videoType)) {
                toast.error('Error', {
                    description: 'Please choose the correct video type',
                    duration: 3000,
                });
                return;
            }

            const args = {
                userMediaLink,
                settings,
                updateSetting,
                isPublicUrl,
            };

            /* upload the image to cloudinary and start the prediction */
            console.log('Calling the startProcess');
            const projectId = await startProcess(args);
            console.log(`ProjectID : ${projectId}`);

            if (projectId) {
                setProjectId(projectId);
                projectIdRef.current = projectId;
                try {
                    if (!isPublicUrl) {
                        if (cloudinaryUrlRef.current) {
                            console.log(
                                `cloudinarUrlRef.current : `,
                                cloudinaryUrlRef.current
                            );
                            // console.log('Settings at line no : 134', {settings});
                            updateSetting(
                                SETTINGS_MAP.VIDEO_URL,
                                cloudinaryUrlRef.current
                            );
                            await saveInputData(
                                projectId,
                                settings,
                                cloudinaryUrlRef.current
                            );
                        } else {
                            console.error(
                                `cloudinaryUrlRef.current is null can't save inputData`
                            );
                        }
                    } else {
                        console.log('Saving input data for public URL');
                        await saveInputData(projectId, settings);
                    }
                    console.log('Input data saved successfully in database');
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
            console.error(error);
            toast.error('Error', {
                description: getErrorMessage(error, `Error in startProcess`),
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

                    console.log('Saving output data');
                    await saveOutputData(input);

                    console.log('Calling api to update status to succeeded');
                    await updateStatus(project_id, STATUS_MAP.SUCCEEDED);

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
                console.info(`Calling Polling for Project ID : ${projectId}`);

                const pollingData = await pollPredictionStatus(projectId);
                // console.log({ pollingData });

                if (pollingData.data.code == 2000) {
                    /* handle the success case here */
                    handleProcessEnd(pollingData);
                    return;
                } else if (pollingData.data.code == 1000) {
                    // Default case (handles processing and any other status)
                    console.info(`Status : Processing`);
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
                                    onUploadSuccess={setUserMediaLink}
                                    onRemoveMedia={onRemoveMedia}
                                    onUpdateSetting={updateSetting}
                                    setIsPublicUrl={setIsPublicUrl}
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
