# FOR TESTING PURPOSES

import os
import pandas as pd

# Import AQI calculation models
from aqi_calculation.pollutant_aqi_calculator import pollutant_aqi_calculator
from aqi_calculation.final_aqi_determinator import final_aqi_determinator

# Import visualization model for AQI against median
from relation_plotters.median_aqi_plotter import median_aqi_plotter

# Import models
from linear_regression.linear_regression_pollutant_predictor import linear_regression_pollutant_predictor
from random_forest.random_forest_pollutant_median import random_forest_pollutant_median
from decision_tree.decision_tree_aqi_severity import decision_tree_aqi_severity

# Calculates AQI values
def aqi_calculation():
    aqi_calc = pollutant_aqi_calculator()
    aqi_calc.calculate()
    aqi_calc.save()
    aqi_det = final_aqi_determinator()
    aqi_det.determine("ascending")
    aqi_det.save()

# Trains and evaluates Decision Tree model for AQI severity classification, and returns the model
def aqi_severity_classification():
    model = decision_tree_aqi_severity()
    model.prepare_data()
    model.train_tree()
    model.show_rules()
    model.show_severity_distribution()
    model.plot()
    model.tune_depth()
    model.save()
    return model

# Main program begins here
def main():

    # List of pollutants (by code in .csvs)
    POLLUTANT = ["co", "no2", "o3", "so2", "pm2.5", "pm10", "all"]

    aqi_calculation()

    #median2aqi = median_aqi_plotter("")

    # ----Linear Regression of Predicting count, variance, min and max from Date and City and Pollutant----
    lrm = linear_regression_pollutant_predictor()
    lrm.compute()
        
    # show the capability of each model for different pollutants:
    for pollutant in POLLUTANT:

        # ----AQI Plotted Against Median----
        #median2aqi.set_pollutant(pollutant)
        #median2aqi.compute()
        #median2aqi.plot()

        # ----Random Forest of Predicted Median vs Actual Median
        rf = random_forest_pollutant_median(pollutant)
        rf.compute()
    
    # Pollutant and City for testing model functionality 
    poltest = "pm2.5"
    citytest = "Sydney"
    
    # Random Forest prediction testing
    rf_model = random_forest_pollutant_median(poltest)
    rf_model.process_city(citytest)  # Train the model
    rf_predicted_median = rf_model.predict(citytest, "data/australia_air_quality.csv")
    os.makedirs("results/predictions/random_forest", exist_ok=True)
    rf_predicted_median.to_csv(f"results/predictions/random_forest/predicted_median_{citytest}_{poltest}.csv", index=False)
    print(f"/n Random Forest predictions saved to results/predictions/random_forest/predicted_{citytest}_{poltest}.csv")

    # Decision Tree prediction testing
    decision_tree = aqi_severity_classification()
    data = pd.read_csv("data/australia_air_quality.csv") 
    pivot = data.pivot_table(index=['Date', 'City'], columns='Pollutant', values='median', aggfunc='mean').reset_index() # Prepare input data similar to within the decision_tree class
    new_data = pivot[decision_tree.pollutants]
    pivot['Predicted_AQI_Severity'] = decision_tree.clf.predict(new_data) # Predict severity class
    pivot.columns.name = None
    filtered_output = pivot[['Date', 'City', 'Predicted_AQI_Severity']]
    os.makedirs("results/predictions/decision_tree", exist_ok=True)
    filtered_output.to_csv("results/predictions/decision_tree/predicted_severity_aqi_output.csv", index=False)
    print("/nDecision Tree predictions saved to results/predictions/decision_tree/predicted_severity_aqi_output.csv")

# Entry point
if __name__ == "__main__":
    main()