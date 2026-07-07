import cv2
import os
import matplotlib.pyplot as plt
import numpy as np

augmented_folder = "dataset_augmented/benign"  # Change for other classes

# Get some sample images
sample_images = [os.path.join(augmented_folder, img) for img in os.listdir(augmented_folder)[:6]]

plt.figure(figsize=(10,5))
for i, img_path in enumerate(sample_images):
    img = cv2.imread(img_path)
    if img is None:
        print(f"❌ ERROR: Could not load {img_path}")
        continue

    # ✅ Print pixel values to check if the image is black
    print(f"{img_path}: Min Pixel Value = {np.min(img)}, Max Pixel Value = {np.max(img)}")

    # Convert from OpenCV BGR to RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    plt.subplot(2,3,i+1)
    plt.imshow(img)
    plt.title(f"Augmented Image {i+1}")
    plt.axis("off")

plt.show()
