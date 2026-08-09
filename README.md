# 🛡️ CampusShield — AI Women's Safety & Campus Monitoring Platform

CampusShield is a modern, responsive, AI-powered community reporting and safety monitoring platform for colleges and universities. Built for Smart India Hackathon 2026.

---

## 🌟 Key Features

- **🎓 Student & Administrator Authentication**: Verified login system for students (`@university.edu`) and college security/administrators.
- **👣 100% Anonymous Incident Reporting**: Submit safety reports with voice-to-text, GPS auto-detection, and media uploads while protecting student identity.
- **🗺️ Interactive Campus Safety Map**: Leaflet.js interactive map featuring color-coded risk zones (Green/Yellow/Red) and C++ Dijkstra Safe Route Finder.
- **🚨 Emergency SOS Dispatch**: One-click panic button broadcasting live GPS coordinates and audio recording simulation to security desks.
- **🤖 ShieldAI Safety Assistant**: Intelligent safety chatbot trained on university emergency protocols and self-defense guidelines.
- **📊 Admin Analytics & Case Dispatch**: Chart.js analytics graphs, officer assignment workflows, and downloadable PDF safety reports.
- **📷 QR Code Campus Scanner Hub**: Poster scanner simulator for quick physical campus location reporting.

---

## ⚙️ Architecture

```
CampusShield/
├── backend/
│   └── campus_shield.cpp   # C++ Core Engine (AI Risk Scoring, Dijkstra Route Finder, WinSock Server)
├── index.html              # Main Responsive Single Page Application
├── styles.css              # Glassmorphism Theme & UI Design Tokens
├── app.js                  # JavaScript Application Logic & REST Client
└── start_campus_shield.bat # One-Click Windows Launcher Script
```

---

## 🚀 How to Run Locally

1. Clone or download the repository:
   ```bash
   git clone https://github.com/vinittech/CampusShield-Women-safety-.git
   ```
2. Double-click `start_campus_shield.bat` to compile the C++ backend and open `index.html` in your browser.

---

## 🤝 GitHub Push Commands

```bash
git init
git add .
git commit -m "Initial commit: CampusShield AI Women's Safety Platform"
git branch -M main
git remote add origin https://github.com/vinittech/CampusShield-Women-safety-.git
git push -u origin main
```
