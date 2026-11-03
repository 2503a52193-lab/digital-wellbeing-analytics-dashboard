# Digital Well-being Analytics Dashboard & Universal Student Analytics Platform
> **University Semester Project (DAV Project No. 48)**  
> **Research Question:** *Does screen time influence students' academic performance?*  
> **Final Output:** Interactive, High-Fidelity Full-Stack Web Application with Universal Dataset Ingestion

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Flask 3.0+](https://img.shields.io/badge/Flask-3.0%2B-black.svg?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite 5](https://img.shields.io/badge/Vite-5-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS 3](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Recharts-2.13-22c55e.svg)](https://recharts.org/)
[![Tests Passing](https://img.shields.io/badge/Pytest-25%20Passed-brightgreen.svg?logo=pytest&logoColor=white)](backend/tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 1. Executive Summary & Research Investigation

This project investigates whether daily social media consumption and screen exposure before sleep correlate with secondary and university students' academic performance (evaluated across standard 4.0 GPA, 10.0 CGPA, or percentage scoring systems).

By default, the platform includes the verified baseline empirical dataset:
- **`Teen_Mental_Health_Dataset.csv(6).xlsx`** (1,200 verified student records, 13 features).

### Core Empirical Findings (Baseline Sample Cohort):
- **Daily Social Media Hours vs. GPA:** $r = +0.013$ (negligible linear association; heavier daily usage does not linearly correlate with lower GPA across the cohort).
- **Pre-Sleep Screen Time vs. GPA:** $r = -0.035$ (very slight negative tendency, within statistical noise $|r| < 0.05$).
- **Correlation $\neq$ Causation:** The dashboard emphasizes academic rigor: absence of linear correlation does not eliminate non-linear interactions, nor does it establish causation. Confounding factors such as unrecorded study hours, homework completion, parental supervision, and intrinsic motivation play decisive roles.
- **Dataset Constraints:** The baseline dataset does not record independent study hours. The dashboard explicitly annotates this constraint in the Academic Analytics module and unlocks dedicated Study Hours analytics whenever custom datasets providing study hours are uploaded.
- **Ethical Integrity:** Analytics are displayed strictly at population and cohort levels. No individual student is diagnosed, labeled, or profiled.

---

## 2. Universal Student Dataset Platform ("Upload & Analyze")

In addition to analyzing the baseline dataset, this application is a **reusable analytics platform**. Teachers, researchers, and administrators can upload any student dataset in **Excel (`.xlsx`, `.xls`)** or **CSV (`.csv`)** format with varied column structures and scoring metrics.

### Key Ingestion Capabilities:
1. **Intelligent Synonym Auto-Detection:** Automatically matches non-standard column names to canonical analytics variables:
   - *Screen Time / Social Media:* `screen_time`, `phone_usage`, `mobile_hours`, `screen_hours`, `daily_social_media_hours`, `media_time`
   - *Academic Performance:* `GPA`, `cgpa`, `marks`, `exam_score`, `final_score`, `academic_performance`, `grade_point_average`
   - *Sleep Duration:* `sleep_duration`, `sleep_hours`, `nightly_sleep`, `hours_sleep`, `rest_hours`
   - *Study Duration:* `study_time`, `study_hours`, `study_duration`, `prep_time`, `independent_study`
   - *Physical Activity:* `workout_hours`, `exercise_hours`, `physical_activity`, `sports_hours`
   - *Mental Well-being:* `stress`, `stress_level`, `anxiety`, `anxiety_level`, `depression_label`
2. **Interactive Column-Mapping Review Matrix:** Teachers can review suggested mappings, override any column via intuitive dropdowns, or mark variables as optional.
3. **Dynamic Academic Scoring Scales:** Supports 5 academic scoring systems:
   - **Standard 4.00 GPA Scale** (standard secondary/college GPA)
   - **10.0 CGPA Scale** (common university CGPA)
   - **100% Percentage / Marks** (0 - 100% scale)
   - **50 Marks Scale** (half-semester tests)
   - **Custom Scoring Scale** (custom min, max, and unit)
4. **Study Hours Analytics:** If the uploaded dataset contains study duration, the dashboard activates the *Academic Performance vs. Study Hours* module, displaying scatter plots, performance tier correlations, and KPI metrics.
5. **Missing Variable Protection:** If optional indicators (e.g. platform, stress, physical activity) are missing in the uploaded dataset, the dashboard gracefully disables corresponding charts with clear informative notices without throwing errors.
6. **Dataset Switching:** Teachers can toggle anytime between the "Original Sample Dataset (1,200 Students)" and the "Uploaded Custom Dataset" from the top navigation bar.
7. **Privacy & Local Session Storage:** Uploaded student files are processed strictly in-memory and in temporary local session storage. Records are never sent to external AI APIs or third-party cloud servers. A 1-click **Delete Uploaded Data** button removes uploaded files and resets the platform.

---

## 3. Screenshots & Visual Preview Instructions

> To showcase your dashboard on GitHub, capture high-resolution screenshots of the key modules and place them in the `assets/screenshots/` directory using the filenames below:

| Screenshot Description | Recommended Filename | Status |
|---|---|---|
| **Overview Dashboard & Core KPIs** | `assets/screenshots/overview.png` | `[Place screenshot here]` |
| **Universal Upload & Column Mapping** | `assets/screenshots/upload_wizard.png` | `[Place screenshot here]` |
| **Digital Habits & Scatter Plot** | `assets/screenshots/digital_habits.png` | `[Place screenshot here]` |
| **Academic Performance Analytics** | `assets/screenshots/academic_analytics.png` | `[Place screenshot here]` |
| **Digital Well-being & Stress Scales** | `assets/screenshots/wellbeing.png` | `[Place screenshot here]` |
| **Data Insights & Correlation Matrix** | `assets/screenshots/data_insights.png` | `[Place screenshot here]` |

```markdown
<!-- Preview Gallery -->
<p align="center">
  <img src="assets/screenshots/overview.png" alt="Dashboard Overview" width="85%" />
</p>
```

---

## 4. Interactive Modules Overview

1. **Dashboard Overview:** Displays total verified student records, average daily social media hours, average sleep hours, academic score on the calibrated scale, pre-bed screen time, and study hours (if present).
2. **Digital Habits:** Visualizes daily usage distributions, comparative platform statistics (Instagram, TikTok, Both), age-stratified usage, and social media vs. academic achievement scatter plots.
3. **Academic Analytics:** Visualizes academic performance distributions across custom scale brackets, score vs. sleep duration, score vs. pre-sleep screen time, and score vs. independent study hours.
4. **Digital Well-being:** Detailed distributions of perceived stress (1-10), anxiety (1-10), device addiction ratings, physical activity by gender, and sleep pattern correlations.
5. **Data Insights:** Presents an interactive Pearson correlation matrix, descriptive statistics table generated via Pandas, and an empirical answer to the research question with dataset limitations.
6. **Reports & Export:** Allows instant download of aggregated, anonymized cohort analytics as CSV and provides a clean, printable executive summary report.
7. **Upload & Analyze:** Universal spreadsheet ingestion wizard supporting `.xlsx`, `.xls`, and `.csv`. Auto-detects columns, offers review dropdowns, configures academic scoring scales, and provides 5-row raw previews.

---

## 5. Technology Stack

### Backend
- **Language:** Python 3.10+ (tested on Python 3.14)
- **Web Framework:** Flask 3.0+ & Flask-CORS
- **Data Analytics:** Pandas, NumPy, SciPy
- **Excel Processing:** `openpyxl`
- **Testing:** `pytest` (25 automated unit and regression tests)
- **WSGI Server:** Gunicorn (for Linux cloud deployments)

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3
- **Icons:** Lucide React
- **Charting Engine:** Recharts (Histograms, Scatter Plots, Multi-axis Bar Charts, Area & Pie Charts)
- **HTTP Client:** Native Fetch API with configurable `VITE_API_BASE_URL`

---

## 6. Project Directory Structure

```
well-being-dashboard/
├── .gitignore                               # Production gitignore (node_modules, uploads, envs)
├── README.md                                # Project documentation & publication guide
├── Teen_Mental_Health_Dataset.csv(6).xlsx   # Verified baseline dataset (1,200 records)
├── assets/
│   └── screenshots/                         # Dashboard screenshots directory
├── backend/
│   ├── app.py                               # Flask REST API endpoints + CORS + static serving
│   ├── data_service.py                      # Data analysis service (openpyxl + Pandas)
│   ├── dataset_manager.py                   # Dataset upload, schema inspection & mapping engine
│   ├── requirements.txt                     # Python dependencies
│   ├── uploads/                             # Session-isolated temporary dataset storage (.gitkeep)
│   └── tests/
│       ├── test_api.py                      # Regression & JSON RFC 8259 compliance test suite
│       └── test_upload_and_mapping.py       # Universal upload, synonym & scale test suite
└── frontend/
    ├── .env.example                         # Example environment configuration
    ├── index.html                           # HTML5 entry with Plus Jakarta Sans typography
    ├── package.json                         # Node dependencies & Vite scripts
    ├── vite.config.js                       # Vite proxy config (configurable proxy target)
    ├── tailwind.config.js                   # Tailwind theme extension
    ├── postcss.config.js                    # PostCSS plugins
    └── src/
        ├── main.jsx                         # React root mount
        ├── App.jsx                          # Main shell with active dataset state & routing
        ├── index.css                        # Tailwind directives
        ├── components/
        │   ├── Sidebar.jsx                  # Module navigation & active dataset card
        │   ├── Header.jsx                   # University project banner & dataset switch pill
        │   ├── FilterBar.jsx                # Dynamic Age, Gender, Platform & Usage sliders
        │   ├── MetricCard.jsx               # Headline KPI cards with tooltips
        │   ├── LoadingSpinner.jsx           # Animated loading state
        │   └── ErrorAlert.jsx               # Graceful error alerts & retry handling
        ├── pages/
        │   ├── UploadPage.jsx               # Universal Dataset Upload, Inspection & Mapping
        │   ├── OverviewPage.jsx             # Core KPIs + Dynamic Scales + Platform breakdown
        │   ├── SocialMediaPage.jsx          # Usage distribution, age-wise & scatter plot
        │   ├── AcademicPage.jsx             # Performance tiers, study hours analytics & sleep
        │   ├── WellBeingPage.jsx            # Stress/anxiety scales, exercise & sleep patterns
        │   ├── InsightsPage.jsx             # Pearson correlation matrix & research synthesis
        │   └── ReportsPage.jsx              # Summary report & Aggregate CSV export
        └── services/
            └── api.js                       # REST API client with upload & dataset methods
```

---

## 7. Installation & Execution Guide

### Prerequisites
- **Python 3.10+** (with `pip` added to PATH)
- **Node.js 18+** & **npm**

---

### Step 1: Backend Setup (Flask API)

1. Open a terminal and navigate to `backend`:
   ```bash
   cd backend
   ```

2. (Recommended) Create and activate a virtual environment:
   ```bash
   # Windows PowerShell:
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the Flask backend server:
   ```bash
   python app.py
   ```
   - Running at: **`http://127.0.0.1:5000`**
   - Health check: **`http://127.0.0.1:5000/api/health`**

---

### Step 2: Frontend Setup (Vite + React)

1. Open a second terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   - Access the dashboard at: **`http://localhost:5173`**

---

## 8. Running Automated Tests

The test suite contains **25 automated tests** covering core API analytics, filter regressions, empty cohort handling, file upload, synonym matching, scale detection, and session deletion:

```bash
# From the project root:
python -m pytest backend/tests -v
```

All 25 test suites verify:
- Baseline Excel dataset loading (1,200 records).
- Strict RFC 8259 JSON compliance with zero raw `NaN` or `Infinity` tokens.
- Dynamic filter bounds (Gender, Platform, Age span, Max Social Media Hours).
- Filter thresholds across 8.0h, 7.0h, 6.0h, 5.5h, 5.0h, 4.0h, 3.0h, 2.0h, and 1.0h.
- Empty cohort handling (converts undefined statistical results to JSON `null`, displaying "Not available").
- CSV and Excel file schema inspection.
- Token-set synonym matching for column aliases (e.g. `exam_score` $\to$ `academic_performance`, `phone_usage` $\to$ `daily_social_media_hours`, `Hours_Sleep` $\to$ `sleep_hours`, `study_time` $\to$ `study_hours`).
- Scoring scale auto-detection (4.0 GPA, 10.0 CGPA, 100% Marks, Custom).
- Activation of Study Hours analytics when mapped.
- Graceful missing metric fallbacks when optional columns are absent.
- Dataset switching and session deletion.
- Anonymized aggregate CSV export.

---

## 9. Deployment Guidelines

### Option A: Unified Full-Stack Deployment (Render / Railway / AWS / Docker)
1. Build the frontend production bundle:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. The compiled assets are placed in `frontend/dist`. The Flask backend automatically detects `frontend/dist` and serves both the REST API and the React SPA on the same port:
   ```bash
   cd backend
   python app.py
   # Or using Gunicorn in Linux environments:
   gunicorn --bind 0.0.0.0:$PORT app:app
   ```

### Option B: Separate Frontend & Backend Deployment
- **Frontend (Vite on Vercel / Netlify / Cloudflare Pages):**
  - Set root directory to `frontend`.
  - Set environment variable: `VITE_API_BASE_URL=https://your-backend-service.onrender.com/api`
  - Build command: `npm run build`
  - Output directory: `dist`
- **Backend (Flask on Render / Railway / Fly.io):**
  - Set root directory to `backend`.
  - Build command: `pip install -r requirements.txt`
  - Start command: `gunicorn --bind 0.0.0.0:$PORT app:app`

---

## 10. How to Upload to GitHub

Follow these steps in your terminal to publish this project to your GitHub account:

1. **Initialize Git repository (if not already initialized):**
   ```bash
   git init
   ```

2. **Stage all prepared files:**
   ```bash
   git add .
   ```

3. **Verify staged files (ensure node_modules and uploads are ignored):**
   ```bash
   git status
   ```

4. **Create initial commit:**
   ```bash
   git commit -m "feat: initial commit for Project 48 Digital Well-being Analytics Dashboard"
   ```

5. **Rename default branch to main:**
   ```bash
   git branch -M main
   ```

6. **Create a new repository on [GitHub](https://github.com/new):**
   - Name: `digital-wellbeing-dashboard` (or your preferred name)
   - Keep it **Public** or **Private**
   - **Do NOT** check "Add a README file" or "Add .gitignore" (we already have comprehensive ones created)

7. **Link your local repository to GitHub and push:**
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/digital-wellbeing-dashboard.git
   git push -u origin main
   ```

---

## 11. Ethical Research Notice & License

- **Ethical Analytics:** This application conducts observational descriptive analysis on survey cohorts. Findings illustrate empirical correlations and do not imply causal mechanisms. No individual student is identified, evaluated, or diagnosed.
- **License:** Released under the [MIT License](LICENSE).
