# [Liver Disease Diagnosis using Tree-Based Machine Learning Algorithms](https://doi.org/10.1109/NILES56402.2022.9942388)

---

## Project Overview
This repository contains the implementation of a diagnostic framework for **Liver Disease Detection** using tree-based Machine Learning (ML) classification algorithms. The study employs **Decision Tree**, **Random Forest**, and **Extreme Gradient Boosting** to accurately classify patients as having or not having LD. A large aggregated dataset from multiple sources is utilized to train these models efficiently.
---

## Repository Structure
The repository includes the following files:

### Data:
- **`LD_raw_data.csv`**: Raw dataset used for training and evaluation.

### Code:
- **`preprocess.py`**: Handles data loading, preprocessing, missing value imputation, SMOTE-based class balancing, feature ranking, and scaling.
- **`models.py`**: Defines tree-based classifiers and hyperparameter grids for GridSearchCV.
- **`train.py`**: Orchestrates the training, hyperparameter tuning, and evaluation of models.

---

## Results
The proposed framework achieves the following results:
1. **Decision Tree (DT)**:
   - Accuracy: **99.94%**
2. **Random Forest (RF)**:
   - Accuracy: **99.95%**
3. **XGBoost (Extreme Gradient Boosting)**:
   - Accuracy: **99.97%**

These results demonstrate the effectiveness of tree-based models in accurately classifying individuals with Liver Disease.

---

## Prerequisites
- Python 3.8 or higher
- Libraries listed in `requirements.txt`

### Installation
To install the required dependencies, run:
```bash
pip install -r requirements.txt
```

---

## Usage
### 1. Data Preprocessing
Use the `preprocess.py` script to clean, impute missing values, balance the dataset, and perform feature ranking:
```bash
python preprocess.py
```

### 2. Train the Models
Train and evaluate models using the `train.py` script:
```bash
python train.py
```

### 3. Visualize Feature Ranking
Feature ranking visualization is part of `preprocess.py`. It generates a bar chart displaying the importance of features based on ANOVA F-test.

---

## References
If you use this work in your research, please cite:
```plaintext
@INPROCEEDINGS{9942388,
  author={Gad, Eyad and Khatwa, Mustafa Abou and Soliman, Seif and Darweesh, M. Saeed},
  booktitle={2022 4th Novel Intelligent and Leading Emerging Sciences Conference (NILES)}, 
  title={Liver Disease Diagnosis using Tree-Based Machine Learning Algorithms}, 
  year={2022},
  volume={},
  number={},
  pages={116-121},
  keywords={Training;Measurement;Drugs;Machine learning algorithms;Liver diseases;Forestry;Classification algorithms;Liver Disease (LD);Machine learning (ML);Decision Tree (DT);Random Forest (RF);XGBoost},
  doi={10.1109/NILES56402.2022.9942388}}
```

