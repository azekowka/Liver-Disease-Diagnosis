import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Define dataset path
dataset_path = "dataset_augmented/"
img_size = (224, 224)
batch_size = 32

# Create Data Generators
datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.3  # ✅ 70% Train, 30% Validation
)

# Load Training Data
train_generator = datagen.flow_from_directory(
    dataset_path,
    target_size=img_size,
    batch_size=batch_size,
    class_mode="categorical",
    subset="training"
)

# Load Validation Data
val_generator = datagen.flow_from_directory(
    dataset_path,
    target_size=img_size,
    batch_size=batch_size,
    class_mode="categorical",
    subset="validation"
)

# ✅ Print Class Labels to Verify Correct Labeling
print("Class Labels Mapping:", train_generator.class_indices)
