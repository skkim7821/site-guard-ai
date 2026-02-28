'use client';

import { useState, useRef, useEffect } from 'react';
import { extractSmartKeyframes } from '@/utils/videoExtractor';

interface MediaUploadProps {
    onUpload: (base64Images: string | string[]) => void;
    isAnalyzing: boolean;
}

export default function MediaUpload({ onUpload, isAnalyzing }: MediaUploadProps) {
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [rotation, setRotation] = useState<number>(0);
    const [extractionProgress, setExtractionProgress] = useState<number>(0);
    const [isExtracting, setIsExtracting] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const isVideo = file.type.startsWith('video/');
            const url = URL.createObjectURL(file);
            setMediaType(isVideo ? 'video' : 'image');
            setMediaUrl(url);

            if (!isVideo) {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    // Calculate new dimensions (max 800px width/height)
                    const MAX_SIZE = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
                    onUpload(base64Image);
                };
                img.src = url;
            }
        }
    };

    const analyzeVideoFrame = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            // Calculate new dimensions (max 800px width/height)
            const MAX_SIZE = 800;
            let width = video.videoWidth;
            let height = video.videoHeight;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, width, height);
                const base64Image = canvas.toDataURL('image/jpeg', 0.8);
                onUpload(base64Image);
            }
        }
    };

    const analyzeAllVideoFrames = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setIsExtracting(true);
        setExtractionProgress(0);

        try {
            const extractedFrames = await extractSmartKeyframes(
                videoRef.current,
                canvasRef.current,
                { onProgress: setExtractionProgress, rotation }
            );

            onUpload(extractedFrames);
        } catch (error) {
            console.error("Error extracting frames:", error);
        } finally {
            setIsExtracting(false);
            setExtractionProgress(0);
        }
    };

    // Cleanup object URL
    useEffect(() => {
        return () => {
            if (mediaUrl) URL.revokeObjectURL(mediaUrl);
        };
    }, [mediaUrl]);

    return (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 500 }}>Upload Image or Video</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Upload a static image, or a video to analyze frames.</p>
            <input
                type="file"
                accept="image/*,video/mp4,video/quicktime,.mov"
                onChange={handleFileChange}
                disabled={isAnalyzing}
                style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)' }}
            />

            {mediaType === 'video' && mediaUrl && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--surface-hover)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                        <video
                            ref={videoRef}
                            src={mediaUrl}
                            controls
                            style={{
                                maxWidth: '100%',
                                maxHeight: '600px',
                                display: 'block',
                                transform: `rotate(${rotation}deg)`,
                                transition: 'transform 0.3s ease'
                            }}
                        />
                        <button
                            onClick={() => setRotation((prev) => (prev + 90) % 360)}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                zIndex: 10
                            }}
                        >
                            ↻ Rotate
                        </button>
                    </div>
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            className="btn-primary"
                            onClick={analyzeVideoFrame}
                            disabled={isAnalyzing || isExtracting}
                            style={{ flex: 1, opacity: (isAnalyzing || isExtracting) ? 0.5 : 1 }}
                        >
                            Analyze Current Frame
                        </button>
                        <button
                            className="btn-primary"
                            onClick={analyzeAllVideoFrames}
                            disabled={isAnalyzing || isExtracting}
                            style={{ flex: 1, opacity: (isAnalyzing || isExtracting) ? 0.5 : 1, background: 'var(--accent)' }}
                        >
                            {isExtracting ? `Extracting (${extractionProgress}%)...` : 'Analyze Smart Keyframes'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
