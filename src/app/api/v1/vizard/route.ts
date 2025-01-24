import { NextRequest } from 'next/server';
import { createLoggerWithLabel } from '@/app/api/utils/logger';
import { SettingsType } from '@/types';
import {
    LANGUAGE_MAP,
    requiredEnvVars,
    SETTINGS_MAP,
    ERROR_MESSAGES,
    STATUS_MAP,
    RETRIES,
} from '@/constants';
import {
    delay,
    calculateBackoff,
    getErrorMessage,
} from '@/utils/utilFunctions';
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
            message: getErrorMessage(e, 'Invalid video URL format'),
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

async function retryAPICall(settings: SettingsType): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> {
    for (let attempt = 1; attempt <= RETRIES.VIZARD_SERVICE; attempt++) {
        try {
            const response = await fetch(
                'https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/create',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        VIZARDAI_API_KEY: process.env
                            .VIZARDAI_API_KEY as string,
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
            logger.info(
                `API Called response (Attempt ${attempt}): ${JSON.stringify(data)}`
            );

            // Check if we should retry
            if (![1000, 2000].includes(data.code)) {
                // If not a known success code, and we haven't exhausted retries
                if (attempt < RETRIES.VIZARD_SERVICE) {
                    // Exponential backoff with jitter
                    const backoffTime = calculateBackoff(attempt);

                    logger.info(
                        `Retrying in ${backoffTime}ms due to code ${data.code}`
                    );
                    await delay(backoffTime);
                    continue;
                }
            }

            // Successful response or last retry
            return {
                success: [1000, 2000].includes(data.code),
                data,
            };
        } catch (error) {
            logger.error(
                `API call error (Attempt ${attempt}): ${error instanceof Error ? error.message : JSON.stringify(error)}`
            );

            // If it's the last attempt, throw the error
            if (attempt === RETRIES.VIZARD_SERVICE) {
                return {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                };
            }

            // Exponential backoff with jitter for error cases
            const backoffTime = calculateBackoff(attempt);

            logger.info(`Retrying in ${backoffTime}ms due to error`);
            await delay(backoffTime);
        }
    }

    // Fallback return (should never reach here due to earlier return)
    return {
        success: false,
        error: 'Max retries exceeded',
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

        // Use new retry mechanism
        const apiResult = await retryAPICall(settings);

        if (!apiResult.success) {
            // Handle failure after all retries
            if (apiResult.data?.code) {
                const errorMessage =
                    ERROR_MESSAGES[apiResult.data.code] || 'Unknown error';
                return makeResponse(200, false, errorMessage, {
                    status: STATUS_MAP.FAILED,
                    code: apiResult.data.code,
                    projectId: apiResult.data.projectId,
                });
            }

            return makeResponse(
                500,
                false,
                apiResult.error || 'Failed to process request',
                null
            );
        }

        const data = apiResult.data;

        logger.info(`API Called response : ${JSON.stringify(data)}`);
        return makeResponse(
            200,
            true,
            data.code === 1000 ? 'Processing' : 'Clipping succeeded',
            {
                status:
                    data.code === 1000
                        ? STATUS_MAP.PROCESSING
                        : STATUS_MAP.SUCCEEDED,
                code: data.code,
                projectId: data.projectId,
                ...(data.code === 2000 && { videos: data.videos }),
            }
        );
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
