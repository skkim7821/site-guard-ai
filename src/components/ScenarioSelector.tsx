'use client';

import React from 'react';

export interface ScenarioData {
    expectedCount: number;
    customScenario: string;
}

interface ScenarioSelectorProps {
    data: ScenarioData;
    onChange: (newData: ScenarioData) => void;
    disabled?: boolean;
}

export default function ScenarioSelector({ data, onChange, disabled }: ScenarioSelectorProps) {
    return (
        <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem', color: 'var(--primary)' }}>Scenario Simulation Setup</h3>

            {/* People Count Input */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.6rem' }}>Expected People Count (Incl. Staff)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                        type="number"
                        min="1"
                        max="10000"
                        value={data.expectedCount}
                        onChange={(e) => onChange({ ...data, expectedCount: parseInt(e.target.value) || 0 })}
                        disabled={disabled}
                        style={{
                            width: '120px',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: 'inherit',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            textAlign: 'center'
                        }}
                    />
                    <span style={{ fontSize: '1.1rem', opacity: 0.8 }}>People</span>
                </div>
            </div>

            {/* Custom Scenario Textarea */}
            <div>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.6rem' }}>Activity & Context Description</label>
                <textarea
                    value={data.customScenario}
                    onChange={(e) => onChange({ ...data, customScenario: e.target.value })}
                    disabled={disabled}
                    placeholder="e.g., Sudden rain causing crowds to rush into a narrow entrance, some with strollers or large luggage."
                    style={{
                        width: '100%',
                        height: '120px',
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: 'inherit',
                        fontSize: '0.95rem',
                        lineHeight: '1.5',
                        resize: 'none',
                        transition: 'border-color 0.2s ease',
                        outline: 'none'
                    }}
                />
                <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '8px' }}>
                    * Detailed descriptions help the AI predict safety risks more accurately.
                </p>
            </div>
        </div>
    );
}
