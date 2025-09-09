# 🏥 Diabetes Clinical Risk Prediction & Dashboard

An end-to-end system for **predicting short-term readmission risk in diabetic patients** using advanced ML workflows, explainability layers, and an **interactive React dashboard** with AI-powered clinical summaries.

---

## ✨ Key Features

- 📊 **Risk Prediction Pipeline**: Ensemble-based models trained on 130 US hospitals diabetes dataset.  
- ⚡ **Feature Engineering**: Comorbidity profiling, utilization metrics, medication complexity, and control markers.  
- 🧠 **Explainability Layer**: SHAP + Autogen agents for patient-level feature attribution.  
- 📝 **Natural Language Summaries**: Google Gemini API converts clinical/tabular outputs into human-readable insights.  
- 🖥️ **Interactive Dashboard**: React app for exploring predictions, feature impacts, and AI summaries.  
- 🔄 **Full Workflow**: From raw data → ML training → explainability → frontend visualization.  

---

## 🧩 Workflow Overview

1. **Problem Framing**  
   - Goal: Predict 90-day readmission risk for diabetic patients.  
   - Clinical value: Reduce readmissions, optimize resources, improve patient care.  

2. **Data Handling**  
   - Dataset: 130 US hospitals diabetes dataset (via Hugging Face).  
   - Processing: Patient tracking (`patient_id`), balancing, cleaning.  

3. **Target Engineering**  
   - Risk label = weighted signals:  
     - Readmission (40%), Emergency visits (20%), Inpatient visits (15%), High A1C (15%), Extreme glucose (10%).  
   - Threshold ≥ 0.5 → High-risk classification.  

4. **Feature Strategy**  
   - Medication changes, insulin complexity.  
   - Comorbidity counts + high-risk comorbidities.  
   - Utilization metrics (ER ratio, total visits).  
   - Control markers (A1C, glucose).  
   - Derived: *High utilizer*, *High procedure burden*.  

5. **Preprocessing Pipeline**  
   - Label encoding, median imputation.  
   - Feature selection (ANOVA F-test → top 50).  
   - Float32 casting for efficiency.  

6. **Model Training**  
   - Base: **XGBoost (GPU-accelerated)**.  
   - Handle imbalance: **SMOTE (k=3)**.  
   - Ensemble: ROC-AUC weighted averaging.  
   - Threshold tuning for max F1-score.  

7. **Model Persistence**  
   - Saves: imputer, encoders, feature mapping, model weights.  

8. **Explainability Layer**  
   - **SHAP**: Top-20 feature contributions per patient.  
   - **Autogen Agents**: Organize explanations for clinicians.  

9. **Summarization & Insights**  
   - Orchestrator agent runs SHAP + trend summarizer.  
   - Uses **Gemini API** for plain-language summaries.  

10. **Frontend Showcase**  
   - **React Dashboard** with:  
     - Risk predictions  
     - Feature contributions  
     - Natural language summaries  

---

## ⚙️ Setup Instructions

### 🔹 Backend (ML Pipeline)

1. Create and activate a Python environment.  
2. Install dependencies:  
   ```bash
   pip install -r requirements.txt
   ```
3. Train or load pre-trained model:  
   ```bash
   python train_pipeline.py
   ```
4. Save artifacts (model + encoders + selectors).  

### 🔹 Frontend (Dashboard)

1. Install dependencies:  
   ```bash
   npm install
   ```
2. Configure **Gemini API key**:  
   - Open `.env` in root directory.  
   - Add your key:  
     ```env
     REACT_APP_GEMINI_API_KEY=your-actual-api-key-here
     ```
3. Start the app:  
   ```bash
   npm start
   ```
   The dashboard will open at [http://localhost:3000](http://localhost:3000).  

---

## 📂 Project Structure

```
├── backend/
│   ├── train_pipeline.py       # Training script
│   ├── preprocess.py           # Data preprocessing
│   ├── explainability.py       # SHAP + Autogen layer
│   ├── models/                 # Saved models + encoders
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Dashboard pages
│   │   └── utils/              # API + helpers
│   ├── public/newdata.csv      # Patient data
│   └── package.json
└── README.md
```

---

## 🧠 Technologies Used

- **Backend**: Python, XGBoost, Scikit-learn, SMOTE, SHAP, Autogen Agents  
- **Frontend**: React 18, Chart.js, Lucide Icons, Axios  
- **Explainability + NLP**: SHAP, Google Gemini API  

---

## 🩺 Example Dashboard Insights

- *Patient A*: High-risk due to frequent ER visits (35% contribution) + poor A1C control (20%).  
- *Patient B*: Low-risk; strong medication adherence offsets occasional high glucose readings.  

---

## 🔐 Notes

- `.env` is ignored in version control for API key safety.  
- This project is intended for **educational and healthcare analysis purposes only**.  

---
