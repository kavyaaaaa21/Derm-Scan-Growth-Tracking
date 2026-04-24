"""
DermScan API v4 
That is we are working on the backend of the given project
"""

from dotenv import load_dotenv
load_dotenv()
import os,io,base64
from datetime import datetime

import numpy as np
from PIL import Image
import cv2
from fastapi import FastAPI, File, UploadFile, Form,HTTPException,Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import uvicorn

from model.inference import load_model,predict_image
from model.gradcam import GradCAMEngine
from model.tracker import LesionChangeAnalyzer
from model.abcde import compute_abcde
from model.report import generate_report
from database import get_db,create_tables,Patient,Visit
from auth import auth_router,get_current_user,User
from analytics import get_analytics

def _parse_cors_origins(raw_value: str) -> list[str]:
    origins = [origin.strip() for origin in raw_value.split(",") if origin.strip()]
    return origins or ["http://localhost:3000"]

ALLOWED_ORIGINS = _parse_cors_origins(
    os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
)

app = FastAPI(title="DermScan API",version="4.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)

MODEL=None
GRADCAM_ENG=None
ANALYZER=LesionChangeAnalyzer()
MODEL_PATH=os.getenv("MODEL_PATH","./dermscan_2019.keras")
IMG_SIZE = 224
BINARY_NAMES = ["Benign", "Requires Professional Consultation"]
MULTI_CLASS_FULL = {
    "MEL":"Melanoma","NV":"Melanocytic Nevus","BCC":"Basal Cell Carcinoma",
    "AK":"Actinic Keratosis","BKL":"Benign Keratosis-like","DF":"Dermatofibroma",
    "VASC":"Vascular Lesion","SCC":"Squamous Cell Carcinoma","UNK":"Unknown",
}
MALIGNANT_CLASSES = {"MEL","BCC","AK","SCC"}
@app.on_event("startup")
async def startup():
    global MODEL,GRADCAM_ENG
    create_tables()
    MODEL,loaded=load_model(MODEL_PATH)
    if loaded:
        GRADCAM_ENG=GradCAMEngine(MODEL)
        print("Model+Grad-CAM ready")
    else:
        GRADCAM_ENG=None
        print("Demo Mode")

def _read_image(upload):
    data=upload.file.read()
    return np.array(Image.open(io.BytesIO(data)).convert("RGB"),dtype=np.uint8)

def _np_to_b64(arr,fmt="PNG"):
    buf=io.BytesIO()
    Image.fromarray(arr.astype(np.uint8)).save(buf,format=fmt)
    return base64.b64encode(buf.getvalue()).decode()

def _resize(arr,size=IMG_SIZE):
    return np.array(Image.fromarray(arr).resize((size,size)))

def _simulate_multiclass(prob):
    import random
    rng=random.Random(int(prob*1e6))
    if prob>=0.5:
        base={"MEL":0.4,"BCC":0.25,"AK":0.15,"SCC":0.08,"NV":0.05,"BKL":0.03,"DF":0.02,"VASC":0.01,"UNK":0.01}
    else:
        base={"NV":0.50,"BKL":0.20,"DF":0.10,"VASC":0.08,"UNK":0.05,"MEL":0.03,"BCC":0.02,"AK":0.01,"SCC":0.01}
    noisy={k:max(0,v+rng.uniform(-0.02,0.02)) for k,v in base.items()}
    total=sum(noisy.values())
    norm={k:v/total for k,v in noisy.items()}
    return sorted([{"code":k,"name":MULTI_CLASS_FULL[k],"probability":round(v,4),"malignant":k in MALIGNANT_CLASSES} for k,v in norm.items()],key=lambda x:x["probability"],reverse=True)

@app.get("/api/health")
def health():
    return {"status":"ok","model_loaded":MODEL is not None,"version":"4.0.0"}



@app.post("/api/predict")
async def predict(file:UploadFile=File(...)):
    img=_resize(_read_image(file))
    label,conf,prob=predict_image(MODEL,img,IMG_SIZE)
    return{"prediction":BINARY_NAMES[label],"label":label,"confidence":round(conf,4),
            "probability":round(prob,4),"image_b64":_np_to_b64(img),
            "abcde":compute_abcde(img),"multiclass":_simulate_multiclass(prob)}

@app.post("/api/gradcam")
async def gradcam(file:UploadFile=File(...)):
    img=_resize(_read_image(file))
    label,conf,prob=predict_image(MODEL,img,IMG_SIZE)
    overlay_b64=heatmap_b64=None
    if GRADCAM_ENG:
        try:
            hm,overlay=GRADCAM_ENG.compute(img)
            overlay_b64=_np_to_b64(overlay)
            hm_color=cv2.applyColorMap((hm*255).astype(np.uint8),cv2.COLORMAP_JET)
            heatmap_b64=_np_to_b64(cv2.cvtColor(hm_color,cv2.COLOR_BGR2RGB))
        except Exception as e:
            print(f"Grad-CAM error:{e}")
    return{"prediction":BINARY_NAMES[label],"label":label,"confidence":round(conf,4),
           "probability":round(prob,4),"original_b64":_np_to_b64(img),
           "overlay_b64":overlay_b64,"heatmap_b64":heatmap_b64,
           "abcde":compute_abcde(img),"multiclass":_simulate_multiclass(prob)}

@app.post("/api/compare")
async def compare(before:UploadFile=File(...),after:UploadFile=File(...),
                  date_before:str=Form("Visit 1"),date_after:str=Form("Visit 2")):
    img_b=_read_image(before);img_a=_read_image(after)
    rpt=ANALYZER.analyze(img_b,img_a,date_before=date_before,date_after=date_after)
    diff=cv2.absdiff(cv2.cvtColor(rpt["img_before"],cv2.COLOR_RGB2GRAY),
                     cv2.cvtColor(rpt["img_after"],cv2.COLOR_RGB2GRAY))
    diff_rgb=cv2.cvtColor(cv2.applyColorMap(diff,cv2.COLORMAP_HOT),cv2.COLOR_BGR2RGB)
    return{"risk_score":round(rpt["risk_score"],4),"risk_level":rpt["risk_level"],
           
           "alert":rpt["alert"],"date_before":rpt["date_before"],"date_after":rpt["date_after"],
           "deltas":{k:round(v,6)for k,v in rpt["deltas"].items()},
           "before_b64":_np_to_b64(_resize(rpt["img_before"])),
           "after_b64":_np_to_b64(_resize(rpt["img_after"])),
           "diff_b64":_np_to_b64(cv2.resize(diff_rgb, (IMG_SIZE, IMG_SIZE))),
           "mask_before_b64":_np_to_b64(cv2.resize(rpt["before_feats"]["mask"],(IMG_SIZE,IMG_SIZE))),
           "mask_after_b64":_np_to_b64(cv2.resize(rpt["after_feats"]["mask"],(IMG_SIZE,IMG_SIZE))),
            "abcde":compute_abcde(_resize(img_a),risk_score=rpt["risk_score"])
           }
@app.post("/api/report")
async def make_report(file: UploadFile=File(...), patient_id: str=Form("Unknown"),
                      visit_date: str=Form(""), include_gradcam: str=Form("true")):
    img = _resize(_read_image(file))
    label, conf, prob = predict_image(MODEL, img, IMG_SIZE)
    abcde = compute_abcde(img)
    overlay_b64 = None
    if include_gradcam.lower()=="true" and GRADCAM_ENG:
        try:
            _, overlay = GRADCAM_ENG.compute(img)
            overlay_b64 = _np_to_b64(overlay)
        except Exception as e:
            print(f"Grad-CAM report error:{e}")
    pdf_bytes = generate_report(
        patient_id=patient_id, visit_date=visit_date or datetime.now().strftime("%Y-%m-%d"),
        prediction=BINARY_NAMES[label], confidence=conf, probability=prob,
        abcde=abcde, original_b64=_np_to_b64(img), overlay_b64=overlay_b64)
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf",
        headers={"Content-Disposition":f"attachment; filename=dermscan_{patient_id}.pdf"})


@app.post("/api/patient/visit")
async def add_visit(patient_id:str=Form(...),date:str=Form(None),
                    body_location:str=Form(None),body_x:float=Form(None),
                    body_y:float=Form(None),file:UploadFile=File(...),
                    db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    img=_resize(_read_image(file))
    label,conf,prob=predict_image(MODEL,img,IMG_SIZE)
    visit_date=date or datetime.now().strftime("%Y-%m-%d")
    patient=db.query(Patient).filter(Patient.id==patient_id,Patient.owner_id==current_user.id).first()
    if not patient:
        patient=Patient(id=patient_id,owner_id=current_user.id)
        db.add(patient);db.commit()
    abcde_dict = compute_abcde(img)
    prev_visits = db.query(Visit).filter(Visit.patient_id==patient_id).order_by(Visit.visit_date.desc()).all()
    change_dict = None
    if prev_visits and prev_visits[0].image_b64:
        prev_img = np.array(Image.open(io.BytesIO(base64.b64decode(prev_visits[0].image_b64))).convert("RGB"),dtype=np.uint8)
        rpt = ANALYZER.analyze(prev_img, img, date_before=prev_visits[0].visit_date, date_after=visit_date)
        change_dict = {"risk_score":round(rpt["risk_score"],4),"risk_level":rpt["risk_level"],
                       "alert":rpt["alert"],"date_before":rpt["date_before"],"date_after":rpt["date_after"],
                       "deltas":{k:round(v,6) for k,v in rpt["deltas"].items()}}
        abcde_dict = compute_abcde(img, risk_score=rpt["risk_score"])
    visit = Visit(patient_id=patient_id, visit_date=visit_date,
                  prediction=BINARY_NAMES[label], confidence=round(conf,4),
                  probability=round(prob,4), image_b64=_np_to_b64(img),
                  abcde_json=abcde_dict, change_json=change_dict,
                  body_location=body_location, body_x=body_x, body_y=body_y)
    db.add(visit); db.commit(); db.refresh(visit)
    return {"patient_id":patient_id,"visit_id":visit.id,"visit_date":visit_date,
            "prediction":BINARY_NAMES[label],"confidence":round(conf,4),
            "image_b64":_np_to_b64(img),"abcde":abcde_dict,"change":change_dict,
            "total_visits":len(prev_visits)+1}
@app.get("/api/patient/{patient_id}")
def get_patient(patient_id: str, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id==patient_id,Patient.owner_id==current_user.id).first()
    if not patient: raise HTTPException(404,"Patient not found")
    return {"patient_id":patient_id,"visits":[
        {"id":v.id,"date":v.visit_date,"prediction":v.prediction,"confidence":v.confidence,
         "image_b64":v.image_b64,"abcde":v.abcde_json,"change":v.change_json,
         "body_location":v.body_location,"body_x":v.body_x,"body_y":v.body_y}
        for v in sorted(patient.visits, key=lambda x:x.visit_date)]}
 
@app.get("/api/patients")
def list_patients(db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    patients = db.query(Patient).filter(Patient.owner_id==current_user.id).all()
    return {"patients":[{"id":p.id,"visits":len(p.visits)} for p in patients]}
 
@app.get("/api/analytics")
def analytics(db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    return get_analytics(db, owner_id=current_user.id)
 
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
