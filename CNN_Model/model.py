import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import (
    Conv2D, MaxPooling2D, GlobalAveragePooling2D, GlobalMaxPooling2D,
    Concatenate, Dense, Dropout, BatchNormalization, LeakyReLU, Rescaling, Input,
    RandomFlip, RandomRotation, RandomZoom, RandomContrast,
)
from tensorflow.keras.applications import MobileNetV2


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


def build_transfer_cnn(learning_rate: float = 1e-4, augment: bool = True):
    """MobileNetV2 backbone pretrained on ImageNet + a small classification head.

    With only ~1.5k training images, a from-scratch CNN (build_custom_cnn) has too
    little data to learn discriminative low/mid-level filters and collapses to
    predicting the majority class. A frozen pretrained backbone already knows
    general edge/texture features, so only the small head needs to learn the
    liver-ultrasound-specific decision boundary.

    Pooling combines GlobalAveragePooling2D with GlobalMaxPooling2D: a benign/
    malignant lesion is a *local* feature that occupies a small part of the
    scan, and average pooling alone dilutes it into the surrounding tissue
    texture (verified empirically: a plain-GAP head mapped near-black and
    near-gray images - i.e. most real ultrasound frames - to "malignant"
    almost independent of content). Max pooling keeps the strongest local
    activation, which is what a small-lesion signal needs to survive pooling.

    Augmentation is mild and built into the model graph (so it's active only
    in `.fit()`, not at inference). The original pipeline's offline augmentation
    (preprocessing/data_augmentation.py: 40deg rotation, 0.3 shear/zoom/shift,
    and - nonsensically for an anatomical scan - *vertical* flips) turned out
    to be too destructive: end-to-end training on it never stabilized past
    predicting a single class regardless of loss weighting, while a plain
    classifier fit on frozen features from the un-augmented source images hit
    ~72% held-out accuracy immediately. Horizontal-only flip + small
    rotation/zoom/contrast jitter adds regularization without wrecking signal.

    Inputs are expected in [0, 1] range (same as the rest of the pipeline, via
    ImageDataGenerator(rescale=1./255) and backend/app.py's `_prepare_image`);
    the Rescaling layer below maps that to the [-1, 1] range MobileNetV2 expects,
    so no other part of the pipeline needs to change.

    The backbone starts fully frozen (call `set_backbone_trainable` below to
    unfreeze top layers for a fine-tuning phase once the head has warmed up).
    """
    inputs = Input(shape=(224, 224, 3))
    x = inputs
    if augment:
        x = RandomFlip("horizontal")(x)
        x = RandomRotation(0.03)(x)
        x = RandomZoom(0.1)(x)
        x = RandomContrast(0.1)(x)
    x = Rescaling(scale=2.0, offset=-1.0)(x)
    base_model = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights="imagenet")
    base_model.trainable = False
    x = base_model(x)
    avg = GlobalAveragePooling2D()(x)
    mx = GlobalMaxPooling2D()(x)
    x = Concatenate()([avg, mx])
    x = Dense(128)(x)
    x = BatchNormalization()(x)
    x = LeakyReLU(alpha=0.1)(x)
    x = Dropout(0.4)(x)
    outputs = Dense(3, activation="softmax")(x)

    model = Model(inputs, outputs, name="mobilenetv2_liver_cnn")
    model.compile(
        # clipnorm: class_weight amplifies gradients for the rare classes
        # (up to ~2.5x for "normal"); without clipping this occasionally
        # produced a large update that knocked the head into a degenerate
        # single-class solution it couldn't recover from.
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate, clipnorm=1.0),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def strip_augmentation_layers(model):
    """Rebuild the trained model without the RandomFlip/Rotation/Zoom/Contrast
    preprocessing layers, reusing the same (already-trained) layer instances
    for everything else. Those layers only ever do something during `.fit()`
    - at inference Keras already runs them as a no-op - but newer Keras 3.x
    preprocessing layers gained constructor kwargs (e.g. RandomContrast's
    `value_range`) that older Keras 3.x releases can't deserialize. A backend
    running a slightly different TensorFlow/Keras version than training then
    fails to load the model at all. Since these layers are inert at inference
    anyway, the fix is to just not ship them in the saved artifact."""
    inputs = Input(shape=(224, 224, 3), name="input_layer")
    x = model.get_layer("rescaling")(inputs)
    x = model.get_layer("mobilenetv2_1.00_224")(x)
    avg = model.get_layer("global_average_pooling2d")(x)
    mx = model.get_layer("global_max_pooling2d")(x)
    x = model.get_layer("concatenate")([avg, mx])
    x = model.get_layer("dense")(x)
    x = model.get_layer("batch_normalization")(x)
    x = model.get_layer("leaky_re_lu")(x)
    x = model.get_layer("dropout")(x)
    outputs = model.get_layer("dense_1")(x)
    return Model(inputs, outputs, name="mobilenetv2_liver_cnn_inference")


def set_backbone_trainable(model, fine_tune_layers: int, learning_rate: float = 1e-5):
    """Unfreeze the last `fine_tune_layers` layers of the MobileNetV2 backbone
    (found by type, since it's nested inside the functional model) and
    recompile with a low learning rate for a fine-tuning phase. BatchNorm
    layers stay frozen even when "unfrozen" so their ImageNet running
    statistics aren't wrecked by our ~1.5k-image dataset."""
    base_model = next(layer for layer in model.layers if isinstance(layer, tf.keras.Model))
    base_model.trainable = True
    for layer in base_model.layers[:-fine_tune_layers]:
        layer.trainable = False
    for layer in base_model.layers[-fine_tune_layers:]:
        if isinstance(layer, BatchNormalization):
            layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate, clipnorm=1.0),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


if __name__ == "__main__":
    model = build_custom_cnn()
    model.summary()
