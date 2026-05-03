"""
model/inference.py
Loads DermScan EfficientNetB3 and runs single-image predictions.
Falls back to random predictions when model file is absent (demo mode).
"""

import os
import numpy as np

IMG_SIZE = 224

# Lazy-import TF to avoid slow startup during tests
_tf  = None
_k   = None

def _get_tf():
    global _tf, _k
    if _tf is None:
        import tensorflow as tf
        from tensorflow import keras
        from tensorflow.keras.applications.efficientnet import preprocess_input
        _tf = tf
        _k  = {"keras": keras, "preprocess": preprocess_input}
    return _tf, _k


def load_model(path: str):
    """
    Returns (model, model_loaded: bool).
    model is None when the file does not exist (demo mode).
    """
    if not os.path.exists(path):
        print(f"Model file not found at {path}. Running in demo mode.")
        return None, False

    tf, _ = _get_tf()
    try:
        model = tf.keras.models.load_model(path, compile=False)
        print(f"Model loaded from {path}")
        print(f"Output shape: {model.output_shape}")
        return model, True
    except Exception as e:
        print(f"Failed to load model: {e}")
        return None, False


def predict_image(model, img_rgb_uint8: np.ndarray, img_size: int = IMG_SIZE):
    """
    img_rgb_uint8 : uint8 numpy array, shape (H, W, 3)
    Returns       : (label: int, confidence: float, probability: float)
      label 0 = Benign
      label 1 = Requires Professional Consultation
    """
    if model is None:
        # Demo mode – return plausible-looking random result
        prob = float(np.random.beta(2, 5))   # skewed towards benign
        label = int(prob >= 0.5)
        conf  = prob if label == 1 else 1.0 - prob
        return label, float(conf), float(prob)

    tf, k = _get_tf()
    preprocess_input = k["preprocess"]

    img = tf.image.resize(img_rgb_uint8, [img_size, img_size])
    img = tf.cast(img, tf.float32)
    img = preprocess_input(img)
    batch = img[tf.newaxis]               # (1, H, W, 3)

    raw  = model(batch, training=False)   # (1, 1) or (1,)
    prob = float(tf.squeeze(raw))         # scalar

    label = int(prob >= 0.5)
    conf  = prob if label == 1 else 1.0 - prob
    return label, float(conf), float(prob)