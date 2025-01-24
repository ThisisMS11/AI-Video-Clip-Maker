import { fetchClient } from '../utils/fetchClient';
import {
    MongoSaveInput,
    MongoSaveOutput,
    SettingsType,
    APIResponse,
} from '../types';

export const cloudinaryService = {
    upload: async (mediaUrl: string, type: string) => {
        try {
            const data = await fetchClient<APIResponse>('cloudinary', {
                method: 'POST',
                body: JSON.stringify({ mediaUrl, type }),
            });
            return data;
        } catch (error) {
            throw error;
        }
    },
};

export const databaseService = {
    saveInputInfo: async (inputData: MongoSaveInput) => {
        try {
            const data = await fetchClient<APIResponse>('db/vizard-input', {
                method: 'POST',
                body: JSON.stringify(inputData),
            });
            return data;
        } catch (error) {
            throw error;
        }
    },
    saveOutputInfo: async (outputData: MongoSaveOutput) => {
        try {
            const data = await fetchClient<APIResponse>('db/vizard-output', {
                method: 'POST',
                body: JSON.stringify(outputData),
            });

            return data;
        } catch (error) {
            throw error;
        }
    },

    updateStatus: async (project_id: number, status: string) => {
        try {
            const data = await fetchClient<APIResponse>('db/vizard-input', {
                method: 'PATCH',
                body: JSON.stringify({ project_id, status }),
            });
            return data;
        } catch (error) {
            throw error;
        }
    },

    fetchHistory: async () => {
        try {
            const data = await fetchClient<APIResponse>('db', {
                method: 'GET',
            });
            return data;
        } catch (error) {
            throw error;
        }
    },
};

export const vizardService = {
    processMedia: async (settings: SettingsType) => {
        try {
            const data = await fetchClient<APIResponse>('vizard', {
                method: 'POST',
                body: JSON.stringify({ settings }),
            });
            return data;
        } catch (error) {
            throw error;
        }
    },

    getPollResults: async (project_id: number) => {
        console.log('CALLING POLLING RESULT');
        try {
            const data = await fetchClient<APIResponse>(
                `vizard/polling/${project_id}`
            );
            return data;
        } catch (error) {
            throw error;
        }
    },
};
