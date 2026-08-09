# 🛡️ CampusShield — Community-Based Campus Safety & Reporting System

**CampusShield** is a modern, responsive, AI-powered women's safety monitoring and incident reporting platform for colleges and universities across India.

---

## 🌟 Key Features

- **🔐 Gatekeeper Login & Multi-Role System**: Dedicated split-screen login page (`login.html`) with role-based access control for **Students (🎓)**, **Administrators (🛡️)**, and **Security Patrol Officers (🚨)**.
- **📍 Pan-India & Parul University Live Geocoding**: Automatically detects exact GPS campus coordinates for **Parul University (Vadodara, Gujarat)**, Central Universities, State Universities, and Private/Deemed Institutions across all 28 States & 8 UTs of India.
- **🗺️ Interactive Campus Safety Map**: Leaflet.js interactive map displaying color-coded safe zones (🟢), security posts (🔵), panic pillars (🆘), and incident hotspots (🔴).
- **👣 100% Anonymous Incident Reporting**: File verified or anonymous safety hazards with voice-to-text input, automatic GPS location tagger, severity rating, and photo evidence upload.
- **🚨 Emergency SOS Panic Dispatch**: 1-click emergency SOS modal triggering immediate call to campus security (1800-11-2233), live GPS location sharing, and 112 emergency helpline dispatch.
- **📊 Admin Analytics & Dispatch Console**: Chart.js doughnut & bar analytics, incident investigation workflow, officer dispatch console, and 1-click downloadable PDF safety reports.
- **⚡ Native C++ Backend Server Engine**: Fast C++ WinSock server (`backend/campus_shield.cpp`) serving static web files and REST endpoints (`/api/login`, `/api/incidents`, `/api/risk-map`).

---

## 🎨 Color Palette & Visual Theme

- **Deep Navy Background**: `#0B132B`
- **Card Panel**: `#0D1713`
- **Aurora Mint Primary**: `#5EEAD4`
- **Electric Blue Secondary**: `#2563EB`
- **Cyan Accent**: `#06B6D4`
- **Soft Lime Safe Badge**: `#A3E635`
- **Warning Amber**: `#FBBF24`
- **Emergency Coral**: `#FB5B5B`

---

## ⚙️ Architecture & File Structure

```text
CampusShield/
├── login.html              # First entry Gatekeeper Login Page (Student/Admin/Security roles)
├── index.html              # Main App (Dashboard, Incident Form, Safety Map, Alerts)
├── app.js                  # Application Logic, Live Map Geocoding API & Role Filtering
├── styles.css              # Glassmorphic Styling & Color System Design Tokens
├── backend/
│   └── campus_shield.cpp   # Native C++ WinSock HTTP Server & AI Risk Prediction Engine
├── README.md               # Repository Description & Documentation
├── .gitignore              # Git ignore rules for build binaries
└── start_campus_shield.bat # 1-Click Server & Web Launcher Script
```

---

## 🚀 How to Run Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/vinittech/CampusShield-Women-safety-.git
   cd CampusShield-Women-safety-
   ```

2. **Launch with 1-Click Batch Script**:
   Double-click `start_campus_shield.bat` to compile/run the C++ backend and open `login.html` in Google Chrome!

3. **Demo Login Credentials**:
   - **Student Account**: `student@university.edu` / `student123`
   - **Admin Account**: `admin@university.edu` / `admin123`
   - **Security Account**: `security@university.edu` / `security123`

---

## 🤝 GitHub Upload Commands

```bash
git init
git add .
git commit -m "Update CampusShield: Gatekeeper Login, Parul University GPS Geocoding, Role-Based UI"
git branch -M main
git remote add origin https://github.com/vinittech/CampusShield-Women-safety-.git
git push -u origin main
```
