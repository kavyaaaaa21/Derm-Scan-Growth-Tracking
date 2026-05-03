"""
model/report.py
Generates a clinical PDF report for a DermScan analysis result.
Uses reportlab — install with: pip install reportlab
"""

import io
import base64
from datetime import datetime

import numpy as np
from PIL import Image as PILImage

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image as RLImage, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


# ── Colour palette ───────────────────────────────────────────────
DS_DARK   = colors.HexColor("#070C14")
DS_CARD   = colors.HexColor("#111F34")
DS_TEAL   = colors.HexColor("#00D9C0")
DS_RED    = colors.HexColor("#FF4C6A")
DS_AMBER  = colors.HexColor("#FFB347")
DS_GREEN  = colors.HexColor("#3DDC84")
DS_MUTED  = colors.HexColor("#6B8CAE")
DS_TEXT   = colors.HexColor("#D8E8FF")
DS_WHITE  = colors.white
DS_BLACK  = colors.black

RISK_COLOR = {"LOW": DS_GREEN, "MEDIUM": DS_AMBER, "HIGH": DS_RED}
TIER_COLOR = {"LOW": DS_GREEN, "MEDIUM": DS_AMBER, "HIGH": DS_RED}


def _b64_to_rl_image(b64str: str, width_mm: float, height_mm: float):
    """Convert base64 PNG/JPEG to a ReportLab Image flowable."""
    data = base64.b64decode(b64str)
    buf  = io.BytesIO(data)
    return RLImage(buf, width=width_mm * mm, height=height_mm * mm)


def _np_to_rl_image(arr: np.ndarray, width_mm: float, height_mm: float):
    buf = io.BytesIO()
    PILImage.fromarray(arr.astype(np.uint8)).save(buf, format="PNG")
    buf.seek(0)
    return RLImage(buf, width=width_mm * mm, height=height_mm * mm)


def _styles():
    base = getSampleStyleSheet()
    def make(name, **kw):
        return ParagraphStyle(name, parent=base["Normal"], **kw)

    return {
        "title":    make("DSTitle",  fontSize=22, textColor=DS_TEAL,
                         fontName="Helvetica-Bold", spaceAfter=2),
        "subtitle": make("DSSub",    fontSize=10, textColor=DS_MUTED,
                         fontName="Helvetica",    spaceAfter=6),
        "h2":       make("DSH2",     fontSize=13, textColor=DS_TEXT,
                         fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=4),
        "body":     make("DSBody",   fontSize=9,  textColor=DS_TEXT,
                         fontName="Helvetica",    leading=14),
        "small":    make("DSSmall",  fontSize=8,  textColor=DS_MUTED,
                         fontName="Helvetica"),
        "warning":  make("DSWarn",   fontSize=9,  textColor=DS_AMBER,
                         fontName="Helvetica-Bold"),
        "center":   make("DSCenter", fontSize=9,  textColor=DS_TEXT,
                         fontName="Helvetica",    alignment=TA_CENTER),
        "mono":     make("DSMono",   fontSize=8,  textColor=DS_TEAL,
                         fontName="Courier"),
    }


def _section_header(title: str, s):
    return [
        HRFlowable(width="100%", thickness=0.5, color=DS_TEAL, spaceAfter=3),
        Paragraph(title.upper(), s["h2"]),
    ]


def _kv_table(rows: list[tuple], col_widths=None):
    """Simple 2-column key-value table."""
    col_widths = col_widths or [60 * mm, 110 * mm]
    data = [[Paragraph(f"<b>{k}</b>", ParagraphStyle("kh", fontSize=8,
             textColor=DS_MUTED, fontName="Helvetica-Bold")),
             Paragraph(str(v), ParagraphStyle("kv", fontSize=9,
             textColor=DS_TEXT, fontName="Helvetica"))]
            for k, v in rows]
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("VALIGN",      (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING",  (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING",(0,0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


# ── Main builder ─────────────────────────────────────────────────

def generate_report(
    *,
    patient_id:   str,
    visit_date:   str,
    prediction:   str,
    confidence:   float,
    probability:  float,
    abcde:        dict | None = None,
    change:       dict | None = None,
    original_b64: str | None  = None,
    overlay_b64:  str | None  = None,
    generated_by: str = "DermScan v3 · EfficientNetB3 · ISIC 2019",
) -> bytes:
    """
    Build the PDF and return raw bytes.
    All image inputs are base64-encoded PNG strings.
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize     = A4,
        leftMargin   = 20 * mm,
        rightMargin  = 20 * mm,
        topMargin    = 18 * mm,
        bottomMargin = 18 * mm,
    )
    s   = _styles()
    W   = A4[0] - 40 * mm     # usable width
    story = []

    # ── Header ─────────────────────────────────────────────────
    story += [
        Paragraph("DERMSCAN", s["title"]),
        Paragraph("AI-Assisted Skin Lesion Analysis Report", s["subtitle"]),
        HRFlowable(width="100%", thickness=1.5, color=DS_TEAL, spaceAfter=8),
    ]

    # Patient / visit info
    story += _section_header("Patient Information", s)
    story.append(_kv_table([
        ("Patient ID",      patient_id),
        ("Visit Date",      visit_date),
        ("Report Generated", datetime.now().strftime("%Y-%m-%d %H:%M")),
        ("System",          generated_by),
    ]))
    story.append(Spacer(1, 6 * mm))

    # ── AI Prediction ──────────────────────────────────────────
    story += _section_header("AI Classification", s)
    is_mal   = prediction != "Benign"
    pred_clr = DS_RED if is_mal else DS_GREEN

    pred_data = [
        [Paragraph("<b>Prediction</b>", ParagraphStyle("ph", fontSize=9,
                    textColor=DS_MUTED, fontName="Helvetica-Bold")),
         Paragraph(f"<font color='#{('%02x%02x%02x' % (int(pred_clr.red*255), int(pred_clr.green*255), int(pred_clr.blue*255)))}'>"
                   f"<b>{prediction}</b></font>",
                   ParagraphStyle("pv", fontSize=11, fontName="Helvetica-Bold"))],
        [Paragraph("<b>Confidence</b>", ParagraphStyle("ph2", fontSize=9,
                    textColor=DS_MUTED, fontName="Helvetica-Bold")),
         Paragraph(f"{round(confidence*100)}%",
                   ParagraphStyle("pv2", fontSize=11, fontName="Helvetica"))],
        [Paragraph("<b>Malignancy Probability</b>", ParagraphStyle("ph3", fontSize=9,
                    textColor=DS_MUTED, fontName="Helvetica-Bold")),
         Paragraph(f"{round(probability*100)}%",
                   ParagraphStyle("pv3", fontSize=11, fontName="Helvetica"))],
    ]
    pt = Table(pred_data, colWidths=[60*mm, 110*mm])
    pt.setStyle(TableStyle([
        ("VALIGN",       (0,0),(-1,-1),"MIDDLE"),
        ("TOPPADDING",   (0,0),(-1,-1), 5),
        ("BOTTOMPADDING",(0,0),(-1,-1), 5),
        ("LEFTPADDING",  (0,0),(-1,-1), 0),
        ("BACKGROUND",   (0,0),(-1,-1), colors.HexColor("#0D1625")),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[colors.HexColor("#111F34"),
                                          colors.HexColor("#0D1625")]),
        ("ROUNDEDCORNERS", (0,0),(-1,-1), 4),
    ]))
    story.append(pt)
    story.append(Spacer(1, 6*mm))

    # ── Images ────────────────────────────────────────────────
    if original_b64 or overlay_b64:
        story += _section_header("Lesion Images", s)
        img_row = []
        captions = []
        if original_b64:
            img_row.append(_b64_to_rl_image(original_b64, 75, 75))
            captions.append("Original Image")
        if overlay_b64:
            img_row.append(_b64_to_rl_image(overlay_b64, 75, 75))
            captions.append("Grad-CAM Attention Overlay")

        img_table = Table(
            [img_row,
             [Paragraph(c, s["center"]) for c in captions]],
            colWidths=[85*mm] * len(img_row)
        )
        img_table.setStyle(TableStyle([
            ("ALIGN", (0,0),(-1,-1), "CENTER"),
            ("VALIGN",(0,0),(-1,-1), "MIDDLE"),
        ]))
        story.append(img_table)
        story.append(Spacer(1, 6*mm))

    # ── ABCDE ─────────────────────────────────────────────────
    if abcde:
        story += _section_header("ABCDE Criteria Assessment", s)

        tier_clr = TIER_COLOR.get(abcde["tier"], DS_MUTED)
        story.append(Paragraph(
            f"Total Score: <b>{abcde['total']}/{abcde['max']}</b>"
            f"  —  Tier: <b>{abcde['tier']}</b>",
            s["body"]
        ))
        story.append(Spacer(1, 3*mm))

        criteria_keys = ["asymmetry", "border", "color", "diameter", "evolution"]
        criteria_labels = {
            "asymmetry": "A — Asymmetry",
            "border":    "B — Border",
            "color":     "C — Color",
            "diameter":  "D — Diameter",
            "evolution": "E — Evolution",
        }
        abcde_data = [
            [Paragraph("<b>Criterion</b>", ParagraphStyle("ah", fontSize=8,
                        textColor=DS_MUTED, fontName="Helvetica-Bold")),
             Paragraph("<b>Score</b>", ParagraphStyle("ah2", fontSize=8,
                        textColor=DS_MUTED, fontName="Helvetica-Bold", alignment=TA_CENTER)),
             Paragraph("<b>Finding</b>", ParagraphStyle("ah3", fontSize=8,
                        textColor=DS_MUTED, fontName="Helvetica-Bold"))]
        ]
        for k in criteria_keys:
            c = abcde.get(k, {})
            sc = c.get("score", 0)
            sc_clr = DS_RED if sc == 2 else DS_AMBER if sc == 1 else DS_GREEN
            abcde_data.append([
                Paragraph(criteria_labels[k], ParagraphStyle("ak", fontSize=9,
                           textColor=DS_TEXT, fontName="Helvetica")),
                Paragraph(f"<b>{sc}/2</b>", ParagraphStyle("av", fontSize=9,
                           textColor=sc_clr, fontName="Helvetica-Bold",
                           alignment=TA_CENTER)),
                Paragraph(c.get("description", "—"), ParagraphStyle("ad", fontSize=8,
                           textColor=DS_MUTED, fontName="Helvetica")),
            ])

        at = Table(abcde_data, colWidths=[55*mm, 18*mm, 97*mm])
        at.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,0),  colors.HexColor("#0D1625")),
            ("ROWBACKGROUNDS",(0,1),(-1,-1), [colors.HexColor("#111F34"),
                                               colors.HexColor("#0D1625")]),
            ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
            ("TOPPADDING",    (0,0),(-1,-1), 5),
            ("BOTTOMPADDING", (0,0),(-1,-1), 5),
            ("LEFTPADDING",   (0,0),(-1,-1), 6),
            ("ALIGN",         (1,0),(1,-1),  "CENTER"),
        ]))
        story.append(at)
        story.append(Spacer(1, 6*mm))

    # ── Change Analysis ────────────────────────────────────────
    if change:
        story += _section_header("Lesion Change Analysis", s)
        rc = RISK_COLOR.get(change.get("risk_level","LOW"), DS_MUTED)
        story.append(_kv_table([
            ("Risk Level",    change.get("risk_level","—")),
            ("Risk Score",    str(round(change.get("risk_score", 0), 4))),
            ("Alert",         "YES — Consult recommended" if change.get("alert") else "No"),
            ("Date Range",    f"{change.get('date_before','—')} → {change.get('date_after','—')}"),
        ]))
        story.append(Spacer(1, 6*mm))

    # ── Disclaimer ─────────────────────────────────────────────
    story += _section_header("Clinical Disclaimer", s)
    story.append(Paragraph(
        "<b>IMPORTANT:</b> This report is generated by an AI screening tool and does NOT "
        "constitute a medical diagnosis. DermScan is intended to assist clinical decision-making "
        "and should not replace professional dermatological examination. All findings must be "
        "interpreted by a licensed medical professional in conjunction with clinical history, "
        "physical examination, and other relevant investigations.",
        s["warning"]
    ))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        "Model: EfficientNetB3 trained on ISIC 2019 (25,331 images, 9 classes).  "
        "Binary mapping: MEL/BCC/AK/SCC → Requires Consultation | NV/BKL/DF/VASC/UNK → Benign.",
        s["small"]
    ))

    doc.build(story)
    return buf.getvalue()