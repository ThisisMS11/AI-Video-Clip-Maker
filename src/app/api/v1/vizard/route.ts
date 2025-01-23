import { NextRequest } from 'next/server';
import { createLoggerWithLabel } from '@/app/api/utils/logger';
import { SettingsType } from '@/types';
import { LANGUAGE_MAP, requiredEnvVars, SETTINGS_MAP } from '@/constants';
import { makeResponse } from '../../utils/makeResponse';

const logger = createLoggerWithLabel('VIZARD_CLIP_MAKER_API');

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        logger.error(`Missing required environment variable: ${envVar}`);
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

function validateRequirements(settings: SettingsType) {
    const requiredFields = [
        SETTINGS_MAP.VIDEO_URL,
        SETTINGS_MAP.VIDEO_TYPE,
        SETTINGS_MAP.LANG,
        SETTINGS_MAP.PREFER_LENGTH,
    ];

    /* Checking undefined or null */
    let inCorrectEntities = requiredFields.filter(
        (field) => !settings[field as keyof SettingsType]
    );

    if (inCorrectEntities.length > 0) {
        return {
            validated: false,
            message: 'Missing required fields',
            inCorrectEntities,
        };
    }

    /* Check whether video url is a valid url of not */
    try {
        new URL(settings.videoUrl);
    } catch (e) {
        return {
            validated: false,
            message: 'Invalid video URL format',
            inCorrectEntities: [SETTINGS_MAP.VIDEO_URL],
        };
    }

    /* check whether video type is one from [1,2,3,4,5] */
    if (![1, 2, 3, 4, 5].includes(Number(settings.videoType))) {
        return {
            validated: false,
            message: 'Invalid video type. Must be between 1-5',
            inCorrectEntities: [SETTINGS_MAP.VIDEO_TYPE],
        };
    }

    /* check whether lang is one from the supported language or not */
    const supportedLanguages = Object.values(LANGUAGE_MAP);
    if (!supportedLanguages.includes(settings.lang as any)) {
        return {
            validated: false,
            message: 'Unsupported language code',
            inCorrectEntities: [SETTINGS_MAP.LANG],
        };
    }

    /* check whether prefer length is one from [0,1,2,3,4] or not */
    if (settings.preferLength?.length == 0) {
        return {
            validated: false,
            message: 'Choose at least one preferlength option',
            inCorrectEntities: [SETTINGS_MAP.PREFER_LENGTH],
        };
    }

    return {
        validated: true,
        inCorrectEntities: [],
    };
}

export async function POST(request: NextRequest) {
    try {
        const { settings }: { settings: SettingsType } = await request.json();

        // Validate settings object
        if (!settings || typeof settings !== 'object') {
            logger.warn('Invalid settings object');
            return makeResponse(400, false, 'Invalid settings provided', null);
        }

        logger.info(`Validating Required Fields`);
        const { validated, message, inCorrectEntities } =
            validateRequirements(settings);

        if (!validated) {
            logger.warn(`${message} : ${inCorrectEntities.join(', ')}`);
            return makeResponse(400, false, message, inCorrectEntities);
        }

        logger.info(
            `Starting the process of creating clips for ${JSON.stringify(settings)}`
        );

        const response = await fetch(
            'https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/create',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    VIZARDAI_API_KEY: process.env.VIZARDAI_API_KEY as string,
                },
                body: JSON.stringify(settings),
            }
        );

        if (!response.ok) {
            throw new Error(
                `API request failed with status ${response.status}`
            );
        }

        const data = await response.json();

        logger.info(`API Called response : ${JSON.stringify(data)}`);
        return makeResponse(200, true, 'Clips making initiated', data);
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Vizard API error: ${error.message}`);

            if (error.message.includes('auth')) {
                return makeResponse(401, false, 'Authentication failed', null);
            }

            if (error.message.includes('rate')) {
                return makeResponse(429, false, 'Rate limit exceeded', null);
            }
        } else {
            logger.error(`Vizard API error: ${JSON.stringify(error)}`);
        }

        return makeResponse(500, false, 'Failed to process image', null);
    }
}

export const maxDuration = 60;

// Configure CORS if needed
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '7gb',
        },
    },
};
