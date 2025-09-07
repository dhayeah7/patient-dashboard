import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MessageCircle } from 'lucide-react';
import './DoctorChatbot.css';

const DoctorChatbot = ({ data }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: 'Hello Doctor! I can help you analyze patient data and answer questions. What would you like to know?',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Reset messages when patient changes
    useEffect(() => {
        if (data) {
            setMessages([
                {
                    id: 1,
                    type: 'bot',
                    text: `Hello Doctor! I can help you analyze Patient #${data.Patient_ID} data and answer questions. What would you like to know?`,
                    timestamp: new Date()
                }
            ]);
        }
    }, [data]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            text: inputText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        // Simulate bot response
        setTimeout(() => {
            const botResponse = generateBotResponse(inputText, data);
            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                text: botResponse,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);
        }, 1000);
    };

    const generateBotResponse = (userInput, patientData) => {
        const input = userInput.toLowerCase();

        if (!patientData) {
            return "Please select a patient first to get specific information.";
        }

        const riskLevel = patientData.risk_factor < 0.3 ? 'Low' :
            patientData.risk_factor < 0.6 ? 'Medium' : 'High';

        const matches = (patterns) => patterns.some(p => {
            if (p instanceof RegExp) return p.test(input);
            return input.includes(p);
        });

        // Mortality / fatality intent
        if (matches([/\b(fatal|die|death|deadly|life[- ]?threatening|mortality)\b/, 'critical', 'urgent'])) {
            return `I can't predict mortality. Patient #${patientData.Patient_ID} currently has ${riskLevel.toLowerCase()} risk at ${(patientData.risk_factor * 100).toFixed(1)}%. ${riskLevel === 'High' ? 'Prioritize close monitoring and timely follow-up.' : 'Continue guideline-based management and monitoring.'} Key context: ${patientData.number_emergency} emergency visit(s), ${patientData.number_inpatient} inpatient stay(s), ${patientData.num_medications} medication changes/meds, average hospital stay ${patientData.time_in_hospital} day(s).`;
        }

        // Overall status / "how is he doing" intent
        if (matches(['how is', "how's", 'doing', 'overall', 'summary', 'status', 'condition', 'progress', 'improve', 'better', 'worse', 'how are they', 'how is the patient'])) {
            const ageText = patientData['age:70+'] ? '70+ years' : 'under 70 years';
            const medsText = patientData.diabetesMed ? 'on diabetes meds' : 'not on diabetes meds';
            const followUp = riskLevel === 'High' ? 'close follow-up within 1–2 weeks' : riskLevel === 'Medium' ? 'routine follow-up within 4–6 weeks' : 'continue standard monitoring';
            return `Patient #${patientData.Patient_ID} is ${riskLevel.toLowerCase()} risk at ${(patientData.risk_factor * 100).toFixed(1)}%. Utilization: inpatient ${patientData.number_inpatient}, emergency ${patientData.number_emergency}, outpatient ${patientData.number_outpatient}; avg stay ${patientData.time_in_hospital} day(s). Age ${ageText}, ${medsText}. Plan: ${followUp}.`;
        }

        // Risk questions
        if (matches(['risk', 'probability', 'chance', 'likelihood', 'diabetes'])) {
            return `Patient #${patientData.Patient_ID} has a ${riskLevel.toLowerCase()} risk of ${(patientData.risk_factor * 100).toFixed(1)}%. ${patientData.number_emergency > 0 ? `Emergency visits (${patientData.number_emergency}) suggest potential instability.` : 'No recent emergency use suggests stable outpatient control.'}`;
        }

        // Visits / utilization
        if (matches(['visit', 'visits', 'hospital', 'inpatient', 'emergency', 'outpatient'])) {
            return `Utilization for #${patientData.Patient_ID}: total ${patientData.total_visits}, inpatient ${patientData.number_inpatient}, emergency ${patientData.number_emergency}, outpatient ${patientData.number_outpatient}. Avg hospital stay ${patientData.time_in_hospital} day(s).`;
        }

        // Medications / insulin
        if (matches(['medication', 'medications', 'drug', 'insulin', 'meds'])) {
            return `Medication profile for #${patientData.Patient_ID}: ${patientData.num_medications} total changes/meds. ${patientData.diabetesMed ? 'On diabetes meds' : 'Not on diabetes meds'}${patientData['feature_13_insulin_No'] === 1 ? '; insulin currently marked as No' : ''}.`;
        }

        // Age
        if (matches(['age', 'elderly', 'old'])) {
            return `Patient #${patientData.Patient_ID} is ${patientData['age:70+'] ? '70+ years' : 'under 70 years'}. Adjust care pathways accordingly.`;
        }

        // Diagnoses
        if (matches(['diagnosis', 'diagnoses', 'condition'])) {
            return `#${patientData.Patient_ID} has ${patientData.number_diagnoses} documented diagnoses. Consider comorbidity management and care coordination.`;
        }

        // Recommendations
        if (matches(['recommendation', 'recommend', 'suggest', 'advice', 'plan'])) {
            const actions = [];
            if (riskLevel === 'High') actions.push('close follow-up within 1–2 weeks');
            if (patientData.number_emergency > 0) actions.push('review emergency triggers and access plan');
            if (patientData.num_medications > 20) actions.push('pharmacist-led medication review');
            if (patientData.diabetesMed) actions.push('optimize diabetes regimen and self-monitoring');
            if (actions.length === 0) actions.push('continue routine monitoring and lifestyle counseling');
            return `For Patient #${patientData.Patient_ID} (${riskLevel} risk): ${actions.join('; ')}.`;
        }

        // Greetings / help
        if (matches(['hello', 'hi', 'help', 'hey'])) {
            return `Hello! Ask about risk, hospital use, medications, age, diagnoses, or recommendations for Patient #${patientData.Patient_ID}.`;
        }

        // Default: provide a concise status summary
        const ageText = patientData['age:70+'] ? '70+ years' : 'under 70 years';
        const medsText = patientData.diabetesMed ? 'on diabetes meds' : 'not on diabetes meds';
        const followUp = riskLevel === 'High' ? 'close follow-up within 1–2 weeks' : riskLevel === 'Medium' ? 'routine follow-up within 4–6 weeks' : 'continue standard monitoring';
        return `Summary for #${patientData.Patient_ID}: ${riskLevel} risk ${(patientData.risk_factor * 100).toFixed(1)}%; inpatient ${patientData.number_inpatient}, emergency ${patientData.number_emergency}, outpatient ${patientData.number_outpatient}; avg stay ${patientData.time_in_hospital} day(s); age ${ageText}, ${medsText}. Recommended: ${followUp}.`;
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (timestamp) => {
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="doctor-chatbot">
            <div className="chatbot-header">
                <div className="header-info">
                    <MessageCircle className="header-icon" />
                    <div>
                        <h3>AI Assistant</h3>
                        <p>Ask questions about the selected patient</p>
                    </div>
                </div>
            </div>

            <div className="chatbot-messages">
                {messages.map((message) => (
                    <div key={message.id} className={`message ${message.type}`}>
                        <div className="message-avatar">
                            {message.type === 'bot' ? <Bot className="avatar-icon" /> : <User className="avatar-icon" />}
                        </div>
                        <div className="message-content">
                            <div className="message-text">{message.text}</div>
                            <div className="message-time">{formatTime(message.timestamp)}</div>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="message bot">
                        <div className="message-avatar">
                            <Bot className="avatar-icon" />
                        </div>
                        <div className="message-content">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="chatbot-input">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about the patient's data..."
                    className="input-field"
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isTyping}
                    className="send-button"
                >
                    <Send className="send-icon" />
                </button>
            </div>
        </div>
    );
};

export default DoctorChatbot;
