export const STATUS_MAP = {
    default: 'default',
    processing: 'processing',
    uploading: 'uploading',
    succeeded: 'succeeded',
    error: 'error',
    failed: 'failed',
} as const;

export const RETRIES = {
    MONGO_DB_SERVICE: 5,
    REPLICATE_SERVICE: 3,
    CLOUDINARY_SERVICE: 5,
} as const;

export const IMAGE_TYPE = {
    ORIGINAL: 'original',
    PROCESSED: 'processed',
} as const;

export const CLOUDINARY_FOLDER = {
    ORIGINAL: 'task_3_Age_Transformation_GIFs_Original',
    ENHANCED: 'task_3_Age_Transformation_GIFs_Enhanced',
} as const;

export const requiredEnvVars = [
    'NEXT_PUBLIC_REPLICATE_API_TOKEN',
    'WEBHOOK_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
];

export const WAIT_TIMES = {
    CLOUDINARY_SERVICE: 5000,
    REPLICATE_SERVICE_RETRY: 5000,
    PREDICTION_SERVICE: 5000,
} as const;
