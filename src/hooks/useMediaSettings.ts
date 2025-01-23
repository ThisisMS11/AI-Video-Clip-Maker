import { useState } from 'react';
import { SettingsType } from '@/types';
import { LANGUAGE_MAP } from '@/constants';

export function useMediaSettings() {
    const [settings, setSettings] = useState<SettingsType>({
        videoUrl: '',
        videoType: 1,
        lang: LANGUAGE_MAP['English'],
        preferLength: 0,
        ext: '',
        maxClipNumber: 5,
        keywords: '',
        projectName: '',
        subtitleSwitch: 1,
        headlineSwitch: 1,
        removeSilenceSwitch: 1,
    });

    const updateSetting = (key: keyof SettingsType, value: string | number) => {
        setSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return {
        settings,
        setSettings,
        updateSetting,
    };
}
