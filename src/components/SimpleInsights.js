import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
Provide a concise, factual medical brief for the following diabetes patient. Use the sections and formatting exactly as specified.

PATIENT DATA
- Patient ID: ${data.Patient_ID}
- Risk Probability: ${(data.risk_factor * 100).toFixed(1)}%
- Age 70+: ${data['age:70+'] ? 'Yes' : 'No'}
- Total Contacts: ${data.total_visits}
- Inpatient: ${data.number_inpatient} (intensity: ${data.feature_3_inpatient_intensity ?? 0})
- Emergency: ${data.number_emergency} (ratio to total: ${data.feature_5_emergency_to_total_ratio ?? 0})
- Outpatient: ${data.number_outpatient}
- High Utilizer: ${data.feature_6_high_utilizer ? 'Yes' : 'No'}
- Diagnoses Count: ${data.number_diagnoses}
- Lab Procedures: ${data.num_lab_procedures}
- Hospital Stay: ${data.time_in_hospital} days
- Admission Source (Emergency): ${data['admission_source_id:Emergency'] ? 'Yes' : 'No'}
- Referral Admission: ${data.feature_14_admission_source_id_Referral ? 'Yes' : 'No'}
- Diabetes Meds: ${data.diabetesMed ? 'Yes' : 'No'}; Insulin No: ${data.feature_13_insulin_No ? 'Yes' : 'No'}; Insulin Complexity: ${data.feature_17_insulin_complexity ?? 0}
- A1C High (>=8): ${data.feature_7_A1Cresult__8 ? 'Yes' : 'No'}; Poor Control: ${data.feature_8_diabetes_control_poor ? 'Yes' : 'No'}; Moderate Control: ${data.feature_9_diabetes_control_moderate ? 'Yes' : 'No'}; A1C Missing: ${data.feature_10_A1Cresult_None ? 'Yes' : 'No'}
- Max Glucose >=300: ${data.feature_15_max_glu_serum__300 ? 'Yes' : 'No'}
- Medication Changes: ${data.num_medications}

TOP FEATURES (rank:score)
- ${data.importance_rank_1}:${data.importance_score_1}
- ${data.importance_rank_2}:${data.importance_score_2}
- ${data.importance_rank_3}:${data.importance_score_3}
- ${data.importance_rank_4}:${data.importance_score_4}
- ${data.importance_rank_5}:${data.importance_score_5}

OUTPUT FORMAT (exact headings)
PATIENT SUMMARY
[One sentence: overall status and most important factors]

RISK FACTORS
- [3–5 concise bullet facts grounded in the data]

CARE RECOMMENDATIONS
- [3–5 concise, guideline-aligned actions with rationale]

MONITORING PLAN
- [Follow-up cadence and what to track]

PRIORITY
[Low/Medium/High]

Constraints: Keep total under 180 words. No markdown, no emojis, no tables.`;

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

                        if (
                            trimmedLine === 'PATIENT SUMMARY' ||
                            trimmedLine === 'RISK FACTORS' ||
                            trimmedLine === 'CARE RECOMMENDATIONS' ||
                            trimmedLine === 'MONITORING PLAN' ||
                            trimmedLine === 'PRIORITY' ||
                            trimmedLine === 'RECOMMENDATIONS'
                        ) {
                            return <h4 key={index} className="insight-heading">{trimmedLine}</h4>;
                        } else if (trimmedLine.startsWith('-')) {
                            const listItem = trimmedLine.replace(/^-\s*/, '');
                            return <div key={index} className="insight-list-item">{listItem}</div>;
                        } else if (trimmedLine === '') {
                            return null;
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
