import { SettingsType } from '@/types';
import { FileUploaderMinimal } from '@uploadcare/react-uploader';
import '@uploadcare/react-uploader/core.css';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    Label,
    Input,
    Button,
    Switch,
} from '@/imports/Shadcn_imports';
import { SETTINGS_MAP, LANGUAGE_MAP } from '@/constants';

interface AdvancedSettingsProps {
    settings: SettingsType | null;
    onUpdateSetting: (key: keyof SettingsType, value: any) => void;
    onMaskUpload: (info: any) => void;
    uploadMaskKey: number;
}

export default function AdvancedSettings({
    settings,
    onUpdateSetting,
    onMaskUpload,
    uploadMaskKey,
}: AdvancedSettingsProps) {
    return (
        <div className="space-y-4 w-full h-[42%] p-5 overflow-y-auto">
            <h3 className="text-lg font-medium">Advanced Settings</h3>

            <div className="space-y-3">
                <div className="space-y-2">
                    <Label>Language</Label>

                    <Select
                        value={settings?.lang}
                        defaultValue={LANGUAGE_MAP['English']}
                        onValueChange={(value) =>
                            onUpdateSetting(SETTINGS_MAP.LANG, value)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(LANGUAGE_MAP).map(
                                ([displayText, value]) => (
                                    <SelectItem key={value} value={value}>
                                        {displayText}
                                    </SelectItem>
                                )
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Video Type</Label>
                    <Select
                        value={settings?.videoType.toString()}
                        onValueChange={(value) =>
                            onUpdateSetting(
                                SETTINGS_MAP.VIDEO_TYPE,
                                parseInt(value)
                            )
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Remote Video File</SelectItem>
                            <SelectItem value="2">YouTube Link</SelectItem>
                            <SelectItem value="3">Google Drive Link</SelectItem>
                            <SelectItem value="4">Vimeo Link</SelectItem>
                            <SelectItem value="5">StreamYard Link</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Preferred Length</Label>
                    <Select
                        value={settings?.preferLength.toString()}
                        onValueChange={(value) =>
                            onUpdateSetting(
                                SETTINGS_MAP.PREFER_LENGTH,
                                parseInt(value)
                            )
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">Auto</SelectItem>
                            <SelectItem value="1">Less than 30s</SelectItem>
                            <SelectItem value="2">30s to 60s</SelectItem>
                            <SelectItem value="3">60s to 90s</SelectItem>
                            <SelectItem value="4">90s to 3min</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {settings?.videoType === 1 && (
                    <div className="space-y-2">
                        <Label>File Extension</Label>
                        <Select
                            value={settings?.ext}
                            onValueChange={(value) =>
                                onUpdateSetting(SETTINGS_MAP.EXT, value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mp4">MP4</SelectItem>
                                <SelectItem value="3gp">3GP</SelectItem>
                                <SelectItem value="avi">AVI</SelectItem>
                                <SelectItem value="mov">MOV</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Video URL</Label>
                    <Input
                        type="url"
                        value={settings?.videoUrl}
                        onChange={(e) =>
                            onUpdateSetting(
                                SETTINGS_MAP.VIDEO_URL,
                                e.target.value
                            )
                        }
                        placeholder="https://"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Project Name (Optional)</Label>
                    <Input
                        value={settings?.projectName}
                        onChange={(e) =>
                            onUpdateSetting(
                                SETTINGS_MAP.PROJECT_NAME,
                                e.target.value
                            )
                        }
                        placeholder="Enter project name"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Keywords (Optional)</Label>
                    <Input
                        value={settings?.keywords}
                        onChange={(e) =>
                            onUpdateSetting(
                                SETTINGS_MAP.KEYWORDS,
                                e.target.value
                            )
                        }
                        placeholder="keyword1, keyword2, keyword3"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Max Clip Number (Optional)</Label>
                    <Input
                        type="number"
                        value={settings?.maxClipNumber}
                        onChange={(e) =>
                            onUpdateSetting(
                                SETTINGS_MAP.MAX_CLIP_NUMBER,
                                parseInt(e.target.value)
                            )
                        }
                        min={0}
                        max={100}
                        placeholder="Enter number (0-100)"
                    />
                </div>

                <div className="space-y-2 flex items-center justify-between gap-4">
                    <div className="flex items-center justify-between gap-16">
                        <div className="flex items-center gap-2">
                            <Label>Subtitle</Label>
                            <Switch
                                checked={settings?.subtitleSwitch === 1}
                                onCheckedChange={(checked) =>
                                    onUpdateSetting(
                                        SETTINGS_MAP.SUBTITLE_SWITCH,
                                        checked ? 1 : 0
                                    )
                                }
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Label>Headline</Label>
                            <Switch
                                checked={settings?.headlineSwitch === 1}
                                onCheckedChange={(checked) =>
                                    onUpdateSetting(
                                        SETTINGS_MAP.HEADLINE_SWITCH,
                                        checked ? 1 : 0
                                    )
                                }
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Label>Remove Silence</Label>
                            <Switch
                                checked={settings?.removeSilenceSwitch === 1}
                                onCheckedChange={(checked) =>
                                    onUpdateSetting(
                                        SETTINGS_MAP.REMOVE_SILENCE_SWITCH,
                                        checked ? 1 : 0
                                    )
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
