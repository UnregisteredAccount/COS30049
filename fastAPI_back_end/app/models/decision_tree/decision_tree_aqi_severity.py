import os
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.tree import DecisionTreeClassifier, plot_tree, export_text
from sklearn.model_selection import train_test_split
from sklearn.model_selection import GridSearchCV
from sklearn.model_selection import StratifiedShuffleSplit
from app.evaluation.evaluator import evaluator
from pathlib import Path

MAIN_PATH = Path("app")

class decision_tree_aqi_severity:
    
    DATA_PATH = MAIN_PATH / "data" / "australia_air_quality_pollutant_aqi.csv"

    def __init__(self, filepath = DATA_PATH):
        self.filepath = filepath
        self.pollutants = ['co', 'no2', 'o3', 'pm10', 'pm2.5', 'so2']
        self.df = pd.read_csv(self.filepath)
        self.dataset = None
        self.clf = None # Decision tree classifier
        self.grid = None # Grid search object
        self.results = [] # Store evaluation results

    # Maps AQI values to severity categories
    # https://soe.dcceew.gov.au/air-quality/about-chapter/approach
    def classify_severity(self, aqi):
        if aqi <= 32:
            return "1 (Very Good)"
        elif aqi <= 65:
            return "2 (Good)"
        elif aqi <= 98:
            return "3 (Fair)"
        elif aqi <= 148:
            return "4 (Poor)"
        elif aqi <= 199:
            return "5 (Very Poor)"
        else:
            return "6 (Extremely Poor)"

    def prepare_data(self):
        # Pivot pollutant medians to wide format: one row per index (Date and City) with pollutant columns
        pivot_medians = self.df.pivot_table(index=['Date', 'City'], columns='Pollutant', values='median', aggfunc='mean')
        # Get max AQI per  group
        max_aqi = self.df.groupby(['Date', 'City'])['AQI'].max().rename('Max_AQI')
        # Merge pollutant data with AQI values
        self.dataset = pivot_medians.merge(max_aqi, left_index=True, right_index=True).reset_index()
        # Add severity classification
        self.dataset['Severity'] = self.dataset['Max_AQI'].apply(self.classify_severity)

    def train_tree(self, max_depth=4):
        # Prepare features(X) and target(Y)
        X = self.dataset[self.pollutants]
        y = self.dataset['Severity']

        #Stratified Split, which maintains class balance in training and testing sets 
        split = StratifiedShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
        for train_idx, test_idx in split.split(X, y):
            X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
            y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
        
        # Train decision tree with balanced class weights
        self.clf = DecisionTreeClassifier(max_depth=max_depth, class_weight='balanced', random_state=42)
        self.clf.fit(X_train, y_train)
        y_pred = self.clf.predict(X_test)

        # Evaluate predictions using evaluator class
        eval = evaluator(y_test, y_pred)
        accuracy, precision, recall, f1, confusion, classification = eval.evaluate_decision_tree()

        # Store evaluation metrics
        self.results.append({
            "Accuracy Score": accuracy,
            "Precision Score": precision, 
            "Recall Score": recall,
            "F1 Score": f1,
            "Confusion Matrix": confusion,
            "Classification Report": classification,
        })

    # Prints decision tree rules in text format
    def show_rules(self):
        if self.clf:
            tree_rules = export_text(self.clf, feature_names=self.pollutants)
            print("\nDecision Tree Rules:\n")
            print(tree_rules)
        else:
            print("Train the model first using train_tree().")

    # Displays the count of each severity class
    def show_severity_distribution(self):
        print("\nSeverity Class Distribution:")
        print(self.dataset['Severity'].value_counts())

    # Performs grid searching to find the optimal tree depth
    def tune_depth(self, min_depth=2, max_depth=14):
        X = self.dataset[self.pollutants]
        y = self.dataset['Severity']
        param_grid = {'max_depth': list(range(min_depth, max_depth + 1))}
        self.grid = GridSearchCV(DecisionTreeClassifier(random_state=42), param_grid, cv=5)
        self.grid.fit(X, y)
        self.clf = self.grid.best_estimator_
        print(f"\nBest depth from grid search: {self.grid.best_params_['max_depth']}")

    # Plots the trained decision tree
    def plot(self):
        if self.clf is None:
            print("Train the model first using train_tree() or tune_depth().")
            return
        plt.figure(figsize=(20, 10))
        plot_tree(self.clf,
                feature_names=self.pollutants,
                class_names=sorted(self.dataset['Severity'].unique()),
                filled=True,
                rounded=True,
                fontsize=10)
        plt.title("Decision Tree for AQI Severity")

        filepath = MAIN_PATH / "plots" / "decision_tree"
        filename = filepath / "decision_tree_aqi_severity.png"

        os.makedirs(filepath, exist_ok=True)
        plt.savefig(filename, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Saved plot to {filename}")

    # Saves evaluation results to CSV and TXT files
    def save(self):
        if self.clf is None:
            print("Train the model first using train_tree() or tune_depth().")
            return

        print("\nDecision Tree Classification Results:")
        results_df = pd.DataFrame(self.results)

        filepath  = MAIN_PATH / "evaluation" / "decision_tree"
        filename = filepath / "decision_tree_aqi_severity.png"
        filename2 = filepath / "classification_report.txt"

        # Save metrics to CSV
        os.makedirs(filepath, exist_ok=True)
        results_df.to_csv(filename, index=False)
        print(f"Results saved to {filename}")

        # Save classification report to TXT
        classification_report_text = self.results[-1]["Classification Report"]
        with open(filename2, "w") as f:
            f.write(classification_report_text)
        print(f"Classification report saved to {filename2}")