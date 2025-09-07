import React, { useState, useMemo } from 'react';
import { ChevronDown, User } from 'lucide-react';
import './PatientSelector.css';

const PatientSelector = ({ patients, onPatientSelect, selectedPatient }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');

    const filteredPatients = useMemo(() => {
        if (!query.trim()) return patients;
        const q = query.trim();
        // allow partial numeric match
        return patients.filter(p => String(p.Patient_ID).includes(q));
    }, [patients, query]);

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
                            <span className="count">({filteredPatients.length}/{patients.length})</span>
                        </div>
                        <div className="dropdown-search">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search by ID..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value.replace(/[^0-9]/g, ''))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const exact = patients.find(p => String(p.Patient_ID) === query.trim());
                                        if (exact) {
                                            handleSelect(exact);
                                        }
                                    }
                                }}
                            />
                        </div>
                        <div className="dropdown-list">
                            {filteredPatients.map((patient) => (
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
