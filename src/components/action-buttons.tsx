import { Button } from '@/components/ui/button';
import { STATUS_MAP } from '@/constants';
import { Wand2, RotateCw, History } from 'lucide-react';

interface ActionButtonsProps {
    status: string;
    onProcess: () => void;
    onHistory: () => void;
    isDisabled?: boolean;
}

export default function ActionButtons({
    status,
    onProcess,
    onHistory,
}: ActionButtonsProps) {
    return (
        <div className="flex gap-3 h-fit px-2 flex-wrap">
            <Button
                className="flex-1 rounded-lg"
                onClick={onProcess}
                disabled={['uploading', 'processing'].includes(status)}
            >
                {/* Icon based on status */}
                {[
                    STATUS_MAP.default,
                    STATUS_MAP.processing,
                    STATUS_MAP.uploading,
                    STATUS_MAP.succeeded,
                ].includes(status as any) && <Wand2 className="w-4 h-4 mr-2" />}
                {status === STATUS_MAP.failed && (
                    <RotateCw className="w-4 h-4 mr-2" />
                )}

                {/* Button text based on status */}
                {{
                    default: 'Transform',
                    uploading: 'Uploading Image...',
                    processing: 'Transforming Image...',
                    failed: 'Retry...',
                    succeeded: 'Transformed Image',
                }[status] || 'Transform Image'}
            </Button>

            <Button className="flex-1 rounded-lg" onClick={onHistory}>
                <History className="w-4 h-4 mr-2" />
                View History
            </Button>
        </div>
    );
}
