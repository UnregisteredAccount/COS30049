import os
import pandas as pd
from pathlib import Path

# Import models
from app.models.linear_regression.linear_regression_pollutant_predictor import linear_regression_pollutant_predictor
from app.models.random_forest.random_forest_pollutant_median import random_forest_pollutant_median
from app.models.decision_tree.decision_tree_aqi_severity import decision_tree_aqi_severity
from app.aqi_calculation.pollutant_aqi_calculator import calculate_aqi, CONCENTRATION_BREAKPOINTS

MAIN_PATH = Path("app")

class combined_model:

    def __init__(self):
        # Initialize model instances for Linear Regression and Random Forest models
        self.lr_model = None
        self.rf_model = None
        self.dt = decision_tree_aqi_severity()
        self.dt.prepare_data()
        self.dt.tune_depth()
        self.dt.train_tree()
        self.dt_model = self.dt

    def compute(self, date, city, pollutant):
        # Load original input
        try: 
            data = {
                'Date': [date],
                'City': [city],
                'Pollutant': [pollutant] 
            }
            df = pd.DataFrame(data)
        except Exception as e:
            print(f"Error processing data: {e}")
            return None
        # Train and predict using Linear Regression
        self.lr_model = linear_regression_pollutant_predictor()
        self.lr_model.compute()
        self.lr_model.process_city(city)
        lr_predictions = self.lr_model.predict(city, df)

        # Append Linear Regression predictions to original data
        for col in ['count', 'variance', 'min', 'max']:
            if col in lr_predictions.columns:
                df[col] = lr_predictions[col]

        # Train and predict using Random Forest
        self.rf_model = random_forest_pollutant_median(pollutant)
        self.rf_model.compute()
        self.rf_model.process_city(city)
        rf_predictions = self.rf_model.predict(city, df)

        # Append Random Forest median prediction to data
        if 'median' in rf_predictions.columns:
            df['median'] = rf_predictions['median']

        #Calculate Rounded AQI
        if 'median' in df.columns and pollutant in CONCENTRATION_BREAKPOINTS:
            # Since the input 'df' only has one row, we can access the value directly
            median_concentration = df['median'].iloc[0]
            
            # Calculate the raw AQI using the imported static method
            aqi = calculate_aqi(median_concentration, pollutant)
            
            # Append AQI and Rounded AQI to the DataFrame
            df['AQI'] = aqi
            df['Rounded_AQI'] = round(aqi)
        else:
            # Set to None if prediction failed or pollutant is invalid
            df['AQI'] = None
            df['Rounded_AQI'] = None

        # Prepare pivot for AQI severity
        pivot = df.pivot_table(index=['Date', 'City'], columns='Pollutant', values='median', aggfunc='mean').reset_index()
        for p in self.dt_model.pollutants:
            if p not in pivot.columns:
                pivot[p] = 0
        input_data = pivot[self.dt_model.pollutants]
        pivot['AQI_Severity'] = self.dt_model.clf.predict(input_data)

        # Merge severity back
        severity_map = pivot.set_index(['Date', 'City'])['AQI_Severity']
        df['AQI_Severity'] = df.set_index(['Date', 'City']).index.map(severity_map)

        # Final output
        filepath = MAIN_PATH / "data/combined_model/"
        dynamic_file_name = f"{city}_step3_dt_final_combined.csv"
        filename = filepath / dynamic_file_name

        os.makedirs(filepath, exist_ok=True)
        df.to_csv(filename, index=False)
        print(f"Final combined predictions saved to {filename}")

        return df.to_dict('records')

