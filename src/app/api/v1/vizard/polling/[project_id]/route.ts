import { NextRequest } from 'next/server';
import { createLoggerWithLabel } from '@/app/api/utils/logger';
import { makeResponse } from '@/app/api/utils/makeResponse';
import { pollingResponse } from '@/types';
import { STATUS_MAP, ERROR_MESSAGES } from '@/constants';

const logger = createLoggerWithLabel('VIZARD_STATUS_API');

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ project_id: number }> }
) {
    try {
        const project_id = (await params).project_id;

        if (!project_id) {
            logger.warn('Missing project_id parameter');
            return makeResponse(400, false, 'Project ID is required', null);
        }

        if (!process.env.VIZARDAI_API_KEY) {
            logger.error('Missing VIZARDAI_API_KEY environment variable');
            return makeResponse(500, false, 'Server configuration error', null);
        }

        logger.info(`Fetching status for project: ${project_id}`);

        const response = await fetch(
            `https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/query/${project_id}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    VIZARDAI_API_KEY: process.env.VIZARDAI_API_KEY,
                },
            }
        );

        if (!response.ok) {
            throw new Error(
                `API request failed with status ${response.status}`
            );
        }

        const data: pollingResponse = await response.json();
        logger.info(
            `Received response for project ${project_id} code : ${data.code}`
        );

        /* Handle different response codes */
        switch (data.code) {
            case 1000:
                logger.info('[Status] : Processing');
                return makeResponse(200, true, 'Processing', {
                    status: STATUS_MAP.PROCESSING,
                    code: data.code,
                });
            case 2000:
                logger.info('[Status] : Succeeded');
                return makeResponse(200, true, 'Clipping succeeded', {
                    status: STATUS_MAP.SUCCEEDED,
                    videos: data.videos,
                    code: data.code,
                });
            default:
                logger.info('[Status] : Failed');
                const errorMessage =
                    ERROR_MESSAGES[data.code] || 'Unknown error';
                logger.error(
                    `Error for project ${project_id}: ${errorMessage}`
                );
                return makeResponse(200, false, errorMessage, {
                    status: STATUS_MAP.FAILED,
                    code: data.code,
                });
        }
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Status check failed: ${error.message}`);

            if (error.message.includes('auth')) {
                return makeResponse(401, false, 'Authentication failed', null);
            }
        }

        logger.error(`Unexpected error: ${JSON.stringify(error)}`);
        return makeResponse(500, false, 'Failed to check project status', null);
    }
}

export const maxDuration = 60;

export const config = {
    api: {
        bodyParser: false,
    },
};
