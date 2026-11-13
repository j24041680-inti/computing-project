# SchoolAir: Full-Stack AI Air Quality Hazard Prediction & School Event Decision Platform

**Unit Code:** COS30049 – Computing Technology Innovation Project  
**Assignment:** Assignment 3 – Full-Stack Web Development for AI Application  
**Academic Session:** Semester 2 (2026)  
**Group Identification:** Group 7 (Poh Wei Le, Ng Boon Ping, Kennard Chan Kai Lik, Tee Ming Jun)  
**Convenor / Lecturer:** Mohamad Faizal Alias  

Running the submission ZIP? Start with the [Windows setup](#3-first-time-setup-on-windows-powershell) or the [macOS and Linux setup](#4-setup-on-macos-and-linux).

---

## 1. System Overview

**SchoolAir** helps Malaysian schools plan outdoor events using historical air-quality estimates and interactive charts.

The platform bridges trained **XGBoost** regression and classification models with a modern, responsive web stack:
- **Frontend:** React 19, Material UI (MUI), and four custom D3.js (v7) visualization engines.
- **Backend:** FastAPI REST server with Pydantic request validation.
- **Machine Learning Core:** Packaged XGBoost models (`champion_regressor.json`, `champion_classifier.json`) and precomputed seasonal estimates for the 26 DOE monitoring stations in the project dataset. On-demand inference uses stored seasonal features.
- **School Event Guidance:** The app maps estimated Air Pollutant Index (API) values to event guidance. The backend supports thresholds for three student cohorts, listed in Section 8.

---

## 2. Repository Directory Structure

```text
computing-project/
├── README.md                                     <-- Complete project documentation & execution guide
├── start_schoolair.sh                            <-- One-click macOS / Linux launch script
│
├── backend/                                      <-- FastAPI Server & AI Model Serving
│   ├── main.py                                   <-- REST API, model inference, and event scheduling
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
        │   └── exportUtils.js                    <-- CSV export utilities
        └── components/
            ├── SafetyPrintReport.js              <-- Printable Safety Checker report
            └── charts/                           <-- D3.js charts and shared tooltip
                ├── ChartPointReadout.js          <-- Shared tooltip for the curves, heatmap, and SHAP chart
                ├── SafetyGaugeD3.js              <-- Semicircle dial gauge with animated needle
                ├── DiurnalTrendD3.js             <-- 24h diurnal curve & 168h Focus+Context brush-zoom
                ├── ShapAttributionD3.js          <-- TreeSHAP feature attribution bar chart
                └── SeasonalHeatmapD3.js          <-- 12-month regional station heatmap
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
   - Seasonal estimate lookup by station, event date, start hour, and activity.
   - Semicircle safety gauge with dynamic MOE threshold sectors.
   - 24-hour diurnal risk curve highlighting the safest clean-air window.
   - TreeSHAP feature attributions showing which inputs contribute to the stored prediction.
   - Optional **Run Model Prediction** button reruns XGBoost with stored historical features for the selected event hours and displays a separate result. Small differences can arise from rounded stored features.
   - Assessment CSV export and a printable report that can be saved as PDF from the browser.

2. **Event Planner View (`/planner`):**
   - Multi-year planning calendar (2026–2029) that reuses the historical monthly profiles across planning years.
   - Monthly risk and planning recommendations, plus side-by-side comparison of two stations for the selected month and start hour.
   - Create, reschedule, and delete saved events. Export monthly summaries and scheduled events as CSV files.

3. **Analytics Dashboard (`/analytics`):**
   - **12-Month Regional Heatmap** with station and corridor filters and cell details.
   - **7-Day Haze Trends** with a draggable time range for exploring historical readings and model predictions.
   - The Analytics API response also includes correlation data and model metrics.

---

## 7. REST API Endpoints

The backend provides full Swagger UI documentation at `http://localhost:8000/docs`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/v1/health` | Service status, station and forecast counts, and model metrics |
| **GET** | `/api/v1/stations` | List of 26 monitoring stations and 4 regional corridors |
| **GET** | `/api/v1/schools` | Returns school directory entries, with optional state, district, and corridor filters |
| **GET** | `/api/v1/forecast-lookup` | Retrieves precomputed hourly forecasts, MOE directive, and SHAP data |
| **GET** | `/api/v1/compare-districts` | Compares two stations for the same month and start hour |
| **POST** | `/api/v1/model-prediction` | Reruns the model using stored seasonal features; returns a separate prediction |
| **POST** | `/api/v1/assess-event` | Assesses an event from a JSON request, with optional API and weather input overrides |
| **GET** | `/api/v1/seasonal-planner` | Returns 12-month risk profiles and safest months for a given year |
| **GET** | `/api/v1/analytics` | Returns the historical time series, heatmap data, correlation matrix, and model metrics |
| **GET** | `/api/v1/events` | Retrieves all scheduled school outdoor events |
| **POST** | `/api/v1/events` | Creates a new scheduled school outdoor event |
| **PUT** | `/api/v1/events/{event_id}` | Updates or auto-reschedules an existing school outdoor event |
| **DELETE** | `/api/v1/events/{event_id}` | Deletes a scheduled event |

---

## 8. Safety Thresholds Used by SchoolAir

The backend applies the following thresholds to the estimated Air Pollutant Index. The Safety Checker uses the general cohort.

| Cohort | `SAFE` | `CAUTION` | `MOVE INDOORS` | `TOTAL SUSPENSION` |
| :--- | :--- | :--- | :--- | :--- |
| General | API ≤ 50 | Above 50 through 100 | Above 100 through 200 | Above 200 |
| High-intensity athletics | API ≤ 46 | Above 46 through 88 | Above 88 through 175 | Above 175 |
| Asthmatic and respiratory-sensitive students | API ≤ 42 | Above 42 through 75 | Above 75 through 150 | Above 150 |

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
