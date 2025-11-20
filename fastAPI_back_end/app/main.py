import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path

# Set the MAIN_PATH environment variable for the combined_model to use
# The model will save its CSV output to 'app/data/combined_model'
os.environ['MAIN_PATH'] = str(Path("./models").parent) 

# Import the core model logic
from .models.combined_model.combined_model import combined_model

class PredictionRequest(BaseModel):
    date: str     # e.g., "2025-10-14"
    city: str     # e.g., "Sydney"
    pollutant: str  # e.g., "pm2.5"

app = FastAPI(
    title="Air Quality Prediction Service",
    description="A service for combining predictions from various AQI models.",
    version="1.0.0"
)

origins = ["*"] 

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Allows specific origins
    allow_credentials=True, # Allows cookies to be included in cross-origin requests
    allow_methods=["*"], # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"], # Allows all headers
)

try:
    print("Initializing global combined model...")
    global_combined_model = combined_model()
    print("Combined model initialized successfully.")
except Exception as e:
    # If the model fails to load, raise an alert but allow the app to technically start
    print(f"CRITICAL ERROR: Failed to initialize combined_model: {e}")
    global_combined_model = None
    
@app.get("/")
def read_root():
    """Provides a basic welcome message and API status."""
    return {
        "title": app.title,
        "version": app.version,
        "documentation_url": "/docs",
        "status": "Running",
        "model_loaded": global_combined_model is not None
    }

@app.post("/predict")
async def get_prediction(request: PredictionRequest):
    
    if global_combined_model is None:
        raise HTTPException(
            status_code=503,
            detail="Model service is unavailable due to a startup error."
        )

    try:
        # Call the compute method on the globally initialized model instance
        # The modified combined_model.py now returns the result as a list of dicts.
        prediction_result = global_combined_model.compute(
            request.date, 
            request.city, 
            request.pollutant
        )
        
        if prediction_result:
            return {
                "message": "Prediction computed successfully and CSV saved.",
                "data": prediction_result[0] # Assuming only one row of prediction is returned
            }
        else:
            raise HTTPException(status_code=404, detail="No prediction data generated.")

    except Exception as e:
        # Catch any runtime errors from the compute logic
        print(f"Runtime computation error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Prediction computation failed due to internal error: {e}"
        )

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": global_combined_model is not None}