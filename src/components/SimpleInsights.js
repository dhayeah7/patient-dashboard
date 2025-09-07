import React from 'react';
import { Brain, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import './SimpleInsights.css';

const SimpleInsights = ({ data }) => {
    if (!data) return null;

    const getRiskLevel = (riskFactor) => {
        if (riskFactor < 0.3) return { level: 'Low', color: '#10B981', icon: CheckCircle };
        if (riskFactor < 0.6) return { level: 'Medium', color: '#F59E0B', icon: AlertTriangle };
        return { level: 'High', color: '#EF4444', icon: XCircle };
    };

    const riskInfo = getRiskLevel(data.risk_factor);
    const RiskIcon = riskInfo.icon;

    const insights = [
        {
            label: 'Total Visits',
            value: data.total_visits,
            type: 'number'
        },
        {
            label: 'Total Procedures',
            value: (data.num_lab_procedures || 0) + (data.num_procedures || 0),
            type: 'number'
        },
        {
            label: 'Avg. Hospital Stay',
            value: `${data.time_in_hospital || 0} days`,
            type: 'text'
        },
        {
            label: 'Risk Factor',
            value: `${(data.risk_factor * 100).toFixed(1)}%`,
            type: 'risk',
            riskLevel: riskInfo.level
        }
    ];

    return (
        <div className="simple-insights">
            <div className="insights-header">
                <Brain className="header-icon" />
                <h3>Quick Analysis</h3>
            </div>

            <div className="insights-grid">
                {insights.map((insight, index) => (
                    <div key={index} className="insight-item">
                        <div className="insight-label">{insight.label}</div>
                        <div className={`insight-value ${insight.type === 'risk' ? 'risk-value' : ''}`}>
                            {insight.type === 'risk' && (
                                <RiskIcon
                                    className="risk-icon"
                                    style={{ color: riskInfo.color }}
                                />
                            )}
                            {insight.value}
                        </div>
                        {insight.type === 'risk' && (
                            <div className="risk-level" style={{ color: riskInfo.color }}>
                                {insight.riskLevel} Risk
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SimpleInsights;
