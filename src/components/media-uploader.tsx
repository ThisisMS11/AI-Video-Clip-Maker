import { Card, CardContent, Button, toast } from '@/imports/Shadcn_imports';
import { Trash2 } from 'lucide-react';
import { FileUploaderRegular } from '@uploadcare/react-uploader/next';
import '@uploadcare/react-uploader/core.css';
import { SettingsType } from '@/types';
import { SETTINGS_MAP, SUPPORTED_FORMATS } from '@/constants';
import { useState } from 'react';

interface VideoUploaderProps {
    uploadCareCdnUrl: string | null;
    onUploadSuccess: (url: string) => void;
    onRemoveMedia: () => void;
    onUpdateSetting: (key: keyof SettingsType, value: any) => void;
}

export default function VideoUploader({
    uploadCareCdnUrl,
    onUploadSuccess,
    onRemoveMedia,
    onUpdateSetting,
}: VideoUploaderProps) {
    const [uploadKey, setUploadKey] = useState(0);
    const handleUploadFile = (info: any) => {
        // console.log({ info });

        const extension = info.fileInfo.contentInfo.mime.subtype;
        // Check if the extension is supported
        const isSupported = SUPPORTED_FORMATS.includes(extension);

        if (isSupported) {
            onUploadSuccess(info.cdnUrl);
            onUpdateSetting(SETTINGS_MAP.EXT, extension);
        } else {
            toast.error('Error', {
                description:
                    'The uploaded file format is not supported. Supported: mp4, mov',
                duration: 5000,
            });
            setUploadKey((prev) => prev + 1);
        }
    };

    return (
        <div className="space-y-1 h-[44%]">
            <Card className="border-dashed h-full flex items-center justify-center">
                <CardContent className="flex items-center justify-center p-2">
                    {!uploadCareCdnUrl ? (
                        <FileUploaderRegular
                            sourceList="local, url, camera, dropbox, gdrive"
                            classNameUploader="uc-light uc-red"
                            pubkey={
                                process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY ||
                                ''
                            }
                            onFileUploadSuccess={handleUploadFile}
                            multiple={false}
                            className="h-32 flex items-center justify-center"
                            accept="video/*"
                            key={uploadKey}
                        />
                    ) : (
                        <div className="w-full space-y-2">
                            <div className="relative w-full aspect-video">
                                <video
                                    className="w-full h-full rounded-lg"
                                    controls
                                    src={uploadCareCdnUrl}
                                />
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={onRemoveMedia}
                                className="flex items-center gap-2 w-full"
                            >
                                <Trash2 className="w-4 h-4" />
                                Remove Video
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
