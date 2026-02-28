'use client';

import { useRef, useState, useEffect } from 'react';

interface CameraCaptureProps {
    onCapture: (base64Image: string) => void;
    isAnalyzing: boolean;
}

export default function CameraCapture({ onCapture, isAnalyzing }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [streamStarted, setStreamStarted] = useState(false);
    const [errorMSG, setErrorMSG] = useState('');

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setStreamStarted(true);
            }
        } catch (err: any) {
            console.error('Error accessing camera:', err);
            setErrorMSG('Camera access denied or unavailabe: ' + err.message);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setStreamStarted(false);
        }
    };

    const captureFrame = () => {
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
                onCapture(base64Image);
            }
        }
    };

    return (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 className="title-glow">Live Monitoring</h2>

            {errorMSG && <p className="text-danger">{errorMSG}</p>}

            <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--surface-hover)', minHeight: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', display: streamStarted ? 'block' : 'none' }}
                />
                {!streamStarted && !errorMSG && (
                    <p style={{ color: 'var(--foreground)', opacity: 0.7 }}>Camera is off</p>
                )}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div style={{ display: 'flex', gap: '1rem' }}>
                {!streamStarted ? (
                    <button className="btn-primary" onClick={startCamera}>Start Camera</button>
                ) : (
                    <button className="btn-primary" onClick={stopCamera} style={{ background: 'var(--surface-hover)', color: 'var(--foreground)', boxShadow: 'none' }}>Stop Camera</button>
                )}

                <button
                    className="btn-primary"
                    onClick={captureFrame}
                    disabled={!streamStarted || isAnalyzing}
                    style={{ flex: 1, opacity: (!streamStarted || isAnalyzing) ? 0.5 : 1 }}
                >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Scene'}
                </button>
            </div>
        </div>
    );
}
