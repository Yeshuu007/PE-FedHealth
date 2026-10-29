
import os
import sys
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------
# Project configuration
# ---------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

app = FastAPI(
    title="PE-FedHealth",
    description=(
        "Privacy-Preserving and Explainable Federated Learning "
        "Framework for Wearable Sensor Research"
    ),
    version="1.0",
)

# CORS FIX:
# Permit the two known Codespaces frontend origins.
# Add another exact origin here if your forwarded URL changes.
app.add_middleware(
    CORSMiddleware,
        allow_origins=[
            "https://peppy-dango-200a9c.netlify.app",
            "https://glowing-succotash-4j4r67wvj4j9f57rj-5173.app.github.dev",
            "https://glowing-succotash-4j4r67wvj4j9f57rj-5174.app.github.dev",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Model configuration
# ---------------------------------------------------------

FEATURES = ["ecg_std", "eda_mean", "temp_std", "resp_std"]

MODEL = None
SCALER = None
MODEL_LOAD_ERROR = None



def load_model():
    """Load the trained model and its matching scaler."""
    global MODEL, SCALER, MODEL_LOAD_ERROR

    try:
        import joblib

        bundle_path = PROJECT_ROOT / "models" / "stress_model_bundle.pkl"

        if bundle_path.exists():
            bundle = joblib.load(bundle_path)

            if isinstance(bundle, dict):
                MODEL = bundle["model"]
                SCALER = bundle["scaler"]
            else:
                MODEL = bundle
                scaler_path = PROJECT_ROOT / "models" / "scaler.pkl"
                SCALER = joblib.load(scaler_path) if scaler_path.exists() else None

        else:
            possible_model_paths = [
                PROJECT_ROOT / "models" / "model.pkl",
                PROJECT_ROOT / "models" / "logistic_regression.pkl",
                PROJECT_ROOT / "models" / "stress_model.pkl",
            ]

            model_path = next(
                (path for path in possible_model_paths if path.exists()),
                None,
            )

            if model_path is None:
                raise FileNotFoundError(
                    "No supported saved model file was found."
                )

            MODEL = joblib.load(model_path)

            scaler_path = PROJECT_ROOT / "models" / "scaler.pkl"
            SCALER = (
                joblib.load(scaler_path)
                if scaler_path.exists()
                else None
            )

        MODEL_LOAD_ERROR = None
        print("Loaded trained model:", type(MODEL).__name__)
        print("Loaded matching scaler:", type(SCALER).__name__ if SCALER is not None else "None")

    except Exception as exc:
        MODEL = None
        SCALER = None
        MODEL_LOAD_ERROR = str(exc)
        print(f"Model loading failed: {exc}")



load_model()

# ---------------------------------------------------------
# Request models
# ---------------------------------------------------------


class SensorInput(BaseModel):
    ecg_std: float = Field(..., description="ECG standard deviation")
    eda_mean: float = Field(..., description="EDA mean")
    temp_std: float = Field(..., description="Temperature standard deviation")
    resp_std: float = Field(..., description="Respiratory standard deviation")


class FederatedTrainRequest(BaseModel):
    clients: int = Field(default=15, ge=1, le=100)


def make_feature_array(data: SensorInput):
    values = np.array(
        [[
            data.ecg_std,
            data.eda_mean,
            data.temp_std,
            data.resp_std,
        ]],
        dtype=float,
    )

    if not np.isfinite(values).all():
        raise HTTPException(
            status_code=422,
            detail="All sensor values must be finite numbers.",
        )

    if SCALER is not None:
        values = SCALER.transform(values)

    return values


def calculate_demo_indicators(data: SensorInput):
    """
    Simple demonstration indicators.

    These values are not validated clinical risk scores.
    Replace this function with the existing trained research
    indicator logic if your project already implements it.
    """
    values = np.array(
        [
            abs(data.ecg_std),
            abs(data.eda_mean),
            abs(data.temp_std),
            abs(data.resp_std),
        ],
        dtype=float,
    )

    # Keep the demonstration bounded and clearly non-clinical.
    normalized = np.clip(values / (1.0 + values), 0, 1) * 100

    return {
        "cardiac_risk": round(float(normalized[0]), 1),
        "stress_risk": round(float(normalized[1]), 1),
        "respiratory_risk": round(float(normalized[3]), 1),
        "overall_risk": round(float(np.mean(normalized)), 1),
    }


def predict_with_model(data: SensorInput):
    if MODEL is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "The trained model is unavailable. "
                "Check your model file paths and backend logs. "
                f"Details: {MODEL_LOAD_ERROR}"
            ),
        )

    values = make_feature_array(data)

    try:
        predicted = MODEL.predict(values)[0]

        if hasattr(MODEL, "predict_proba"):
            probabilities = MODEL.predict_proba(values)[0]
            classes = list(MODEL.classes_)
            predicted_index = classes.index(predicted)
            confidence = float(probabilities[predicted_index])

            stress_probability = (
                float(probabilities[classes.index(1)])
                if 1 in classes
                else confidence
            )
        else:
            confidence = None
            stress_probability = None

        if str(predicted).lower() in {"0", "baseline"}:
            predicted_state = "Baseline"
        elif str(predicted).lower() in {"1", "stress"}:
            predicted_state = "Stress"
        else:
            predicted_state = str(predicted)

        return {
            "predicted_state": predicted_state,
            "stress_probability": (
                round(stress_probability, 4)
                if stress_probability is not None
                else None
            ),
            "confidence": (
                round(confidence, 4)
                if confidence is not None
                else None
            ),
            "model_type": type(MODEL).__name__,
            "task": "Baseline vs Stress",
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Model prediction failed: {exc}",
        ) from exc


# ---------------------------------------------------------
# Root and health endpoints
# ---------------------------------------------------------


@app.get("/")
def root():
    return {
        "service": "PE-FedHealth",
        "message": "API is running",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PE-FedHealth FastAPI Backend",
        "model_loaded": MODEL is not None,
    }


# ---------------------------------------------------------
# Prediction endpoint
# ---------------------------------------------------------


@app.post("/prediction/risk")
def predict_risk(data: SensorInput):
    """
    Return the nested response expected by the React dashboard:
    { "message": "...", "prediction": { ... } }
    """
    model_result = predict_with_model(data)
    indicators = calculate_demo_indicators(data)

    return {
        "message": "ML-based physiological prediction generated successfully",
        "prediction": {
            **indicators,
            **model_result,
            "model_metrics": {},
            "note": (
                "Research-oriented physiological indicators only. "
                "They are not clinical diagnoses or validated disease scores."
            ),
        },
    }


# ---------------------------------------------------------
# Explainability endpoint
# ---------------------------------------------------------


@app.post("/explanation/shap")
def explain_prediction(data: SensorInput):
    if MODEL is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "The trained model is unavailable, so a model explanation "
                "cannot be generated."
            ),
        )

    try:
        import shap

        values = make_feature_array(data)

        # LinearExplainer supports linear models such as LogisticRegression.
        background = np.zeros((1, len(FEATURES)))
        explainer = shap.LinearExplainer(MODEL, background)
        shap_values = explainer.shap_values(values)

        # Normalize SHAP's output shape across library versions.
        array = np.asarray(shap_values)

        if array.ndim == 3:
            contributions = array[0, :, -1]
        elif array.ndim == 2:
            contributions = array[0]
        else:
            contributions = array.reshape(-1)

        result = {
            name: float(value)
            for name, value in zip(FEATURES, contributions)
        }

        model_result = predict_with_model(data)

        return {
            "method": "SHAP LinearExplainer",
            "feature_contributions": result,
            **model_result,
            "note": (
                "Feature contributions explain model output; "
                "they do not establish medical causality."
            ),
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Explanation generation failed: {exc}",
        ) from exc


# ---------------------------------------------------------
# Federated learning status
# ---------------------------------------------------------


@app.get("/federated/status")
def federated_status():
    return {
        "status": "Federated Learning system is running",
        "clients": 15,
        "privacy": "Check implementation",
        "aggregation": "Weighted Aggregation",
    }


# ---------------------------------------------------------
# Federated training endpoint
# ---------------------------------------------------------


@app.post("/federated/train")
def federated_train(request: FederatedTrainRequest):
    """
    This endpoint deliberately does not claim to train a model.

    Connect your existing real federated training implementation
    here before presenting training as completed.
    """
    raise HTTPException(
        status_code=501,
        detail=(
            "Federated training implementation is not connected in this "
            "standalone backend file. Connect your existing training "
            "pipeline before using this endpoint."
        ),
    )
