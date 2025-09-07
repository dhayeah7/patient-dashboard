import React, { useState } from 'react';
import { ChevronDown, User } from 'lucide-react';
import './PatientSelector.css';

const PatientSelector = ({ patients, onPatientSelect, selectedPatient }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (patient) => {
        onPatientSelect(patient.Patient_ID);
        setIsOpen(false);
    };

    return (
        <div className="patient-selector">
            <div className="dropdown">
                <button
                    className="dropdown-button"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="button-content">
                        <User className="button-icon" />
                        <span>
                            {selectedPatient
                                ? `Patient #${selectedPatient.Patient_ID}`
                                : 'Select a patient'
                            }
                        </span>
                    </div>
                    <ChevronDown className={`chevron ${isOpen ? 'open' : ''}`} />
                </button>

                {isOpen && (
                    <div className="dropdown-menu">
                        <div className="dropdown-header">
                            <span>Available Patients</span>
                            <span className="count">({patients.length})</span>
                        </div>
                        <div className="dropdown-list">
                            {patients.map((patient) => (
                                <button
                                    key={patient.Patient_ID}
                                    className={`dropdown-item ${selectedPatient?.Patient_ID === patient.Patient_ID ? 'selected' : ''
                                        }`}
                                    onClick={() => handleSelect(patient)}
                                >
                                    <div className="patient-info">
                                        <span className="patient-id">Patient #{patient.Patient_ID}</span>
                                        <span className="risk-factor">
                                            Risk: {(patient.risk_factor * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientSelector;
