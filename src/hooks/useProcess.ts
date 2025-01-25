import { SettingsType, APIResponse } from '@/types';
import { useRef, useState } from 'react';
import { cloudinaryService, vizardService } from '@/services/api';
import { MEDIA_TYPE, SETTINGS_MAP, STATUS_MAP, WAIT_TIMES } from '@/constants';

export interface Args {
    userMediaLink: string;
    settings: SettingsType;
    updateSetting: (key: keyof SettingsType, value: string | number) => void;
    isPublicUrl: boolean | null;
}

export const useProcess = () => {
    const [projectId, setProjectId] = useState<number | null>(null);
    const projectIdRef = useRef<number | null>(null);

    const [status, setStatus] = useState<string>(STATUS_MAP.DEFAULT);
    const [cloudinaryOriginalUrl, setCloudinaryOriginalUrl] = useState<
        string | null
    >(null);
    const cloudinaryUrlRef = useRef<string | null>(null);

    const validateSettings = (settings: SettingsType): string | null => {
        if (!settings.videoUrl) return 'Error: A video URL must be provided.';
        if (!settings.lang) return 'Error: Language selection is required.';
        if (settings.preferLength.length == 0)
            return 'Error: Please choose at least one preferred length.';
        if (settings.videoType == undefined || settings.videoType == null)
            return 'Error: A video type must be specified.';

        if (!process.env.NEXT_PUBLIC_APP_URL)
            return 'Error: The application URL is not configured in the environment variables.';
        return null;
    };

    const startProcessingMedia = async (
        settings: SettingsType
    ): Promise<string> => {
        const validationError = validateSettings(settings);
        if (validationError) {
            console.error(validationError);
            throw new Error(validationError);
        }

        try {
            console.info('Calling processMedia function with settings : ', {
                settings,
            });
            const response: APIResponse =
                await vizardService.processMedia(settings);
            if (!response.success) {
                throw new Error(response.message);
            }
            setProjectId(response.data.projectId);
            return response.data.projectId;
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to process media';
            console.error('Processing error:', message);
            throw new Error(`Error starting processing : ${message}`);
        }
    };

    /* start the process */
    const startProcess = async (args: Args) => {
        const { userMediaLink, settings, updateSetting, isPublicUrl } = args;

        /* upload the image to cloudinary if not already uploaded */
        let uploadedUrl = isPublicUrl
            ? settings.videoUrl
            : cloudinaryUrlRef.current;

        if (!uploadedUrl && !isPublicUrl) {
            setStatus(STATUS_MAP.UPLOADING);
            try {
                console.log(`Uploading video to cloudinary`);
                const uploadResult = await cloudinaryService.upload(
                    userMediaLink,
                    MEDIA_TYPE.ORIGINAL
                );

                if (!uploadResult.success) {
                    throw new Error(uploadResult.message);
                }

                cloudinaryUrlRef.current = uploadResult.data.url;
                uploadedUrl = uploadResult.data.url;
                setCloudinaryOriginalUrl(uploadedUrl);

                // Create updated settings with new image URL
                const updatedSettings: SettingsType = {
                    ...settings,
                    videoUrl: uploadedUrl as string,
                };

                updateSetting(SETTINGS_MAP.VIDEO_URL, uploadedUrl as string);

                /* transform the image */
                try {
                    setStatus(STATUS_MAP.PROCESSING);

                    /* Adding some delay time to give cloudinary time to upload the image */
                    await new Promise((resolve) =>
                        setTimeout(resolve, WAIT_TIMES.CLOUDINARY_SERVICE)
                    );

                    // Use updated settings directly instead of relying on state
                    console.log('calling startProcessingMedia');
                    const projectId =
                        await startProcessingMedia(updatedSettings);
                    if (!projectId) {
                        throw new Error('No project ID returned');
                    }
                    return Number(projectId);
                } catch (error) {
                    console.error('Error from startProcessingMedia:', error);
                    throw new Error(`Error from startProcessingMedia:${error}`);
                }
            } catch (error) {
                console.error(
                    'Error uploading original media to cloudinary:',
                    error
                );
                throw new Error(
                    `Error uploading original media to cloudinary : ${error}`
                );
            }
        } else {
            // If cloudinaryOriginalUrl exists, use existing settings
            // console.log('line no 92 : ', { settings });
            try {
                setStatus(STATUS_MAP.PROCESSING);
                const updatedSettings: SettingsType = {
                    ...settings,
                    videoUrl:
                        isPublicUrl && cloudinaryUrlRef.current
                            ? cloudinaryUrlRef.current
                            : settings.videoUrl,
                };

                console.log(
                    'Already uploaded to cloudinary, calling startProcessingMedia'
                );
                const projectId = await startProcessingMedia(updatedSettings);
                if (!projectId) {
                    throw new Error('No project ID returned');
                }
                return Number(projectId);
            } catch (error) {
                console.error('Error from startProcessingMedia:', error);
                throw new Error(`Error from startProcessingMedia:${error}`);
            }
        }
    };

    return {
        status,
        setStatus,
        projectId,
        projectIdRef,
        setProjectId,
        cloudinaryOriginalUrl,
        cloudinaryUrlRef,
        setCloudinaryOriginalUrl,
        startProcessingMedia,
        startProcess,
    };
};
