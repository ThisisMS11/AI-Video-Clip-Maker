'use client';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import AgeTransformer from '@/components/age-transformation-component';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
export default function App() {
    useEffect(() => {
        toast('Welcome', {
            description: 'Welcome to Age Transformation Tool',
            duration: 3000,
            icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        });
    }, []);

    return (
        <div className="h-[98vh] w-[100vw] flex justify-center items-center">
            <SignedIn>
                <AgeTransformer />
            </SignedIn>
            <SignedOut>
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold">
                        Age Transformation Tool
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Please sign in to transform your images
                    </p>
                </div>
            </SignedOut>
        </div>
    );
}
