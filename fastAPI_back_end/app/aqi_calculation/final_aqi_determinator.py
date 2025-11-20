import pandas as pd
from pathlib import Path

MAIN_PATH = Path("app")

class final_aqi_determinator:

    def __init__(self):
        datapath = MAIN_PATH / "data" / "australia_air_quality_pollutant_aqi.csv"
        self.filepath = datapath
        self.dataframe = pd.read_csv(self.filepath)
        self.outputframe = None

    def determine(self, text):
        self.dataframe['Date'] = pd.to_datetime(self.dataframe['Date'], dayfirst=True)

        # Drops rows with missing AQI before grouping
        df_valid = self.dataframe.dropna(subset=['AQI'])

        # Gets index of max AQI per (Date, City)
        max_aqi_indices = df_valid.groupby(["Date", "City"])["AQI"].idxmax().dropna().astype(int)

        # Selects rows with highest AQI per group
        self.outputframe = (
            self.dataframe.loc[max_aqi_indices]
            [["Date", "City", "AQI", "Rounded AQI"]]
            .rename(columns={"AQI": "Highest AQI"})
            .reset_index(drop=True)
        )

        # Sorts the outputframe by date
        ascending = text != "descending"
        self.outputframe = self.outputframe.sort_values(by='Date', ascending=ascending)

    # Saves the updated dataframe to a .csv file while printing the results
    def save(self):
        print(self.outputframe.shape)
        filename = MAIN_PATH / "data" / "australia_air_quality_final_aqi.csv"
        self.outputframe.to_csv(filename, index=False)
        print(f"Results saved to {filename}")
