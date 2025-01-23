import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { createLoggerWithLabel } from '../../utils/logger';
import { MEDIA_TYPE, CLOUDINARY_FOLDER } from '@/constants';
import { makeResponse } from '../../utils/makeResponse';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const logger = createLoggerWithLabel('CLOUDINARY');

const getOptimalVideoSettings = (): Partial<any> => {
    const baseSettings = {
        video_codec: 'h264:main',
        quality_analysis: true,
        audio_codec: 'aac',
        audio_frequency: 44100,
        audio_bitrate: '128k',
    };

    return {
        ...baseSettings,
        eager: [
            {
                raw_transformation: ['q_auto:good', 'vc_h264:main'].join('/'),
                format: 'mp4',
            },
        ],
        eager_async: true,
    };
};

export async function POST(request: NextRequest) {
    const { mediaUrl, type } = await request.json();

    if (!mediaUrl) {
        logger.warn('Video URL is required');
        return NextResponse.json(
            { error: 'Video URL is required' },
            { status: 400 }
        );
    }
    const folder =
        type === MEDIA_TYPE.ORIGINAL
            ? CLOUDINARY_FOLDER.ORIGINAL
            : CLOUDINARY_FOLDER.CLIPPED;

    try {
        const uploadOptions: UploadApiOptions = {
            resource_type: 'video',
            folder: folder,
        };

        // Modified settings for original videos
        if (type === MEDIA_TYPE.ORIGINAL) {
            const videoSettings = getOptimalVideoSettings();
            Object.assign(uploadOptions, {
                ...videoSettings,
            });
        } else {
            Object.assign(uploadOptions, {
                quality_analysis: true,
                transformation: [
                    {
                        quality: 'auto:best',
                        audio_codec: 'aac',
                        audio_frequency: 44100,
                        audio_bitrate: '128k',
                    },
                ],
            });
        }

        logger.info(
            `Uploading video type : ${type} to cloudinary with options: ${JSON.stringify(uploadOptions)}`
        );

        const result = await cloudinary.uploader.upload(
            mediaUrl,
            uploadOptions
        );

        logger.info(`Video uploaded to cloudinary: ${result.secure_url}`);

        // Return appropriate URL based on video type
        const responseUrl =
            type === MEDIA_TYPE.ORIGINAL && result.eager?.[0]?.secure_url
                ? result.eager[0].secure_url
                : result.secure_url;

        const data = {
            url: responseUrl,
            public_id: result.public_id,
        };

        return makeResponse(
            200,
            true,
            'Successfully uploaded media to cloudinary',
            data
        );
    } catch (error) {
        logger.error(
            `Error uploading video to cloudinary: ${JSON.stringify(error)}`
        );
        return makeResponse(
            500,
            false,
            `Failed to upload video :${error instanceof Error ? error.message : 'Unknown error'}`,
            null
        );
    }
}
