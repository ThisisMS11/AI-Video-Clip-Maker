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
import {
    ImageTransformationHistoryModalProps,
    MongoFetchResult,
} from '@/types';
import { databaseService } from '@/services/api';
import { sampleHistoryOutput } from '@/constants';

export function ImageHistoryModal({
    open,
    onOpenChange,
}: ImageTransformationHistoryModalProps) {
    const [history, setHistory] =
        useState<MongoFetchResult[]>(sampleHistoryOutput);
    const [loading, setLoading] = useState(false);
    const [selectedSettings, setSelectedSettings] =
        useState<MongoFetchResult | null>(null);
    const [selectedOutput, setSelectedOutput] =
        useState<MongoFetchResult | null>(null);

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
                className={`${statusStyles[status as keyof typeof statusStyles]} px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider`}
            >
                {status === 'processing' && (
                    <Loader2 className="w-3 h-3 mr-1 inline animate-spin" />
                )}
                {status}
            </Badge>
        );
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Video Enhancement History</DialogTitle>
                    </DialogHeader>
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold ">
                                            Project ID
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                            Project Name
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                            Settings
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                            Output Clips
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                            Status
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history &&
                                        history.map((process) => (
                                            <TableRow
                                                key={process._id}
                                                className="hover:bg-gray-50 transition-colors duration-200"
                                            >
                                                <TableCell className="font-medium">
                                                    {process.project_id}
                                                </TableCell>
                                                <TableCell>
                                                    {process.project_name ||
                                                        'Untitled'}
                                                </TableCell>
                                                <TableCell>
                                                    <button
                                                        onClick={() =>
                                                            setSelectedSettings(
                                                                process
                                                            )
                                                        }
                                                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors duration-200"
                                                    >
                                                        <svg
                                                            className="w-4 h-4 mr-1.5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        Settings
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    <button
                                                        onClick={() =>
                                                            setSelectedOutput(
                                                                process
                                                            )
                                                        }
                                                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-full hover:bg-green-100 transition-colors duration-200"
                                                    >
                                                        <svg
                                                            className="w-4 h-4 mr-1.5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                            />
                                                        </svg>
                                                        View{' '}
                                                        {process.output.length}{' '}
                                                        Clips
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(
                                                        process.status
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                            {(!history || history.length === 0) && (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500">
                                        No history found
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!selectedSettings}
                onOpenChange={() => setSelectedSettings(null)}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Process Settings</DialogTitle>
                    </DialogHeader>
                    {selectedSettings && (
                        <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                                        Video Settings
                                    </h3>
                                    <div className="bg-white p-4 rounded-md shadow-sm space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-600">
                                                Video URL
                                            </span>
                                            <a
                                                href={
                                                    selectedSettings.settings
                                                        .video_url
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-700"
                                            >
                                                View Video
                                            </a>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-600">
                                                Language
                                            </span>
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                {
                                                    selectedSettings.settings
                                                        .language
                                                }
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-600">
                                                Preferred Length
                                            </span>
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                {
                                                    selectedSettings.settings
                                                        .prefer_length
                                                }
                                            </span>
                                        </div>
                                        {selectedSettings.settings.keywords && (
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-600">
                                                    Keywords
                                                </span>
                                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                    {
                                                        selectedSettings
                                                            .settings.keywords
                                                    }
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!selectedOutput}
                onOpenChange={() => setSelectedOutput(null)}
            >
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Process Outputs</DialogTitle>
                    </DialogHeader>
                    {selectedOutput && (
                        <div className="grid grid-cols-1 gap-4">
                            {selectedOutput.output.map((output, index) => (
                                <div
                                    key={index}
                                    className="bg-white p-4 rounded-lg border"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-gray-900 text-lg ml-2">
                                                    Clip {index + 1}
                                                </h4>
                                                {output.viral_score && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Viral Score
                                                        </span>
                                                        <Badge className="bg-green-100 text-green-800 px-3 py-1">
                                                            {output.viral_score}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>

                                            {output.title && (
                                                <div className="bg-white p-3 rounded-md shadow-sm">
                                                    <span className="font-medium text-gray-700 block mb-1">
                                                        Title
                                                    </span>
                                                    <p className="text-gray-900">
                                                        {output.title}
                                                    </p>
                                                </div>
                                            )}

                                            {output.video_ms_duration && (
                                                <div className="bg-white p-3 rounded-md shadow-sm">
                                                    <span className="font-medium text-gray-700 block mb-1">
                                                        Duration
                                                    </span>
                                                    <p className="text-gray-900">
                                                        {formatDuration(
                                                            output.video_ms_duration.toString()
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="flex flex-col gap-3">
                                                {output.viral_reason && (
                                                    <div className="bg-white p-4 rounded-md shadow-sm">
                                                        <h4 className="font-medium text-gray-900 mb-2">
                                                            Viral Potential
                                                            Analysis
                                                        </h4>
                                                        <p className="text-gray-700 text-sm leading-relaxed">
                                                            {
                                                                output.viral_reason
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                                <a
                                                    href={output.video_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                                                >
                                                    <svg
                                                        className="w-5 h-5 mr-2"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                    Watch Generated Video
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    {output.transcript && (
                                        <div className="mt-4">
                                            <h5 className="font-medium text-gray-900 mb-2">
                                                Transcript
                                            </h5>
                                            <div className="text-sm text-gray-600 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded">
                                                {output.transcript}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
