import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { createLoggerWithLabel } from '../../utils/logger';
import { IMAGE_TYPE, CLOUDINARY_FOLDER } from '@/constants';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const logger = createLoggerWithLabel('CLOUDINARY');

const isValidImage = async (url: string) => {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        const contentType = response.headers.get('content-type');
        return contentType?.startsWith('image/');
    } catch (error) {
        logger.error(`Error validating image type: ${JSON.stringify(error)}`);
        return false;
    }
};

export async function POST(request: NextRequest) {
    const { imageUrl, type } = await request.json();

    if (!imageUrl) {
        logger.warn('Image URL is required');
        return NextResponse.json(
            { error: 'Image URL is required' },
            { status: 400 }
        );
    }

    if (!(await isValidImage(imageUrl))) {
        logger.warn('Invalid image type');
        return NextResponse.json(
            { error: 'Invalid image type. Supported types: JPG, PNG, WebP' },
            { status: 400 }
        );
    }

    const folder =
        type === IMAGE_TYPE.ORIGINAL
            ? CLOUDINARY_FOLDER.ORIGINAL
            : CLOUDINARY_FOLDER.ENHANCED;

    try {
        const uploadOptions: UploadApiOptions = {
            resource_type: 'image',
            folder: folder,
            quality_analysis: true,
            transformation: [
                {
                    quality: 100,
                    fetch_format: 'auto',
                },
            ],
            flags: 'preserve_transparency',
            delivery_type: 'upload',
        };

        logger.info(
            `Uploading image type: ${type} to cloudinary with options: ${JSON.stringify(uploadOptions)}`
        );

        const result = await cloudinary.uploader.upload(
            imageUrl,
            uploadOptions
        );

        logger.info(`Image uploaded to cloudinary: ${result.secure_url}`);

        const responseUrl =
            type === IMAGE_TYPE.ORIGINAL && result.eager?.[0]?.secure_url
                ? result.eager[0].secure_url
                : result.secure_url;

        return NextResponse.json({
            url: responseUrl,
            public_id: result.public_id,
        });
    } catch (error) {
        logger.error(
            `Error uploading image to cloudinary: ${JSON.stringify(error)}`
        );
        return NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
        );
    }
}
