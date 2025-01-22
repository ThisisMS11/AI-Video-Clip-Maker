import { STATUS_MAP, IMAGE_TYPE } from '@/constants';
import { cloudinaryService } from '@/services/api';
import { ModelSettings } from '@/types';
import { WAIT_TIMES } from '@/constants';
import { RefObject } from 'react';
import {} from 'react';

interface Args {
    uploadCareCdnUrl: string;
    cloudinaryOriginalUrl: string | null;
    setCloudinaryOriginalUrl: (url: string) => void;
    setStatus: (status: string) => void;
    settings: ModelSettings;
    setSettings: (settings: ModelSettings) => void;
    startTransformingImage: (settings: ModelSettings) => Promise<string>;
    cloudinaryUrlRef: RefObject<string | null>;
}

export const useImageTransformingHandler = () => {
    /* Handle image processing : returns predictionId or error */
    const handleProcessingImage = async (args: Args) => {
        const {
            uploadCareCdnUrl,
            cloudinaryOriginalUrl,
            setCloudinaryOriginalUrl,
            setStatus,
            settings,
            setSettings,
            startTransformingImage,
            cloudinaryUrlRef,
        } = args;

        // console.log({
        //     uploadCareCdnUrl,
        //     cloudinaryOriginalUrl,
        //     ref: cloudinaryUrlRef.current,
        // });

        /* upload the image to cloudinary if not already uploaded */
        let uploadedUrl = cloudinaryUrlRef.current;
        if (!cloudinaryUrlRef.current) {
            setStatus(STATUS_MAP.uploading);
            try {
                const uploadResult = await cloudinaryService.upload(
                    uploadCareCdnUrl,
                    IMAGE_TYPE.ORIGINAL
                );
                if (!uploadResult?.url) {
                    throw new Error('Failed to get upload URL from Cloudinary');
                }
                cloudinaryUrlRef.current = uploadResult.url;
                uploadedUrl = uploadResult.url;
                setCloudinaryOriginalUrl(uploadedUrl);

                // Create updated settings with new image URL
                const updatedSettings = {
                    ...settings,
                    image_url: uploadedUrl,
                };

                setSettings(updatedSettings);

                /* transform the image */
                try {
                    setStatus(STATUS_MAP.processing);

                    /* Adding some delay time to give cloudinary time to upload the image */
                    await new Promise((resolve) =>
                        setTimeout(resolve, WAIT_TIMES.CLOUDINARY_SERVICE)
                    );

                    // Use updated settings directly instead of relying on state
                    const predictionId =
                        await startTransformingImage(updatedSettings);
                    if (!predictionId) {
                        throw new Error('No prediction ID returned');
                    }
                    return predictionId;
                } catch (error) {
                    console.error('Error transforming image:', error);
                    throw new Error(`Error transforming image : ${error}`);
                }
            } catch (error) {
                console.error(
                    'Error uploading original image to cloudinary:',
                    error
                );
                throw new Error(
                    `Error uploading original image to cloudinary : ${error}`
                );
            }
        } else {
            // If cloudinaryOriginalUrl exists, use existing settings
            try {
                setStatus(STATUS_MAP.processing);
                const updatedSettings = {
                    ...settings,
                    image_url: cloudinaryUrlRef.current,
                };
                const predictionId =
                    await startTransformingImage(updatedSettings);
                if (!predictionId) {
                    throw new Error('No prediction ID returned');
                }
                return predictionId;
            } catch (error) {
                console.error('Error Creating GIF:', error);
                throw new Error(`Error Creating GIF : ${error}`);
            }
        }
    };

    return {
        handleProcessingImage,
    };
};
