# 🌏 Air Quality Monitoring & Prediction System

This project is a full-stack web application built using React (front-end) and FastAPI (back-end) to visualize air quality data, calculate AQI, and generate pollutant predictions using machine-learning models.

The system provides interactive charts, user input forms, data validation, and real-time API requests to the prediction engine.

Video Link: https://studentnewintiedumy-my.sharepoint.com/:v:/g/personal/j22037392_student_newinti_edu_my/IQC9k2YKbNGUSIQSp3B7YRMfAXr5Gv-Ed9bMdPcqjY2uNcU?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=bACuxV

## Features
**1. User Input Form**

Users can choose any city in Australia

Users can choose pollutant such as PM2.5, PM10, NO₂, SO₂, CO, and O₃.

Clear labels guide users on the required input.

When the form is submitted, the data is sent to the FastAPI backend.

**2. Input Validation**

The front-end performs validation before sending data to the server, prevents the API request until inputs pass validation

This guarantees clean and reliable data for prediction.

**3. Data Visualization**

The application uses D3.js to show:

A Radar Chart

A Bar Chart

A Line Chart

These charts demonstrate a comparison of pollutant AQIs, historical AQI trends and predicted pollutant levels

Charts are responsive and automatically update based on user input and prediction results.

**4. Back-End Prediction API (FastAPI)**

The FastAPI backend:

Receives input values from the front-end (date, city, pollutant)

Loads trained machine-learning model pipeline (consisting of a decision tree, linear regression and random forest model)

Returns predicted pollutant levels and AQI scores

Provides endpoints for prediction

**5. AQI Calculation**

The system computes:

Individual AQI for each pollutant

Overall AQI (highest pollutant AQI)

AQI Category Helper (AUS) colours according to severity categories:https://soe.dcceew.gov.au/air-quality/about-chapter/approach

**6. UI features**

Fully responsive layout (Works on desktop and mobile)

Clean design

Uses FastAPI application (models), dynamic charts, and interactive data views

## 📁 Project Structure
```bash
project/
├── front_end/              
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   └── package.json
└── fastAPI_back_end/          
    ├── app/
    │   ├── api/v1/            
    │   ├── aqi_calculation/   
    │   ├── data/              
    │   ├── evaluation/       
    │   ├── models/            
    │   ├── relation_plotters/ 
    │   ├── output_csvs/
    │   │   └── linear_regression/
    │   ├── plots/
    │   │   └── random_forest/
    │   ├── __init__.py
    │   └── main.py
    ├── requirements.txt
    └── test.py
```
It is worth noting that /plots and /output_csvs have been taken from initial model development stages and are not extensively used as plots and .csv generation has been removed to improve model loading time.

# 🚀 Getting Started

Begin with navigating to your project folder.

## Back-End Setup (FastAPI)

It is recomended to setup a virtual environment to install your dependencies, but do be sure to check if python is installed beforehand:

```bash
python --version  
```

```bash  
python -m venv .venv
.venv\Scripts\activate
```

Install dependencies into your virtual environment:
```bash
pip install fastapi, joblib, matplotlib, numpy, pandas, pydantic, scikit_learn, tqdm, uvicorn
```

## Front-End Setup (React)

```bash
cd front_end/air
npm install
```

## Starting Back-End

To run the FastAPI application, change your project directory to fastAPI_back_end from your project folder:

```bash
cd fastAPI_back_end
```
Next, run the command:

```bash
uvicorn app.main:app --reload
```

or

```bash
python -m uvicorn app.main:app --reload
```

The uvicorn server should be running on **http://localhost:8000**

The docs are open at: **http://localhost:8000/docs**

## Starting Front-End

To run the React web application, change your project directory to front_end/air from your project folder:

```bash
cd front_end/air
```
Next, run the command:

```bash
npm start
```
The web app should be running on **http://localhost:3000**


# 📌 Notes

Make sure FastAPI runs on port 8000 or update the React API_BASE_URL accordingly.

(Recommended) Use a virtual environment for the Python back-end.