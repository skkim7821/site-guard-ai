'use client';

import { useState, useRef } from 'react';

import MediaUpload from '@/components/MediaUpload';
import RiskDashboard, { AnalysisResult } from '@/components/RiskDashboard';
import ScenarioSelector, { ScenarioData } from '@/components/ScenarioSelector';

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [thumbnails, setThumbnails] = useState<{ image: string, result: AnalysisResult | null, isAnalyzing: boolean, error?: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [scenario, setScenario] = useState<ScenarioData>({
    expectedCount: 300,
    customScenario: "Crowds are attempting to exit through this corridor simultaneously after an event finishes."
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const stopAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
    // Mark remaining analyzing thumbnails as stopped
    setThumbnails(prev => prev.map(t => t.isAnalyzing ? { ...t, isAnalyzing: false } : t));
  };

  const analyzeImage = async (base64Data: string | string[]) => {
    setIsAnalyzing(true);
    setErrorMsg('');

    // Create a new AbortController for this session
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const frames = Array.isArray(base64Data) ? base64Data : [base64Data];

    // Initialize thumbnails state
    const initialThumbnails = frames.map(frame => ({
      image: frame,
      result: null,
      isAnalyzing: true
    }));
    setThumbnails(initialThumbnails);
    setSelectedIndex(0);

    // Run analyses concurrently for speed
    try {
      await Promise.all(frames.map(async (frame, index) => {
        try {
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: frame,
              expectedCount: scenario.expectedCount,
              customScenario: scenario.customScenario
            }),
            signal: controller.signal
          });

          if (!response.ok) {
            throw new Error(`Analysis failed for frame ${index + 1}`);
          }

          const data = await response.json();

          // Update the specific thumbnail with the result
          setThumbnails(prev => {
            const updated = [...prev];
            if (updated[index]) {
              updated[index] = { ...updated[index], result: data, isAnalyzing: false };
            }
            return updated;
          });

        } catch (error: any) {
          if (error.name === 'AbortError') return;
          console.error(error);
          setThumbnails(prev => {
            const updated = [...prev];
            if (updated[index]) {
              updated[index] = { ...updated[index], isAnalyzing: false, error: error.message };
            }
            return updated;
          });
        }
      }));
    } catch (err) {
      // Promise.all catches
    } finally {
      if (abortControllerRef.current === controller) {
        setIsAnalyzing(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleImageUpload = (base64Data: string | string[]) => {
    // Just store for now or analyze immediately? 
    // Let's store in thumbnails so user can see what's uploaded before hitting "Run"
    const frames = Array.isArray(base64Data) ? base64Data : [base64Data];
    const newThumbnails = frames.map(frame => ({
      image: frame,
      result: null,
      isAnalyzing: false
    }));
    setThumbnails(newThumbnails);
    setSelectedIndex(0);
  };

  const runAnalysis = () => {
    if (thumbnails.length > 0) {
      const frames = thumbnails.map(t => t.image);
      analyzeImage(frames);
    }
  };

  const currentSelection = thumbnails.length > 0 ? thumbnails[selectedIndex] : null;

  const getStatusColor = (level: string) => {
    switch (level?.trim()?.toLowerCase()) {
      case 'low':
      case 'safe': return 'var(--success)';
      case 'medium':
      case 'warning': return 'var(--warning)';
      case 'high':
      case 'danger': return '#f97316';
      case 'critical': return 'var(--danger)';
      default: return 'var(--primary)';
    }
  };


  return (
    <main className="app-container">
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 className="title-glow" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>SiteGuard AI</h1>
        <p style={{ opacity: 0.7, fontSize: '1.1rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Safety Intelligence & Crowd Simulation</p>
      </header>

      {errorMsg && (
        <div className="bg-danger" style={{ color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>

        {/* Left Column: Input */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <ScenarioSelector
            data={scenario}
            onChange={setScenario}
            disabled={isAnalyzing}
          />

          <MediaUpload onUpload={handleImageUpload} isAnalyzing={isAnalyzing} />

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button
              className="btn-primary"
              onClick={isAnalyzing ? stopAnalysis : runAnalysis}
              disabled={!isAnalyzing && thumbnails.length === 0}
              style={{
                flex: 1,
                height: '50px',
                fontSize: '1.1rem',
                backgroundColor: isAnalyzing ? 'var(--danger)' : 'var(--primary)',
                borderColor: isAnalyzing ? 'var(--danger)' : 'var(--primary)'
              }}
            >
              {isAnalyzing ? 'Stop Simulation' : 'Run Simulation'}
            </button>
            <button
              onClick={() => { setThumbnails([]); setSelectedIndex(0); setErrorMsg(''); setIsAnalyzing(false); }}
              style={{ padding: '0 1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Right Column: Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
          {/* Prediction Gallery - Moved here */}
          {thumbnails.length > 0 && (
            <div className="glass-panel" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.8 }}>Prediction Gallery</h3>
                <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{thumbnails.length} frames</span>
              </div>
              <div style={{
                display: 'flex',
                gap: '12px',
                overflowX: 'auto',
                paddingBottom: '8px',
                scrollbarWidth: 'thin'
              }}>
                {thumbnails.map((thumb, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedIndex(idx)}
                    style={{
                      position: 'relative',
                      width: '80px',
                      height: '80px',
                      flexShrink: 0,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: selectedIndex === idx ? '3px solid var(--primary)' : '1px solid var(--border)',
                      boxShadow: selectedIndex === idx ? '0 0 15px var(--primary-glow)' : 'none',
                      opacity: (thumb.isAnalyzing && !thumb.result) ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                      backgroundColor: 'var(--surface)'
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb.image} alt={`Frame ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                    {thumb.isAnalyzing && !thumb.result && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                        <div className="spinner-small"></div>
                      </div>
                    )}

                    {thumb.result && (
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(thumb.result.simulationRiskLevel),
                        border: '1px solid white',
                        zIndex: 10
                      }} />
                    )}

                    {thumb.error && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.5)' }}>
                        <span style={{ fontSize: '1rem' }} title={thumb.error}>⚠️</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <RiskDashboard
            result={currentSelection?.result || null}
            analyzedImage={currentSelection?.image || null}
          />
        </div>
      </div>

      <footer style={{ marginTop: '4rem', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>
        <p>Built with Next.js & Gemini Multimodal AI</p>
      </footer>
    </main>
  );
}
