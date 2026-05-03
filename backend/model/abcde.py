"""
model/abcde.py
Computes the dermatological ABCDE criteria from a lesion image.
Each criterion is scored 0-2; total is 0-10.

A — Asymmetry      (0=symmetric, 1=one axis, 2=both axes)
B — Border         (0=smooth, 1=irregular, 2=very irregular)
C — Color          (0=uniform, 1=2 colors, 2=3+ colors)
D — Diameter       (0=small, 1=medium, 2=large relative to frame)
E — Evolution      (0=stable, 1=moderate change, 2=significant — needs prior image)
"""

import numpy as np
import cv2
from PIL import Image


def _load(src, size=(224, 224)) -> np.ndarray:
    if isinstance(src, np.ndarray):
        arr = src.astype(np.uint8)
        return cv2.resize(arr, size) if arr.shape[:2] != size else arr
    if isinstance(src, Image.Image):
        return np.array(src.convert("RGB").resize(size), dtype=np.uint8)
    if isinstance(src, str):
        return np.array(Image.open(src).convert("RGB").resize(size), dtype=np.uint8)
    raise TypeError(f"Unsupported image type: {type(src)}")


def _segment(rgb: np.ndarray) -> np.ndarray:
    """Otsu threshold on blurred grayscale → binary mask."""
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    blur = cv2.GaussianBlur(gray, (7, 7), 0)
    _, mask = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k, iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  k, iterations=1)
    return mask


# ── Individual criteria ───────────────────────────────────────────

def score_asymmetry(mask: np.ndarray) -> dict:
    """Compare left/right and top/bottom halves of the lesion mask."""
    h, w = mask.shape
    top    = float(mask[:h//2].sum())
    bottom = float(mask[h//2:].sum())
    left   = float(mask[:, :w//2].sum())
    right  = float(mask[:, w//2:].sum())

    total  = float(mask.sum()) + 1e-6

    asym_v = abs(top - bottom) / total
    asym_h = abs(left - right) / total

    score = int(asym_v > 0.20) + int(asym_h > 0.20)

    return {
        "score": score,
        "max": 2,
        "vertical_asymmetry": round(asym_v, 4),
        "horizontal_asymmetry": round(asym_h, 4),
        "description": (
            "Symmetric" if score == 0 else
            "Asymmetric on one axis" if score == 1 else
            "Asymmetric on both axes"
        ),
    }


def score_border(mask: np.ndarray) -> dict:
    """Border irregularity via contour compactness."""
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        return {"score": 0, "max": 2, "compactness": 0.0,
                "description": "No lesion detected"}

    c    = max(cnts, key=cv2.contourArea)
    area = float(cv2.contourArea(c)) + 1e-6
    peri = float(cv2.arcLength(c, True)) + 1e-6

    # Circularity: 1.0 = perfect circle, higher = more irregular
    circularity = (peri ** 2) / (4 * np.pi * area)

    score = 0
    if circularity > 1.5:
        score = 1
    if circularity > 2.5:
        score = 2

    return {
        "score": score,
        "max": 2,
        "compactness": round(circularity, 4),
        "description": (
            "Regular, well-defined border" if score == 0 else
            "Slightly irregular border" if score == 1 else
            "Highly irregular / notched border"
        ),
    }


def score_color(rgb: np.ndarray, mask: np.ndarray) -> dict:
    """Color variation inside the lesion using k-means clustering in Lab space."""
    pixels = rgb[mask > 0]
    if len(pixels) < 20:
        return {"score": 0, "max": 2, "n_clusters": 1,
                "description": "Insufficient lesion area"}

    lab = cv2.cvtColor(
        pixels.reshape(1, -1, 3).astype(np.uint8),
        cv2.COLOR_RGB2Lab
    ).reshape(-1, 3).astype(np.float32)

    best_k, best_inertia = 1, float("inf")
    for k in range(1, 5):
        if len(lab) < k:
            break
        inertia, _, _  = cv2.kmeans(
            lab, k, None,
            (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0),
            3, cv2.KMEANS_PP_CENTERS
        )
        if float(inertia) < best_inertia * 0.7 or k == 1:
            best_inertia = float(inertia)
            best_k = k

    score = min(max(best_k - 1, 0), 2)

    return {
        "score": score,
        "max": 2,
        "n_clusters": best_k,
        "description": (
            "Uniform color" if score == 0 else
            "Two distinct colors" if score == 1 else
            "Three or more colors / heterogeneous"
        ),
    }


def score_diameter(mask: np.ndarray) -> dict:
    """Relative lesion diameter as fraction of image frame."""
    h, w  = mask.shape
    area  = float(mask.sum()) / float(h * w)
    diam  = float(np.sqrt(area / np.pi) * 2)  # normalised diameter [0-1]

    score = 0
    if diam > 0.20:
        score = 1
    if diam > 0.40:
        score = 2

    return {
        "score": score,
        "max": 2,
        "relative_diameter": round(diam, 4),
        "description": (
            "Small relative to frame" if score == 0 else
            "Moderate size" if score == 1 else
            "Large / dominant lesion"
        ),
    }


def score_evolution(risk_score: float = None) -> dict:
    """
    Evolution requires two images; uses change analyzer risk_score when available.
    Returns 0 if no prior data supplied.
    """
    if risk_score is None:
        return {
            "score": 0,
            "max": 2,
            "risk_score": None,
            "description": "No prior image — use Compare feature for evolution scoring",
        }

    score = 0
    if risk_score > 0.15:
        score = 1
    if risk_score > 0.30:
        score = 2

    return {
        "score": score,
        "max": 2,
        "risk_score": round(risk_score, 4),
        "description": (
            "Stable — no significant change" if score == 0 else
            "Moderate change detected" if score == 1 else
            "Significant evolution — recommend evaluation"
        ),
    }


# ── Main entry ───────────────────────────────────────────────────

def compute_abcde(image_rgb: np.ndarray, risk_score: float = None) -> dict:
    """
    image_rgb  : uint8 (H, W, 3)
    risk_score : optional float from LesionChangeAnalyzer for Evolution
    Returns    : full ABCDE dict including total score and risk tier
    """
    img  = _load(image_rgb)
    mask = _segment(img)

    A = score_asymmetry(mask)
    B = score_border(mask)
    C = score_color(img, mask)
    D = score_diameter(mask)
    E = score_evolution(risk_score)

    total = A["score"] + B["score"] + C["score"] + D["score"] + E["score"]
    max_t = 10

    tier = "LOW"
    if total >= 4:
        tier = "MEDIUM"
    if total >= 7:
        tier = "HIGH"

    return {
        "asymmetry":  A,
        "border":     B,
        "color":      C,
        "diameter":   D,
        "evolution":  E,
        "total":      total,
        "max":        max_t,
        "tier":       tier,
        "description": (
            f"ABCDE score {total}/{max_t} — "
            + ("Low concern" if tier == "LOW" else
               "Moderate concern — consider monitoring" if tier == "MEDIUM" else
               "High concern — professional evaluation recommended")
        ),
    }