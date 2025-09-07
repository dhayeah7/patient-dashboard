# Diabetes Patient Dashboard

A beautiful React-based dashboard for analyzing diabetes patient data with AI-powered insights using Google Gemini API.

## Features

- 🏥 **Patient Selection**: Dropdown to select from 10000+ patients
- 📊 **Data Visualization**: Interactive charts showing medical activity distribution
- 📋 **Comprehensive Data Display**: Organized patient information with risk assessment
- 🤖 **AI Insights**: Google Gemini AI-powered analysis and recommendations
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Modern UI**: Beautiful gradient design with glassmorphism effects

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Gemini API

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Open the `.env` file in the root directory
3. Replace `your_gemini_api_key_here` with your actual API key:

```env
REACT_APP_GEMINI_API_KEY=your-actual-api-key-here
```

**Note**: The `.env` file is already included in `.gitignore` to keep your API key secure.

### 3. Start the Application

```bash
npm start
```

The application will open at `http://localhost:3000`

## Data Structure

The application reads from `public/newdata.csv` which contains the following patient data (mapped to the UI):

- **Patient Information**: ID, visits, hospital stays
- **Medical Data**: Diagnoses, medications, procedures
- **Risk Factors**: Calculated risk scores and assessments
- **Admission Details**: Source and discharge information

## Components

- **PatientSelector**: Dropdown for patient selection
- **PatientDataDisplay**: Organized data presentation
- **PatientChart**: Interactive doughnut chart visualization
- **SimpleInsights**: AI-powered health analysis

## Technologies Used

- React 18
- Chart.js with react-chartjs-2
- Google Gemini AI API
- Lucide React (icons)
- CSS3 with modern features
- Axios for API calls

## API Integration

The application integrates with Google Gemini AI to provide:
- Health pattern analysis
- Risk factor assessment
- Care recommendations
- Trend identification
- Plain English insights

## Customization

You can customize the application by:
- Modifying the chart data in `PatientChart.js`
- Adjusting the data display format in `PatientDataDisplay.js`
- Updating the AI prompt in `GeminiInsights.js`
- Changing the styling in the CSS files

## Troubleshooting

### Gemini API Issues
- Ensure your API key is correctly set
- Check your API quota and billing
- Verify internet connectivity

### Data Loading Issues
- Ensure `data.csv` is in the `public` directory
- Check browser console for errors
- Verify CSV format matches expected structure

## License

This project is for educational and healthcare analysis purposes.
