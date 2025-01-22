import { STATUS_MAP } from './constants';

export interface ModelSettings {
    image_url: string | undefined | null;
    target_age: string | number;
}

export type PredictionResponse = {
    status: string;
    image_url: string;
    output_url?: string;
    target_age: string;
    created_at: string;
    completed_at: string;
    predict_time: string | number;
    urls: {
        cancel: string;
        get: string;
        stream: string;
    };
};

export type MongoSave = {
    status: string;
    image_url: string;
    output_url?: string;
    target_age: string;
    created_at: string;
    completed_at: string;
    predict_time: string;
};

export interface ImageDocument {
    _id: string;
    image_url: string;
    output_url: string;
    target_age: string;
    status: string;
    created_at: string;
    completed_at: string;
    predict_time: string | number;
}

export interface ImageTransformationHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export type StatusType = keyof typeof STATUS_MAP;
