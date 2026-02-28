export interface KeyframeExtractionOptions {
    maxFrames?: number;
    sampleRate?: number;
    diffThreshold?: number;
    defaultSize?: number;
    rotation?: number;
    onProgress?: (progress: number) => void;
}

const getDifference = (img1: ImageData, img2: ImageData) => {
    let diff = 0;
    const data1 = img1.data;
    const data2 = img2.data;
    for (let i = 0; i < data1.length; i += 16) {
        diff += Math.abs(data1[i] - data2[i]); // R
        diff += Math.abs(data1[i + 1] - data2[i + 1]); // G
        diff += Math.abs(data1[i + 2] - data2[i + 2]); // B
    }
    return diff / (data1.length / 4); // average difference per pixel (0-255)
};

// Calculate approximate Laplacian variance to measure focus/blur
const getBlurScore = (img: ImageData, width: number, height: number) => {
    const data = img.data;
    let sum = 0;
    let laplacianSum = 0;
    let laplacianSqSum = 0;
    let validPixels = 0;

    // Fast grayscale conversion and laplacian approx
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            const topIdx = ((y - 1) * width + x) * 4;
            const bottomIdx = ((y + 1) * width + x) * 4;
            const leftIdx = (y * width + (x - 1)) * 4;
            const rightIdx = (y * width + (x + 1)) * 4;

            // Simplified grayscale (just use G channel for speed)
            const val = data[idx + 1];
            const top = data[topIdx + 1];
            const bottom = data[bottomIdx + 1];
            const left = data[leftIdx + 1];
            const right = data[rightIdx + 1];

            // Laplacian kernel: [0, 1, 0], [1, -4, 1], [0, 1, 0]
            const laplacian = top + bottom + left + right - 4 * val;

            laplacianSum += laplacian;
            laplacianSqSum += laplacian * laplacian;
            validPixels++;
        }
    }

    if (validPixels === 0) return 0;
    const mean = laplacianSum / validPixels;
    const variance = (laplacianSqSum / validPixels) - (mean * mean);
    return variance;
};

export const extractSmartKeyframes = async (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    options?: KeyframeExtractionOptions
): Promise<string[]> => {
    const {
        maxFrames = 20, // Increase max to 20
        sampleRate = 2,
        diffThreshold = 10, // Lower threshold even more to catch subtle pans
        defaultSize = 800,
        rotation = 0,
        onProgress
    } = options || {};

    const duration = video.duration;
    const totalSamples = Math.floor(duration * sampleRate);
    const extractedFrames: string[] = [];

    // Pause if playing
    video.pause();

    const originalTime = video.currentTime;

    const bucketCount = Math.min(maxFrames, Math.max(1, Math.floor(duration)));
    const bucketSize = duration / bucketCount;
    const buckets: { bestTime: number; bestScore: number }[] = Array.from({ length: bucketCount }, () => ({
        bestTime: -1,
        bestScore: -1
    }));

    let lastImageData: ImageData | null = null;

    for (let i = 0; i < totalSamples; i++) {
        const currentTime = i / sampleRate;
        video.currentTime = currentTime;

        // Wait for video to seek
        await new Promise<void>((resolve) => {
            const handler = () => {
                video.removeEventListener('seeked', handler);
                resolve();
            };
            video.addEventListener('seeked', handler);
        });

        // Use a small fixed size to speed up the diffing
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.save();
            ctx.drawImage(video, 0, 0, 100, 100);
            const currentImageData = ctx.getImageData(0, 0, 100, 100);
            ctx.restore();

            let currentDiff = 0;
            if (lastImageData) {
                // Calculate diff against previous frame to find local "events/issues"
                currentDiff = getDifference(lastImageData, currentImageData);
            }
            lastImageData = currentImageData;

            const blurScore = getBlurScore(currentImageData, 100, 100);

            // Score prioritizes sharp frames, but high local movement (issues) gives a boost
            const score = (currentDiff * 10) + blurScore;

            let bucketIdx = Math.floor(currentTime / bucketSize);
            if (bucketIdx >= bucketCount) bucketIdx = bucketCount - 1;

            if (score > buckets[bucketIdx].bestScore || buckets[bucketIdx].bestTime === -1) {
                buckets[bucketIdx].bestScore = score;
                buckets[bucketIdx].bestTime = currentTime;
            }
        }

        // Phase 1 progress (0-50%)
        if (onProgress) {
            onProgress(Math.round(((i + 1) / totalSamples) * 50));
        }
    }

    // Pass 2: Extract top candidates from each bucket
    const topCandidates = buckets.filter(b => b.bestTime !== -1).map(b => ({ time: b.bestTime }));

    // 3. Second pass: extract full quality frames for the selected times
    for (let i = 0; i < topCandidates.length; i++) {
        const candidate = topCandidates[i];
        video.currentTime = candidate.time;

        await new Promise<void>((resolve) => {
            const handler = () => {
                video.removeEventListener('seeked', handler);
                resolve();
            };
            video.addEventListener('seeked', handler);
        });

        const ctx = canvas.getContext('2d');
        if (ctx) {
            let width = video.videoWidth;
            let height = video.videoHeight;

            if (width > height) {
                if (width > defaultSize) {
                    height *= defaultSize / width;
                    width = defaultSize;
                }
            } else {
                if (height > defaultSize) {
                    width *= defaultSize / height;
                    height = defaultSize;
                }
            }

            // Apply rotation for the final output frame
            if (rotation !== 0) {
                if (rotation % 180 !== 0) {
                    canvas.width = height;
                    canvas.height = width;
                } else {
                    canvas.width = width;
                    canvas.height = height;
                }

                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.drawImage(video, -width / 2, -height / 2, width, height);
            } else {
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(video, 0, 0, width, height);
            }

            const base64Image = canvas.toDataURL('image/jpeg', 0.8);
            extractedFrames.push(base64Image);
        }

        // Phase 2 progress (50-100%)
        if (onProgress) {
            onProgress(50 + Math.round(((i + 1) / topCandidates.length) * 50));
        }
    }

    video.currentTime = originalTime;
    return extractedFrames;
};
