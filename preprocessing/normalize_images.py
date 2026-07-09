import os
import cv2
import numpy as np

# Define dataset path and categories
dataset_path = "dataset_CNN/"
category_paths = {
    "normal": os.path.join(dataset_path, "Normal", "Normal", "image"),
    "benign": os.path.join(dataset_path, "Benign", "Benign", "image"),
    "malignant": os.path.join(dataset_path, "Malignant", "Malignant", "image"),
}

for category, path in category_paths.items():

    if not os.path.exists(path):
        print(f"Folder {path} not found. Skipping...")
        continue

    for img_file in os.listdir(path):
        img_path = os.path.join(path, img_file)

        # Read image
        image = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
        if image is not None:
            image = image / 255.0  # Normalize
            cv2.imwrite(img_path, (image * 255).astype(np.uint8))  # Save back
        else:
            print(f"Error loading {img_path}, skipping...")

print("✅ All dataset_CNN images normalized to [0,1] range!")
