import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    Title
} from 'chart.js';
import './PatientChart.css';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const PatientChart = ({ data }) => {
    if (!data) return null;

    // Prepare data for the doughnut chart showing key metrics
    const chartData = {
        labels: [
            'Inpatient Visits',
            'Emergency Visits',
            'Outpatient Visits',
            'Lab Procedures',
            'Other Procedures'
        ],
        datasets: [
            {
                data: [
                    data.number_inpatient || 0,
                    data.number_emergency || 0,
                    data.number_outpatient || 0,
                    data.num_lab_procedures || 0,
                    data.num_procedures || 0
                ],
                backgroundColor: [
                    '#FF6B6B',
                    '#4ECDC4',
                    '#45B7D1',
                    '#96CEB4',
                    '#FFEAA7'
                ],
                borderColor: [
                    '#FF5252',
                    '#26A69A',
                    '#2196F3',
                    '#66BB6A',
                    '#FFC107'
                ],
                borderWidth: 2,
                hoverOffset: 4
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: 'white',
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif"
                    },
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            title: {
                display: true,
                text: 'Medical Activity Distribution',
                color: 'white',
                font: {
                    size: 16,
                    weight: 'bold',
                    family: "'Inter', sans-serif"
                },
                padding: {
                    top: 10,
                    bottom: 20
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
        cutout: '60%',
        animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1000
        }
    };


    return (
        <div className="patient-chart">
            <div className="chart-container">
                <Doughnut data={chartData} options={options} />
            </div>

        </div>
    );
};

export default PatientChart;
