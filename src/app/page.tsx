'use client';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import MakeClipsComponent from '@/components/make-clips-component';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
export default function App() {
    useEffect(() => {
        toast('Welcome', {
            description: 'Welcome to AI Clips Maker Tool',
            duration: 3000,
            icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        });
    }, []);

    return (
        <div className="h-[98vh] w-[100vw] flex justify-center items-center">
            <SignedIn>
                <MakeClipsComponent />
            </SignedIn>
            <SignedOut>
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold">AI Clips Maker Tool</h1>
                    <p className="text-lg text-muted-foreground">
                        Please sign in to make clips out of your videos
                    </p>
                </div>
            </SignedOut>
        </div>
    );
}
