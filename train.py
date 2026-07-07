# train.py
import numpy as np
from models import rf_params, dt_params, knn_params, lr_params, svc_params, xgb_params, evaluate_classifier
from preprocess import load_data
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split


# Train and evaluate classifiers
data = load_data()
X, y = data.drop('Diagnosis', axis=1), data['Diagnosis']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
evaluate_classifier(RandomForestClassifier(), rf_params, X_train, y_train, X_test, y_test, 'RF_results.txt')
evaluate_classifier(DecisionTreeClassifier(), dt_params, X_train, y_train, X_test, y_test, 'DT_results.txt')
evaluate_classifier(KNeighborsClassifier(), knn_params, X_train, y_train, X_test, y_test, 'KNN_results.txt')
evaluate_classifier(LogisticRegression(), lr_params, X_train, y_train, X_test, y_test, 'LR_results.txt')
evaluate_classifier(SVC(), svc_params, X_train, y_train, X_test, y_test, 'SVC_results.txt')
evaluate_classifier(XGBClassifier(), xgb_params, X_train, y_train, X_test, y_test, 'XGB_results.txt')
