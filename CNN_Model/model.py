import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, GlobalAveragePooling2D, Dense, Dropout, BatchNormalization, LeakyReLU

def build_custom_cnn():
    model = Sequential([
        # ✅ Convolutional Layer 1 (32 filters instead of 64)
        Conv2D(32, (3, 3), padding="same", input_shape=(224, 224, 3)),
        BatchNormalization(),
        LeakyReLU(alpha=0.1),
        MaxPooling2D(pool_size=(2, 2)),

        # ✅ Convolutional Layer 2 (64 filters instead of 128)
        Conv2D(64, (3, 3), padding="same"),
        BatchNormalization(),
        LeakyReLU(alpha=0.1),
        MaxPooling2D(pool_size=(2, 2)),

        # ✅ Convolutional Layer 3 (128 filters)
        Conv2D(128, (3, 3), padding="same"),
        BatchNormalization(),
        LeakyReLU(alpha=0.1),
        MaxPooling2D(pool_size=(2, 2)),

        # ✅ Convolutional Layer 4 (256 filters)
        Conv2D(256, (3, 3), padding="same"),
        BatchNormalization(),
        LeakyReLU(alpha=0.1),
        MaxPooling2D(pool_size=(2, 2)),

        # ✅ Global Average Pooling (Reduces parameters significantly)
        GlobalAveragePooling2D(),

        # ✅ Fully Connected Layers (Reduced dense layer size)
        Dense(256),
        BatchNormalization(),
        LeakyReLU(alpha=0.1),
        Dropout(0.5),  # ✅ Prevent overfitting

        Dense(3, activation="softmax")  # ✅ 3 Classes: Benign, Malignant, Normal
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),  # ✅ Lower learning rate for better accuracy
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )

    return model

if __name__ == "__main__":
    model = build_custom_cnn()
    model.summary()
