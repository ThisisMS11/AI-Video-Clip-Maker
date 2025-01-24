import {
    Card,
    CardContent,
    Button,
    toast,
    Input,
} from '@/imports/Shadcn_imports';
import { Trash2 } from 'lucide-react';
import { FileUploaderRegular } from '@uploadcare/react-uploader/next';
import '@uploadcare/react-uploader/core.css';
import { SettingsType } from '@/types';
import { SETTINGS_MAP, SUPPORTED_FORMATS } from '@/constants';
import { useState } from 'react';

interface VideoUploaderProps {
    onUploadSuccess: (url: string) => void;
    onRemoveMedia: () => void;
    onUpdateSetting: (key: keyof SettingsType, value: any) => void;
    setIsPublicUrl: (flag: boolean) => void;
}

export default function VideoUploader({
    onUploadSuccess,
    onRemoveMedia,
    onUpdateSetting,
    setIsPublicUrl,
}: VideoUploaderProps) {
    const [uploadKey, setUploadKey] = useState(0);
    const [videoUrl, setVideoUrl] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const getEmbedUrl = (url: string) => {
        try {
            // YouTube handling
            if (url.includes('youtube.com/watch')) {
                const videoId = new URL(url).searchParams.get('v');
                // Add additional parameters to allow embedding
                return `https://www.youtube.com/embed/${videoId}?autoplay=0&origin=${window.location.origin}`;
            }

            // YouTube shortened URL handling
            if (url.includes('youtu.be/')) {
                const videoId = url.split('/').pop();
                return `https://www.youtube.com/embed/${videoId}?autoplay=0&origin=${window.location.origin}`;
            }

            // Vimeo URL handling
            if (url.includes('vimeo.com/')) {
                const videoId = url.split('/').pop();
                return `https://player.vimeo.com/video/${videoId}`;
            }

            // Google Drive handling
            if (url.includes('drive.google.com/')) {
                const match = url.match(/\/d\/([^/]+)/);
                if (match) {
                    return `https://drive.google.com/file/d/${match[1]}/preview`;
                }
            }

            // Streamyard handling
            if (url.includes('streamyard.com/')) {
                return url.replace('watch/', 'embed/');
            }

            // Generic video URL handling
            const urlObj = new URL(url);
            const fileExt = urlObj.pathname.split('.').pop()?.toLowerCase();

            // Check if it's a direct video file URL
            if (['mp4', 'mov', 'webm', 'ogg'].includes(fileExt || '')) {
                return url;
            }

            // Fallback to original URL if no specific handling
            return url;
        } catch (error) {
            console.warn(`URL Conversion Error ${error}`);
            toast.error('URL Conversion Error', {
                description: 'Could not convert the video URL.',
                duration: 3000,
            });
            return url;
        }
    };

    const handleUploadFile = (info: any) => {
        const extension = info.fileInfo.contentInfo.mime.subtype;
        const isSupported = SUPPORTED_FORMATS.includes(extension);

        if (isSupported) {
            onUploadSuccess(info.cdnUrl);
            setPreviewUrl(info.cdnUrl);
            setIsPublicUrl(false);
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

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVideoUrl(e.target.value);
    };

    const handleUrlSubmit = () => {
        if (videoUrl) {
            try {
                const url = new URL(videoUrl);
                const embedUrl = getEmbedUrl(url.toString());
                setPreviewUrl(embedUrl);
                onUploadSuccess(videoUrl);
                onUpdateSetting(SETTINGS_MAP.VIDEO_URL, videoUrl);
                setIsPublicUrl(true);
            } catch (error) {
                console.log(`handleUrlSubmit error : ${error}`);
                toast.error('Invalid URL', {
                    description: 'Please enter a valid public video URL.',
                    duration: 5000,
                });
            }
        }
    };

    return (
        <div className="space-y-1 h-[44%] flex flex-col">
            {!previewUrl ? (
                <>
                    <Card className="border-dashed h-full flex items-center justify-center">
                        <CardContent className="flex items-center justify-center p-2">
                            <div className="flex flex-col w-full h-full">
                                <FileUploaderRegular
                                    sourceList="local"
                                    classNameUploader="uc-light uc-red"
                                    pubkey={
                                        process.env
                                            .NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY ||
                                        ''
                                    }
                                    onFileUploadSuccess={handleUploadFile}
                                    multiple={false}
                                    className="h-24 flex items-center justify-center"
                                    accept="video/*"
                                    key={uploadKey}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <span className="mx-auto text-gray-400 mb-4"> Or </span>
                    <div className="w-full flex gap-2 items-center">
                        <Input
                            type="url"
                            placeholder="Paste public video URL"
                            value={videoUrl}
                            onChange={handleUrlChange}
                            className="flex-1"
                        />
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleUrlSubmit}
                        >
                            Submit
                        </Button>
                    </div>
                </>
            ) : (
                <div className="w-full space-y-2">
                    <div className="relative w-full aspect-video">
                        <iframe
                            className="w-full h-full rounded-lg"
                            src={previewUrl}
                            title="Video Preview"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            onRemoveMedia();
                            setPreviewUrl(null);
                        }}
                        className="flex items-center gap-2 w-full"
                    >
                        <Trash2 className="w-4 h-4" />
                        Remove Video
                    </Button>
                </div>
            )}
        </div>
    );
}
