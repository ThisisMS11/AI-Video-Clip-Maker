import { fetchClient } from '../utils/fetchClient';
import {
    PredictionResponse,
    MongoSave,
    ModelSettings,
    ImageDocument,
} from '../types';

export const cloudinaryService = {
    upload: async (imageUrl: string, type: string) => {
        try {
            const data = await fetchClient<{ url: string }>('cloudinary', {
                method: 'POST',
                body: JSON.stringify({ imageUrl, type }),
            });

            if (!data.url) {
                throw new Error('Invalid response from Cloudinary API');
            }

            return data;
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw new Error('Failed to upload image to Cloudinary');
        }
    },
};

export const databaseService = {
    saveInfo: async (inputData: MongoSave) => {
        try {
            const data = await fetchClient('db', {
                method: 'POST',
                body: JSON.stringify(inputData),
            });

            // console.log('Database save response:', data);
            return data;
        } catch (error) {
            console.error('Failed to save to database:', error);
            throw new Error('Failed to save image information to database');
        }
    },

    fetchHistory: async () => {
        try {
            const data = await fetchClient<{ data: ImageDocument[] }>('db', {
                method: 'GET',
            });
            return data.data as ImageDocument[];
        } catch (error) {
            console.error('Failed to fetch history:', error);
            throw new Error('Failed to fetch history');
        }
    },
};

export const predictionService = {
    getStatus: async (id: string) => {
        console.log('CALLING PREDICTION STATUS');
        try {
            return await fetchClient<PredictionResponse>(
                'replicate/prediction',
                {
                    params: { id },
                }
            );
        } catch (error) {
            console.error('Polling error:', error);
            throw new Error('Failed to get prediction status');
        }
    },
};

export const replicateService = {
    processVideo: async (settings: ModelSettings) => {
        try {
            const data = await fetchClient<{ id: string }>('replicate', {
                method: 'POST',
                body: JSON.stringify({ settings }),
            });

            if (!data?.id) {
                throw new Error('Invalid response: missing prediction ID');
            }

            return data;
        } catch (error) {
            console.error('Image processing error:', error);
            throw new Error('Failed to start image processing');
        }
    },
};
