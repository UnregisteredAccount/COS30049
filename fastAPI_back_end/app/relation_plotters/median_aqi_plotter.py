import pandas as pd
import matplotlib.pyplot as plt

class median_aqi_plotter:
    
    def __init__(self, pollutant):
        self.dataframe = pd.read_csv("./data/australia_air_quality_pollutant_aqi.csv")
        self.dataframe.dropna(inplace = True)
        self.y_target = "AQI"     # Dependant
        self.x_target = "median"  # Independant
        self.x = None
        self.y = None
        self.slope = None
        self.intercept = None
        self.r = None
        self.p = None
        self.std_err = None
        self.model = None

    # Sets new pollutant type
    def set_pollutant(self, pollutant):
        self.pollutant = pollutant

    def compute(self):
        # Loops through each city under the 'City' column in the dataset
        for city in self.dataframe["City"].unique():
            if (self.pollutant != "all"):
                city_data = self.dataframe[(self.dataframe["City"] == city) & (self.dataframe["Pollutant"] == self.pollutant)]
            else:
                city_data = self.dataframe[(self.dataframe["City"] == city)]

            # Extract x and y values for regression, and returns filtered data
            self.x = city_data[self.x_target]
            print (self.x)
            self.y = city_data[self.y_target]
            print (self.y)

            return city_data

    def plot(self):
        for city in self.dataframe["City"].unique():
            # Plot predicted vs actual values
            plt.figure()
            plt.scatter(self.x, self.y, color='blue', label='Data Points')
            #plt.plot(self.dataframe[self.x_target], self.model, color='red', label='Regression Line')
            plt.xlabel(self.x_target)
            plt.ylabel(self.y_target)
            plt.title(f"Linear Regression: {self.y_target} vs {self.x_target}")
            plt.legend()
            plt.grid(True)
            
            # Save before show
            plt.savefig(f"./results/plots/linear_regression/linear_{city}_{self.pollutant}_median_to_aqi.png", dpi=300, bbox_inches='tight')
            plt.close()
            print(f"✅ Plot saved to results/plots/linear_regression/linear_{city}_{self.pollutant}_median_to_aqi.png")



    
