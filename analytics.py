"""
analytics.py
Aggregates statistics across all visits in the database.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import Visit,Patient,User

def get_analytics(db: Session, owner_id: str):
    # Example analytics: count of visits per patient
    visits_q=db.query(Visit)
    if owner_id:
        patient_ids=[p.id for p in db.query(Patient).filter(Patient.owner_id==owner_id).all()]
        visits_q=visits_q.filter(Visit.patient_id.in_(patient_ids))
    visits=visits_q.all()

    if not visits:
        return {
            "total_scans":         0,
            "total_patients":      0,
            "malignant_count":     0,
            "benign_count":        0,
            "malignancy_rate":     0.0,
            "high_risk_count":     0,
            "alert_count":         0,
            "avg_confidence":      0.0,
            "risk_distribution":   {"LOW": 0, "MEDIUM": 0, "HIGH": 0},
            "abcde_distribution":  [],
            "prediction_by_month": [],
            "top_body_locations":  [],

        }
    total=len(visits)
    malignant=sum(1 for v in visits if v.prediction and "Consulattaion" in v.prediction)
    benign=total-malignant
    confidences=[v.confidence for v in visits if v.confidence is not None]
    avg_conf=round(sum(confidences)/len(confidences),4) if confidences else 0.0

    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    alert_count = 0
    for v in visits:
        if v.change_json:
            lvl = v.change_json.get("risk_level", "LOW")
            risk_dist[lvl] = risk_dist.get(lvl, 0) + 1
            if v.change_json.get("alert"):
                alert_count += 1

    high_risk = risk_dist.get("HIGH", 0)

    # ABCDE total distribution
    abcde_scores = [v.abcde_json["total"] for v in visits
                    if v.abcde_json and "total" in v.abcde_json]
    abcde_dist = {}
    for sc in abcde_scores:
        abcde_dist[str(sc)] = abcde_dist.get(str(sc), 0) + 1
    abcde_distribution = [{"score": int(k), "count": v}
                           for k, v in sorted(abcde_dist.items(), key=lambda x: int(x[0]))]

    # Predictions by month
    month_map: dict[str, dict] = {}
    for v in visits:
        if not v.visit_date:
            continue
        month = v.visit_date[:7]  # YYYY-MM
        if month not in month_map:
            month_map[month] = {"month": month, "total": 0, "malignant": 0}
        month_map[month]["total"] += 1
        if v.prediction and "Consultation" in v.prediction:
            month_map[month]["malignant"] += 1
    prediction_by_month = sorted(month_map.values(), key=lambda x: x["month"])

    # Body locations
    loc_map: dict[str, int] = {}
    for v in visits:
        if v.body_location:
            loc_map[v.body_location] = loc_map.get(v.body_location, 0) + 1
    top_locations = sorted(
        [{"location": k, "count": c} for k, c in loc_map.items()],
        key=lambda x: x["count"], reverse=True
    )[:8]

    # Unique patients
    patient_ids = set(v.patient_id for v in visits)

    return {
        "total_scans":         total,
        "total_patients":      len(patient_ids),
        "malignant_count":     malignant,
        "benign_count":        benign,
        "malignancy_rate":     round(malignant / total, 4) if total else 0.0,
        "high_risk_count":     high_risk,
        "alert_count":         alert_count,
        "avg_confidence":      avg_conf,
        "risk_distribution":   risk_dist,
        "abcde_distribution":  abcde_distribution,
        "prediction_by_month": prediction_by_month,
        "top_body_locations":  top_locations,
    }
