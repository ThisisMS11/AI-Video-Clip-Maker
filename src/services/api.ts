import { fetchClient } from '../utils/fetchClient';
import {
    pollingResponse,
    MongoSaveInput,
    MongoSaveOutput,
    SettingsType,
    MongoFetchResult,
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
            const data = await fetchClient<APIResponse>('vizard/polling', {
                params: { project_id: String(project_id) },
            });
            return data;
        } catch (error) {
            throw error;
        }
    },
};
