import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Brain, TrendingUp } from 'lucide-react';

const ModelPrediction = ({ record }) => {
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (record) {
            fetchPrediction();
        }
    }, [record]);

    const fetchPrediction = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch('http://localhost:8000/predict-patient', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(record)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Prediction failed');
            }

            const result = await response.json();
            setPrediction(result);
        } catch (err) {
            console.error('Prediction error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (riskLevel) => {
        switch (riskLevel?.toLowerCase()) {
            case 'low': return 'text-green-600';
            case 'medium': return 'text-yellow-600';
            case 'high': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getRiskIcon = (riskLevel) => {
        switch (riskLevel?.toLowerCase()) {
            case 'low': return <CheckCircle className="w-5 h-5" />;
            case 'medium': return <Activity className="w-5 h-5" />;
            case 'high': return <AlertTriangle className="w-5 h-5" />;
            default: return <Activity className="w-5 h-5" />;
        }
    };

    const formatFeatureValue = (value) => {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'number') {
            return Number.isInteger(value) ? value.toString() : value.toFixed(3);
        }
        return value.toString();
    };

    if (!record) {
        return (
            <div className="model-prediction-container">
                <p className="text-gray-500">Select a patient to see ML model predictions</p>
            </div>
        );
    }

    return (
        <div className="model-prediction-container">
            <div className="prediction-header">
                <h3 className="section-subtitle">
                    <Brain className="w-5 h-5" />
                    ML Model Prediction
                </h3>
                <button 
                    onClick={fetchPrediction}
                    disabled={loading}
                    className="refresh-button"
                >
                    {loading ? 'Analyzing...' : 'Refresh'}
                </button>
            </div>

            {loading && (
                <div className="prediction-loading">
                    <div className="loading-spinner"></div>
                    <p>Running ML model analysis...</p>
                </div>
            )}

            {error && (
                <div className="prediction-error">
                    <AlertTriangle className="w-5 h-5" />
                    <p>Error: {error}</p>
                    <button onClick={fetchPrediction} className="retry-button">
                        Retry
                    </button>
                </div>
            )}

            {prediction && !loading && (
                <div className="prediction-results">
                    {/* Risk Score Section */}
                    <div className="risk-score-section">
                        <div className="risk-score-main">
                            <div className={`risk-indicator ${getRiskColor(prediction.risk_level)}`}>
                                {getRiskIcon(prediction.risk_level)}
                                <span className="risk-level">{prediction.risk_level} Risk</span>
                            </div>
                            <div className="risk-probability">
                                <span className="probability-value">
                                    {(prediction.risk_probability * 100).toFixed(1)}%
                                </span>
                                <span className="probability-label">Risk Probability</span>
                            </div>
                        </div>
                        
                        <div className="risk-bar">
                            <div 
                                className="risk-bar-fill"
                                style={{ 
                                    width: `${prediction.risk_probability * 100}%`,
                                    backgroundColor: prediction.risk_level?.toLowerCase() === 'high' ? '#dc2626' : 
                                                   prediction.risk_level?.toLowerCase() === 'medium' ? '#d97706' : '#16a34a'
                                }}
                            ></div>
                        </div>
                    </div>

                    {/* Top Features Section */}
                    <div className="top-features-section">
                        <h4 className="features-title">
                            <TrendingUp className="w-4 h-4" />
                            Key Contributing Features
                        </h4>
                        <div className="features-grid">
                            {Object.entries(prediction.top20_features).slice(0, 8).map(([feature, value]) => (
                                <div key={feature} className="feature-item">
                                    <span className="feature-name">{feature.replace(/_/g, ' ')}</span>
                                    <span className="feature-value">{formatFeatureValue(value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Explanation Section */}
                    {prediction.explanation && (
                        <div className="explanation-section">
                            <h4 className="explanation-title">
                                <Brain className="w-4 h-4" />
                                Clinical Interpretation
                            </h4>
                            <div className="explanation-content">
                                {prediction.explanation.split('\n').map((line, index) => (
                                    line.trim() && (
                                        <p key={index} className="explanation-line">
                                            {line.trim()}
                                        </p>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Features Toggle */}
                    <details className="all-features-details">
                        <summary className="features-summary">
                            View All Features ({Object.keys(prediction.top20_features).length})
                        </summary>
                        <div className="all-features-grid">
                            {Object.entries(prediction.top20_features).map(([feature, value]) => (
                                <div key={feature} className="feature-item-detailed">
                                    <span className="feature-name-detailed">{feature.replace(/_/g, ' ')}</span>
                                    <span className="feature-value-detailed">{formatFeatureValue(value)}</span>
                                </div>
                            ))}
                        </div>
                    </details>
                </div>
            )}

            <style jsx>{`
                .model-prediction-container {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    margin-top: 20px;
                }

                .prediction-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .section-subtitle {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 18px;
                    font-weight: 600;
                    color: #1f2937;
                    margin: 0;
                }

                .refresh-button {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px 16px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .refresh-button:hover {
                    background: #2563eb;
                }

                .refresh-button:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                }

                .prediction-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 40px;
                    color: #6b7280;
                }

                .loading-spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid #e5e7eb;
                    border-top: 3px solid #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 12px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .prediction-error {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 16px;
                    background: #fee2e2;
                    border: 1px solid #fecaca;
                    border-radius: 8px;
                    color: #dc2626;
                }

                .retry-button {
                    background: #dc2626;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                    font-size: 12px;
                    cursor: pointer;
                    margin-left: auto;
                }

                .prediction-results {
                    space-y: 24px;
                }

                .risk-score-section {
                    background: #f8fafc;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 24px;
                }

                .risk-score-main {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .risk-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    font-size: 18px;
                }

                .risk-probability {
                    text-align: right;
                }

                .probability-value {
                    display: block;
                    font-size: 24px;
                    font-weight: 700;
                    color: #1f2937;
                }

                .probability-label {
                    font-size: 14px;
                    color: #6b7280;
                }

                .risk-bar {
                    width: 100%;
                    height: 8px;
                    background: #e5e7eb;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .risk-bar-fill {
                    height: 100%;
                    transition: width 0.5s ease;
                }

                .top-features-section {
                    margin-bottom: 24px;
                }

                .features-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 16px;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 12px;
                }

                .feature-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    background: #f1f5f9;
                    border-radius: 6px;
                    border-left: 3px solid #3b82f6;
                }

                .feature-name {
                    font-size: 13px;
                    color: #374151;
                    text-transform: capitalize;
                }

                .feature-value {
                    font-weight: 600;
                    color: #1f2937;
                }

                .explanation-section {
                    margin-bottom: 24px;
                }

                .explanation-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 12px;
                }

                .explanation-content {
                    background: #f0f9ff;
                    border: 1px solid #e0f2fe;
                    border-radius: 8px;
                    padding: 16px;
                }

                .explanation-line {
                    margin: 8px 0;
                    color: #374151;
                    line-height: 1.5;
                }

                .all-features-details {
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .features-summary {
                    background: #f9fafb;
                    padding: 12px 16px;
                    cursor: pointer;
                    font-weight: 500;
                    color: #374151;
                    user-select: none;
                }

                .features-summary:hover {
                    background: #f3f4f6;
                }

                .all-features-grid {
                    padding: 16px;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 8px;
                    max-height: 300px;
                    overflow-y: auto;
                }

                .feature-item-detailed {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px 0;
                    border-bottom: 1px solid #f3f4f6;
                }

                .feature-name-detailed {
                    font-size: 12px;
                    color: #6b7280;
                    text-transform: capitalize;
                    flex: 1;
                    margin-right: 12px;
                }

                .feature-value-detailed {
                    font-weight: 500;
                    color: #1f2937;
                    font-size: 12px;
                }
            `}</style>
        </div>
    );
};

export default ModelPrediction;