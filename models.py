# models.py
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from xgboost import XGBClassifier
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import accuracy_score

def save_grid_search_results(filename, grid_search):
    """
    Save GridSearchCV results to a text file.
    """
    with open(filename, 'w') as f:
        f.write(f'Best score: {grid_search.best_score_}\n')
        f.write(f'Best parameters: {grid_search.best_params_}\n')

def evaluate_classifier(estimator, param_grid, X_train, y_train, X_test, y_test, filename):
    """
    Train and evaluate a classifier using GridSearchCV.
    """
    grid_search = GridSearchCV(estimator, param_grid, scoring='accuracy', cv=5, n_jobs=-1, verbose=1)
    grid_search.fit(X_train, y_train)
    y_pred = grid_search.best_estimator_.predict(X_test)
    print(f'Accuracy of {type(estimator).__name__}: {accuracy_score(y_test, y_pred):.2f}')
    save_grid_search_results(filename, grid_search)

# Parameter grids for GridSearchCV
rf_params = {
    'n_estimators': [10, 100, 1000],
    'max_depth': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 5, 10],
    'criterion': ['gini', 'entropy'],
    'max_features': ['auto', 'sqrt', 'log2', None],
    'bootstrap': [True, False],
    'random_state': [0]
}

dt_params = {
    'max_depth': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    'criterion': ['gini', 'entropy'],
    'splitter': ['best', 'random'],
    'min_samples_split': [2, 5, 10, 20],
    'max_features': ['auto', 'sqrt', 'log2', None],
    'class_weight': ['balanced', None],
    'random_state': [0]
}

knn_params = {
    'n_neighbors': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    'p': [1, 2],
    'metric': ['minkowski', 'euclidean', 'manhattan'],
    'weights': ['uniform', 'distance']
}

lr_params = {
    'C': [0.1, 1, 10, 100, 1000],
    'solver': ['newton-cg', 'lbfgs', 'liblinear', 'sag', 'saga'],
    'max_iter': [200, 500, 1000],
    'random_state': [0]
}

svc_params = {
    'C': [0.1, 1, 10, 100, 1000],
    'kernel': ['linear', 'poly', 'rbf', 'sigmoid'],
    'gamma': [0.1, 1, 10, 100],
    'random_state': [0]
}

xgb_params = {
    'n_estimators': [100, 200, 300],
    'learning_rate': [0.1, 0.2, 0.3],
    'max_depth': [1, 2, 3, 4, 5, 6],
    'random_state': [0]
}
