import { NextRequest } from 'next/server';
import { createLoggerWithLabel } from '@/app/api/utils/logger';
import { currentUser } from '@clerk/nextjs/server';
import clientPromise from '@/app/api/utils/mongoClient';
import { MongoSaveOutput, BaseOutput } from '@/types';
import { makeResponse } from '@/app/api/utils/makeResponse';

const logger = createLoggerWithLabel('DB_OUTPUT');

export async function POST(request: NextRequest) {
    try {
        logger.info('Starting to process output storage request');

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

        const { project_id, ...outputs } = body;
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
        if (!process.env.DB_NAME || !process.env.OUTPUT_COLLECTION) {
            logger.error('Database configuration missing');
            return makeResponse(
                503,
                false,
                'Database configuration missing',
                null
            );
        }

        const db = client.db(process.env.DB_NAME);
        const collection = db.collection(process.env.OUTPUT_COLLECTION);

        // Prepare documents for insertion
        const documents = outputs.map((output: BaseOutput) => ({
            project_id,
            user_id: user.id,
            ...output,
            created_at: new Date(),
        }));

        // Insert documents
        const result = await collection.insertMany(documents);

        if (!result.acknowledged) {
            logger.error('Failed to insert documents into MongoDB');
            return makeResponse(500, false, 'Database operation failed', null);
        }

        logger.info(
            `Successfully stored ${documents.length} output documents for project_id: ${project_id}`
        );
        return makeResponse(200, true, 'Output documents stored successfully', {
            insertedCount: result.insertedCount,
        });
    } catch (error) {
        logger.error(`Error storing output documents: ${error}`);
        return makeResponse(
            500,
            false,
            'Failed to store output documents',
            null
        );
    }
}
