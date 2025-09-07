import React, { useState, useEffect } from 'react';
import { User, Activity, Brain, BarChart3 } from 'lucide-react';
import PatientSelector from './components/PatientSelector';
import PatientDataDisplay from './components/PatientDataDisplay';
import DoctorChatbot from './components/DoctorChatbot';
import SimpleInsights from './components/SimpleInsights';
import './App.css';

function App() {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientData, setPatientData] = useState(null);

    useEffect(() => {
        // Load patient data from CSV
        loadPatientData();
    }, []);

    const loadPatientData = async () => {
        try {
            // Switch to new dataset
            const response = await fetch('/newdata.csv');
            const csvText = await response.text();
            const lines = csvText.split('\n');
            const headers = lines[0].split(',');

            const patientList = [];
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = lines[i].split(',');
                    const raw = {};
                    headers.forEach((header, index) => {
                        const key = header.trim();
                        const cell = values[index];
                        // parse floats when numeric, otherwise keep string; default to 0
                        raw[key] = cell !== undefined && cell !== '' ? (isNaN(Number(cell)) ? cell : parseFloat(cell)) : 0;
                    });

                    // Map newdata.csv schema to the UI's expected schema
                    // Detect new schema by presence of 'patient_id'
                    const isNewSchema = Object.prototype.hasOwnProperty.call(raw, 'patient_id');

                    let unified = raw;
                    if (isNewSchema) {
                        const numberInpatient = Number(raw['feature_2_number_inpatient'] || 0);
                        const numberEmergency = Number(raw['feature_4_number_emergency'] || 0);
                        const numberOutpatient = Number(raw['feature_11_number_outpatient'] || 0);
                        const totalVisits = Number(raw['feature_1_total_healthcare_contacts'] || (numberInpatient + numberEmergency + numberOutpatient));

                        unified = {
                            // IDs and risk
                            Patient_ID: Number(raw['patient_id'] || 0),
                            risk_factor: Math.max(0, Math.min(1, Number(raw['risk_probability'] || 0))),

                            // Visit counts
                            total_visits: totalVisits,
                            number_inpatient: numberInpatient,
                            number_emergency: numberEmergency,
                            number_outpatient: numberOutpatient,

                            // Derived/booleans
                            has_multiple_inpatient: numberInpatient > 1 ? 1 : 0,
                            has_emergency_visits: numberEmergency > 0 ? 1 : 0,

                            // Medical data
                            number_diagnoses: Number(raw['number_diagnoses'] || 0),
                            num_lab_procedures: Number(raw['num_lab_procedures'] || 0),
                            num_procedures: Number(raw['num_procedures'] || 0), // may be 0 in new schema
                            // Use total medication changes as a proxy if medication count missing
                            num_medications: Number(raw['feature_16_total_med_changes'] || raw['num_medications'] || 0),

                            // Hospital stay
                            time_in_hospital: Number(raw['time_in_hospital'] || 0),
                            'age:70+': Number(raw['age:70+'] || 0) ? 1 : 0,

                            // Admission/Discharge flags
                            'admission_source_id:Emergency': Number(raw['feature_12_admission_source_id_Emergency'] || 0) ? 1 : 0,
                            'admission_source_id:Transfer': Number(raw['admission_source_id:Transfer'] || 0) ? 1 : 0, // fallback if ever present
                            'discharge_disposition_id:Discharged to Home': Number(raw['discharge_disposition_id:Discharged to Home'] || 0) ? 1 : 0,
                            'discharge_disposition_id:Other': Number(raw['discharge_disposition_id:Other'] || 0) ? 1 : 0,

                            // Diabetes medication / insulin context
                            diabetesMed: Number(raw['feature_20_diabetesMed'] || raw['diabetesMed'] || 0) ? 1 : 0,
                            feature_13_insulin_No: Number(raw['feature_13_insulin_No'] || 0),
                            feature_17_insulin_complexity: Number(raw['feature_17_insulin_complexity'] || 0),
                            feature_18_change: Number(raw['feature_18_change'] || 0),
                            feature_19_diag_1_Diabetes: Number(raw['feature_19_diag_1_Diabetes'] || 0),

                            // A1C / glucose indicators
                            feature_7_A1Cresult__8: Number(raw['feature_7_A1Cresult__8'] || 0),
                            feature_8_diabetes_control_poor: Number(raw['feature_8_diabetes_control_poor'] || 0),
                            feature_9_diabetes_control_moderate: Number(raw['feature_9_diabetes_control_moderate'] || 0),
                            feature_10_A1Cresult_None: Number(raw['feature_10_A1Cresult_None'] || 0),
                            feature_15_max_glu_serum__300: Number(raw['feature_15_max_glu_serum__300'] || 0),

                            // Utilization flags
                            feature_6_high_utilizer: Number(raw['feature_6_high_utilizer'] || 0),
                            feature_5_emergency_to_total_ratio: Number(raw['feature_5_emergency_to_total_ratio'] || 0),
                            feature_3_inpatient_intensity: Number(raw['feature_3_inpatient_intensity'] || 0),
                            feature_14_admission_source_id_Referral: Number(raw['feature_14_admission_source_id_Referral'] || 0),

                            // Top feature importances (keep as raw for AI)
                            importance_rank_1: raw['importance_rank_1'],
                            importance_score_1: Number(raw['importance_score_1'] || 0),
                            importance_rank_2: raw['importance_rank_2'],
                            importance_score_2: Number(raw['importance_score_2'] || 0),
                            importance_rank_3: raw['importance_rank_3'],
                            importance_score_3: Number(raw['importance_score_3'] || 0),
                            importance_rank_4: raw['importance_rank_4'],
                            importance_score_4: Number(raw['importance_score_4'] || 0),
                            importance_rank_5: raw['importance_rank_5'],
                            importance_score_5: Number(raw['importance_score_5'] || 0),
                        };
                    }

                    patientList.push(unified);
                }
            }

            setPatients(patientList);
        } catch (error) {
            console.error('Error loading patient data:', error);
        }
    };

    const handlePatientSelect = (patientId) => {
        const patient = patients.find(p => p.Patient_ID === patientId);
        setSelectedPatient(patient);
        setPatientData(patient);
    };

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-content">
                    <div className="header-title">
                        <Activity className="header-icon" />
                        <h1>Diabetes Patient Dashboard</h1>
                    </div>
                    <p className="header-subtitle">AI-Powered Patient Data Analysis</p>
                </div>
            </header>

            <main className="app-main">
                <div className="dashboard-container">
                    <div className="sidebar">
                        <div className="sidebar-section">
                            <h2 className="section-title">
                                <User className="section-icon" />
                                Select Patient
                            </h2>
                            <PatientSelector
                                patients={patients}
                                onPatientSelect={handlePatientSelect}
                                selectedPatient={selectedPatient}
                            />
                        </div>
                    </div>

                    <div className="main-content">
                        {selectedPatient ? (
                            <>
                                <div className="content-grid">
                                    <div className="data-section">
                                        <h2 className="section-title">
                                            <BarChart3 className="section-icon" />
                                            Patient Data
                                        </h2>
                                        <PatientDataDisplay data={patientData} />
                                    </div>

                                    <div className="chart-section">
                                        <h2 className="section-title">
                                            <Activity className="section-icon" />
                                            AI Risk Analysis
                                        </h2>
                                        <SimpleInsights data={patientData} />
                                    </div>
                                </div>

                                <div className="chatbot-section">
                                    <h2 className="section-title">
                                        <Brain className="section-icon" />
                                        Doctor Assistant
                                    </h2>
                                    <DoctorChatbot data={patientData} />
                                </div>
                            </>
                        ) : (
                            <div className="welcome-message">
                                <Activity className="welcome-icon" />
                                <h2>Welcome to the Diabetes Patient Dashboard</h2>
                                <p>Select a patient from the dropdown to view their data and AI-powered insights.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
