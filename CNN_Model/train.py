import os
import sys
import pickle
from collections import Counter

import numpy as np
from PIL import Image
from sklearn.model_selection import train_test_split
from tensorflow.keras.callbacks import ReduceLROnPlateau, EarlyStopping
from tensorflow.keras.utils import to_categorical

# Ensure Python finds project root for local imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from model import build_transfer_cnn, set_backbone_trainable, strip_augmentation_layers

# ── Load the RAW (un-augmented) source images straight into memory ──
# The old pipeline trained off preprocessing/data_augmentation.py's output
# (dataset_augmented/, 3x each image with rotation/shear/zoom/vertical-flip).
# That offline augmentation turned out to be too aggressive: end-to-end
# training on it never stabilized (see models/_backup_broken_model/ for the
# three failed attempts). A frozen-feature linear probe on these raw images
# hit ~72% held-out accuracy immediately, so we train directly on them with
# only the mild in-model augmentation from build_transfer_cnn().
CLASS_NAMES = ["benign", "malignant", "normal"]
CLASS_FOLDERS = {
    "benign": "dataset_CNN/Benign/Benign/image",
    "malignant": "dataset_CNN/Malignant/Malignant/image",
    "normal": "dataset_CNN/Normal/Normal/image",
}
IMG_SIZE = 224


def load_images():
    X, y = [], []
    for idx, cname in enumerate(CLASS_NAMES):
        folder = CLASS_FOLDERS[cname]
        files = sorted(os.listdir(folder))
        for fname in files:
            img = Image.open(os.path.join(folder, fname)).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
            X.append(np.asarray(img, dtype=np.float32) / 255.0)
            y.append(idx)
        print(f"Loaded {len(files)} images for class '{cname}'")
    return np.stack(X), np.array(y)


print("Loading raw dataset_CNN images into memory...")
X, y = load_images()
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
print("Train:", X_train.shape, "Val:", X_val.shape)

class_counts = Counter(y_train.tolist())
n_samples = len(y_train)
n_classes = len(class_counts)
class_weight = {cls: n_samples / (n_classes * count) for cls, count in class_counts.items()}
print("Class counts (train):", dict(class_counts))
print("Class weights:", class_weight)

y_train_oh = to_categorical(y_train, num_classes=3)
y_val_oh = to_categorical(y_val, num_classes=3)

model_path = "models/custom_liver_cnn.keras"
history_path = "models/training_history.pkl"
full_history = {}


def run_phase(model, epochs, patience, tag):
    lr_schedule = ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=max(2, patience // 3), min_lr=1e-7, verbose=1)
    early_stop = EarlyStopping(monitor="val_loss", patience=patience, restore_best_weights=True, verbose=1)
    hist = model.fit(
        X_train, y_train_oh,
        validation_data=(X_val, y_val_oh),
        epochs=epochs,
        batch_size=16,
        class_weight=class_weight,
        callbacks=[lr_schedule, early_stop],
    )
    for k, v in hist.history.items():
        full_history.setdefault(f"{tag}_{k}", []).extend(v)
    return model


# ── Phase 1: train the classification head only, MobileNetV2 backbone frozen ──
print("=== Phase 1: training head (backbone frozen) ===")
model = build_transfer_cnn(learning_rate=1e-4)
model = run_phase(model, epochs=30, patience=8, tag="head")

# ── Phase 2: unfreeze the top of the backbone and fine-tune end-to-end at a
# low learning rate so mid/high-level features adapt from generic ImageNet
# photos to liver-ultrasound texture.
print("=== Phase 2: fine-tuning top of backbone ===")
model = set_backbone_trainable(model, fine_tune_layers=40, learning_rate=1e-5)
model = run_phase(model, epochs=40, patience=10, tag="finetune")

inference_model = strip_augmentation_layers(model)
inference_model.save(model_path)
print("Model saved successfully!")

with open(history_path, "wb") as f:
    pickle.dump(full_history, f)
print("Training history saved successfully!")
