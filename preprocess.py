# preprocess.py
import pandas as pd
import numpy as np
from imblearn.over_sampling import SMOTE
from miceforest import ImputationKernel
from sklearn.feature_selection import SelectKBest, f_classif
import matplotlib.pyplot as plt

# Constants
FEATURE_COLUMNS = [
    'Age', 'Gender', 'Total Bilirubin', 'Direct Bilirubin',
    'Alkphos Alkaline Phosphotase', 'Sgpt Alamine Aminotransferase',
    'Sgot Aspartate Aminotransferase', 'Total Protiens',
    'ALB Albumin', 'A/G Ratio Albumin and Globulin Ratio'
]
TARGET_COLUMN = 'Diagnosis'
SCALING_COLUMNS = [
    'Alkphos Alkaline Phosphotase',
    'Sgpt Alamine Aminotransferase',
    'Sgot Aspartate Aminotransferase'
]

def impute_data(data):
    """
    handle missing values using MICE imputation.
    """
    print("Imputing missing values...")
    imputer = ImputationKernel(data, random_state=42, save_all_iterations_data=True)
    imputer.mice(5)
    data = imputer.complete_data()
    print("Missing values imputed successfully.")
    return data

def apply_smote(data):
    """
    Handle class imbalance using SMOTE.
    """
    print("Applying SMOTE for class balancing...")
    sm = SMOTE(random_state=42)
    X_resampled, y_resampled = sm.fit_resample(data[FEATURE_COLUMNS], data[TARGET_COLUMN])
    print("SMOTE applied successfully.")
    return X_resampled, y_resampled

def rank_features(X, y):
    """
    Perform feature ranking using SelectKBest with ANOVA F-test.
    """
    print("Performing feature ranking...")
    selector = SelectKBest(f_classif, k=10)
    selector.fit(X, y)
    scores = -np.log10(selector.pvalues_)
    scores /= scores.max()

    # Create DataFrame for feature scores
    df_scores = pd.DataFrame(scores, columns=['score'], index=FEATURE_COLUMNS)
    df_scores.sort_values(by='score', ascending=False, inplace=True)

    print("\nFeature Ranking:")
    print(df_scores)

    # Plot feature scores
    plt.figure(figsize=(8, 6))
    plt.title("Feature Ranking", fontsize=12)
    plt.bar(df_scores.index, df_scores['score'], color='blue', edgecolor='black', alpha=0.8)
    plt.xticks(rotation=90, fontsize=10)
    plt.xlabel("Features", fontsize=12)
    plt.ylabel("Normalized Score", fontsize=12)
    plt.tight_layout()
    plt.grid(axis='y', linestyle='--', linewidth=0.5)
    plt.show()

def normalize_and_scale_features(data):
    """
    Normalize and scale specific features to the range [0, 100].
    """
    print("Normalizing and scaling specific features...")
    for col in SCALING_COLUMNS:
        col_range = data[col].max() - data[col].min()
        if col_range == 0:
            data[col] = 0
        else:
            data[col] = (data[col] - data[col].min()) / col_range * 100
    print("Normalization and scaling completed.")
    return data

def load_data(filename = "./LD_raw_data.csv"):
    """
    Load data from a CSV file.
    """
    data = pd.read_csv(filename)
    data = impute_data(data)
    X_resampled, y_resampled = apply_smote(data)
    data = pd.DataFrame(X_resampled, columns=FEATURE_COLUMNS)
    data[TARGET_COLUMN] = y_resampled
    data = normalize_and_scale_features(data)

    return data