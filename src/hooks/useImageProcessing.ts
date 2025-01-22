import { PredictionResponse, ModelSettings } from '@/types';
import { useState } from 'react';
import { replicateService } from '@/services/api';
import { STATUS_MAP } from '@/constants';

export const useImageProcessing = () => {
    const [predictionId, setPredictionId] = useState<string | null>(null);
    const [status, setStatus] = useState<string>(STATUS_MAP.default);
    const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(
        null
    );
    const [cloudinaryOriginalUrl, setCloudinaryOriginalUrl] = useState<
        string | null
    >(null);
    const [finalResponse, setFinalResponse] =
        useState<PredictionResponse | null>(null);

    const validateSettings = (settings: ModelSettings): string | null => {
        if (!settings.image_url) return 'No image URL provided';
        if (!process.env.NEXT_PUBLIC_APP_URL)
            return 'App URL environment variable is not configured';
        return null;
    };

    const startTransformingImage = async (
        settings: ModelSettings
    ): Promise<string> => {
        const validationError = validateSettings(settings);
        if (validationError) {
            console.error(validationError);
            throw new Error(validationError);
        }

        try {
            const response = await replicateService.processVideo(settings);
            if (!response?.id) {
                throw new Error('Invalid response: missing prediction ID');
            }
            setPredictionId(response.id);
            // console.log('Prediction ID:', response.id);
            return response.id;
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to process image';
            console.error('Transformation error:', message);
            throw new Error(`Error starting transformation : ${message}`);
        }
    };

    return {
        status,
        setStatus,
        predictionId,
        setPredictionId,
        enhancedImageUrl,
        setEnhancedImageUrl,
        cloudinaryOriginalUrl,
        setCloudinaryOriginalUrl,
        startTransformingImage,
        finalResponse,
        setFinalResponse,
    };
};
