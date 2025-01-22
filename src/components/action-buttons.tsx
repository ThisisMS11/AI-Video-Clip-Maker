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
                    STATUS_MAP.DEFAULT,
                    STATUS_MAP.PROCESSING,
                    STATUS_MAP.UPLOADING,
                    STATUS_MAP.SUCCEEDED,
                ].includes(status as any) && <Wand2 className="w-4 h-4 mr-2" />}
                {status === STATUS_MAP.FAILED && (
                    <RotateCw className="w-4 h-4 mr-2" />
                )}

                {/* Button text based on status */}
                {{
                    default: 'Make Clips',
                    uploading: 'Uploading Video...',
                    processing: 'Making Clips...',
                    failed: 'Retry...',
                    succeeded: 'Clips Made',
                }[status] || 'Make Clips'}
            </Button>

            <Button className="flex-1 rounded-lg" onClick={onHistory}>
                <History className="w-4 h-4 mr-2" />
                View History
            </Button>
        </div>
    );
}
