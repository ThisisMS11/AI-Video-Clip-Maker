import { RETRY_CONFIG } from '@/constants';

export const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
    });
};

export const formatDuration = (predictTime: string) => {
    const seconds = parseFloat(predictTime);
    if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
    }
    return `${seconds.toFixed(1)}s`;
};

export const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

export const calculateBackoff = (retryCount: number): number => {
    const exponentialDelay = RETRY_CONFIG.BASE_DELAY * Math.pow(2, retryCount);
    const maxDelay = Math.min(exponentialDelay, RETRY_CONFIG.MAX_DELAY);
    const jitter = maxDelay * RETRY_CONFIG.JITTER_FACTOR * Math.random();
    return maxDelay + jitter;
};
