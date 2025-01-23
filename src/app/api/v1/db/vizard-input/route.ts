import { NextRequest, NextResponse } from 'next/server';
import { createLoggerWithLabel } from '@/app/api/utils/logger';
import { currentUser } from '@clerk/nextjs/server';
import clientPromise from '@/app/api/utils/mongoClient';
import { MongoSaveInput } from '@/types';
import { STATUS_MAP } from '@/constants';
import { makeResponse } from '@/app/api/utils/makeResponse';
const logger = createLoggerWithLabel('DB_INPUT');

export async function POST(request: NextRequest) {
    try {
        logger.info('Starting to process image information storage request');

        // Validate request body exists
        if (!request.body) {
            logger.warn('Empty request body');
            return makeResponse(400, false, 'Request body is required', null);
        }

        let body: MongoSaveInput;
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

        const {
            status = STATUS_MAP.PROCESSING,
            project_id,
            video_url,
            video_type,
            prefer_length,
            lang,
            ext = 'mp4',
            subtitle_switch = 1,
            headline_switch = 1,
            max_clip_number,
            keywords,
            remove_silence_switch = 1,
        }: MongoSaveInput = body;

        // Validate required fields
        const requiredFields = {
            project_id,
            video_url,
            video_type,
            prefer_length,
            lang,
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => !value)
            .map(([key]) => key);

        if (missingFields.length > 0) {
            logger.warn(`Missing required fields: ${missingFields.join(', ')}`);
            return makeResponse(
                400,
                false,
                'Missing required fields',
                missingFields
            );
        }

        if (video_type === 1 && !ext) {
            logger.warn('Video type is set to 1 but extension is missing');
            return makeResponse(
                400,
                false,
                'Extension (ext) is required when video type is 1',
                null
            );
        }

        // Validate field types and formats
        if (typeof video_url !== 'string' || !video_url.startsWith('http')) {
            logger.warn('Invalid image_url format');
            return makeResponse(400, false, 'Invalid image_url format', null);
        }

        const user = await currentUser();
        if (!user) {
            logger.warn('User not authenticated');
            return makeResponse(401, false, 'Unauthorized', null);
        }

        const user_id = user.id;
        logger.info(`Processing DB save request for user: ${user_id}`);

        let client;
        try {
            client = await clientPromise;
        } catch (error) {
            logger.error(`MongoDB connection error: ${error}`);
            return makeResponse(503, false, 'Database connection failed', null);
        }

        // Ensure environment variables are defined
        if (!process.env.DB_NAME || !process.env.COLLECTION_NAME) {
            logger.error('Database configuration missing');
            throw new Error('Database or collection name not configured');
        }

        const db = client.db(process.env.DB_NAME);
        const collection = db.collection(process.env.COLLECTION_NAME);

        const document = {
            user_id,
            status,
            video_url,
            project_id,
            video_type,
            prefer_length,
            lang,
            ext,
            subtitle_switch,
            headline_switch,
            max_clip_number,
            keywords,
            remove_silence_switch,
            updated_at: new Date(),
            created_at: new Date(),
            completed_at: undefined,
        };

        const result = await collection.insertOne(document);

        if (!result.acknowledged) {
            logger.error('Failed to insert document into MongoDB');
            return makeResponse(500, false, 'Database operation failed', null);
        }

        logger.info(
            `Successfully stored image process with id: ${result.insertedId}`
        );
        return makeResponse(200, true, 'Image process stored successfully', {
            id: result.insertedId,
        });
    } catch (error) {
        logger.error(`Error storing image process: ${error}`);
        return makeResponse(
            500,
            false,
            'Failed to store image information',
            null
        );
    }
}

/* to update this document */
export async function PATCH(request: NextRequest) {
    try {
        logger.info('Starting to process status update request');

        let body;
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

        const { project_id, status } = body;

        if (!project_id || !status) {
            logger.warn('Missing project_id or status in request');
            return makeResponse(
                400,
                false,
                'project_id and status are required',
                null
            );
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

        if (!process.env.DB_NAME || !process.env.COLLECTION_NAME) {
            logger.error('Database configuration missing');
            return makeResponse(
                503,
                false,
                'Database configuration missing',
                null
            );
        }

        const db = client.db(process.env.DB_NAME);
        const collection = db.collection(process.env.COLLECTION_NAME);

        const updateData: any = {
            status,
            updated_at: new Date(),
        };

        // If status is completed, add completed_at timestamp
        if (status === STATUS_MAP.SUCCEEDED) {
            updateData.completed_at = new Date();
        }

        const result = await collection.updateOne(
            { project_id, user_id: user.id },
            { $set: updateData }
        );

        if (!result.matchedCount) {
            logger.warn(`No document found with project_id: ${project_id}`);
            return makeResponse(404, false, 'Document not found', null);
        }

        logger.info(
            `Successfully updated status for project_id: ${project_id}`
        );
        return makeResponse(200, true, 'Status updated successfully', null);
    } catch (error) {
        logger.error(`Error updating status: ${error}`);
        return makeResponse(500, false, 'Failed to update status', null);
    }
}
