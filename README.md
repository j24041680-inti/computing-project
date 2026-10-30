# SchoolAir: Full-Stack AI Air Quality Hazard Prediction & School Event Decision Platform

**Unit Code:** COS30049 – Computing Technology Innovation Project  
**Assignment:** Assignment 3 – Full-Stack Web Development for AI Application  
**Academic Session:** Semester 2 (2026)  
**Group Identification:** Group 7 (Poh Wei Le, Ng Boon Ping, Kennard Chan Kai Lik, Tee Ming Jun)  
**Convenor / Lecturer:** Mohamad Faizal Alias  

---

## 1. System Overview

**SchoolAir** is a production-grade full-stack web application integrating machine learning with interactive data visualization to safeguard Malaysian schoolchildren against urban air pollution and transboundary haze.

The platform bridges trained **XGBoost** regression and classification models with a modern, responsive web stack:
- **Frontend:** React 19, Material UI (MUI), and four custom D3.js (v7) visualization engines.
- **Backend:** High-performance FastAPI REST server with Pydantic boundary validation.
- **Machine Learning Core:** XGBoost universal cross-platform model boosters (`champion_regressor.json`, `champion_classifier.json`) serving precomputed hourly hazard forecasts across all 26 DOE air quality monitoring stations in Malaysia, alongside a live What-If scenario inference engine.
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
            └── charts/                           <-- Custom Interactive D3.js Visualizations
                ├── SafetyGaugeD3.js              <-- Semicircle dial gauge with animated needle
                ├── DiurnalTrendD3.js             <-- 24h diurnal curve & 168h Focus+Context brush-zoom
                ├── ShapAttributionD3.js          <-- TreeSHAP feature attribution bar chart
                └── SeasonalHeatmapD3.js          <-- 12-month station risk & Pearson correlation matrix
```

---

## 3. First-Time Setup Guide (From Scratch)

Follow these steps if you are setting up the project on a new computer.

### Step 3.1: Install Required Software
Ensure the following are installed:
1. **Git** or **GitHub Desktop**: [https://desktop.github.com/](https://desktop.github.com/)
2. **Node.js (LTS version 18, 20, or 22)**: [https://nodejs.org/](https://nodejs.org/) *(installs both `node` and `npm`)*
3. **Python (version 3.10, 3.11, or 3.12 recommended)**: [https://www.python.org/downloads/](https://www.python.org/downloads/)  
   *Windows Users:* During Python installation, make sure to check the box **"Add Python to PATH"**.

Verify installations in your terminal:
```bash
git --version
node -v
python --version
```

---

### Step 3.2: Clone or Pull the Repository
- **Using GitHub Desktop:** Click **File** > **Clone Repository**, select `computing-project`, and choose a local destination folder.
- **Using Git CLI:**
  ```bash
  git clone https://github.com/<your-username>/computing-project.git
  cd computing-project
  ```

---

### Step 3.3: Set Up the Backend (Python FastAPI)

1. Open a terminal in the project root and navigate to `backend`:
   ```bash
   cd backend
   ```

2. Create an isolated virtual environment (`.venv`):
   - **Windows:**
     ```powershell
     python -m venv .venv
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv .venv
     ```

3. Install required Python packages into `.venv`:
   - **Windows:**
     ```powershell
     .\.venv\Scripts\python.exe -m pip install --upgrade pip
     .\.venv\Scripts\python.exe -m pip install -r requirements.txt
     ```
   - **macOS / Linux:**
     ```bash
     source .venv/bin/activate
     pip install --upgrade pip
     pip install -r requirements.txt
     ```

4. Start the backend server:
   - **Windows (Direct path, avoids PowerShell script execution blocks):**
     ```powershell
     .\.venv\Scripts\python.exe -m uvicorn main:app --reload
     ```
   - **macOS / Linux:**
     ```bash
     source .venv/bin/activate
     uvicorn main:app --reload
     ```

5. Verify backend health:
   - Open your browser and navigate to: **[http://localhost:8000/docs](http://localhost:8000/docs)**
   - You should see the interactive Swagger UI and `[SchoolAir] Successfully initialized live XGBoost models.` in the terminal.
   - *Leave this terminal window running.*

---

### Step 3.4: Set Up the Frontend (React.js + D3.js)

1. Open a **second terminal window** and navigate to `frontend`:
   ```bash
   cd computing-project/frontend
   ```

2. Install JavaScript packages:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

4. Open the web app:
   - The browser will automatically open **[http://localhost:3000](http://localhost:3000)**.
   - The top navigation bar should display a green **Online** status badge.

---

## 4. Daily Running Commands (Subsequent Launches)

Once the first-time setup is complete, you only need to run the two servers:

### Terminal 1: Backend (FastAPI)
```powershell
# Windows:
cd computing-project\backend
.\.venv\Scripts\python.exe -m uvicorn main:app --reload

# macOS / Linux:
cd computing-project/backend
source .venv/bin/activate
uvicorn main:app --reload
```

### Terminal 2: Frontend (React)
```bash
cd computing-project/frontend
npm start
```

*(On macOS/Linux, you can also run `./start_schoolair.sh` from the repository root to launch both simultaneously).*

---

## 5. Troubleshooting & FAQ

### Q1: `xgboost._c_api.XGBoostError: input stream corrupted` on Windows
- **Cause:** Occurs when loading raw C++ pickled buffers from `.joblib` files across differing operating systems (macOS vs Windows).
- **Solution:** SchoolAir includes cross-platform JSON model boosters (`champion_regressor.json` and `champion_classifier.json`). Ensure you have pulled the latest commit from the repository, which loads `.json` models by default.

### Q2: PowerShell says `running scripts is disabled on this system`
- **Cause:** Windows restricts running `.ps1` activation scripts by default.
- **Solution:** You do not need to activate the environment. Execute Python directly from the virtual environment:
  ```powershell
  .\.venv\Scripts\python.exe -m uvicorn main:app --reload
  ```
  Alternatively, enable local script execution in PowerShell (Run as Administrator):
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### Q3: `ModuleNotFoundError: No module named 'xgboost'` or `pandas`
- **Cause:** The terminal is running your computer's global Python rather than the virtual environment's Python.
- **Solution:** Always run commands using `.\.venv\Scripts\python.exe` on Windows or `source .venv/bin/activate` on macOS. In VS Code, press `Ctrl + Shift + P` > **Python: Select Interpreter** > select `backend\.venv\Scripts\python.exe`.

### Q4: Port 8000 or 3000 is already in use
- **Solution:** Stop any existing processes running on those ports:
  - **Windows:**
    ```powershell
    netstat -ano | findstr :8000
    taskkill /PID <PID> /F
    ```
  - **macOS / Linux:**
    ```bash
    lsof -ti :8000 | xargs kill -9
    lsof -ti :3000 | xargs kill -9
    ```

---

## 6. Key Features & Visualizations

1. **Safety Checker View (`/checker`):**
   - Instant forecast lookup by State, District, Date, Hour, Cohort, and Activity.
   - Semicircle safety gauge with dynamic MOE threshold sectors.
   - 24-hour diurnal risk curve highlighting the safest clean-air window.
   - TreeSHAP feature attributions showing exact drivers of air quality.
   - Live What-If Stress Tester with MAAQS boundary validation.

2. **Event Planner View (`/planner`):**
   - Multi-year planning calendar (2026, 2027, 2028, 2029).
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
| **GET** | `/api/v1/health` | Service status, loaded model type, and precomputed record counts |
| **GET** | `/api/v1/stations` | List of 26 monitoring stations and 4 regional corridors |
| **GET** | `/api/v1/forecast-lookup` | Retrieves precomputed hourly forecasts, MOE directive, and SHAP data |
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
