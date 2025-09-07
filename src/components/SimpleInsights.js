import React, { useState, useEffect } from 'react';
import { Brain, AlertTriangle, CheckCircle, XCircle, Loader } from 'lucide-react';
import axios from 'axios';
import './SimpleInsights.css';

const SimpleInsights = ({ data }) => {
    const [insights, setInsights] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get API key from environment variables
    const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    useEffect(() => {
        if (data) {
            generateInsights();
        }
    }, [data]);

    const generateInsights = async () => {
        if (!data) return;

        // Check if API key is configured
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
            setError('Please configure your Gemini API key in the .env file');
            setInsights(generateFallbackInsights(data));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('API Key:', GEMINI_API_KEY ? 'Present' : 'Missing');
            console.log('API URL:', GEMINI_API_URL);

            const prompt = `
        Analyze this diabetes patient data and provide a concise, factual medical summary for doctors. Keep it brief and to the point.

        PATIENT DATA:
        Patient ID: ${data.Patient_ID}
        Risk Factor: ${(data.risk_factor * 100).toFixed(1)}%
        Total Visits: ${data.total_visits}
        Inpatient: ${data.number_inpatient}
        Emergency: ${data.number_emergency}
        Outpatient: ${data.number_outpatient}
        Diagnoses: ${data.number_diagnoses}
        Medications: ${data.num_medications}
        Hospital Stay: ${data.time_in_hospital} days
        Age 70+: ${data['age:70+'] ? 'Yes' : 'No'}
        Diabetes Med: ${data.diabetesMed ? 'Yes' : 'No'}

        Provide a brief summary in this format:

        PATIENT SUMMARY
        [One sentence about patient status]

        RISK FACTORS
        - [Fact 1]
        - [Fact 2]
        - [Fact 3]

        RECOMMENDATIONS
        - [Action 1]
        - [Action 2]
        - [Action 3]

        PRIORITY
        [Low/Medium/High priority level]

        Keep it simple, factual, and under 150 words total. No fancy formatting or emojis.
      `;

            const response = await axios.post(GEMINI_API_URL, {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            });

            if (response.data && response.data.candidates && response.data.candidates[0]) {
                const generatedText = response.data.candidates[0].content.parts[0].text;
                setInsights(generatedText);
            } else {
                throw new Error('No insights generated');
            }
        } catch (err) {
            console.error('Error generating insights:', err);
            console.error('Error response:', err.response?.data);
            console.error('Error status:', err.response?.status);

            let errorMessage = 'Failed to generate AI insights. Please check your API key and try again.';
            if (err.response?.status === 400) {
                errorMessage = 'Invalid API request. Please check your API key format.';
            } else if (err.response?.status === 403) {
                errorMessage = 'API key is invalid or has insufficient permissions.';
            } else if (err.response?.status === 429) {
                errorMessage = 'API quota exceeded. Please try again later.';
            }

            setError(errorMessage);
            setInsights(generateFallbackInsights(data));
        } finally {
            setLoading(false);
        }
    };

    const generateFallbackInsights = (patientData) => {
        const riskLevel = patientData.risk_factor < 0.3 ? 'Low' :
            patientData.risk_factor < 0.6 ? 'Medium' : 'High';

        return `
PATIENT SUMMARY
Patient #${patientData.Patient_ID} has ${(patientData.risk_factor * 100).toFixed(1)}% diabetes risk with ${patientData.total_visits} total visits and ${patientData.num_medications} medications.

RISK FACTORS
- ${(patientData.risk_factor * 100).toFixed(1)}% diabetes risk (${riskLevel} priority)
- ${patientData.number_diagnoses} active diagnoses
- ${patientData.number_emergency} emergency visits
- ${patientData['age:70+'] ? 'Age 70+' : 'Under 70'}

RECOMMENDATIONS
- ${patientData.risk_factor > 0.5 ? 'High-priority monitoring' : 'Standard monitoring'}
- ${patientData.number_emergency > 0 ? 'Review emergency patterns' : 'Maintain prevention'}
- ${patientData.num_medications > 20 ? 'Medication review needed' : 'Medication count OK'}
- ${patientData.diabetesMed ? 'Continue diabetes meds' : 'Consider diabetes evaluation'}

PRIORITY
${riskLevel} priority care required

Note: This is a fallback analysis. For AI-powered insights, please configure your Gemini API key.
    `;
    };

    if (!data) return null;

    return (
        <div className="simple-insights">
            {loading && (
                <div className="loading-state">
                    <Loader className="loading-icon spinning" />
                    <p>Generating AI insights...</p>
                </div>
            )}

            {error && (
                <div className="error-state">
                    <p>{error}</p>
                </div>
            )}

            {insights && !loading && (
                <div className="insights-content">
                    {insights.split('\n').map((line, index) => {
                        const trimmedLine = line.trim();

                        if (trimmedLine === 'PATIENT SUMMARY' || trimmedLine === 'RISK FACTORS' || trimmedLine === 'RECOMMENDATIONS' || trimmedLine === 'PRIORITY') {
                            return <h4 key={index} className="insight-heading">{trimmedLine}</h4>;
                        } else if (trimmedLine.startsWith('-')) {
                            const listItem = trimmedLine.replace(/^-\s*/, '');
                            return <div key={index} className="insight-list-item">{listItem}</div>;
                        } else if (trimmedLine === '') {
                            return <br key={index} />;
                        } else if (trimmedLine.length > 0) {
                            return <p key={index} className="insight-paragraph">{trimmedLine}</p>;
                        }
                        return null;
                    })}
                </div>
            )}
        </div>
    );
};

export default SimpleInsights;
