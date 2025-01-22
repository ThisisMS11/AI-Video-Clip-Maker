import { PredictionResponse } from '@/types';
import {
    cloudinaryService,
    predictionService,
    databaseService,
} from '@/services/api';
import { STATUS_MAP, IMAGE_TYPE } from '@/constants';

export const usePredictionHandling = () => {
    /* Get prediction data from redis */
    const pollPredictionStatus = async (id: string) => {
        try {
            const data = await predictionService.getStatus(id);
            // console.log(data);
            return data;
        } catch (error) {
            console.error('Polling error:', error);
            throw new Error('Failed to get prediction data');
        }
    };

    const savePredictionData = async (
        data: PredictionResponse,
        outputUrl?: string
    ) => {
        if (data.status === STATUS_MAP.succeeded && outputUrl) {
            await savePredictionSuccess(data, outputUrl);
        } else if (data.status === STATUS_MAP.failed) {
            await savePredictionFailed(data);
        } else {
            throw new Error('Invalid prediction data or output URL');
        }
    };

    /* Handle Prediction Success : upload replicate output to cloudinary and save to database */
    const savePredictionSuccess = async (
        data: PredictionResponse,
        outputUrl: string
    ) => {
        try {
            // Upload enhanced image to Cloudinary
            const cloudinaryData = await cloudinaryService.upload(
                outputUrl,
                IMAGE_TYPE.PROCESSED
            );
            if (!cloudinaryData?.url) {
                throw new Error(
                    'Failed to upload enhanced image to Cloudinary'
                );
            }

            // Extract and validate required fields from PredictionResponse
            const {
                image_url,
                target_age,
                created_at,
                completed_at,
                predict_time,
                status,
            } = data;

            // Save to database with properly formatted MongoSave type
            await databaseService.saveInfo({
                status,
                image_url,
                output_url: cloudinaryData.url,
                target_age,
                created_at: created_at,
                completed_at: completed_at,
                predict_time: predict_time.toString(),
            });
        } catch (error) {
            console.error('Error in handlePredictionSuccess:', error);
            throw error;
        }
    };

    /* Handle Prediction Failed : set status to failed and save to database */
    const savePredictionFailed = async (data: PredictionResponse) => {
        try {
            // Extract required fields from PredictionResponse
            const {
                status,
                image_url,
                target_age,
                created_at,
                completed_at,
                predict_time,
            } = data;

            // Save failed prediction to database with properly formatted MongoSave type
            await databaseService.saveInfo({
                status,
                image_url,
                target_age,
                predict_time: predict_time.toString(),
                created_at,
                completed_at,
            });
        } catch (error) {
            console.error('Error in handlePredictionFailed:', error);
            throw error;
        }
    };

    return {
        pollPredictionStatus,
        savePredictionData,
    };
};
