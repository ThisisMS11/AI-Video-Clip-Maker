import {
    APIResponse,
    MongoSaveInput,
    MongoSaveOutput,
    SettingsType,
} from '@/types';
import { vizardService, databaseService } from '@/services/api';
import { STATUS_MAP } from '@/constants';
import { convertKeysToSnakeCase } from '@/utils/utilFunctions';

export const usePollingHandling = () => {
    /* Get prediction data from redis */
    const pollPredictionStatus = async (project_id: number) => {
        try {
            const response: APIResponse =
                await vizardService.getPollResults(project_id);
            return response;
        } catch (error) {
            throw error;
        }
    };

    /* Handle Prediction Success : upload replicate output to cloudinary and save to database */
    const saveInputData = async (
        project_id: number,
        data: SettingsType,
        cloudinaryUrl: string
    ) => {
        try {
            const snakeCasedData = convertKeysToSnakeCase(data);
            const settings = {
                project_id,
                status: STATUS_MAP.PROCESSING,
                video_url: cloudinaryUrl,
                ...snakeCasedData,
            } as MongoSaveInput;

            const response: APIResponse =
                await databaseService.saveInputInfo(settings);
            if (!response.success) {
                throw new Error(response.message);
            }
            return response;
        } catch (error) {
            throw error;
        }
    };

    /* Handle Prediction Failed : set status to failed and save to database */
    const saveOutputData = async (data: MongoSaveOutput) => {
        try {
            /* Saving output data to mongoDB */
            const snakeCasedData = convertKeysToSnakeCase(data);
            const response: APIResponse =
                await databaseService.saveOutputInfo(snakeCasedData);
            if (!response.success) {
                throw new Error(response.message);
            }
            return response;
        } catch (error) {
            throw error;
        }
    };

    /* update the status of a project in db */
    const updateStatus = async (project_id: number, status: string) => {
        try {
            /* Saving output data to mongoDB */
            const response: APIResponse = await databaseService.updateStatus(
                project_id,
                status
            );
            if (!response.success) {
                throw new Error(response.message);
            }
            return response;
        } catch (error) {
            throw error;
        }
    };

    return {
        pollPredictionStatus,
        saveInputData,
        saveOutputData,
        updateStatus,
    };
};
