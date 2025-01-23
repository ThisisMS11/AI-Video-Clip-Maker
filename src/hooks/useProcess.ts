import { STATUS_MAP, MEDIA_TYPE } from '@/constants';
import { cloudinaryService } from '@/services/api';
import { SettingsType } from '@/types';
import { WAIT_TIMES } from '@/constants';
import { RefObject } from 'react';

interface Args {
    uploadCareCdnUrl: string;
    cloudinaryOriginalUrl: string | null;
    setCloudinaryOriginalUrl: (url: string | null) => void;
    setStatus: (status: string) => void;
    settings: SettingsType;
    setSettings: (settings: SettingsType) => void;
    startProcessingMedia: (settings: SettingsType) => Promise<string>;
    cloudinaryUrlRef: RefObject<string | null>;
}

export const useProcess = () => {
    /* Handle image processing : returns projectId or error */
    const startProcess = async (args: Args) => {
        const {
            uploadCareCdnUrl,
            cloudinaryOriginalUrl,
            setCloudinaryOriginalUrl,
            setStatus,
            settings,
            setSettings,
            startProcessingMedia,
            cloudinaryUrlRef,
        } = args;

        /* upload the image to cloudinary if not already uploaded */
        let uploadedUrl = cloudinaryUrlRef.current;

        if (!cloudinaryUrlRef.current) {
            setStatus(STATUS_MAP.UPLOADING);
            try {
                console.log(`Uploading video to cloudinary`);
                const uploadResult = await cloudinaryService.upload(
                    uploadCareCdnUrl,
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

                setSettings(updatedSettings);

                /* transform the image */
                try {
                    setStatus(STATUS_MAP.PROCESSING);

                    /* Adding some delay time to give cloudinary time to upload the image */
                    await new Promise((resolve) =>
                        setTimeout(resolve, WAIT_TIMES.CLOUDINARY_SERVICE)
                    );

                    // Use updated settings directly instead of relying on state
                    const projectId =
                        await startProcessingMedia(updatedSettings);
                    if (!projectId) {
                        throw new Error('No project ID returned');
                    }
                    return projectId;
                } catch (error) {
                    throw error;
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
            try {
                setStatus(STATUS_MAP.PROCESSING);
                const updatedSettings: SettingsType = {
                    ...settings,
                    videoUrl: cloudinaryUrlRef.current,
                };
                const projectId = await startProcessingMedia(updatedSettings);
                if (!projectId) {
                    throw new Error('No project ID returned');
                }
                return projectId;
            } catch (error) {
                console.error('Error Creating Clips:', error);
                throw error;
            }
        }
    };

    return {
        startProcess,
    };
};
