import React, { useState } from 'react';
import { X, InfoIcon, ArrowRight, ArrowLeft } from 'lucide-react';
import { clipType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const VideoCarousel: React.FC<{ videos: clipType[] }> = ({ videos }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showMetadata, setShowMetadata] = useState(false);
    const n = videos.length;

    const currentVideo = videos[currentIndex];

    const nextVideo = () =>
        setCurrentIndex((prev) => (prev + 1) % videos.length);
    const prevVideo = () =>
        setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);

    const formatDuration = (ms: number) => {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className="relative w-full h-full overflow-hidden bg-black rounded-md p-4">
            <div className="relative h-full">
                {/* Full Screen Video */}
                <video
                    key={currentVideo.videoId}
                    src={currentVideo.videoUrl}
                    controls
                    className="absolute inset-0 h-full rounded-md object-cover aspect-[9/16] mx-auto"
                    onClick={() => setShowMetadata(false)}
                />

                {/* Navigation Buttons */}
                <div className="absolute inset-0 pointer-events-none my-auto ">
                    {currentIndex > 0 && (
                        <motion.button
                            onClick={prevVideo}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="absolute left-2 top-1/2  p-2 bg-black/30 rounded-full text-white pointer-events-auto"
                        >
                            <ArrowLeft />
                        </motion.button>
                    )}
                    {currentIndex < n - 1 && (
                        <motion.button
                            onClick={nextVideo}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="absolute right-2 top-1/2  p-2 bg-black/30 rounded-full text-white pointer-events-auto"
                        >
                            <ArrowRight />
                        </motion.button>
                    )}
                </div>

                {/* Metadata Toggle */}
                <button
                    onClick={() => setShowMetadata(!showMetadata)}
                    className="absolute bottom-4 right-4 bg-white/20 rounded-full p-2 z-50"
                >
                    {showMetadata ? (
                        <X color="white" />
                    ) : (
                        <InfoIcon color="white" />
                    )}
                </button>
            </div>
            {/* Metadata Slide */}
            <AnimatePresence>
                {showMetadata && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'tween' }}
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-white/90 to-white/75 backdrop-blur-xl shadow-2xl rounded-t-3xl p-6 z-40"
                    >
                        <div className="max-w-md mx-auto space-y-4">
                            <h2 className="text-2xl font-semibold text-gray-800 tracking-tight">
                                {currentVideo.title}
                            </h2>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                                <div className="bg-gray-100 p-3 rounded-xl">
                                    <p className="text-xs text-gray-500 mb-1">
                                        Viral Score
                                    </p>
                                    <p className="font-bold">
                                        {currentVideo.viralScore}/10
                                    </p>
                                </div>
                                <div className="bg-gray-100 p-3 rounded-xl">
                                    <p className="text-xs text-gray-500 mb-1">
                                        Duration
                                    </p>
                                    <p className="font-bold">
                                        {formatDuration(
                                            currentVideo.videoMsDuration
                                        )}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-xl">
                                {currentVideo.viralReason}
                            </p>
                            {/* Copy Transcript Button */}
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        currentVideo.transcript || ''
                                    );
                                    alert('Transcript copied to clipboard!');
                                }}
                                className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl hover:bg-blue-600 transition"
                            >
                                Copy Transcript
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function VideoOutputDisplay({ videos }: { videos: clipType[] }) {
    console.log(videos.length);
    if (!videos || videos.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No Videos Found</p>
            </div>
        );
    }

    return <VideoCarousel videos={videos} />;
}
