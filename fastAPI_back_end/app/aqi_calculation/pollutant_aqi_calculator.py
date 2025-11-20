import pandas as pd
from pathlib import Path

MAIN_PATH = Path("app")

class pollutant_aqi_calculator:
    # Concentration Breakpoints Constants (https://www.der.wa.gov.au/your-environment/air/air-quality-index)
    CONCENTRATION_BREAKPOINTS = {
        "co": [0, 6, 9, 13.5, 18, float('inf')],
        "no2": [0, 80, 120, 180, 240, float('inf')],
        "o3": [0, 67, 100, 150, 200, float('inf')],
        "pm10": [0, 50, 100, 200, 600, float('inf')],
        "pm2.5": [0, 25, 50, 100, 300, float('inf')],
        "so2": [0, 133, 200, 300, 400, float('inf')]
    }

    # AQI Breakpoints Constant
    # 200 is the max; Everything above 200 is an 'Extremely Poor' AQI Index (https://soe.dcceew.gov.au/air-quality/about-chapter/approach)
    AQI_BREAKPOINTS = [0, 33, 66, 99, 149, 200] 

    DATAPATH = MAIN_PATH / "data" / "australia_air_quality.csv"

    def __init__(self, datapath = DATAPATH):
        # Load data from .csv into dataframe
        self.filepath = datapath
        self.dataframe = pd.read_csv(self.filepath)

    # Calculate AQI using Concentration Level and Pollutant Name
    @staticmethod
    def calculate_aqi(concentration, pollutant):
        # Retrieve concentration breakpoints for the given pollutant
        c_breakpoints = pollutant_aqi_calculator.CONCENTRATION_BREAKPOINTS[pollutant]
        
        aqi_breakpoints = pollutant_aqi_calculator.AQI_BREAKPOINTS  
        
        # Iterates through the concentration breakpoints and find a matching range for the pollutant concentration value
        for i in range(len(c_breakpoints) - 1):
            Clow, Chigh = c_breakpoints[i], c_breakpoints[i + 1]
            Ilow, Ihigh = aqi_breakpoints[i], aqi_breakpoints[i + 1]

            # Checks if concentration is within the current range
            if (Clow <= concentration < Chigh):
                # Handle case where AQI is constant (e.g., c_break == inf)
                if (Ilow == Ihigh):
                    return Ihigh
                # Calculate AQI using formula 
                aqi = ((Ihigh - Ilow) / (Chigh - Clow)) * (concentration - Clow) + Ilow
                return aqi
        
        # If concentration exceeds the last range, return the maximum AQI of 200
        return aqi_breakpoints[-1]  

    def calculate(self):
        # Converts 'Date's to pd "datetime"
        self.dataframe['Date'] = pd.to_datetime(self.dataframe['Date'], dayfirst=True)
        self.dataframe['AQI'] = None
        self.dataframe['Rounded AQI'] = None

        # Iterates through each data row to compute AQI
        for index, row in self.dataframe.iterrows():
            pollutant = row['Pollutant']
            median = row['median']

            # Ensures valid concentration and pollutant type before calculation
            if pd.notna(median) and pollutant in pollutant_aqi_calculator.CONCENTRATION_BREAKPOINTS:
                aqi = pollutant_aqi_calculator.calculate_aqi(median, pollutant)
                self.dataframe.at[index, 'AQI'] = aqi
                self.dataframe.at[index, 'Rounded AQI'] = round(aqi)

    # Changse the csv used to calculate
    def change_csv(self, filepath):
        self.filepath = filepath
        self.dataframe = pd.read_csv(self.filepath)
    
    # Prints the dataframe and its shape to terminal
    def show_dataframe(self):
        print(self.dataframe)
        print(self.dataframe.shape)
        
    # Saves the updated dataframe to a .csv file while printing the results
    def save(self):   
        filename = MAIN_PATH / "data" / "australia_air_quality_pollutant_aqi.csv"
        self.dataframe.to_csv(filename, index=False)
        print(f"Results saved to {filename}")

# Standalone Calculation Method

CONCENTRATION_BREAKPOINTS = {
        "co": [0, 6, 9, 13.5, 18, float('inf')],
        "no2": [0, 80, 120, 180, 240, float('inf')],
        "o3": [0, 67, 100, 150, 200, float('inf')],
        "pm10": [0, 50, 100, 200, 600, float('inf')],
        "pm2.5": [0, 25, 50, 100, 300, float('inf')],
        "so2": [0, 133, 200, 300, 400, float('inf')]
    }

AQI_BREAKPOINTS = [0, 33, 66, 99, 149, 200] 

def calculate_aqi(concentration, pollutant):
    # Retrieve concentration breakpoints for the given pollutant
    c_breakpoints = pollutant_aqi_calculator.CONCENTRATION_BREAKPOINTS[pollutant]
    
    aqi_breakpoints = pollutant_aqi_calculator.AQI_BREAKPOINTS  
    
    # Iterates through the concentration breakpoints and find a matching range for the pollutant concentration value
    for i in range(len(c_breakpoints) - 1):
        Clow, Chigh = c_breakpoints[i], c_breakpoints[i + 1]
        Ilow, Ihigh = aqi_breakpoints[i], aqi_breakpoints[i + 1]

        # Checks if concentration is within the current range
        if (Clow <= concentration < Chigh):
            # Handle case where AQI is constant (e.g., c_break == inf)
            if (Ilow == Ihigh):
                return Ihigh
            # Calculate AQI using formula 
            aqi = ((Ihigh - Ilow) / (Chigh - Clow)) * (concentration - Clow) + Ilow
            return aqi
    
    # If concentration exceeds the last range, return the maximum AQI of 200
    return aqi_breakpoints[-1]  