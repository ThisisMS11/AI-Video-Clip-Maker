import { STATUS_MAP, MEDIA_TYPE } from '@/constants';
import { cloudinaryService } from '@/services/api';
import { SettingsType } from '@/types';
import { WAIT_TIMES, SETTINGS_MAP } from '@/constants';
import { RefObject } from 'react';

interface Args {
    userMediaLink: string;
    setCloudinaryOriginalUrl: (url: string | null) => void;
    setStatus: (status: string) => void;
    settings: SettingsType;
    updateSetting: (key: keyof SettingsType, value: string | number) => void;
    startProcessingMedia: (settings: SettingsType) => Promise<string>;
    cloudinaryUrlRef: RefObject<string | null>;
    isPublicUrl: boolean | null;
}

export const useProcess = () => {
    /* Handle image processing : returns projectId or error */
    const startProcess = async (args: Args) => {
        const {
            userMediaLink,
            setCloudinaryOriginalUrl,
            setStatus,
            settings,
            updateSetting,
            startProcessingMedia,
            cloudinaryUrlRef,
            isPublicUrl,
        } = args;

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
        startProcess,
    };
};
