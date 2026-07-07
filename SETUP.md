# Setup and Usage Guide (Latest Commit)

This guide explains how to run and use the latest project additions, especially:

- `preprocessing/`
- `test_samples/`
- `CNN_Model/` (sometimes referenced as `CNN_model`)
- `models/`

---

## 1) Prerequisites

- Python 3.10+ recommended
- `uv` or `pip` available in your environment
- Dataset https://www.kaggle.com/datasets/abhi8923shriv/liver-disease-patient-dataset and LD_raw_data.csv

From the repository root:

```powershell
uv venv
uv pip install -r requirements.txt
uv pip install tensorflow opencv-python pillow joblib
```

`requirements.txt` covers the tabular ML pipeline. The extra install line adds packages needed by the CNN/image workflow.

---

## 2) Repository Workflow Overview

There are now two parallel workflows:

1. **Tabular liver diagnosis pipeline**
   - Files: `preprocess.py`, `models.py`, `train.py`
2. **Image-based CNN pipeline**
   - Folders/files: `preprocessing/`, `CNN_Model/`, `models/`, `test_samples/`

You can use either workflow independently.

---

## 3) Tabular Pipeline (CSV-Based)

This part uses `LD_raw_data.csv` and classical ML models.

### Step 1: Preprocess data

```powershell
python .\preprocess.py
```

What it does:
- Loads `LD_raw_data.csv`
- Imputes missing values (MICE)
- Balances classes (SMOTE)
- Scales selected lab features

### Step 2: Train and evaluate models

```powershell
python .\train.py
```

What it does:
- Splits data into train/test
- Runs GridSearchCV for:
  - Random Forest
  - Decision Tree
  - KNN
  - Logistic Regression
  - SVC
  - XGBoost
- Saves best-score summaries to:
  - `RF_results.txt`
  - `DT_results.txt`
  - `KNN_results.txt`
  - `LR_results.txt`
  - `SVC_results.txt`
  - `XGB_results.txt`

---

## 4) Image Preprocessing Pipeline (`preprocessing/`)

Expected source dataset structure:

```text
dataset/
  normal/
  benign/
  malignant/
```

### Step 1: Resize images

```powershell
python .\preprocessing\resize_images.py
```

### Step 2: Normalize images

```powershell
python .\preprocessing\normalize_images.py
```

### Step 3: Generate augmented images

```powershell
python .\preprocessing\data_augmentation.py
```

Important note:
- The augmentation script currently outputs to `dataset_augmented_custom/`.
- CNN loading script uses `dataset_augmented/` by default.
- Either:
  1) rename `dataset_augmented_custom` to `dataset_augmented`, or
  2) update dataset path in `preprocessing/load_dataset.py` to match.

### Step 4 (optional): Visual check of augmented images

```powershell
python .\preprocessing\check_augmanted.py
```

---

## 5) CNN Training (`CNN_Model/`)

### Model definition
- `CNN_Model/model.py` defines a custom CNN for 3 classes:
  - `normal`
  - `benign`
  - `malignant`

### Train or resume training

```powershell
python .\CNN_Model\train.py
```

Behavior:
- If `models/custom_liver_cnn/` exists, training resumes from saved model.
- Otherwise, training starts from scratch.
- Saves:
  - model folder: `models/custom_liver_cnn/`
  - training history: `models/training_history.pkl`

If import errors appear around `training.load_dataset`, update the import in `CNN_Model/train.py` to use your local loader module path.

---

## 6) Using Pretrained Models (`models/`)

Current model folders:
- `models/custom_liver_cnn/`
- `models/liver_classification/`

To load a saved TensorFlow model in Python:

```python
import tensorflow as tf
model = tf.keras.models.load_model("models/custom_liver_cnn")
```

Then run prediction on a preprocessed image tensor of shape `(1, 224, 224, 3)`.

---

## 7) Testing with `test_samples/`

`test_samples/` contains sample liver ultrasound images for quick checks.

Minimal inference example (run in Python):

```python
import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image

model = tf.keras.models.load_model("models/custom_liver_cnn")
img_path = "test_samples/4.jpg"

img = image.load_img(img_path, target_size=(224, 224))
x = image.img_to_array(img) / 255.0
x = np.expand_dims(x, axis=0)

pred = model.predict(x)
class_names = ["benign", "malignant", "normal"]  # adjust order if needed
print("Predicted class:", class_names[int(np.argmax(pred))])
print("Probabilities:", pred[0])
```

Tip:
- Confirm class index mapping during training from `train_generator.class_indices` output in `preprocessing/load_dataset.py`.

---

## 8) Quick Start (CNN Path Only)

From repo root:

```powershell
.\.venv\Scripts\Activate.ps1
python .\preprocessing\resize_images.py
python .\preprocessing\normalize_images.py
python .\preprocessing\data_augmentation.py
python .\CNN_Model\train.py
```

After training, run inference on any file in `test_samples/` using the sample code in section 7.

---

## 9) Troubleshooting

- **`ModuleNotFoundError` in CNN training**
  - Check Python path/import in `CNN_Model/train.py`.
- **No images detected**
  - Verify directory names exactly: `dataset/normal`, `dataset/benign`, `dataset/malignant`.
- **Shape mismatch during prediction**
  - Ensure input image tensor is resized to `224x224` and has 3 channels.
- **Wrong class labels**
  - Use `class_indices` from the generator and keep label order consistent at inference time.
