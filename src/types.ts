import { STATUS_MAP } from './constants';

interface BaseVideoSettings {
    video_url: string;
    video_type: number; // 1-5
    lang: string;
    prefer_length: number[]; // 0-4
    ext?: string;
    subtitle_switch?: number; // 0-1
    headline_switch?: number; // 0-1
    max_clip_number?: number;
    keywords?: string;
    remove_silence_switch?: number; // 0-1
}

export interface BaseOutput {
    video_url: string;
    viral_score?: string;
    transcript?: string;
    video_ms_duration?: number;
    video_id?: number;
    title?: string;
    viral_reason?: string;
}

export type MongoSaveInput = BaseVideoSettings & {
    status: string;
    project_id: number;
};

export type MongoSaveOutput = {
    project_id: number;
    outputs: BaseOutput[];
};

export type MongoFetchResult = {
    _id: string;
    project_name?: string;
    project_id: number;
    status: string;
    settings: BaseVideoSettings;
    output: BaseOutput[];
};

export interface SettingsType {
    videoUrl: string;
    videoType: number; // 1-5
    lang: string;
    preferLength: number[]; // 0-4
    ext?: string;
    subtitleSwitch?: number; // 0-1
    headlineSwitch?: number; // 0-1
    maxClipNumber?: number;
    keywords?: string;
    projectName?: string;
    removeSilenceSwitch?: number; // 0-1
}

export type StatusType = keyof typeof STATUS_MAP;

export interface ImageTransformationHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export interface clipType {
    viralScore: string;
    relatedTopic: string;
    transcript: string;
    videoUrl: string;
    videoMsDuration: number;
    videoId: number;
    title: string;
    viralReason: string;
}

export interface pollingResponse {
    code: number;
    projectId?: number;
    videos?: clipType[];
}

export interface APIResponse {
    statusCode: number;
    success: boolean;
    message: string;
    data: any;
}
