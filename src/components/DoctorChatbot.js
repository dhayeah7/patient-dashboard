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
    }, [data?.Patient_ID]);

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

        // Check for fatal/urgent keywords
        if (input.includes('fatal') || input.includes('deadly') || input.includes('dangerous') || input.includes('critical') || input.includes('urgent')) {
            const riskLevel = patientData.risk_factor < 0.3 ? 'Low' :
                patientData.risk_factor < 0.6 ? 'Medium' : 'High';
            if (riskLevel === 'High') {
                return `Patient #${patientData.Patient_ID} has HIGH risk (${(patientData.risk_factor * 100).toFixed(1)}%) requiring immediate attention. With ${patientData.number_emergency} emergency visits and ${patientData.num_medications} medications, this patient needs urgent monitoring and intervention.`;
            } else {
                return `Patient #${patientData.Patient_ID} has ${riskLevel.toLowerCase()} risk (${(patientData.risk_factor * 100).toFixed(1)}%). While not immediately fatal, ${patientData.number_emergency > 0 ? 'the emergency visits indicate' : 'the medical complexity suggests'} need for careful monitoring.`;
            }
        }

        if (input.includes('risk') || input.includes('diabetes')) {
            const riskLevel = patientData.risk_factor < 0.3 ? 'Low' :
                patientData.risk_factor < 0.6 ? 'Medium' : 'High';
            return `Patient #${patientData.Patient_ID} has a ${riskLevel.toLowerCase()} diabetes risk of ${(patientData.risk_factor * 100).toFixed(1)}%. This requires ${riskLevel.toLowerCase()}-priority monitoring. ${patientData.number_emergency > 0 ? `The ${patientData.number_emergency} emergency visit${patientData.number_emergency > 1 ? 's' : ''} indicate${patientData.number_emergency === 1 ? 's' : ''} potential complications.` : ''}`;
        }

        if (input.includes('visit') || input.includes('hospital')) {
            return `Patient #${patientData.Patient_ID} has ${patientData.total_visits} total visits: ${patientData.number_inpatient} inpatient, ${patientData.number_emergency} emergency, ${patientData.number_outpatient} outpatient. Average hospital stay: ${patientData.time_in_hospital} days. ${patientData.number_emergency > 0 ? 'Emergency visits suggest need for better preventive care.' : 'Low emergency visits indicate good management.'}`;
        }

        if (input.includes('medication') || input.includes('drug')) {
            return `Patient #${patientData.Patient_ID} is on ${patientData.num_medications} medications. ${patientData.diabetesMed ? 'Currently taking diabetes medication.' : 'Not currently on diabetes medication.'} ${patientData.num_medications > 20 ? 'High medication count suggests polypharmacy concerns.' : 'Medication count is manageable.'}`;
        }

        if (input.includes('age') || input.includes('elderly')) {
            return `Patient #${patientData.Patient_ID} is ${patientData['age:70+'] ? '70+ years old' : 'under 70 years old'}. ${patientData['age:70+'] ? 'Age-specific care protocols recommended due to increased vulnerability.' : 'Standard adult care protocols apply.'}`;
        }

        if (input.includes('diagnosis') || input.includes('condition')) {
            return `Patient #${patientData.Patient_ID} has ${patientData.number_diagnoses} active diagnoses. This indicates complex medical history requiring comprehensive care management. ${patientData.number_diagnoses > 10 ? 'High diagnosis count suggests multiple comorbidities.' : 'Diagnosis count is manageable.'}`;
        }

        if (input.includes('recommendation') || input.includes('suggest') || input.includes('advice')) {
            const riskLevel = patientData.risk_factor < 0.3 ? 'Low' :
                patientData.risk_factor < 0.6 ? 'Medium' : 'High';
            return `For Patient #${patientData.Patient_ID}: ${riskLevel} priority monitoring, ${patientData.number_emergency > 0 ? 'review emergency patterns, ' : ''}${patientData.num_medications > 20 ? 'medication review, ' : ''}${patientData.diabetesMed ? 'continue diabetes management' : 'consider diabetes evaluation'}. ${patientData['age:70+'] ? 'Age-specific protocols recommended.' : ''}`;
        }

        if (input.includes('hello') || input.includes('hi') || input.includes('help')) {
            return `Hello! I can help you analyze Patient #${patientData.Patient_ID}. Ask about risk factors, visits, medications, age considerations, diagnoses, or recommendations.`;
        }

        return `I can help you analyze Patient #${patientData.Patient_ID}. Try asking about risk factors, hospital visits, medications, age considerations, diagnoses, or care recommendations.`;
    };

    const handleKeyPress = (e) => {
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
                    onKeyPress={handleKeyPress}
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
