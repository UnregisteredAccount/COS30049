**💨 Air Quality Analysis and Prediction Model Toolkit**
This project integrates multiple machine learning models—Linear Regression, Random Forest, and Decision Tree—to predict air pollutant statistics, estimate pollutant medians, and classify AQI severity for a given city and pollutant. The pipeline is designed to process air quality data and generate step-by-step predictions saved as CSV files. 

This project features a comprehensive collection of classes to assist in gauging the air quality in australia. Each class has its own distinct objective, ranging from AQI computation and visualization, to machine learning-based forecasting. Depending on their main objective, classes also contain methods of producing relevant output or results in the form of .png plots or .csv files. The modular class-based architecture makes the codebase highly organized, extensible, and easy to maintain. The classes provided are also easily customizable; they can be tailored to follow specific needs and can be easily implemented into other projects, and can be used with different datasets, so long as the data in those datasets are formatted according to datasets (.csv) used in the project. 

**🗂️ Project Structure**
.
├── aqi_calculation/
│   └── final_aqi_determinator.py                   # Max AQI determinator (Optional)
│   └── pollutant_aqi_calculator.py                 # Used to generate .csv to train Decision Tree Model
├── combined_model/
│   └── combined_model.py 
├── data/                                           # Stores data
├── decision_tree/
│   └── decision_tree_aqi_severity.py 
├── evaluation/
│   └── evaluator.py
├── linear_regression/
│   └── linear_regression_pollutant_predictor.py
├── models/                                         # Stores models
├── predictions/
│   └── combined_model/                             # Stores combined model predictions
├── random_forest/
│   └── random_forest_pollutant_median.py
├── relation_plotters/
│   └── median_aqi_plotter.py                       # Plots max AQI against median (Optional)
├── results/                                        # Mostly for Testing, as main output is stored in predictions/combined_model/ to support main functionaility
│   └── csvs/
│       └── decision_tree/
│       └── linear_regression/
│       └── random_forest/
│   └── plots/
│       └── decision_tree/
│       └── linear_regression/
│       └── random_forest/
│   └── predictions/
│       └── decision_tree/
│       └── random_forest/
│   └── txt/
│       └── decision_tree/
├── test.py                                         # For testing purposes
├── README.md
└── main.py

**📝 Features**
Classes in the project allow for:

    AQI Calculation: Computes AQI values from pollutant data and determines final AQI rankings.

    Visualization: Plots AQI against pollutant medians.

    Linear Regression: Predicts pollutant medians

    Random Forest: Predicts pollutant medians

    Decision Tree: AQI severity classification (based on non-AQI calculated data)

    Evaluation: Custom evaluator class is used to evaluate models

Model workings are based on select city(**Example: Sydney**) and pollutant fields(**co, no2, o3, so2, pm2.5, pm10, and 'all' pollutants**).
   
Results are saved into organized folders, of which includes .csv and .png files (.txt for classification report of decision tree model).

The **main functionality** of the project is defined in the **combined_model class** that utilizes a sequence of Linear Regression, Random Forest, and Decision Tree to predict values from just a date, city and pollutant of choice. 

**🤖 Setting Up the environment**
There are multiple ways to set up the environment and run the main program (do replace venv_name with the name of your choosing for your virtual environment):

**🐍 1. Conda**

```bash
conda --version                                                 # Make sure conda is installed (Either Anaconda or Miniconda)

conda create --name venv_name python=3.13.7                     # Ceate a virtual environment with python 3.13.7 (recommended)

conda activate venv_name                                        # Activate virtual environment

conda install pandas scikit-learn matplotlib numpy joblib tqdm  #Install Necessary Libraries using conda 
#or 
pip install pandas scikit-learn matplotlib numpy joblib tqdm    #Install Necessary Libraries using PIP 
```

```bash
python main.py      # To run the combine_model via the "main" program   
```

```bash
conda deactivate    # Remember to deactivate the virtual environment when you are done
```
---

**🔧 2. Terminal PIP**

```bash
python --version                                                # Make sure python is installed (Recommended: version 3.13.7)

python -m venv venv_name                                        # Ceate a virtual environment

venv_name\Scripts\activate                                      # Activate the Virtual Environment (Windows)
#or
source venv_name/bin/activate                                   # Activate the Virtual Environment (macOS/Linux)

pip install pandas scikit-learn matplotlib numpy joblib tqdm    #Install Necessary Libraries using PIP
```

```bash
python main.py      # To run the combine_model via the "main" program   
```

```bash
deactivate          # Remember to deactivate the virtual environment when you are done
```
---

**ᯓ Running the Combined Model**
As mentioned before, each class can be created and methods can be called according to the needs of the user (such as in the **test.py** file).

However, an example of the functioning code can be seen in the **main.py** file. 

One is able to declare new filepaths for training data in the construction of new model objects based on the classes.  

**📁 Output Files**
After the main program execution, the following files will be saved in ./predictions/combined_model/:

    City_step1_lr.csv: Output after Linear Regression

    City_step2_rf.csv: Output after Random Forest

    City_step3_dt_final_combined.csv: Final output with AQI severity classification, which is also the main output file.

**📌 Notes**
Input CSV must contain columns like Date, City, Pollutant, and pollutant values.

The Decision Tree model expects a predefined set of pollutants for AQI classification.

Intermediate files are useful for debugging and model evaluation.



