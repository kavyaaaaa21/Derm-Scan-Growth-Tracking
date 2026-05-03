"""
model/tracker.py
LesionChangeAnalyzer  — compares two visits using image features.
PatientStore          — in-memory patient timeline manager.
"""

import numpy as np
import cv2
from PIL import Image
from skimage.metrics import structural_similarity as ssim


# ══════════════════════════════════════════════════════════════════
#  LesionChangeAnalyzer
# ══════════════════════════════════════════════════════════════════

class LesionChangeAnalyzer:
    """
    Compares two images of the same lesion.
    Metrics: SSIM, area, compactness, color variance, asymmetry.
    """

    def __init__(self, size=(224, 224), threshold: float = 0.15):
        self.size      = size
        self.threshold = threshold

    # ── Private helpers ───────────────────────────────────────────

    def _load(self, src) -> np.ndarray:
        if isinstance(src, str):
            arr = np.array(Image.open(src).convert("RGB").resize(self.size))
        elif isinstance(src, Image.Image):
            arr = np.array(src.convert("RGB").resize(self.size))
        else:
            arr = np.array(src, dtype=np.uint8)
            if arr.shape[:2] != self.size:
                arr = cv2.resize(arr, self.size)
        return arr

    def _segment(self, rgb: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        blur = cv2.GaussianBlur(gray, (7, 7), 0)
        _, m = cv2.threshold(
            blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
        )
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k, iterations=2)
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN,  k, iterations=1)
        return m

    def _features(self, rgb: np.ndarray) -> dict:
        mask = self._segment(rgb)
        area = float(np.sum(mask > 0)) / float(mask.size)

        cnts, _ = cv2.findContours(
            mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        if cnts:
            c    = max(cnts, key=cv2.contourArea)
            peri = float(cv2.arcLength(c, True))
            comp = (peri ** 2) / (4 * np.pi * (float(cv2.contourArea(c)) + 1e-6))
        else:
            peri = comp = 0.0

        hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(float)
        px  = hsv[mask > 0] if mask.sum() > 0 else hsv.reshape(-1, 3)
        cvar = float(np.mean(np.std(px, axis=0)))

        h, w = mask.shape
        t = float(mask[: h // 2].sum())
        b = float(mask[h // 2 :].sum())
        asym = abs(t - b) / (t + b + 1e-6)

        return dict(
            area        = area,
            perimeter   = peri,
            compactness = float(comp),
            color_var   = cvar,
            asymmetry   = float(asym),
            mask        = mask,
        )

    # ── Public API ────────────────────────────────────────────────

    def analyze(
        self,
        before,
        after,
        date_before: str = "Visit 1",
        date_after:  str = "Visit 2",
    ) -> dict:
        b, a   = self._load(before), self._load(after)
        fb, fa = self._features(b),  self._features(a)

        sv = ssim(
            cv2.cvtColor(b, cv2.COLOR_RGB2GRAY),
            cv2.cvtColor(a, cv2.COLOR_RGB2GRAY),
            data_range=255,
        )

        d = {
            "area_delta"       : fa["area"]        - fb["area"],
            "compactness_delta": fa["compactness"] - fb["compactness"],
            "color_var_delta"  : fa["color_var"]   - fb["color_var"],
            "asymmetry_delta"  : fa["asymmetry"]   - fb["asymmetry"],
            "ssim"             : float(sv),
            "ssim_change"      : float(1.0 - sv),
        }

        risk = (
            abs(d["area_delta"])        * 2.0
            + abs(d["compactness_delta"]) * 1.5
            + abs(d["color_var_delta"])   * 0.5 / 20
            + abs(d["asymmetry_delta"])   * 1.0
            + d["ssim_change"]            * 1.0
        ) / 6.0

        level = (
            "HIGH"   if risk > 0.3 else
            "MEDIUM" if risk > self.threshold else
            "LOW"
        )

        return dict(
            date_before   = date_before,
            date_after    = date_after,
            before_feats  = fb,
            after_feats   = fa,
            deltas        = d,
            risk_score    = float(risk),
            risk_level    = level,
            alert         = risk > self.threshold,
            img_before    = b,
            img_after     = a,
        )


# ══════════════════════════════════════════════════════════════════
#  PatientStore
# ══════════════════════════════════════════════════════════════════

class PatientStore:
    """In-memory patient records with optional JSON persistence."""

    def __init__(self):
        self._records: dict[str, list] = {}
        self._analyzer = LesionChangeAnalyzer()

    def add_visit(
        self,
        pid:        str,
        image_np:   np.ndarray,
        date:       str,
        prediction: str,
        confidence: float,
    ) -> dict:
        record = dict(
            date          = date,
            image         = image_np,
            prediction    = prediction,
            confidence    = confidence,
            change_report = None,
        )

        visits = self._records.setdefault(pid, [])
        if visits:
            prev = visits[-1]
            record["change_report"] = self._analyzer.analyze(
                prev["image"], image_np,
                date_before = prev["date"],
                date_after  = date,
            )

        visits.append(record)
        return record

    def get_timeline(self, pid: str):
        return self._records.get(pid, [])

    def visit_count(self, pid: str) -> int:
        return len(self._records.get(pid, []))

    def list_patients(self) -> list:
        return list(self._records.keys())
 
