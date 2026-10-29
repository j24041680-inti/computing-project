# SchoolAir: Full-Stack AI Air Quality Hazard Prediction & School Event Decision Platform

**Unit Code:** COS30049 – Computing Technology Innovation Project  
**Assignment:** Assignment 3 – Full-Stack Web Development for AI Application  
**Academic Session:** Semester 2 (August 2026)  
**Group Identification:** Group 7 (Poh Wei Le, Ng Boon Ping, Kennard Chan Kai Lik, Tee Ming Jun)  
**Lecturer / Convenor:** Mohamad Faizal Alias  

---

## 1. System Overview

**SchoolAir** is a full-stack web application built with **React.js** and **D3.js** on the front end and **FastAPI** on the back end, integrating the trained **XGBoost** machine learning pipeline from Assignment 2 (`champion_regressor.joblib` and `champion_classifier.joblib`).

Designed for Malaysian primary and secondary school administrators, PE teachers, sports coordinators, and school health officers, SchoolAir removes the need for users to manually enter raw sensor lags or pollutant sub-indices. Instead, the backend uses the trained Assignment 2 XGBoost models to generate a comprehensive **7,488-record pre-computed hourly forecast & TreeSHAP attribution database** across all **26 DOE monitoring stations**, **12 months**, and **24 hours**, paired with **32 Haversine-matched Malaysian schools**. When a school or teacher selects any school/district, planned event date/month, time slot, and student vulnerability cohort, the predicted Air Pollutant Index (API), expected surface weather (`temperature`, `humidity`, `wind_speed`), Malaysian Ministry of Education (MOE) Circular No. 1/2019 safety directive, and interactive **D3.js visualizations** appear immediately.

---

## 2. Project Directory Structure

```text
Group7_Assignment3_SchoolAir/
│
├── README.md                                     <-- Full setup, architecture & API guide
├── start_schoolair.sh                            <-- One-click launcher for Backend + Frontend
│
├── backend/                                      <-- FastAPI Server & Packaged AI Model Pipeline
│   ├── main.py                                   <-- FastAPI REST API server (GET, POST, PUT, DELETE)
│   ├── generate_forecast_dataset.py              <-- Pre-computes XGBoost forecasts & TreeSHAP dataset
│   ├── requirements.txt                          <-- Pinned Python dependencies
│   ├── models/                                   <-- Serialized Assignment 2 XGBoost model binaries
│   │   ├── champion_regressor.joblib             <-- Champion XGBoost Regressor (MAE=6.9553, R²=0.6123)
│   │   ├── champion_classifier.joblib            <-- Cost-Weighted XGBoost Classifier (Acc=80.24%)
│   │   └── feature_columns.joblib                <-- Locked 12-feature input schema order
│   └── data/                                     <-- Pre-computed AI Forecast & Station Tables
│       ├── clean_locations.csv                   <-- 26 verified DOE monitoring station coordinates
│       ├── schools_directory.csv                 <-- 32 Malaysian schools bound via Haversine distance
│       ├── precomputed_hourly_forecasts.csv      <-- 7,488 hourly XGBoost forecasts & TreeSHAP values
│       ├── precomputed_monthly_summary.csv       <-- 312 monthly seasonal event planning summaries
│       ├── precomputed_multiday_episodes.csv     <-- 4,368 multi-day haze episode rows for D3 brush-zoom
│       ├── analytics_metadata.json               <-- Corridor Pearson correlation matrices & model metrics
│       └── scheduled_events.json                 <-- Persistent store for School Event Schedule CRUD
│
└── frontend/                                     <-- React.js + D3.js Front-End Web Application
    ├── package.json                              <-- React 19 & D3.js v7 dependencies
    ├── public/
    │   └── index.html                            <-- HTML root container
    └── src/
        ├── App.js                                <-- Main 4-view SPA controller & state management
        ├── App.css                               <-- Responsive desktop, tablet, mobile & print styles
        ├── utils/
        │   └── exportUtils.js                    <-- Client-side CSV & printable PDF report exporters
        └── components/
            └── charts/                           <-- 4 Custom Interactive D3.js Chart Components (HD)
                ├── SafetyGaugeD3.js              <-- Chart 1: Cohort-Aware Semicircle Safety Dial Gauge
                ├── DiurnalTrendD3.js             <-- Chart 2: 24h Diurnal Curve & 168h Brush-Zoom Trendline
                ├── ShapAttributionD3.js          <-- Chart 3: TreeSHAP Feature Attribution Bar Chart
                └── SeasonalHeatmapD3.js          <-- Chart 4: 12-Month Station Risk & Correlation Heatmap
```

---

## 3. Prerequisites & Installation Instructions

### 3.1 Back-End Setup (FastAPI + XGBoost)

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Activate the pre-configured virtual environment (or create a new one):
   ```bash
   source .venv/bin/activate
   ```
   *(If setting up on a fresh machine: `python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`)*
3. *(Optional)* Regenerate the pre-computed forecast datasets from the Assignment 2 models:
   ```bash
   python generate_forecast_dataset.py
   ```
4. Start the FastAPI server on `http://localhost:8000`:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   * Interactive Swagger API Documentation is automatically available at: `http://localhost:8000/docs`

### 3.2 Front-End Setup (React.js + D3.js)

1. Open a new terminal window and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install Node.js dependencies (if `node_modules` is not already present):
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the React development server on `http://localhost:3000`:
   ```bash
   npm start
   ```

---

## 4. Key Features & High Distinction (HD) Capabilities

1. **Four Interactive D3.js Visualizations (Pure D3.js):**
   * **Chart 1 (`SafetyGaugeD3.js`):** Semicircle dial gauge with animated needle transitions and hoverable MOE safety zone arcs that dynamically resize when switching between *General*, *Athletic*, and *Asthmatic* student cohorts.
   * **Chart 2 (`DiurnalTrendD3.js`):** Dual-mode interactive time-series chart providing a clickable 24-hour diurnal event window optimizer on the Safety Checker page and a **168-hour Focus + Context `d3.brushX` Brush-Zoom chart** on the Analytics Dashboard.
   * **Chart 3 (`ShapAttributionD3.js`):** Interactive horizontal bar chart displaying exact XGBoost `pred_contribs=True` TreeSHAP attributions, toggleable between *% Impact Share* and *Signed API Shift (± API pts)*.
   * **Chart 4 (`SeasonalHeatmapD3.js`):** Interactive matrix visualization switching between the **26-Station × 12-Month Seasonal Event Risk Heatmap** (with click-to-inspect drill-down) and the **7×7 Pearson Correlation Matrix (`r`)** across corridors.
2. **Pre-Computed Lookup + Hybrid Live Model Execution:**
   * Teachers and school administrators never need to guess technical lag features—selecting a Malaysian school, date/month, time slot, and activity immediately retrieves the pre-computed forecast and weather profile.
   * Includes a collapsible **What-If Weather & Boundary Validation Stress Tester** that runs live `champion_regressor.joblib` inference and demonstrates client/server MAAQS input validation.
3. **Full RESTful CRUD Event Schedule Manager (`GET`, `POST`, `PUT`, `DELETE`) & CSV Export:**
   * Schools can save planned outdoor events (`POST /api/v1/events`), auto-reschedule risky events to the cleanest morning hour or optimal month (`PUT /api/v1/events/{id}`), delete cancelled events (`DELETE /api/v1/events/{id}`), and export CSV or print-ready PDF compliance reports.

---

## 5. REST API Endpoint Summary

| HTTP Method | Endpoint Route | Description |
| :--- | :--- | :--- |
| **GET** | `/api/v1/health` | Returns server status, loaded `.joblib` model metadata, and pre-computed dataset counts. |
| **GET** | `/api/v1/stations` | Returns all 26 DOE monitoring stations, 4 regional corridors, and 32 Haversine-matched schools. |
| **GET** | `/api/v1/forecast-lookup` | Instant lookup of predicted 24h API, MOE safety tier, weather outlook, 24h diurnal curve, and TreeSHAP values for a selected school/district, date/month, hour, and cohort. |
| **POST** | `/api/v1/assess-event` | Evaluates an outdoor school event payload with full Pydantic MAAQS boundary validation and live XGBoost What-If override support. |
| **GET** | `/api/v1/seasonal-planner` | Returns the 12-month seasonal air quality calendar, optimal month recommendation, and monsoon haze warnings for a selected district and cohort. |
| **GET** | `/api/v1/analytics` | Supplies multi-day episode series, 26-station × 12-month heatmap cells, and Pearson correlation matrices for the D3.js Analytics Dashboard. |
| **GET** | `/api/v1/events` | Lists all scheduled school outdoor events with their attached AI safety assessments. |
| **POST** | `/api/v1/events` | Creates a new scheduled school outdoor event and automatically attaches its AI forecast. |
| **PUT** | `/api/v1/events/{event_id}` | Updates or reschedules an existing school event (e.g., shifting to the cleanest morning hour or optimal month) and recomputes its AI safety badge. |
| **DELETE** | `/api/v1/events/{event_id}` | Removes a scheduled school event from the calendar. |
