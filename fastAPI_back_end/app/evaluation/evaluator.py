from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import numpy as np
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

class evaluator:

    def __init__(self, y_test, y_pred):
        self.y_test = y_test
        self.y_pred = y_pred

    # Different metrics of evaluation designed for the decision tree
    def evaluate_decision_tree(self):
        accuracy = accuracy_score(self.y_test, self.y_pred)
        precision = precision_score(self.y_test, self.y_pred, average='weighted')
        recall = recall_score(self.y_test, self.y_pred, average='weighted')
        f1 = f1_score(self.y_test, self.y_pred, average='weighted')
        confusion = confusion_matrix(self.y_test, self.y_pred)
        classification = classification_report(self.y_test, self.y_pred)

        return accuracy, precision, recall, f1, confusion, classification

    # Different metrics of evaluation designed for continuous data regression
    def evaluate_regression(self):
        r2 = r2_score(self.y_test, self.y_pred)
        mae = mean_absolute_error(self.y_test, self.y_pred)
        rmse = np.sqrt(mean_squared_error(self.y_test, self.y_pred))

        return r2, mae, rmse

    # Sets new target testing and predicted values for evaluation
    def set(self, y_test, y_pred):
        self.y_test = y_test
        self.y_pred = y_pred