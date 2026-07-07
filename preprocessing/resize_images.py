import cv2
import os

dataset_path = "dataset/"
categories = ["normal", "benign", "malignant"]  # Define categories
output_size = (224, 224)  # Standard for CNN models

for category in categories:
    path = os.path.join(dataset_path, category)
    
    # Ensure folder exists
    if not os.path.exists(path):
        print(f"Folder {path} not found. Skipping...")
        continue

    for img_file in os.listdir(path):
        img_path = os.path.join(path, img_file)

        # Read image
        image = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
        if image is not None:
            image = cv2.resize(image, output_size)  # Resize
            cv2.imwrite(img_path, image)  # Overwrite with resized version
        else:
            print(f"Error loading {img_path}, skipping...")

print("✅ All images resized to 224x224!")
