import tensorflow as tf
from tensorflow import keras
from pathlib import Path

path = Path('models/custom_liver_cnn')
print('tf', tf.__version__)
print('path exists', path.exists(), (path / 'saved_model.pb').exists())

for kwargs in [
    {},
    {'compile': False},
    {'compile': False, 'custom_objects': {'Adam': tf.keras.optimizers.legacy.Adam}},
    {'compile': False, 'custom_objects': {'adam': tf.keras.optimizers.legacy.Adam}},
    {'compile': False, 'custom_objects': {'Adam': tf.keras.optimizers.Adam}},
    {'compile': False, 'custom_objects': {'adam': tf.keras.optimizers.Adam}},
]:
    try:
        model = keras.models.load_model(path, **kwargs)
        print('loaded with', kwargs, '->', type(model).__name__)
        break
    except Exception as e:
        print('failed with', kwargs, type(e).__name__, e)
