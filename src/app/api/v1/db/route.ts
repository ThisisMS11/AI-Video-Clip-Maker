import { MongoFetchResult } from '@/types';
import { currentUser } from '@clerk/nextjs/server';
import clientPromise from '../../utils/mongoClient';
import { createLoggerWithLabel } from '../../utils/logger';
import { makeResponse } from '../../utils/makeResponse';

const logger = createLoggerWithLabel('DB_FETCH_HISTORY');

export async function GET() {
    try {
        logger.info('Starting to process information retrieval request');

        const user = await currentUser();
        if (!user) {
            logger.warn('User not authenticated');
            return makeResponse(401, false, 'Unauthorized', null);
        }

        const user_id = user.id;
        logger.info(`Processing DB retrieval request for user: ${user_id}`);

        let client;
        try {
            client = await clientPromise;
        } catch (error) {
            logger.error(`MongoDB connection error: ${error}`);
            return makeResponse(503, false, 'Database connection failed', null);
        }

        // Ensure environment variables are defined
        if (
            !process.env.DB_NAME ||
            !process.env.PROJECTS_COLLECTION ||
            !process.env.OUTPUTS_COLLECTION
        ) {
            logger.error('Database configuration missing');
            return makeResponse(
                500,
                false,
                'Database configuration missing',
                null
            );
        }

        const db = client.db(process.env.DB_NAME);

        // Using MongoDB aggregation pipeline to join collections
        const pipeline = [
            // Match documents for the current user
            {
                $match: { user_id },
            },
            // Sort by creation date
            {
                $sort: { created_at: -1 },
            },
            // Limit to 100 documents
            {
                $limit: 100,
            },
            // Lookup videos from the videos collection
            {
                $lookup: {
                    from: process.env.OUTPUTS_COLLECTION,
                    localField: 'project_id',
                    foreignField: 'project_id',
                    as: 'videos',
                },
            },
            // Project the fields we want to return
            {
                $project: {
                    _id: 1,
                    project_name: 1,
                    project_id: 1,
                    status: 1,
                    settings: {
                        video_url: '$video_url',
                        video_type: '$video_type',
                        prefer_length: '$prefer_length',
                        lang: '$lang',
                        ext: '$ext',
                        subtitle_switch: '$subtitle_switch',
                        headline_switch: '$headline_switch',
                        max_clip_number: '$max_clip_number',
                        keywords: '$keywords',
                        created_at: '$created_at',
                        completed_at: '$completed_at',
                    },
                    videos: {
                        $map: {
                            input: '$videos',
                            as: 'videos',
                            in: {
                                video_url: '$$videos.video_url',
                                viral_score: '$$videos.viral_score',
                                transcript: '$$videos.transcript',
                                video_ms_duration: '$$videos.video_ms_duration',
                                video_id: '$$videos.video_id',
                                title: '$$videos.title',
                                viral_reason: '$$videos.viral_reason',
                            },
                        },
                    },
                },
            },
        ];

        const collection = db.collection(process.env.PROJECTS_COLLECTION);
        const documents = await collection
            .aggregate<MongoFetchResult>(pipeline)
            .toArray();

        if (!documents || documents.length === 0) {
            logger.info(`No documents found for user: ${user_id}`);
            return makeResponse(200, true, 'No processes found', []);
        }

        // Sanitize the documents - simplified since MongoDB is already returning the correct structure
        const sanitizedDocuments = documents.map((doc) => ({
            _id: doc._id,
            project_name: doc.project_name || '',
            project_id: doc.project_id,
            status: doc.status,
            settings: doc.settings || {
                video_url: '',
                video_type: 1,
                lang: 'en',
                prefer_length: 0,
                ext: null,
                subtitle_switch: null,
                headline_switch: null,
                max_clip_number: null,
                keywords: null,
                remove_silence_switch: null,
            },
            videos: Array.isArray(doc.videos) ? doc.videos : [],
        }));

        logger.info(
            `Retrieved and sanitized ${sanitizedDocuments.length} documents for user: ${user_id}`
        );
        return makeResponse(
            200,
            true,
            'Processes retrieved successfully',
            sanitizedDocuments
        );
    } catch (error) {
        logger.error(`Error retrieving processes: ${error}`);
        return makeResponse(500, false, 'Failed to retrieve information', null);
    }
}

export const maxDuration = 60;
