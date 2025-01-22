import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { FileUploaderRegular } from '@uploadcare/react-uploader/next';
import '@uploadcare/react-uploader/core.css';

interface ImageUploaderProps {
    uploadCareCdnUrl: string | null;
    onUploadSuccess: (url: string) => void;
    onRemoveImage: () => void;
}

export default function ImageUploader({
    uploadCareCdnUrl,
    onUploadSuccess,
    onRemoveImage,
}: ImageUploaderProps) {
    return (
        <div className="space-y-1 h-[44%]">
            {!uploadCareCdnUrl ? (
                <Card className="border-dashed h-full flex items-center justify-center">
                    <CardContent className="flex items-center justify-center p-2 w-full ">
                        <FileUploaderRegular
                            sourceList="local, url, camera, dropbox, gdrive"
                            classNameUploader="uc-light uc-red"
                            pubkey={
                                process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY ||
                                ''
                            }
                            onFileUploadSuccess={(info) => {
                                onUploadSuccess(info.cdnUrl);
                            }}
                            multiple={false}
                            className="flex items-center justify-center"
                            accept="image/*"
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="relative w-full h-full  rounded-lg p-2 space-y-2">
                    <div className="h-[90%] bg-muted">
                        <img
                            className="rounded-lg h-full w-full object-contain"
                            src={
                                uploadCareCdnUrl ||
                                'https://res.cloudinary.com/cloudinarymohit/image/upload/v1737450373/task_3_Age_Transformation_GIFs_Original/npsxgmbxp4htyiegdh8c.jpg'
                            }
                            alt="Uploaded Image.."
                        />
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={onRemoveImage}
                        className="flex items-center gap-2 w-full"
                    >
                        <Trash2 className="w-4 h-4" />
                        Remove Image
                    </Button>
                </div>
            )}
        </div>
    );
}
