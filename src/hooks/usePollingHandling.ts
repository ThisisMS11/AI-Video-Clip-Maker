import {
    APIResponse,
    MongoSaveInput,
    MongoSaveOutput,
    pollingResponse,
    SettingsType,
} from '@/types';
import {
    cloudinaryService,
    vizardService,
    databaseService,
} from '@/services/api';
import { STATUS_MAP } from '@/constants';

export const usePredictionHandling = () => {
    /* Get prediction data from redis */
    const pollPredictionStatus = async (project_id: number) => {
        try {
            const response: APIResponse =
                await vizardService.getPollResults(project_id);
            if (!response.success) {
                throw new Error(response.message);
            }
            return response.data as pollingResponse;
        } catch (error) {
            console.error('Polling error:', error);
            throw error;
        }
    };

    /* Handle Prediction Success : upload replicate output to cloudinary and save to database */
    const saveInputData = async (data: SettingsType) => {
        try {
            const settings = {
                status: STATUS_MAP.PROCESSING,
                video_url: data.videoUrl,
                video_type: data.videoType,
                lang: data.lang,
                prefer_length: data.preferLength,
                ext: data.ext,
                subtitle_switch: data.subtitleSwitch,
                headline_switch: data.headlineSwitch,
                max_clip_number: data.maxClipNumber,
                keywords: data.keywords,
                remove_silence_switch: data.removeSilenceSwitch,
            } as MongoSaveInput;

            const response: APIResponse =
                await databaseService.saveInputInfo(settings);
            if (!response.success) {
                throw new Error(response.message);
            }
            return response.data;
        } catch (error) {
            console.error('Error in handlePredictionSuccess:', error);
            throw error;
        }
    };

    /* Handle Prediction Failed : set status to failed and save to database */
    const saveOutputData = async (data: MongoSaveOutput) => {
        try {
            /* Saving output data to mongoDB */
            const response: APIResponse =
                await databaseService.saveOutputInfo(data);
            if (!response.success) {
                throw new Error(response.message);
            }
            return response.data;
        } catch (error) {
            console.error('Error in handlePredictionFailed:', error);
            throw error;
        }
    };

    return {
        pollPredictionStatus,
        saveInputData,
        saveOutputData,
    };
};
