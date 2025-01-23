import { useState } from 'react';
import { SettingsType } from '@/types';
import { INITIAL_SETTINGS } from '@/constants';

export function useMediaSettings() {
    const [settings, setSettings] = useState<SettingsType>(INITIAL_SETTINGS);

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
