import os
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.pipeline import make_pipeline
import joblib
from tqdm import tqdm
from app.evaluation.evaluator import evaluator
from pathlib import Path

MAIN_PATH = Path("app")

class linear_regression_pollutant_predictor:

    DATA_PATH = MAIN_PATH / "data" / "australia_air_quality.csv"

    def __init__(self, filepath = DATA_PATH):
        self.filepath = filepath
        self.df = pd.read_csv(self.filepath)
        self.df.dropna(inplace=True)
        self.targets = ["count", "variance", "min", "max"]
        self.models = {}
        self.results = []
        self.selected_pollutants = ["co", "no2", "o3", "so2", "pm2.5", "pm10"]

        # Convert date to datetime and extract features
        self.df["Date"] = pd.to_datetime(self.df["Date"])
        self.df["dayofyear"] = self.df["Date"].dt.dayofyear
        self.df["year"] = self.df["Date"].dt.year
        self.df["month"] = self.df["Date"].dt.month
        self.df["weekday"] = self.df["Date"].dt.weekday

        # One-hot encode pollutant
        pollutant_dummies = pd.get_dummies(self.df["Pollutant"], prefix="pollutant")
        self.df = pd.concat([self.df, pollutant_dummies], axis=1)

        # Final feature list
        self.features = ["dayofyear", "year", "month", "weekday"] + list(pollutant_dummies.columns)

        # Remove outliers using IQR
        numeric_cols = self.targets
        Q1 = self.df[numeric_cols].quantile(0.25)
        Q3 = self.df[numeric_cols].quantile(0.75)
        IQR = Q3 - Q1
        self.df = self.df[~((self.df[numeric_cols] < (Q1 - 1.5 * IQR)) | (self.df[numeric_cols] > (Q3 + 1.5 * IQR))).any(axis=1)]

    def process_city(self, city):
        city_data = self.df[self.df["City"] == city]

        for target in self.targets:
            X = city_data[self.features]
            y = city_data[target]

            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            model = make_pipeline(StandardScaler(), PolynomialFeatures(degree=2), LinearRegression())
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)

            self.models[f"{city}_{target}"] = model

            eval = evaluator(y_test, y_pred)
            r2, mae, rmse = eval.evaluate_regression()

            self.results.append({
                "City": city,
                "Target": target,
                "Linear_R2": r2,
                "Linear_MAE": mae,
                "Linear_RMSE": rmse
            })

            dynamic_model_name = f"{city}_{target}.pkl"
            model_path = MAIN_PATH / "models"
            model_file_path = model_path / dynamic_model_name
            os.makedirs(model_path, exist_ok=True)
            joblib.dump(model, model_file_path)


    def predict(self, city, dataframe):
        try:
            new_data = dataframe.copy() # Use .copy() for safety
            new_data = new_data[new_data["Pollutant"].isin(self.selected_pollutants)]
            new_data["Date"] = pd.to_datetime(new_data["Date"])
            # ... (date feature extraction remains the same) ...
            new_data["dayofyear"] = new_data["Date"].dt.dayofyear
            new_data["year"] = new_data["Date"].dt.year
            new_data["month"] = new_data["Date"].dt.month
            new_data["weekday"] = new_data["Date"].dt.weekday

            # One-hot encode pollutant
            pollutant_dummies = pd.get_dummies(new_data["Pollutant"], prefix="pollutant")
            new_data = pd.concat([new_data, pollutant_dummies], axis=1)

            # Ensure all expected columns are present
            for col in self.features:
                if col not in new_data.columns:
                    new_data[col] = 0  # Fill missing dummy columns with 0
        except Exception as e:
            # Returning an empty DataFrame on error is safer than returning None
            print(f"Error reading or processing CSV file: {e}")
            return pd.DataFrame() 

        for target in self.targets:
            key = f"{city}_{target}"
            if key not in self.models:
                print(f"No trained model for {key}")
                continue

            dynamic_model_name = f"{city}_{target}.pkl"
            model_file_path = MAIN_PATH / "models" / dynamic_model_name

            if not os.path.exists(model_file_path):
                print(f"Model file not found for {key}")
                continue
            
            # Load the model
            model = joblib.load(model_file_path)

            # 1. CALCULATE PREDICTIONS
            predictions = model.predict(new_data[self.features])

            # 2. CLAMP IF TARGET IS VARIANCE
            if target == "variance":
                # np.maximum checks the entire array and replaces negative values with 0
                predictions = np.maximum(0, predictions)

            # 3. ASSIGN THE FINAL RESULT
            new_data[f"{target}"] = predictions

        return new_data

    # Plotting slows processing severly, not recommended unless one has plenty of time
    def plot(self, city, target, y_test, y_pred):
        plt.figure()
        plt.scatter(y_test, y_pred, color='purple', alpha=0.6)
        plt.xlabel(f"Actual {target}")
        plt.ylabel(f"Predicted {target}")
        plt.title(f"{target} Prediction - {city}")
        plt.grid(True)

        dynamic_plot_name = f"linear_{city}_{target}.png"
        plot_path = MAIN_PATH / "plots"
        dynamic_plot_path = f"linear_regression/{city}"

        filepath = plot_path / dynamic_plot_path
        os.makedirs(filepath, exist_ok=True)
        filename = filepath / dynamic_plot_name
        plt.savefig(filename, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Saved plot to {filename}")

    def save(self):
        results_df = pd.DataFrame(self.results)
        print("\nLinear Regression Results:")
        print(results_df)

        output_csv_name = "linear_regression_pollutant_targets_from_date_and_type.csv"
        filepath = MAIN_PATH / "output_csvs" / "linear_regression"
        filename = filepath / output_csv_name

        os.makedirs(filepath, exist_ok=True)
        results_df.to_csv(filename, index=False)
        print(f"Results saved to {filename}")

    def export_summary_csv(self):
        columns_to_export = ["Date", "City", "Pollutant", "count", "variance", "min", "max"]
        summary_df = self.df[columns_to_export].copy()

        filename= MAIN_PATH / "data" / "linear_regression_summary_data.csv"

        summary_df.to_csv(filename, index=False)
        print(f"Summary data exported to {filename}")

    def compute(self):
        for city in tqdm(self.df["City"].unique(), desc="Training models"):
            self.process_city(city)
        # self.export_summary_csv()
        # self.save()
