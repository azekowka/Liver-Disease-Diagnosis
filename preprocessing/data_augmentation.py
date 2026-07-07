import os
import numpy as np
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from PIL import Image  # ✅ Use PIL to prevent OpenCV corruption

dataset_path = "dataset/"
output_path = "dataset_augmented_custom/"
output_size = (224, 224)  # Standard for CNNs

# ✅ Define the number of augmented images per input image
AUGMENTATION_MULTIPLIER = 3  # Change this to increase dataset size

# Ensure output path exists
if not os.path.exists(output_path):
    os.makedirs(output_path)

categories = ["normal", "benign", "malignant"]

# ✅ Define Data Augmentation
datagen = ImageDataGenerator(
    rotation_range=40,  # ✅ More rotation (previously 20)
    width_shift_range=0.3,
    height_shift_range=0.3,
    shear_range=0.3,
    zoom_range=0.3,  # ✅ Increased zoom variation
    brightness_range=[0.6, 1.5],  # ✅ More brightness variation
    horizontal_flip=True,
    vertical_flip=True,  # ✅ Adds more randomization
    fill_mode="nearest"
)

for category in categories:
    input_folder = os.path.join(dataset_path, category)
    output_folder = os.path.join(output_path, category)

    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    for img_file in os.listdir(input_folder):
        img_path = os.path.join(input_folder, img_file)

        try:
            # ✅ Load Image Properly
            image = Image.open(img_path).convert("RGB")
            image = image.resize(output_size)

            # ✅ Convert Image to NumPy Array
            image = np.array(image).astype(np.float32) / 255.0

            # ✅ Expand Dimensions for Augmentation
            image = np.expand_dims(image, axis=0)

            # ✅ Generate Multiple Augmented Images
            aug_iter = datagen.flow(image, batch_size=1)

            for i in range(AUGMENTATION_MULTIPLIER):  # ✅ Generate multiple versions
                aug_image = next(aug_iter)[0]  # Get the augmented image

                # ✅ Convert Back to 0-255 Before Saving
                aug_image = np.clip(aug_image * 255, 0, 255).astype(np.uint8)

                # ✅ Save With New Filename
                output_file = os.path.join(output_folder, f"aug_{i}_{img_file}")
                Image.fromarray(aug_image).save(output_file, format="PNG")

                print(f"✅ Saved Augmented Image: {output_file}")

        except Exception as e:
            print(f"❌ ERROR: Could not process {img_path} - {e}")

print("✅ All images processed successfully!")
