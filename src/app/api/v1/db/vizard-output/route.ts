import { NextRequest } from 'next/server';
import { createLoggerWithLabel } from '@/app/api/utils/logger';
import { currentUser } from '@clerk/nextjs/server';
import clientPromise from '@/app/api/utils/mongoClient';
import { MongoSaveOutput, BaseOutput } from '@/types';
import { makeResponse } from '@/app/api/utils/makeResponse';
import { MEDIA_TYPE } from '@/constants';

const logger = createLoggerWithLabel('DB_OUTPUT');

export async function POST(request: NextRequest) {
    try {
        logger.info('Starting to store project output information');

        if (!request.body) {
            logger.warn('Empty request body');
            return makeResponse(400, false, 'Request body is required', null);
        }

        let body: MongoSaveOutput;
        try {
            body = await request.json();
        } catch (e) {
            logger.warn(`Invalid JSON in request body ${JSON.stringify(e)}`);
            return makeResponse(
                400,
                false,
                'Invalid JSON in request body',
                null
            );
        }

        const { project_id, videos } = body;
        logger.info(
            `project_id : ${project_id} Number of videos : ${videos?.length}`
        );
        if (!project_id) {
            logger.warn('Missing project_id in request');
            return makeResponse(400, false, 'project_id is required', null);
        }

        const user = await currentUser();
        if (!user) {
            logger.warn('User not authenticated');
            return makeResponse(401, false, 'Unauthorized', null);
        }

        let client;
        try {
            client = await clientPromise;
        } catch (error) {
            logger.error(`MongoDB connection error: ${error}`);
            return makeResponse(503, false, 'Database connection failed', null);
        }

        // Validate environment variables
        if (!process.env.DB_NAME || !process.env.OUTPUTS_COLLECTION) {
            logger.error('Database configuration missing');
            return makeResponse(
                503,
                false,
                'Database configuration missing',
                null
            );
        }

        const db = client.db(process.env.DB_NAME);
        const collection = db.collection(process.env.OUTPUTS_COLLECTION);

        logger.info(`Iterating over the output length : ${videos.length}`);

        if (!videos || videos.length === 0) {
            logger.warn(`No videos provided for project_id: ${project_id}`);
            return makeResponse(400, false, 'No videos provided', null);
        }

        // Filter out videos with video_ids that already exist in the database
        const existingVideoIds = await collection.distinct('video_id', {
            video_id: {
                $in: videos.filter((o) => o.video_id).map((o) => o.video_id),
            },
        });

        // Prepare documents for insertion, excluding ones with existing video_ids
        const documents = videos
            .filter(
                (output: BaseOutput) =>
                    !output.video_id ||
                    !existingVideoIds.includes(output.video_id)
            )
            .map((output: BaseOutput) => ({
                project_id,
                user_id: user.id,
                ...output,
                created_at: new Date(),
            }));

        /* upload all the video files to cloudinary first and then replace the document.video_url with cloudinary obtained url */
        const uploadedDocuments = await Promise.all(
            documents.map(async (document) => {
                const cloudinaryResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/cloudinary`,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            mediaUrl: document.video_url,
                            type: MEDIA_TYPE.PROCESSED,
                        }),
                    }
                );

                const { data } = await cloudinaryResponse.json();
                return {
                    ...document,
                    video_url: data.url,
                };
            })
        );

        // Insert documents if any remain after filtering
        logger.info(`Inserting ${uploadedDocuments.length} documents into DB`);
        const result =
            uploadedDocuments.length > 0
                ? await collection.insertMany(uploadedDocuments)
                : { acknowledged: true, insertedCount: 0 };

        if (!result.acknowledged) {
            logger.error('Failed to insert documents into MongoDB');
            return makeResponse(500, false, 'Database operation failed', null);
        }

        logger.info(
            `Successfully stored ${uploadedDocuments.length} output documents for project_id: ${project_id}`
        );
        return makeResponse(200, true, 'Output documents stored successfully', {
            insertedCount: result.insertedCount,
        });
    } catch (error) {
        logger.error(`Error storing output documents: ${error}`);
        return makeResponse(
            500,
            false,
            `Failed to store output documents ${error instanceof Error ? error.message : 'Unknown error'}`,
            null
        );
    }
}

export const maxDuration = 60;
