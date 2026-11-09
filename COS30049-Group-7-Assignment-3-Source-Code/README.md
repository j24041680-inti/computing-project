# SchoolAir: Full-Stack AI Air Quality Hazard Prediction & School Event Decision Platform

**Unit Code:** COS30049 – Computing Technology Innovation Project  
**Assignment:** Assignment 3 – Full-Stack Web Development for AI Application  
**Academic Session:** Semester 2 (2026)  
**Group Identification:** Group 7 (Poh Wei Le, Ng Boon Ping, Kennard Chan Kai Lik, Tee Ming Jun)  
**Convenor / Lecturer:** Mohamad Faizal Alias  

Running the submission ZIP? Start with the [Windows setup](#3-first-time-setup-on-windows-powershell) or the [macOS and Linux setup](#4-setup-on-macos-and-linux).

---

## 1. System Overview

**SchoolAir** is a production-grade full-stack web application integrating machine learning with interactive data visualization to safeguard Malaysian schoolchildren against urban air pollution and transboundary haze.

The platform bridges trained **XGBoost** regression and classification models with a modern, responsive web stack:
- **Frontend:** React 19, Material UI (MUI), and four custom D3.js (v7) visualization engines.
- **Backend:** High-performance FastAPI REST server with Pydantic boundary validation.
- **Machine Learning Core:** XGBoost universal cross-platform model boosters (`champion_regressor.json`, `champion_classifier.json`) serving precomputed hourly hazard forecasts across all 26 DOE air quality monitoring stations in Malaysia, with optional on-demand inference using stored seasonal features.
- **Regulatory Framework:** Evaluates student exposure against **Malaysian Ministry of Education (MOE) Circular No. 1/2019** and the **Malaysian Ambient Air Quality Standard (MAAQS)** across three student vulnerability cohorts (*Cohort A: General*, *Cohort B: High-Intensity Athletic*, *Cohort C: Asthmatic & Respiratory Sensitive*).

---

## 2. Repository Directory Structure

```text
computing-project/
├── README.md                                     <-- Complete project documentation & execution guide
├── start_schoolair.sh                            <-- One-click macOS / Linux launch script
│
├── backend/                                      <-- FastAPI Server & AI Model Serving
│   ├── main.py                                   <-- REST API server (CORS, CRUD, What-If simulation)
│   ├── generate_forecast_dataset.py              <-- Precomputes 7,488 hourly forecasts & TreeSHAP data
│   ├── requirements.txt                          <-- Python dependencies
│   ├── models/                                   <-- Machine learning models & feature mappings
│   │   ├── champion_regressor.json               <-- Universal cross-platform XGBoost Regressor
│   │   ├── champion_classifier.json              <-- Universal cross-platform XGBoost Classifier
│   │   ├── feature_columns.json                  <-- Input feature schema (12 features)
│   │   ├── champion_regressor.joblib             <-- Legacy pickle binary (fallback)
│   │   ├── champion_classifier.joblib            <-- Legacy pickle binary (fallback)
│   │   └── feature_columns.joblib                <-- Legacy feature schema (fallback)
│   └── data/                                     <-- Precomputed forecasts & station metadata
│       ├── clean_locations.csv                   <-- 26 DOE monitoring stations with GPS coordinates
│       ├── schools_directory.csv                 <-- 32 Malaysian schools matched via Haversine distance
│       ├── precomputed_hourly_forecasts.csv      <-- 7,488 hourly predictions & TreeSHAP attributions
│       ├── precomputed_monthly_summary.csv       <-- 312 monthly seasonal planning records
│       ├── precomputed_multiday_episodes.csv     <-- 4,368 multi-day haze time-series points
│       ├── analytics_metadata.json               <-- Regional correlation matrices & model evaluation
│       └── scheduled_events.json                 <-- Persistent JSON store for event scheduling CRUD
│
└── frontend/                                     <-- React.js + D3.js Web Application
    ├── package.json                              <-- React, MUI, and D3.js dependencies
    ├── package-lock.json
    ├── public/
    │   └── index.html                            <-- HTML entry point
    └── src/
        ├── App.js                                <-- Core SPA controller, multi-year state & routing
        ├── App.css                               <-- Responsive styling, mobile viewports & print styles
        ├── index.js                              <-- React DOM renderer
        ├── utils/
        │   └── exportUtils.js                    <-- CSV and printable PDF export utilities
        └── components/
            └── charts/                           <-- D3.js charts and shared tooltip
                ├── ChartPointReadout.js          <-- Shared tooltip for the curves, heatmap, and SHAP chart
                ├── SafetyGaugeD3.js              <-- Semicircle dial gauge with animated needle
                ├── DiurnalTrendD3.js             <-- 24h diurnal curve & 168h Focus+Context brush-zoom
                ├── ShapAttributionD3.js          <-- TreeSHAP feature attribution bar chart
                └── SeasonalHeatmapD3.js          <-- 12-month station risk & Pearson correlation matrix
```

---

## 3. First-Time Setup on Windows (PowerShell)

### Step 1. Install the prerequisites and extract the ZIP

- Install [Node.js 22](https://nodejs.org/en/download) and [64-bit Python 3.12](https://www.python.org/downloads/windows/). For a typical Intel or AMD laptop, choose the x64 installers.
- Make sure the Microsoft Visual C++ Redistributable is installed for XGBoost. The Windows download is linked in the [XGBoost installation guide](https://xgboost.readthedocs.io/en/stable/install.html#python).
- Right-click the submission ZIP and choose **Extract All**. Use a local folder you can write to. Open the extracted folder containing this README and the `backend` and `frontend` folders. You can open PowerShell there by typing `powershell` in File Explorer’s address bar and pressing Enter.

The ZIP includes the precomputed data and trained JSON models. The first-time dependency installation needs internet access.

In PowerShell, check that the tools are available:

```powershell
node --version
npm.cmd --version
py -3.12 --version
```

If `py` is unavailable and `python --version` shows Python 3.12, use `python -m venv .venv` in place of the `py -3.12 -m venv .venv` command below.

### Step 2. Start the backend in the first PowerShell window

Run these commands from the folder containing this README:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Leave this window open. The [health endpoint](http://localhost:8000/api/v1/health) should show `"status": "online"`. The [interactive API documentation](http://localhost:8000/docs) is also available.

### Step 3. Start the frontend in a second PowerShell window

Open the second window in the folder containing this README:

```powershell
cd frontend
npm.cmd ci --legacy-peer-deps
npm.cmd start
```

Leave this window open and go to [http://localhost:3000](http://localhost:3000). Check that the navigation bar shows **Online**. To verify XGBoost inference separately, go to **Safety Checker**, expand **Advanced model tools**, and click **Run Model Prediction**. A successful run shows a separate model prediction for the selected event.

### Start SchoolAir again later

From the folder containing this README, run the backend and frontend commands in separate PowerShell windows. Keep both windows open while using the app. Press **Ctrl+C** in each window to stop its server.

**Backend**

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

**Frontend**

```powershell
cd frontend
npm.cmd start
```

---

## 4. Setup on macOS and Linux

With Node.js 22 and Python 3.12 installed, open two terminals in the folder containing this README.

**Backend**

```bash
cd backend
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

**Frontend**

```bash
cd frontend
npm ci --legacy-peer-deps
npm start
```

Open [http://localhost:3000](http://localhost:3000). After setup, run just the server commands in their respective folders, or run `./start_schoolair.sh` from the folder containing this README.

---

## 5. Troubleshooting

| What you see | What to do |
| :--- | :--- |
| `node`, `npm.cmd`, or `py` is unrecognised | Reopen PowerShell after installing Node.js or Python so it picks up the updated paths. For Python, check the fallback in Step 1. |
| PowerShell says scripts are disabled | Use `npm.cmd` and run `.\.venv\Scripts\python.exe` directly, as shown above. |
| `No module named ...` | From `backend`, repeat the dependency installation with the virtual environment’s Python. |
| XGBoost reports a missing DLL | Check that the Microsoft Visual C++ Redistributable is installed, then restart the backend. See the [XGBoost Windows prerequisites](https://xgboost.readthedocs.io/en/stable/install.html#python). |
| The site shows **Offline** | Check that the backend window is still running on port 8000 and open the health endpoint from Step 2. |
| The site is online but **Run Model Prediction** fails | Check the backend terminal for model-loading messages and confirm `champion_regressor.json` and `champion_classifier.json` are present in `backend/models/`. |
| Port 8000 or 3000 is already in use | If another SchoolAir server is running in a terminal you opened, stop it with **Ctrl+C** and try again. If the React server starts on a different port, use the local URL it prints. Keep the backend on port 8000. |

---

## 6. Key Features & Visualizations

1. **Safety Checker View (`/checker`):**
   - Instant forecast lookup by State, District, Date, Hour, Cohort, and Activity.
   - Semicircle safety gauge with dynamic MOE threshold sectors.
   - 24-hour diurnal risk curve highlighting the safest clean-air window.
   - TreeSHAP feature attributions showing exact drivers of air quality.
   - Optional **Run Model Prediction** button reruns XGBoost with stored historical features for the selected event hours and displays a separate result. Main readings, charts, exports, and saved events continue to use the precomputed dataset. Small differences can arise from rounded stored features.

2. **Event Planner View (`/planner`):**
   - Multi-year planning calendar (2026, 2027, 2028, 2029). Each year reuses historical seasonal estimates; these are not year-specific forecasts.
   - District-level monthly risk bar chart and Monsoon hazard warnings.
   - Full RESTful Event Schedule Manager with Create, Edit, Reschedule, and Delete actions.
   - One-click CSV and print-ready PDF export.

3. **Analytics Dashboard (`/analytics`):**
   - 168-hour Focus + Context interactive brush-zoom time-series (`d3.brushX`).
   - 26-Station × 12-Month seasonal risk heatmap with drill-down inspector.
   - Inter-pollutant and weather Pearson correlation matrix.

---

## 7. REST API Endpoints

The backend provides full Swagger UI documentation at `http://localhost:8000/docs`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/v1/health` | Service status, station and forecast counts, and model metrics |
| **GET** | `/api/v1/stations` | List of 26 monitoring stations and 4 regional corridors |
| **GET** | `/api/v1/forecast-lookup` | Retrieves precomputed hourly forecasts, MOE directive, and SHAP data |
| **POST** | `/api/v1/model-prediction` | Reruns the model using stored seasonal features; returns a separate prediction |
| **POST** | `/api/v1/assess-event` | Evaluates event safety with optional live What-If weather overrides |
| **GET** | `/api/v1/seasonal-planner` | Returns 12-month risk profiles and safest months for a given year |
| **GET** | `/api/v1/analytics` | Provides time-series and correlation matrix data for D3.js charts |
| **GET** | `/api/v1/events` | Retrieves all scheduled school outdoor events |
| **POST** | `/api/v1/events` | Creates a new scheduled school outdoor event |
| **PUT** | `/api/v1/events/{event_id}` | Updates or auto-reschedules an existing school outdoor event |
| **DELETE** | `/api/v1/events/{event_id}` | Deletes a scheduled event |

---

## 8. Regulatory Reference (MOE Circular No. 1/2019)

SchoolAir operationalizes the **Ministry of Education Malaysia Circular No. 1/2019 (Surat Pekeliling Ikhtisas Bil. 1/2019: Panduan Pengurusan Cuaca Panas dan Jerebu di Sekolah)**:

| API Range | Air Quality Status | MOE SOP Directive | System Badge |
| :---: | :---: | :--- | :---: |
| **0 – 50** | Good | All outdoor PE, assemblies, and sporting events proceed normally. | `SAFE` |
| **51 – 100** | Moderate | Caution advised; shorten intense exertion; monitor respiratory-sensitive students. | `CAUTION` |
| **101 – 200** | Unhealthy | Mandatory cessation of outdoor sports & assemblies; relocate activities indoors. | `MOVE INDOORS` |
| **201 – 300** | Very Unhealthy | Complete suspension of outdoor activities; prepare campus closure protocols. | `TOTAL SUSPENSION` |
| **> 300** | Hazardous | Immediate school closure and transition to Home-Based Learning (PdPR). | `EMERGENCY CLOSURE` |

## Backend regression checks

Run from the folder containing this README after installing the backend dependencies.

**Windows PowerShell**

```powershell
.\backend\.venv\Scripts\python.exe -m unittest discover -s backend/tests -v
```

**macOS and Linux**

```bash
backend/.venv/bin/python -m unittest discover -s backend/tests -v
```

The checks cover invalid dates and query inputs, selected-month comparisons, live model inference, and unavailable-model responses. They do not write scheduled events.
