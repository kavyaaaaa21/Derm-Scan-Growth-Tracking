"""
model/gradcam.py
Grad-CAM implementation that works with the DermScan sigmoid binary output.
"""

import numpy as np
import cv2


class GradCAMEngine:
    """
    Wraps a Keras model and produces Grad-CAM heatmaps.
    Compatible with EfficientNetB3 + sigmoid binary output.
    """

    def __init__(self, model, layer_name: str = None):
        import tensorflow as tf
        from tensorflow.keras import layers, Model

        self.model = model

        if layer_name is None:
            layer_name = self._find_layer(model)
        print(f"Grad-CAM target layer: {layer_name}")

        self.grad_model = Model(
            inputs  = model.inputs,
            outputs = [model.get_layer(layer_name).output, model.output],
        )

    # ── Layer detection ────────────────────────────────────────────
    @staticmethod
    def _find_layer(model, preferred: str = "top_conv") -> str:
        import tensorflow as tf
        from tensorflow.keras import layers

        try:
            model.get_layer(preferred)
            return preferred
        except ValueError:
            pass
        for lyr in reversed(model.layers):
            if isinstance(lyr, layers.Conv2D):
                return lyr.name
        raise ValueError("No Conv2D layer found in model.")

    # ── Compute ────────────────────────────────────────────────────
    def compute(self, img_rgb_uint8: np.ndarray, alpha: float = 0.45):
        """
        img_rgb_uint8 : uint8 numpy (224, 224, 3)
        Returns       : (heatmap [0-1 float], overlay uint8)
        """
        import tensorflow as tf
        from tensorflow.keras.applications.efficientnet import preprocess_input

        img_f = preprocess_input(img_rgb_uint8.astype(np.float32))
        batch = tf.constant(img_f[np.newaxis])

        with tf.GradientTape() as tape:
            tape.watch(batch)
            conv_out, pred = self.grad_model(batch, training=False)
            score = pred

        grads   = tape.gradient(score, conv_out)    # (1, h, w, C)
        weights = tf.reduce_mean(grads, axis=(0, 1, 2))  # (C,)
        cam     = tf.reduce_sum(conv_out[0] * weights, axis=-1)  # (h, w)
        cam     = tf.nn.relu(cam).numpy()

        if cam.max() > 1e-8:
            cam = cam / cam.max()

        # Resize heatmap to image size
        h, w = img_rgb_uint8.shape[:2]
        hm = cv2.resize(cam, (w, h))

        # Overlay
        hm_color = cv2.applyColorMap((hm * 255).astype(np.uint8), cv2.COLORMAP_JET)
        hm_rgb   = cv2.cvtColor(hm_color, cv2.COLOR_BGR2RGB)
        overlay  = cv2.addWeighted(img_rgb_uint8, 1 - alpha, hm_rgb, alpha, 0)

        return hm, overlay