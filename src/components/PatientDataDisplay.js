import React from 'react';
import { 
  Calendar, 
  Activity, 
  Stethoscope, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import './PatientDataDisplay.css';

const PatientDataDisplay = ({ data }) => {
    if (!data) return null;

    const formatValue = (value, type = 'number') => {
        if (type === 'percentage') {
            return `${(value * 100).toFixed(1)}%`;
        }
        if (type === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        if (type === 'days') {
            return `${value} days`;
        }
        return value.toString();
    };

    const getRiskLevel = (riskFactor) => {
        if (riskFactor < 0.3) return { level: 'Low', color: '#10B981', icon: CheckCircle };
        if (riskFactor < 0.6) return { level: 'Medium', color: '#F59E0B', icon: AlertTriangle };
        return { level: 'High', color: '#EF4444', icon: XCircle };
    };

    const riskInfo = getRiskLevel(data.risk_factor);
    const RiskIcon = riskInfo.icon;

    const dataSections = [
        {
            title: 'Visit Information',
            icon: Calendar,
            items: [
                { label: 'Total Visits', value: data.total_visits, type: 'number' },
                { label: 'Inpatient Visits', value: data.number_inpatient, type: 'number' },
                { label: 'Emergency Visits', value: data.number_emergency, type: 'number' },
                { label: 'Outpatient Visits', value: data.number_outpatient, type: 'number' },
            ]
        },
        {
            title: 'Medical Data',
            icon: Stethoscope,
            items: [
                { label: 'Number of Diagnoses', value: data.number_diagnoses, type: 'number' },
                { label: 'Number of Medications', value: data.num_medications, type: 'number' },
                { label: 'Lab Procedures', value: data.num_lab_procedures, type: 'number' },
                { label: 'Other Procedures', value: data.num_procedures, type: 'number' },
            ]
        },
        {
            title: 'Hospital Stay',
            icon: Clock,
            items: [
                { label: 'Time in Hospital', value: data.time_in_hospital, type: 'days' },
                { label: 'Age 70+', value: data['age:70+'], type: 'boolean' },
                { label: 'Discharged to Home', value: data['discharge_disposition_id:Discharged to Home'], type: 'boolean' },
                { label: 'Other Discharge', value: data['discharge_disposition_id:Other'], type: 'boolean' },
            ]
        },
        {
            title: 'Admission Details',
            icon: Activity,
            items: [
                { label: 'Transfer Admission', value: data['admission_source_id:Transfer'], type: 'boolean' },
                { label: 'Emergency Admission', value: data['admission_source_id:Emergency'], type: 'boolean' },
                { label: 'Diabetes Medication', value: data.diabetesMed, type: 'boolean' },
                { label: 'Multiple Inpatient', value: data.has_multiple_inpatient, type: 'boolean' },
            ]
        }
    ];

    return (
        <div className="patient-data-display">
            <div className="risk-summary">
                <div className="risk-header">
                    <RiskIcon className="risk-icon" style={{ color: riskInfo.color }} />
                    <div className="risk-info">
                        <h3>Risk Assessment</h3>
                        <p className="risk-level" style={{ color: riskInfo.color }}>
                            {riskInfo.level} Risk
                        </p>
                    </div>
                </div>
                <div className="risk-factor">
                    <span className="risk-label">Risk Factor:</span>
                    <span className="risk-value" style={{ color: riskInfo.color }}>
                        {formatValue(data.risk_factor, 'percentage')}
                    </span>
                </div>
            </div>

            <div className="data-sections">
                {dataSections.map((section, index) => {
                    const SectionIcon = section.icon;
                    return (
                        <div key={index} className="data-section">
                            <div className="section-header">
                                <SectionIcon className="section-icon" />
                                <h4>{section.title}</h4>
                            </div>
                            <div className="data-items">
                                {section.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="data-item">
                                        <span className="item-label">{item.label}</span>
                                        <span className="item-value">
                                            {formatValue(item.value, item.type)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PatientDataDisplay;
