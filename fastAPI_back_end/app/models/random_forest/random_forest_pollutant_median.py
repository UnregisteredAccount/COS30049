import os
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np # Import numpy for non-negative constraint
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from app.evaluation.evaluator import evaluator
from pathlib import Path

MAIN_PATH = Path("app")

class random_forest_pollutant_median:

    DATA_PATH = MAIN_PATH / "data" / "australia_air_quality.csv"

    def __init__(self, pollutant, filepath = DATA_PATH):
        self.filepath = filepath
        self.df = pd.read_csv(self.filepath)
        self.df.dropna(inplace=True)
        # Features used to predict median: summary statistics of the time series
        self.features = ["count", "min", "max", "variance"]
        self.target = "median"
        self.results = [] # Store evaluation results
        self.pollutant = pollutant
        self.models = {} # Dictionary that stores trained models for each city

        # Removing Outliers using IQR (applied globally for simplicity)
        numeric_cols = self.features + [self.target]
        Q1 = self.df[numeric_cols].quantile(0.25)
        Q3 = self.df[numeric_cols].quantile(0.75)
        IQR = Q3 - Q1
        self.df = self.df[~((self.df[numeric_cols] < (Q1 - 1.5 * IQR)) | (self.df[numeric_cols] > (Q3 + 1.5 * IQR))).any(axis=1)]

    # Filters data for specified city and pollutant
    def process_city(self, city):
        if self.pollutant == "all":
            city_data = self.df[self.df["City"] == city]
        else:
            city_data = self.df[(self.df["City"] == city) & (self.df["Pollutant"] == self.pollutant)]

        # Skip cities with insufficient data
        if len(city_data) < 5:
            print(f"Skipping {city} - not enough data for pollutant '{self.pollutant}'")
            return
        
        # Extract features and target variables
        X = city_data[self.features]
        y = city_data[self.target]

        # Split train and test data for model evaluation and training
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Initialize and train Random Forest Regressor
        rf = RandomForestRegressor(n_estimators=100, random_state=42)
        rf.fit(X_train, y_train)
        y_pred = rf.predict(X_test)

        # Store trained models for future use
        self.models[city] = rf

        # Evaluate predictions using evaluator class
        eval = evaluator(y_test, y_pred)
        r2, mae, rmse = eval.evaluate_regression()

        # Store evaluation metrics
        self.results.append({
            "City": city,
            "Pollutant": self.pollutant,
            "RF_R2": r2,
            "RF_MAE": mae,
            "RF_RMSE": rmse
        })

        # Generate and save plot
        # self.plot(city, y_test, y_pred)

    # Predicts median values for new data using trained models
    def predict(self, city, dataframe):
        if city not in self.models:
            print(f"No trained model found for {city}. Please run compute() first.")
            return pd.DataFrame() # Return empty DataFrame on error

        try:
            # Create a copy of the input DataFrame to ensure safety
            new_data = dataframe.copy() 
        except Exception as e:
            print(f"Error processing input data: {e}")
            return pd.DataFrame() # Return empty DataFrame on error

        # Check for required feature columns
        missing_cols = [col for col in self.features if col not in new_data.columns]
        if missing_cols:
            print(f"Missing required columns in input data: {missing_cols}")
            return pd.DataFrame() # Return empty DataFrame if features are missing

        # Make predictions
        model = self.models[city]
        prediction = model.predict(new_data[self.features])
        
        # --- CRITICAL FIX FOR NON-NEGATIVE PREDICTION ---
        # The median of a pollutant concentration cannot be negative.
        # We use np.maximum to ensure all predictions are clamped to a minimum of 0.
        prediction = np.maximum(0, prediction) # 
        # --- END FIX ---
        
        # Add the results to DataFrame
        new_data["median"] = prediction
        return new_data

# Plots scatter plot of actual vs predicted median values
    def plot(self, city, y_test, y_pred):
        plt.figure()
        plt.scatter(y_test, y_pred, color='green', alpha=0.6)
        plt.xlabel("Actual Median Values")
        plt.ylabel("Predicted Median Values")
        plt.title(f"Random Forest Regression - {city} ({self.pollutant})")
        plt.grid(True)

        dynamic_filepath = f"plots/random_forest/{city}"
        filepath = MAIN_PATH / dynamic_filepath
        dynamic_filename = f"randomForest_{city}_{self.pollutant}.png"
        filename = filepath / dynamic_filename

        # Save plot as .png
        os.makedirs(filepath, exist_ok=True)
        plt.savefig(filename, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Saved plot: {filename}")

    # Saves evaluation results to .csv
    def save(self):
        results_df = pd.DataFrame(self.results)
        print("\nRandom Forest Regression Results:")
        print(results_df)

        dynamic_filepath = f"random_forest/{self.pollutant}"
        filepath = MAIN_PATH / "evaluation" / dynamic_filepath
        dynamic_filename = f"random_forest_of_{self.pollutant}_pollutant_median_results_in_australian_cities.csv"
        filename = filepath / dynamic_filename
    
        os.makedirs(filepath, exist_ok=True)  
        results_df.to_csv(filename, index=False)
        print(f"Results saved to {filename}")

    # Runs regression for each city and save results
    def compute(self):
        for city in self.df["City"].unique():
            self.process_city(city)
        # self.save()   