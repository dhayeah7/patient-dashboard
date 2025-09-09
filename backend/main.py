import os
import io
import json
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import numpy as np
import requests


class PredictRequest(BaseModel):
    records: List[Dict[str, Any]]


class PredictResponse(BaseModel):
    risk_probability: List[float]
    risk_prediction: List[int]
    risk_level: List[str]
    top20_features: List[Dict[str, Any]]
    explanation: Optional[str] = None


def load_artifacts() -> Dict[str, Any]:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    pipeline_path = os.path.join(base_dir, 'pipeline_artifacts.joblib')
    model_path = os.path.join(base_dir, 'final_model.joblib')
    top20_path = os.path.join(base_dir, 'top_20_features.csv')
    
    print(f"Looking for files in: {base_dir}")
    print(f"Pipeline path: {pipeline_path}")
    print(f"Model path: {model_path}")
    print(f"Pipeline exists: {os.path.exists(pipeline_path)}")
    print(f"Model exists: {os.path.exists(model_path)}")

    if not os.path.exists(pipeline_path):
        raise RuntimeError(f'Pipeline artifacts not found at: {pipeline_path}')
    
    if not os.path.exists(model_path):
        raise RuntimeError(f'Model artifacts not found at: {model_path}')

    try:
        pipeline_dict = joblib.load(pipeline_path)
        print(f"Pipeline loaded successfully. Type: {type(pipeline_dict)}")
        
        if isinstance(pipeline_dict, dict):
            print("Pipeline keys:", list(pipeline_dict.keys()))
        
    except Exception as e:
        raise RuntimeError(f'Failed to load pipeline artifacts: {str(e)}')
    
    try:
        model = joblib.load(model_path)
        print(f"Model loaded successfully. Type: {type(model)}")
        
    except Exception as e:
        print(f"Error details: {str(e)}")
        raise RuntimeError(f'Failed to load model artifacts. The model file may be corrupted or saved in an incompatible format: {str(e)}')

    top20_features: Optional[List[str]] = None
    if os.path.exists(top20_path):
        try:
            df_top = pd.read_csv(top20_path)
            if df_top.shape[1] == 1:
                top20_features = df_top.iloc[:, 0].dropna().astype(str).tolist()
            elif 'feature' in df_top.columns:
                top20_features = df_top['feature'].dropna().astype(str).tolist()
        except Exception as e:
            print(f"Warning: Could not load top 20 features: {e}")
            top20_features = None

    return {
        'pipeline': pipeline_dict,
        'model': model,
        'top20': top20_features or []
    }


def preprocess_data(df_input: pd.DataFrame, pipeline_dict: Dict[str, Any]) -> np.ndarray:
    """
    Custom preprocessing function to handle the pipeline dictionary format
    """
    df = df_input.copy()
    
    # Get pipeline components
    imputer = pipeline_dict.get('imputer')
    selector = pipeline_dict.get('selector') 
    label_encoders = pipeline_dict.get('label_encoders', {})
    sanitized_feature_names = pipeline_dict.get('sanitized_feature_names', [])
    selected_features = pipeline_dict.get('selected_features', [])
    feature_name_mapping = pipeline_dict.get('feature_name_mapping', {})
    
    print(f"Input columns: {list(df.columns)}")
    print(f"Expected sanitized features: {len(sanitized_feature_names)}")
    print(f"Selected features: {len(selected_features)}")
    
    # Step 1: Map original column names to sanitized names if mapping exists
    if feature_name_mapping:
        # Create reverse mapping (sanitized -> original)
        reverse_mapping = {v: k for k, v in feature_name_mapping.items()}
        
        # Ensure we have all sanitized features, fill missing with 0
        sanitized_df = pd.DataFrame()
        for sanitized_name in sanitized_feature_names:
            original_name = reverse_mapping.get(sanitized_name, sanitized_name)
            if original_name in df.columns:
                sanitized_df[sanitized_name] = df[original_name]
            elif sanitized_name in df.columns:
                sanitized_df[sanitized_name] = df[sanitized_name]
            else:
                # Handle common name variations
                found = False
                for col in df.columns:
                    if str(col).replace(':', '_').replace(' ', '_') == sanitized_name:
                        sanitized_df[sanitized_name] = df[col]
                        found = True
                        break
                if not found:
                    sanitized_df[sanitized_name] = 0
                    print(f"Warning: Feature {sanitized_name} not found, filled with 0")
        
        df = sanitized_df
    else:
        # If no mapping, ensure we have expected columns
        for col in sanitized_feature_names:
            if col not in df.columns:
                df[col] = 0
        
        # Keep only expected columns in correct order
        df = df[sanitized_feature_names]
    
    print(f"After column mapping - shape: {df.shape}")
    
    # Step 2: Apply label encoders if any
    if label_encoders:
        for col, encoder in label_encoders.items():
            if col in df.columns:
                try:
                    # Handle unseen categories by using most frequent class
                    unique_vals = df[col].unique()
                    encoder_classes = encoder.classes_
                    for val in unique_vals:
                        if val not in encoder_classes and not pd.isna(val):
                            print(f"Warning: Unseen category {val} in {col}, replacing with most frequent")
                            df[col] = df[col].replace(val, encoder_classes[0])
                    
                    df[col] = encoder.transform(df[col])
                except Exception as e:
                    print(f"Warning: Could not apply label encoder to {col}: {e}")
    
    # Step 3: Imputation
    if imputer:
        try:
            print("Applying imputation...")
            df_imputed = pd.DataFrame(
                imputer.transform(df),
                columns=df.columns,
                index=df.index
            )
            df = df_imputed
            print(f"After imputation - shape: {df.shape}")
        except Exception as e:
            print(f"Warning: Imputation failed: {e}")
            # Fill NaN with 0 as fallback
            df = df.fillna(0)
    
    # Step 4: Feature selection
    if selector and selected_features:
        try:
            print("Applying feature selection...")
            X_selected = selector.transform(df)
            print(f"After feature selection - shape: {X_selected.shape}")
            print(f"Expected selected features: {len(selected_features)}")
            return X_selected
        except Exception as e:
            print(f"Warning: Feature selection failed: {e}")
            # Fallback: manually select features by name
            available_selected = [f for f in selected_features if f in df.columns]
            if available_selected:
                return df[available_selected].values
            else:
                return df.values
    
    return df.values


# Load artifacts on startup
try:
    ARTIFACTS = load_artifacts()
    print("Model artifacts loaded successfully")
except Exception as e:
    print(f"Error loading artifacts: {e}")
    raise

app = FastAPI(title='Patient Risk API', version='1.0.0')

# CORS for local React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://localhost',
        'http://127.0.0.1'
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/health')
def health() -> Dict[str, str]:
    return {'status': 'ok'}


def infer(df_input: pd.DataFrame) -> Dict[str, Any]:
    pipeline_dict = ARTIFACTS['pipeline']
    model = ARTIFACTS['model']
    top20 = ARTIFACTS['top20']

    # Ensure columns are strings
    df_input = df_input.copy()
    df_input.columns = [str(c) for c in df_input.columns]
    
    print(f"Input dataframe shape: {df_input.shape}")
    print(f"Input columns: {list(df_input.columns)[:10]}...")  # First 10 columns

    # Preprocess using custom function
    try:
        X_processed = preprocess_data(df_input, pipeline_dict)
        print(f"Preprocessed data shape: {X_processed.shape}")
    except Exception as e:
        raise RuntimeError(f"Preprocessing failed: {str(e)}")

    # Predict
    try:
        if hasattr(model, 'predict_proba'):
            proba = model.predict_proba(X_processed)
            # Use positive class probability
            if proba.shape[1] == 2:
                risk_prob = proba[:, 1]
            else:
                # If multi-class, take max
                risk_prob = proba.max(axis=1)
        elif hasattr(model, 'decision_function'):
            scores = model.decision_function(X_processed)
            # Sigmoid to map to [0,1]
            risk_prob = 1 / (1 + np.exp(-scores))
        else:
            preds = model.predict(X_processed)
            # Map to 0/1; probability is 1 for positive predictions
            risk_prob = np.where(np.array(preds) == 1, 1.0, 0.0)
            
        print(f"Prediction successful. Risk probabilities: {risk_prob}")
            
    except Exception as e:
        raise RuntimeError(f"Model prediction failed: {str(e)}")

    risk_pred = (risk_prob >= 0.5).astype(int).tolist()
    risk_prob_list = [float(x) for x in risk_prob]
    risk_level_list = [
        'Low' if p < 0.3 else ('Medium' if p < 0.6 else 'High')
        for p in risk_prob_list
    ]

    # Extract meaningful features (non-zero, non-null values) for each record
    top_values: List[Dict[str, Any]] = []
    
    for _, row in df_input.iterrows():
        per_row = {}
        
        # First, collect all available meaningful features
        meaningful_features = {}
        for col in df_input.columns:
            val = row[col]
            if isinstance(val, np.generic):
                val = val.item()
            
            # Include feature if it has meaningful value
            if not pd.isna(val) and val != 0 and val != '' and val != 'None':
                meaningful_features[str(col)] = val
        
        # If we have selected features from model, prioritize those
        if 'selected_features' in pipeline_dict and pipeline_dict['selected_features']:
            priority_features = []
            for feat in pipeline_dict['selected_features'][:20]:
                # Try to find this feature in our meaningful features
                if feat in meaningful_features:
                    priority_features.append((feat, meaningful_features[feat]))
                # Try alternative names
                elif feat.replace('_', ':') in meaningful_features:
                    alt_name = feat.replace('_', ':')
                    priority_features.append((feat, meaningful_features[alt_name]))
                # Include important features even if zero (for context)
                elif feat in ['diabetesMed', 'time_in_hospital', 'number_inpatient', 'number_emergency', 'age_70']:
                    val = row.get(feat, row.get(feat.replace('_', ':'), 0))
                    if isinstance(val, np.generic):
                        val = val.item()
                    priority_features.append((feat, val))
            
            # Add remaining meaningful features
            for feat, val in meaningful_features.items():
                if not any(feat == pf[0] or feat.replace(':', '_') == pf[0] for pf in priority_features):
                    priority_features.append((feat, val))
            
            # Take top 20
            for feat, val in priority_features[:20]:
                per_row[feat] = val
                
        else:
            # If no model features available, use top meaningful features
            sorted_features = sorted(meaningful_features.items(), 
                                   key=lambda x: abs(x[1]) if isinstance(x[1], (int, float)) else 1, 
                                   reverse=True)[:20]
            for feat, val in sorted_features:
                per_row[feat] = val
        
        # Ensure we have at least some features
        if len(per_row) < 5:
            # Add some basic features even if zero
            basic_features = ['time_in_hospital', 'number_diagnoses', 'num_medications', 
                            'diabetesMed', 'age_70', 'Patient_ID']
            for feat in basic_features:
                if feat in row.index and feat not in per_row:
                    val = row[feat]
                    if isinstance(val, np.generic):
                        val = val.item()
                    per_row[feat] = val
                    if len(per_row) >= 20:
                        break
        
        top_values.append(per_row)
        
    print(f"Extracted features for first record: {list(top_values[0].keys()) if top_values else 'None'}")

    return {
        'risk_probability': risk_prob_list,
        'risk_prediction': risk_pred,
        'risk_level': risk_level_list,
        'top20_features': top_values,
    }


def call_gemini(summary_payload: Dict[str, Any]) -> Optional[str]:
    api_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
    if not api_key:
        print("Warning: GEMINI_API_KEY not found in environment variables")
        return None

    url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}'

    # Build prompt from the first record
    risk_prob = summary_payload['risk_probability'][0]
    risk_level = summary_payload['risk_level'][0]
    top_feats = summary_payload['top20_features'][0]

    bullet_lines = []
    for name, value in top_feats.items():
        bullet_lines.append(f"- {name}: {value}")

    prompt = (
        "Provide a concise clinical explanation for a diabetes patient's risk assessment. "
        "Focus on the key factors contributing to the risk score. Use bullet points and keep it under 180 words. "
        "Format similar to: '* Factor name: Brief explanation of how it affects risk.'\n\n"
        f"RISK SCORE: {risk_prob:.3f} ({risk_level} Risk)\n"
        "KEY FEATURES:\n" + "\n".join(bullet_lines[:10])  # Limit to top 10 for brevity
    )

    try:
        resp = requests.post(
            url,
            json={
                'contents': [{
                    'parts': [{ 'text': prompt }]
                }],
                'generationConfig': {
                    'temperature': 0.4,
                    'topK': 32,
                    'topP': 0.9,
                    'maxOutputTokens': 512
                }
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        text = (
            data.get('candidates', [{}])[0]
            .get('content', {})
            .get('parts', [{}])[0]
            .get('text', None)
        )
        return text
    except requests.exceptions.RequestException as e:
        print(f"Gemini API request failed: {e}")
        return None
    except Exception as e:
        print(f"Gemini API unexpected error: {e}")
        return None


@app.post('/predict', response_model=PredictResponse)
async def predict(
    json_payload: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
    body: Optional[PredictRequest] = Body(default=None)
):
    """
    Accepts either:
      - multipart/form-data with a CSV file under field 'file'
      - multipart/form-data with a 'json_payload' field containing JSON string { records: [ {..}, .. ] }
      - application/json body like {"records": [{...}, ...]}
    """
    try:
        if file is not None:
            if not file.filename.lower().endswith('.csv'):
                raise HTTPException(status_code=400, detail='File must be a CSV')
            content = await file.read()
            try:
                df = pd.read_csv(io.BytesIO(content))
                print(f"CSV loaded: {df.shape}")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f'Failed to parse CSV: {str(e)}')
                
        elif json_payload is not None:
            try:
                payload = json.loads(json_payload)
            except json.JSONDecodeError as e:
                raise HTTPException(status_code=400, detail=f'Invalid JSON: {str(e)}')
                
            records = payload.get('records')
            if not isinstance(records, list) or len(records) == 0:
                raise HTTPException(status_code=400, detail='records must be a non-empty list')
            df = pd.DataFrame(records)
            
        elif body is not None:
            if not body.records:
                raise HTTPException(status_code=400, detail='records must be a non-empty list')
            df = pd.DataFrame(body.records)
            
        else:
            raise HTTPException(status_code=400, detail='No input provided. Use file upload, json_payload, or JSON body with {"records": [...]}.')

        if df.shape[0] == 0:
            raise HTTPException(status_code=400, detail='Empty input data')

        # Check if dataframe has any columns
        if df.shape[1] == 0:
            raise HTTPException(status_code=400, detail='Input data has no columns')

        result = infer(df)
        explanation = call_gemini(result)

        return PredictResponse(
            risk_probability=result['risk_probability'],
            risk_prediction=result['risk_prediction'],
            risk_level=result['risk_level'],
            top20_features=result['top20_features'],
            explanation=explanation
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # Return a more detailed error to aid debugging
        detail = f"Prediction failed: {type(e).__name__}: {str(e)}"
        print(f"Error in predict endpoint: {detail}")
        raise HTTPException(status_code=500, detail=detail)


@app.post('/predict-patient')
async def predict_patient(patient_data: Dict[str, Any]):
    """
    Endpoint specifically for single patient prediction from React frontend
    """
    try:
        # Convert single patient record to DataFrame
        df = pd.DataFrame([patient_data])
        
        result = infer(df)
        explanation = call_gemini(result)

        return {
            'risk_probability': result['risk_probability'][0],
            'risk_prediction': result['risk_prediction'][0],
            'risk_level': result['risk_level'][0],
            'top20_features': result['top20_features'][0],
            'explanation': explanation
        }
        
    except Exception as e:
        detail = f"Patient prediction failed: {type(e).__name__}: {str(e)}"
        print(f"Error in predict-patient endpoint: {detail}")
        raise HTTPException(status_code=500, detail=detail)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)