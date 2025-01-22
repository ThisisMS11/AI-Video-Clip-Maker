import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { v2 as cloudinary } from 'cloudinary';
import { createLoggerWithLabel } from '@/app/api/utils/logger';
import { ModelSettings } from '@/types';
import { requiredEnvVars } from '@/constants';

const logger = createLoggerWithLabel('AGE_TRANSFORMATION_REPLICATE');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Validate required environment variables

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        logger.error(`Missing required environment variable: ${envVar}`);
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

const replicate = new Replicate({
    auth: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
    try {
        const { settings }: { settings: ModelSettings } = await request.json();

        // Validate settings object
        if (!settings || typeof settings !== 'object') {
            logger.warn('Invalid settings object');
            return NextResponse.json(
                { error: 'Invalid settings provided' },
                { status: 400 }
            );
        }

        if (!settings.image_url) {
            logger.warn('Image URL is required');
            return NextResponse.json(
                { error: 'Image URL is required' },
                { status: 400 }
            );
        }

        // Validate image URL format
        try {
            new URL(settings.image_url);
        } catch (e) {
            logger.warn(`Invalid image URL format ${JSON.stringify(e)}`);
            return NextResponse.json(
                { error: 'Invalid image URL format' },
                { status: 400 }
            );
        }

        if (!settings.target_age) {
            settings.target_age = 'default';
        }

        logger.info(
            `Creating age transformation GIF for ${settings.image_url} with target age ${settings.target_age}`
        );

        const input = {
            image: settings.image_url,
            target_age: settings.target_age
                ? String(settings.target_age)
                : 'default',
        };

        const prediction = await replicate.predictions.create({
            version:
                '9222a21c181b707209ef12b5e0d7e94c994b58f01c7b2fec075d2e892362f13c',
            input,
            webhook: `${process.env.WEBHOOK_URL}/api/v1/replicate/webhook`,
            webhook_events_filter: ['start', 'output', 'completed'],
        });

        const latest = await replicate.predictions.get(prediction.id);

        logger.info(
            `Prediction created with id ${latest.id} and status ${latest.status}`
        );

        return NextResponse.json({
            success: true,
            id: latest.id,
            status: latest.status,
            webhookUrl: `${process.env.WEBHOOK_URL}/api/v1/replicate/webhook`,
        });
    } catch (error) {
        // Handle specific error types
        if (error instanceof Error) {
            logger.error(
                `Replicate AI Age transformation API error: ${error.message}`
            );

            if (error.message.includes('auth')) {
                return NextResponse.json(
                    { error: 'Authentication failed' },
                    { status: 401 }
                );
            }

            if (error.message.includes('rate')) {
                return NextResponse.json(
                    { error: 'Rate limit exceeded' },
                    { status: 429 }
                );
            }
        } else {
            logger.error(
                `Replicate AI Age transformation API error: ${JSON.stringify(error)}`
            );
        }

        return NextResponse.json(
            { error: 'Failed to process image' },
            { status: 500 }
        );
    }
}

export const maxDuration = 60;

// Configure CORS if needed
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};
