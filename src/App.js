import React, { useState, useEffect } from 'react';
import { User, Activity, Brain, BarChart3 } from 'lucide-react';
import PatientSelector from './components/PatientSelector';
import PatientDataDisplay from './components/PatientDataDisplay';
import PatientChart from './components/PatientChart';
import DoctorChatbot from './components/DoctorChatbot';
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
            const response = await fetch('/data.csv');
            const csvText = await response.text();
            const lines = csvText.split('\n');
            const headers = lines[0].split(',');

            const patientList = [];
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = lines[i].split(',');
                    const patient = {};
                    headers.forEach((header, index) => {
                        patient[header.trim()] = values[index] ? parseFloat(values[index]) || values[index] : 0;
                    });
                    patientList.push(patient);
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
                                            Risk Factor Analysis
                                        </h2>
                                        <PatientChart data={patientData} />
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
