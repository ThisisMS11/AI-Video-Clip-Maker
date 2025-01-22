import { NextRequest, NextResponse } from 'next/server';
import { createLoggerWithLabel } from '../../utils/logger';
import { currentUser } from '@clerk/nextjs/server';
import clientPromise from '@/app/api/utils/mongoClient';
import { MongoSave } from '@/types';
import { STATUS_MAP } from '@/constants';
const logger = createLoggerWithLabel('DB');

export async function POST(request: NextRequest) {
    try {
        logger.info('Starting to process image information storage request');

        // Validate request body exists
        if (!request.body) {
            logger.warn('Empty request body');
            return NextResponse.json(
                { error: 'Request body is required' },
                { status: 400 }
            );
        }

        let body: MongoSave;
        try {
            body = await request.json();
        } catch (e) {
            logger.warn(`Invalid JSON in request body ${JSON.stringify(e)}`);
            return NextResponse.json(
                { error: 'Invalid JSON in request body' },
                { status: 400 }
            );
        }

        const {
            status,
            image_url,
            output_url,
            target_age,
            created_at,
            completed_at,
            predict_time,
        }: MongoSave = body;

        // Validate required fields
        const requiredFields = {
            image_url,
            status,
            predict_time,
            ...(status === STATUS_MAP.succeeded && {
                output_url,
            }),
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => !value)
            .map(([key]) => key);

        if (missingFields.length > 0) {
            logger.warn(`Missing required fields: ${missingFields.join(', ')}`);
            return NextResponse.json(
                {
                    error: 'Missing required fields',
                    missingFields,
                },
                { status: 400 }
            );
        }

        // Validate field types and formats
        if (typeof image_url !== 'string' || !image_url.startsWith('http')) {
            logger.warn('Invalid image_url format');
            return NextResponse.json(
                { error: 'Invalid image_url format' },
                { status: 400 }
            );
        }

        const validStatuses = ['succeeded', 'failed'];
        if (!validStatuses.includes(status)) {
            logger.warn(`Invalid status: ${status}`);
            return NextResponse.json(
                { error: 'Invalid status value' },
                { status: 400 }
            );
        }

        const user = await currentUser();
        if (!user) {
            logger.warn('User not authenticated');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const user_id = user.id;
        logger.info(`Processing DB save request for user: ${user_id}`);

        let client;
        try {
            client = await clientPromise;
        } catch (error) {
            logger.error(`MongoDB connection error: ${error}`);
            return NextResponse.json(
                { error: 'Database connection failed' },
                { status: 503 }
            );
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
            image_url,
            output_url,
            target_age,
            status,
            predict_time,
            updated_at: new Date(),
            created_at: new Date(created_at),
            completed_at: completed_at ? new Date(completed_at) : null,
        };

        const result = await collection.insertOne(document);

        if (!result.acknowledged) {
            logger.error('Failed to insert document into MongoDB');
            return NextResponse.json(
                { error: 'Database operation failed' },
                { status: 500 }
            );
        }

        logger.info(
            `Successfully stored image process with id: ${result.insertedId}`
        );
        return NextResponse.json({
            success: true,
            id: result.insertedId,
            message: 'Image process stored successfully',
        });
    } catch (error) {
        logger.error(`Error storing image process: ${error}`);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: 'Failed to store image information',
            },
            { status: 500 }
        );
    }
}

/* to get the information of all the image processes of a user */
export async function GET() {
    try {
        logger.info('Starting to process image information retrieval request');

        const user = await currentUser();
        if (!user) {
            logger.warn('User not authenticated');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const user_id = user.id;
        logger.info(`Processing DB retrieval request for user: ${user_id}`);

        let client;
        try {
            client = await clientPromise;
        } catch (error) {
            logger.error(`MongoDB connection error: ${error}`);
            return NextResponse.json(
                { error: 'Database connection failed' },
                { status: 503 }
            );
        }

        // Ensure environment variables are defined
        if (!process.env.DB_NAME || !process.env.COLLECTION_NAME) {
            logger.error('Database configuration missing');
            throw new Error('Database or collection name not configured');
        }

        const db = client.db(process.env.DB_NAME);
        const collection = db.collection(process.env.COLLECTION_NAME);

        const documents = await collection
            .find({ user_id })
            .sort({ created_at: -1 })
            .limit(100)
            .toArray();

        if (!documents || documents.length === 0) {
            logger.info(`No documents found for user: ${user_id}`);
            return NextResponse.json({
                success: true,
                data: [],
                message: 'No image processes found',
            });
        }

        logger.info(
            `Retrieved ${documents.length} documents for user: ${user_id}`
        );
        return NextResponse.json({
            success: true,
            data: documents,
            message: 'Image processes retrieved successfully',
        });
    } catch (error) {
        logger.error(`Error retrieving image processes: ${error}`);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: 'Failed to retrieve image information',
            },
            { status: 500 }
        );
    }
}
