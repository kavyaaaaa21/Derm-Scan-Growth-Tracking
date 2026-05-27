# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# DermScan v4 — AI Skin Lesion Analyzer

> Early-stage skin lesion screening powered by **EfficientNetB3 + ISIC 2019**,
> with Grad-CAM explainability, ABCDE scoring, PDF clinical reports,
> JWT authentication, PostgreSQL persistence, body map tagging, and an analytics dashboard.

---

## Feature Summary

| Week | Feature | Status |
|------|---------|--------|
| 1 | **ABCDE Criteria Scoring** — per-image A/B/C/D/E scored 0–2, total 0–10 | ✅ |
| 1 | **9-Class Probability Breakdown** — ranked bar chart for all ISIC classes | ✅ |
| 2 | **PDF Clinical Report** — patient info, images, ABCDE table, change deltas | ✅ |
| 4 | **JWT Authentication** — register / login / role-based access (clinician/researcher/admin) | ✅ |
| 4 | **PostgreSQL Persistence** — visits survive restarts; SQLite fallback for local dev | ✅ |
| 5 | **Body Map Location Tagging** — clickable SVG diagram with 22 anatomical regions | ✅ |
| 5 | **Analytics Dashboard** — KPIs, pie chart, bar chart, monthly trend line, top locations | ✅ |

---

## Project Structure

```
dermscan/
├── backend/
│   ├── main.py               ← FastAPI (all endpoints)
│   ├── auth.py               ← JWT register/login/me router
│   ├── database.py           ← SQLAlchemy ORM (User → Patient → Visit)
│   ├── analytics.py          ← Aggregate statistics
│   ├── model/
│   │   ├── inference.py      ← EfficientNetB3 loader + predictor
│   │   ├── gradcam.py        ← Grad-CAM (GradientTape)
│   │   ├── tracker.py        ← LesionChangeAnalyzer
│   │   ├── abcde.py          ← ABCDE criteria computer
│   │   └── report.py         ← ReportLab PDF generator
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx       ← JWT auth state + axios header
│   │   ├── pages/
│   │   │   ├── Home.jsx              ← Landing page
│   │   │   ├── Analyze.jsx           ← Analysis + ABCDE + multi-class + PDF
│   │   │   ├── Compare.jsx           ← Before/after change analysis
│   │   │   ├── Tracker.jsx           ← Patient timeline + body map
│   │   │   ├── Analytics.jsx         ← Stats dashboard (recharts)
│   │   │   └── Auth.jsx              ← Login / Register forms
│   │   └── components/
│   │       ├── Navbar.jsx            ← Nav with user menu / logout
│   │       ├── Footer.jsx
│   │       ├── ImageUploader.jsx
│   │       ├── ResultCard.jsx
│   │       ├── GradCAMViewer.jsx
│   │       ├── ChangeReport.jsx
│   │       ├── ABCDECard.jsx         ← Scored letter cards + ring
│   │       ├── MultiClassChart.jsx   ← 9-class horizontal bar chart
│   │       └── BodyMap.jsx           ← Clickable SVG body diagram
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml         ← postgres + backend + frontend
├── .env.example
└── README.md
```

---

## Quickstart

### 1. Configure environment
```bash
cp .env.example .env
# Edit .env — set DB_PASSWORD and JWT_SECRET
```

### 2. Add your model
```bash
mkdir -p models
cp /path/to/dermscan_2019.keras models/
```

### 3. Launch
```bash
docker-compose up --build
```

| Service   | URL                              |
|-----------|----------------------------------|
| Frontend  | http://localhost                 |
| API docs  | http://localhost:8000/docs       |
| Postgres  | localhost:5432 (internal only)   |

---

## Local Development (no Docker)

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Uses SQLite automatically when DATABASE_URL is not set
$env:JWT_SECRET="dev-secret"
python main.py   # → http://localhost:8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev      # → http://localhost:5173  (proxies /api → :8000)
```

---

## API Reference

### Auth
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Create account → returns JWT |
| `POST` | `/api/auth/login`    | Sign in → returns JWT |
| `GET`  | `/api/auth/me`       | Current user info |

### Analysis (public)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/predict` | Binary prediction + ABCDE + 9-class |
| `POST` | `/api/gradcam` | Same + Grad-CAM overlay |
| `POST` | `/api/compare` | Change analysis between two images |
| `POST` | `/api/report`  | Generate + stream PDF report |

### Patient records (requires JWT)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/patient/visit`       | Add visit (persisted to DB) |
| `GET`  | `/api/patient/{id}`        | Get patient timeline |
| `GET`  | `/api/patients`            | List all patients for current user |
| `GET`  | `/api/analytics`           | Aggregate stats for current user |

---

## ABCDE Scoring

Each criterion scored 0–2:

| Criterion | 0 | 1 | 2 |
|-----------|---|---|---|
| **A** Asymmetry | Symmetric | One axis | Both axes |
| **B** Border | Regular | Slightly irregular | Highly irregular |
| **C** Color | Uniform | 2 colors | 3+ colors |
| **D** Diameter | Small | Moderate | Large |
| **E** Evolution | Stable | Moderate Δ | Significant Δ |

Tiers: **LOW** (0–3) · **MEDIUM** (4–6) · **HIGH** (7–10)

---

## Demo Mode

If `dermscan_2019.keras` is absent, the backend returns plausible random predictions — the entire UI is explorable without a trained model.

---

## Deployment Notes

- **Railway / Render**: set `DATABASE_URL` and `JWT_SECRET` as env vars; deploy backend as Docker service, frontend as static site.
- **GPU inference**: swap `tensorflow` → `tensorflow[and-cuda]` in `requirements.txt`.
- **Production secrets**: always override `JWT_SECRET` and `DB_PASSWORD` with strong random values.

---

## Disclaimer

DermScan is a **research and educational tool** and does **not** provide medical diagnoses.
All outputs must be interpreted by a licensed dermatologist.
