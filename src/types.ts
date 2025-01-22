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


export type MongoSaveInput = {
    status: string;
    project_name?: string;
    project_id : number;
    ext?: string;
    video_url: string;
    video_type: number;
    language: string;
    prefer_length: number;
    subtitle_switch?: number;
    headline_switch?: number;
    max_clip_number?: number;
    keywords?: string;
    template_id?: number;
    remove_silence_switch?: number;
    created_at?: string;
};

export type MongoSaveOutput = {
    project_id: number;
    viral_score?: string;
    transcript?: string;
    video_url: string;
    video_ms_duration?: number;
    video_id?: number;
    title?: string;
    viral_reason?: string;
};


export type MongoFetchResult  = {
    _id : string;
    project_name? : string;
    project_id: number;
    status : string;
    settings : {
        ext?: string;
        video_url: string;
        video_type: number;
        language: string;
        prefer_length: number;
        subtitle_switch?: number;
        headline_switch?: number;
        max_clip_number?: number;
        keywords?: string;
        template_id?: number;
        remove_silence_switch?: number;
    }
    output : {
        viral_score?: string;
        transcript?: string;
        video_url: string;
        video_ms_duration?: number;
        video_id?: number;
        title?: string;
        viral_reason?: string;
    }[]
}


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

export interface SettingsType {
    lang: string;
    videoUrl: string;
    ext?: 'mp4' | '3gp' | 'avi' | 'mov';
    preferLength: number; // 0-4
    projectName?: string;
    subtitleSwitch: number; // 0-1
    headlineSwitch: number; // 0-1
    videoType: number; // 1-5
    maxClipNumber?: number;
    keywords?: string;
    templateId?: number;
    removeSilenceSwitch: number; // 0-1
}

export type StatusType = keyof typeof STATUS_MAP;
