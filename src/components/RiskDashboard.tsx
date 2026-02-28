'use client';

export interface AnalysisResult {
    simulationRiskLevel: "Low" | "Medium" | "High" | "Critical";
    spatialAnalysis?: {
        estimatedAreaM2: number;
        predictedDensity: number;
    };
    safetyScores: {
        flow: number;
        space: number;
        evacuation: number;
    };
    keyInsights: string[];
    spatialSimulationRisks: {
        area: string;
        risk: string;
        status: "Safe" | "Warning" | "Danger";
    }[];
    hotspots?: {
        box_2d: [number, number, number, number];
        label: string;
    }[];
    prevention: {
        immediate: string[];
        longTerm: string[];
    };
}

interface RiskDashboardProps {
    result: AnalysisResult | null;
    analyzedImage?: string | null;
}

export default function RiskDashboard({ result, analyzedImage }: RiskDashboardProps) {
    if (!result) {
        return (
            <div className="glass-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px' }}>
                <p style={{ opacity: 0.6 }}>Waiting for simulation...</p>
            </div>
        );
    }

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

    const statusColor = getStatusColor(result.simulationRiskLevel);

    const ScoreBar = ({ label, score, color }: { label: string, score: number, color: string }) => (
        <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                <span>{label}</span>
                <span style={{ fontWeight: 700 }}>{score}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${score}%`, background: color, transition: 'width 1s ease-in-out' }}></div>
            </div>
        </div>
    );

    return (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Safety Simulation Summary</h2>
                <div style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: `${statusColor}22`, border: `1px solid ${statusColor}`, color: statusColor, fontWeight: 700, fontSize: '0.85rem' }}>
                    {result.simulationRiskLevel} Risk
                </div>
            </div>

            {/* Score Cards & Insights */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
                {/* Physical Evidence Scores */}
                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '1rem', textTransform: 'uppercase' }}>Physical Capacity Metrics</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '8px', background: 'var(--surface)', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Estimated Area</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{result.spatialAnalysis?.estimatedAreaM2 || 0}m²</div>
                        </div>
                        <div style={{ padding: '8px', background: 'var(--surface)', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Predicted Density</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: statusColor }}>{result.spatialAnalysis?.predictedDensity || 0} people/m²</div>
                        </div>
                    </div>
                    <ScoreBar label="Flow Flexibility" score={result.safetyScores?.flow || 0} color="var(--primary)" />
                    <ScoreBar label="Space Capacity" score={result.safetyScores?.space || 0} color="var(--success)" />
                    <ScoreBar label="Evacuation Safety" score={result.safetyScores?.evacuation || 0} color="var(--warning)" />
                </div>

                {/* Key Insights List */}
                <div>
                    <h3 style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.8rem', textTransform: 'uppercase' }}>Key Insights</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {result.keyInsights.map((insight, i) => (
                            <div key={i} style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '0.9rem', borderLeft: '3px solid var(--primary)' }}>
                                {insight}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Analyzed Image & Spatial Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                {/* Visual */}
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', height: '220px' }}>
                    {analyzedImage && <img src={analyzedImage} alt="Analysis" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>

                {/* Scannable Risks Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <h3 style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '4px', textTransform: 'uppercase' }}>Zone-Specific Status</h3>
                    {result.spatialSimulationRisks.map((item, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.area}</span>
                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: getStatusColor(item.status), color: 'white', fontWeight: 700 }}>{item.status}</span>
                            </div>
                            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{item.risk}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h3 style={{ fontSize: '0.85rem', color: 'var(--success)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚡ Immediate Advice: {result.prevention?.immediate?.[0] || 'Observe and maintain safe flow.'}
                </h3>
            </div>
        </div>
    );
}
