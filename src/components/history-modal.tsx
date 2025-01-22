'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { formatDuration } from '@/utils/utilFunctions';
import { ImageDocument, ImageTransformationHistoryModalProps } from '@/types';
import { databaseService } from '@/services/api';

export function ImageHistoryModal({
    open,
    onOpenChange,
}: ImageTransformationHistoryModalProps) {
    const [history, setHistory] = useState<ImageDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open) {
            fetchHistory();
        }
    }, [open]);

    const fetchHistory = async () => {
        try {
            const result = await databaseService.fetchHistory();
            setHistory(result);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusStyles = {
            succeeded: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
            processing: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
        };

        return (
            <Badge
                variant="outline"
                className={statusStyles[status as keyof typeof statusStyles]}
            >
                {status}
            </Badge>
        );
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>History</DialogTitle>
                    </DialogHeader>
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Target Age</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Processing Time</TableHead>
                                    <TableHead>Original Image</TableHead>
                                    <TableHead>Transformed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history &&
                                    history.map((process) => (
                                        <TableRow key={process._id}>
                                            <TableCell className="whitespace-nowrap">
                                                {format(
                                                    new Date(
                                                        process.created_at
                                                    ),
                                                    'PPp'
                                                )}
                                                {process.completed_at && (
                                                    <div className="text-xs text-gray-500">
                                                        Completed:{' '}
                                                        {format(
                                                            new Date(
                                                                process.completed_at
                                                            ),
                                                            'PPp'
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div>{process.target_age}</div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(process.status)}
                                            </TableCell>
                                            <TableCell>
                                                {formatDuration(
                                                    process.predict_time.toString()
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-col gap-2">
                                                    <a
                                                        href={process.image_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 hover:text-blue-700"
                                                    >
                                                        Original Image
                                                    </a>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <a
                                                    href={process.output_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    Transformed{' '}
                                                    {process.target_age ===
                                                    'default'
                                                        ? 'GIF'
                                                        : 'Image'}
                                                </a>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
