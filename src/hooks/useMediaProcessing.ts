import { SettingsType, APIResponse } from '@/types';
import { useState } from 'react';
import { vizardService } from '@/services/api';
import { STATUS_MAP } from '@/constants';
import { pollingResponse } from '@/types';

export const useMediaProcessing = () => {
    const [projectId, setProjectId] = useState<number | null>(null);
    const [status, setStatus] = useState<string>(STATUS_MAP.DEFAULT);
    const [output, setOutput] = useState<pollingResponse | null>(null);
    const [cloudinaryOriginalUrl, setCloudinaryOriginalUrl] = useState<
        string | null
    >(null);

    const validateSettings = (settings: SettingsType): string | null => {
        if (!settings.videoUrl) return 'Error: A video URL must be provided.';
        if (!settings.lang) return 'Error: Language selection is required.';
        if (!settings.preferLength)
            return 'Error: Please choose a preferred length.';
        if (!settings.videoType)
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

    return {
        status,
        setStatus,
        projectId,
        setProjectId,
        output,
        setOutput,
        cloudinaryOriginalUrl,
        setCloudinaryOriginalUrl,
        startProcessingMedia,
    };
};
