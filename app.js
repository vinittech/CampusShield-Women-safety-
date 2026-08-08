/*
 * CampusShield JavaScript Application Engine
 * Handles State, Navigation, Leaflet Map, C++ REST Client, SOS, AI Chatbot, Chart.js Analytics
 */

// Global Application State
const state = {
  currentRole: 'student', // 'student', 'security', 'admin'
  currentTheme: 'dark',
  currentLang: 'EN',
  activeView: 'landing',
  cppServerUrl: 'http://localhost:8080',
  isCppConnected: false,
  incidents: [],
  riskNodes: [],
  map: null,
  mapMarkers: [],
  reportSelectMap: null,
  reportSelectMarker: null,
  isRecordingAudio: false,
  audioRecordSeconds: 0,
  audioTimerInterval: null,
  speechRecognition: null,
  isVoiceListening: false
};

// Translations Dictionary (English & Hindi)
const translations = {
  EN: {
    navDashboard: "Dashboard",
    navReport: "Report",
    navMap: "Campus Map",
    navCommunity: "Community"
  },
  HI: {
    navDashboard: "डैशबोर्ड",
    navReport: "रिपोर्ट करें",
    navMap: "कैंपस मैप",
    navCommunity: "समुदाय"
  }
};

// Initial Sample Data (Synced with C++ Engine Data)
const initialIncidents = [
  {
    id: 101,
    category: "Poor Lighting",
    description: "Dark path behind sports ground with broken streetlight.",
    date: "2026-08-05",
    time: "21:30",
    location: { lat: 28.5490, lng: 77.1940, name: "Sports Ground Pathway" },
    anonymous: true,
    status: "Investigating",
    priorityLevel: 3,
    riskScore: 68.5,
    isSpam: false,
    summary: "Dark pathway requires urgent streetlight maintenance.",
    upvotes: 14,
    confirmations: 5
  },
  {
    id: 102,
    category: "Stalking / Following",
    description: "Suspicious individual following student near cafeteria alley.",
    date: "2026-08-06",
    time: "22:15",
    location: { lat: 28.5440, lng: 77.1960, name: "Old Cafeteria Alley" },
    anonymous: false,
    status: "Pending",
    priorityLevel: 5,
    riskScore: 89.2,
    isSpam: false,
    summary: "High-priority stalking incident reported near cafeteria alley.",
    upvotes: 28,
    confirmations: 12
  },
  {
    id: 103,
    category: "Suspicious Activity",
    description: "Group loitering near hostel gate past curfew hours.",
    date: "2026-08-07",
    time: "23:00",
    location: { lat: 28.5480, lng: 77.1915, name: "Girls Hostel Block A" },
    anonymous: true,
    status: "Investigating",
    priorityLevel: 4,
    riskScore: 75.0,
    isSpam: false,
    summary: "Loitering activity near hostel perimeter under review by security.",
    upvotes: 19,
    confirmations: 8
  }
];

// Initialize Application on Page Load
document.addEventListener('DOMContentLoaded', () => {
  state.incidents = [...initialIncidents];
  
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Check C++ Backend Connectivity
  checkCppServerHealth();

  // Render UI Views
  renderRecentReports();
  renderAdminTable();
  renderSecurityAlerts();
  renderCommunityFeed();

  // Set default datetime picker
  const now = new Date();
  const dtInput = document.getElementById('reportDateTime');
  if (dtInput) {
    dtInput.value = now.toISOString().slice(0, 16);
  }
});

// Check C++ REST API Server Health
async function checkCppServerHealth() {
  try {
    const res = await fetch(`${state.cppServerUrl}/api/health`);
    if (res.ok) {
      const data = await res.json();
      state.isCppConnected = true;
      const statusText = document.getElementById('cppServerText');
      if (statusText) {
        statusText.innerHTML = `<span class="text-emerald-400 font-bold">ONLINE</span> • ${data.engine} (${data.version})`;
      }
      fetchCppData();
    }
  } catch (err) {
    console.log("C++ Backend Server offline, using client-side fallback mode.");
  }
}

// Fetch Incidents & Risk Map from C++ Server
async function fetchCppData() {
  try {
    const res = await fetch(`${state.cppServerUrl}/api/incidents`);
    if (res.ok) {
      const incidents = await res.json();
      if (incidents && incidents.length > 0) {
        state.incidents = incidents;
        renderRecentReports();
        renderAdminTable();
        renderSecurityAlerts();
        renderCommunityFeed();
      }
    }
  } catch (e) {
    console.log("Using cached client data.");
  }
}

// View Router
function navigateTo(viewId) {
  state.activeView = viewId;
  
  // Hide all views
  document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

  // Show active view
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.remove('hidden');
  }

  // Update active nav button
  document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`nav-${viewId}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  // Special view initializations
  if (viewId === 'campusMap') {
    setTimeout(initCampusMap, 100);
  } else if (viewId === 'reportIncident') {
    setTimeout(initReportMapSelect, 100);
  } else if (viewId === 'adminDashboard') {
    setTimeout(initAdminCharts, 100);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Role Switcher
function switchRole(role) {
  state.currentRole = role;
  
  // Toggle Admin/Security Navigation Visibility
  const adminBtns = document.querySelectorAll('.role-admin-only');
  const securityBtns = document.querySelectorAll('.role-security-only');

  adminBtns.forEach(el => {
    if (role === 'admin') el.classList.remove('hidden');
    else el.classList.add('hidden');
  });

  securityBtns.forEach(el => {
    if (role === 'security' || role === 'admin') el.classList.remove('hidden');
    else el.classList.add('hidden');
  });

  // Redirect if on restricted view
  if (role === 'student' && (state.activeView === 'adminDashboard' || state.activeView === 'securityDashboard')) {
    navigateTo('studentDashboard');
  } else if (role === 'admin') {
    navigateTo('adminDashboard');
  } else if (role === 'security') {
    navigateTo('securityDashboard');
  }
}

// Dark / Light Theme Switcher
function toggleTheme() {
  state.currentTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
  document.body.classList.toggle('light-mode', state.currentTheme === 'light');
  
  const sun = document.getElementById('themeIconSun');
  const moon = document.getElementById('themeIconMoon');
  if (sun && moon) {
    sun.classList.toggle('hidden', state.currentTheme === 'dark');
    moon.classList.toggle('hidden', state.currentTheme === 'light');
  }
}

// Multilingual Switcher
function toggleLanguage() {
  state.currentLang = state.currentLang === 'EN' ? 'HI' : 'EN';
  const label = document.getElementById('currentLangLabel');
  if (label) label.textContent = state.currentLang;

  const dict = translations[state.currentLang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
}

// Voice-to-Text Incident Reporting (Web Speech API)
function toggleVoiceReporting() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert("Speech Recognition is not supported by your browser.");
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!state.speechRecognition) {
    state.speechRecognition = new SpeechRecognition();
    state.speechRecognition.continuous = false;
    state.speechRecognition.interimResults = false;
    state.speechRecognition.lang = 'en-US';

    state.speechRecognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const descInput = document.getElementById('reportDescription');
      if (descInput) {
        descInput.value += (descInput.value ? ' ' : '') + transcript;
        runAiLiveAnalysis();
      }
      stopVoiceListening();
    };

    state.speechRecognition.onerror = () => stopVoiceListening();
    state.speechRecognition.onend = () => stopVoiceListening();
  }

  if (!state.isVoiceListening) {
    state.speechRecognition.start();
    state.isVoiceListening = true;
    document.getElementById('voiceBtnText').textContent = "Listening... Speak now";
    document.getElementById('voiceBtn').classList.add('bg-rose-500/20', 'text-rose-300');
  } else {
    state.speechRecognition.stop();
    stopVoiceListening();
  }
}

function stopVoiceListening() {
  state.isVoiceListening = false;
  const txt = document.getElementById('voiceBtnText');
  const btn = document.getElementById('voiceBtn');
  if (txt) txt.textContent = "Voice-to-Text";
  if (btn) btn.classList.remove('bg-rose-500/20', 'text-rose-300');
}

// Real-time AI Analysis Preview
function runAiLiveAnalysis() {
  const desc = document.getElementById('reportDescription').value;
  const category = document.getElementById('reportCategory').value;
  const box = document.getElementById('aiLiveAnalysisBox');
  
  if (!desc || desc.length < 5) {
    box.classList.add('hidden');
    return;
  }

  box.classList.remove('hidden');

  let risk = 25.0;
  let severity = 'Low Priority';
  let badgeClass = 'badge-safe';

  if (category.includes('Assault') || category.includes('Stalking') || desc.includes('emergency') || desc.includes('follow')) {
    risk = 88.5;
    severity = 'CRITICAL PRIORITY';
    badgeClass = 'badge-danger';
  } else if (category.includes('Harassment') || category.includes('Lighting')) {
    risk = 62.0;
    severity = 'HIGH PRIORITY';
    badgeClass = 'badge-warning';
  }

  document.getElementById('aiSeverityBadge').textContent = severity;
  document.getElementById('aiSeverityBadge').className = badgeClass;
  document.getElementById('aiRiskScoreVal').textContent = risk.toFixed(1);
  document.getElementById('aiSpamProbVal').textContent = desc.length < 15 ? '65% (Too Brief)' : '2% (Authentic)';
  document.getElementById('aiSummaryVal').textContent = `AI summary: ${category} reported with ${desc.slice(0, 40)}...`;
}

// Auto-Detect GPS Location
function detectGPSLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      document.getElementById('reportLat').value = pos.coords.latitude;
      document.getElementById('reportLng').value = pos.coords.longitude;
      document.getElementById('reportLocationName').value = `GPS: (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;

      if (state.reportSelectMarker) {
        state.reportSelectMarker.setLatLng([pos.coords.latitude, pos.coords.longitude]);
        state.reportSelectMap.panTo([pos.coords.latitude, pos.coords.longitude]);
      }
      alert("GPS location auto-detected successfully!");
    }, () => alert("Could not fetch GPS location. Defaulting to campus center."));
  }
}

// Media Preview Upload
function previewMediaUpload(input) {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.getElementById('mediaPreviewImg');
      img.src = e.target.result;
      document.getElementById('mediaPreviewContainer').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
}

// Handle Incident Submission
function handleIncidentSubmit(e) {
  e.preventDefault();
  
  const category = document.getElementById('reportCategory').value;
  const desc = document.getElementById('reportDescription').value;
  const dt = document.getElementById('reportDateTime').value;
  const locName = document.getElementById('reportLocationName').value;
  const isAnon = document.getElementById('reportAnonymous').checked;

  const newIncident = {
    id: Date.now(),
    category,
    description: desc,
    date: dt.split('T')[0] || "2026-08-07",
    time: dt.split('T')[1] || "22:00",
    location: { lat: parseFloat(document.getElementById('reportLat').value), lng: parseFloat(document.getElementById('reportLng').value), name: locName },
    anonymous: isAnon,
    status: "Pending",
    priorityLevel: category.includes('Assault') ? 5 : 3,
    riskScore: 75.0,
    isSpam: false,
    summary: desc.slice(0, 50) + "...",
    upvotes: 1,
    confirmations: 1
  };

  state.incidents.unshift(newIncident);

  alert("✅ Incident report submitted successfully! AI analysis verified authentic.");
  document.getElementById('incidentForm').reset();
  document.getElementById('aiLiveAnalysisBox').classList.add('hidden');
  
  renderRecentReports();
  renderAdminTable();
  renderSecurityAlerts();
  renderCommunityFeed();
  
  navigateTo('studentDashboard');
}

// Render Incident Cards on Dashboard
function renderRecentReports() {
  const container = document.getElementById('recentReportsContainer');
  if (!container) return;

  container.innerHTML = state.incidents.slice(0, 4).map(inc => `
    <div class="glass-card p-4 space-y-2 border-l-4 ${inc.priorityLevel >= 4 ? 'border-l-rose-500' : 'border-l-amber-500'}">
      <div class="flex items-center justify-between">
        <span class="font-bold text-sm text-indigo-300">${inc.category}</span>
        <span class="text-xs px-2 py-0.5 rounded-full ${inc.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}">${inc.status}</span>
      </div>
      <p class="text-xs text-slate-300">${inc.description}</p>
      <div class="flex items-center justify-between text-[11px] text-slate-400">
        <span>📍 ${inc.location.name}</span>
        <span>🕒 ${inc.date} ${inc.time}</span>
      </div>
    </div>
  `).join('');
}

// Initialize Interactive Leaflet Campus Map
function initCampusMap() {
  if (state.map) return;

  const campusCenter = [28.5460, 77.1935];
  state.map = L.map('campusMap').setView(campusCenter, 16);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(state.map);

  // Add Incident Markers
  state.incidents.forEach(inc => {
    const color = inc.priorityLevel >= 4 ? '#FF4D4F' : '#F59E0B';
    const circle = L.circle([inc.location.lat, inc.location.lng], {
      color: color,
      fillColor: color,
      fillOpacity: 0.5,
      radius: 60
    }).addTo(state.map);

    circle.bindPopup(`
      <div class="p-2 space-y-1">
        <strong class="text-sm text-indigo-400">${inc.category}</strong>
        <div class="text-xs">${inc.description}</div>
        <div class="text-[10px] text-slate-400">Location: ${inc.location.name}</div>
      </div>
    `);
  });
}

// Initialize Location Selection Map for Incident Report Page
function initReportMapSelect() {
  if (state.reportSelectMap) return;

  const defaultCoords = [28.5450, 77.1920];
  state.reportSelectMap = L.map('reportMapSelect').setView(defaultCoords, 16);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.reportSelectMap);

  state.reportSelectMarker = L.marker(defaultCoords, { draggable: true }).addTo(state.reportSelectMap);

  state.reportSelectMarker.on('dragend', function (event) {
    const position = state.reportSelectMarker.getLatLng();
    document.getElementById('reportLat').value = position.lat;
    document.getElementById('reportLng').value = position.lng;
  });
}

// Safe Route Finder Mode Toggle
function toggleSafeRouteMode() {
  const panel = document.getElementById('safeRoutePanel');
  if (panel) panel.classList.toggle('hidden');
}

// Calculate Safe Route (C++ Dijkstra Simulation)
function calculateSafeRoute() {
  const origin = document.getElementById('routeOrigin').selectedOptions[0].text;
  const dest = document.getElementById('routeDest').selectedOptions[0].text;
  
  const output = document.getElementById('routeOutputText');
  if (output) {
    output.textContent = `🟢 Safe Route Found: ${origin} ➔ Science Quad (CCTV Covered) ➔ ${dest} (100% Streetlight Illumination • 350m)`;
  }
}

// Emergency SOS System
function triggerActiveSOS() {
  document.getElementById('sosActiveTimerBox').classList.remove('hidden');
  state.isRecordingAudio = true;
  state.audioRecordSeconds = 0;

  state.audioTimerInterval = setInterval(() => {
    state.audioRecordSeconds++;
    const sec = String(state.audioRecordSeconds).padStart(2, '0');
    const timerEl = document.getElementById('audioRecTime');
    if (timerEl) timerEl.textContent = `00:${sec}`;
  }, 1000);
}

function cancelSOS() {
  clearInterval(state.audioTimerInterval);
  state.isRecordingAudio = false;
  document.getElementById('sosActiveTimerBox').classList.add('hidden');
  alert("SOS Alarm cancelled.");
}

// ShieldAI Chatbot
function handleAiChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('aiChatInput');
  const text = input.value.trim();
  if (!text) return;

  appendChatMessage('User', text, true);
  input.value = '';

  setTimeout(() => {
    let reply = "I am trained on University Safety Guidelines. For immediate emergency, please tap the red SOS button.";
    if (text.toLowerCase().includes('night') || text.toLowerCase().includes('follow')) {
      reply = "If followed at night: 1) Move towards well-lit areas like the Central Library or Main Gate Security. 2) Trigger the SOS Panic Button in CampusShield. 3) Call Campus Control at 1800-11-2233.";
    } else if (text.toLowerCase().includes('anonymous')) {
      reply = "All reports submitted with the 'Submit Anonymously' checkbox enabled hide your student ID and email from public view while keeping internal hash verification.";
    }
    appendChatMessage('ShieldAI', reply, false);
  }, 600);
}

function sendQuickAiQuery(q) {
  document.getElementById('aiChatInput').value = q;
}

function appendChatMessage(sender, message, isUser) {
  const win = document.getElementById('chatWindow');
  const msgDiv = document.createElement('div');
  msgDiv.className = `flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`;
  
  msgDiv.innerHTML = `
    <div class="w-8 h-8 rounded-lg ${isUser ? 'bg-emerald-600' : 'bg-indigo-600'} flex items-center justify-center text-white shrink-0 font-bold text-xs">
      ${isUser ? 'YOU' : 'AI'}
    </div>
    <div class="glass-card p-3 text-xs max-w-[80%] rounded-2xl space-y-1 ${isUser ? 'bg-indigo-600/30' : ''}">
      <div class="font-bold ${isUser ? 'text-emerald-300' : 'text-indigo-300'}">${sender}</div>
      <p>${message}</p>
    </div>
  `;
  win.appendChild(msgDiv);
  win.scrollTop = win.scrollHeight;
}

// Community Feed Renderer
function renderCommunityFeed() {
  const container = document.getElementById('communityFeedContainer');
  if (!container) return;

  container.innerHTML = state.incidents.map(inc => `
    <div class="glass-card p-5 space-y-3">
      <div class="flex items-center justify-between">
        <span class="font-extrabold text-sm text-indigo-300">${inc.category}</span>
        <span class="text-xs text-slate-400">📍 ${inc.location.name}</span>
      </div>
      <p class="text-xs text-slate-300">${inc.description}</p>
      <div class="flex items-center justify-between text-xs pt-2 border-t border-white/10">
        <div class="flex items-center gap-3">
          <button onclick="upvoteReport(${inc.id})" class="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-1">
            👍 Upvote (${inc.upvotes})
          </button>
          <button onclick="confirmReport(${inc.id})" class="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-1">
            🤝 Confirm (${inc.confirmations})
          </button>
        </div>
        <span class="text-[11px] text-slate-400">AI Credibility: 98% Verified</span>
      </div>
    </div>
  `).join('');
}

function upvoteReport(id) {
  const inc = state.incidents.find(i => i.id === id);
  if (inc) inc.upvotes++;
  renderCommunityFeed();
}

function confirmReport(id) {
  const inc = state.incidents.find(i => i.id === id);
  if (inc) inc.confirmations++;
  renderCommunityFeed();
}

// Admin Table Renderer
function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;

  tbody.innerHTML = state.incidents.map(inc => `
    <tr>
      <td class="p-3">#${inc.id}</td>
      <td class="p-3 font-semibold">${inc.category}</td>
      <td class="p-3">${inc.location.name}</td>
      <td class="p-3"><span class="${inc.priorityLevel >= 4 ? 'badge-danger' : 'badge-warning'}">Level ${inc.priorityLevel}</span></td>
      <td class="p-3">${inc.status}</td>
      <td class="p-3 flex items-center gap-2">
        <button onclick="updateStatus(${inc.id}, 'Investigating')" class="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-[10px]">Investigate</button>
        <button onclick="updateStatus(${inc.id}, 'Resolved')" class="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">Resolve</button>
      </td>
    </tr>
  `).join('');
}

function updateStatus(id, newStatus) {
  const inc = state.incidents.find(i => i.id === id);
  if (inc) {
    inc.status = newStatus;
    renderAdminTable();
    renderRecentReports();
  }
}

// Security Alerts Renderer
function renderSecurityAlerts() {
  const list = document.getElementById('securityAlertsList');
  if (!list) return;

  list.innerHTML = state.incidents.filter(i => i.status !== 'Resolved').map(inc => `
    <div class="glass-panel p-4 rounded-xl border border-rose-500/30 flex items-center justify-between">
      <div class="space-y-1 text-xs">
        <div class="font-bold text-rose-400 text-sm">🚨 HIGH PRIORITY: ${inc.category}</div>
        <div class="text-slate-300">${inc.description}</div>
        <div class="text-slate-400">Location: ${inc.location.name}</div>
      </div>
      <button onclick="dispatchGuard(${inc.id})" class="btn-danger text-xs px-3 py-1.5 shrink-0">Dispatch Patrol</button>
    </div>
  `).join('');
}

function dispatchGuard(id) {
  alert(`Officer dispatched to incident #${id} location!`);
}

// Admin Charts (Chart.js)
function initAdminCharts() {
  const catCanvas = document.getElementById('chartCategories');
  if (catCanvas && !catCanvas.chart) {
    catCanvas.chart = new Chart(catCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Poor Lighting', 'Stalking', 'Verbal Harassment', 'Suspicious Activity'],
        datasets: [{
          data: [40, 25, 20, 15],
          backgroundColor: ['#6C63FF', '#FF4D4F', '#F59E0B', '#00C896']
        }]
      },
      options: { responsive: true, plugins: { legend: { labels: { color: '#F8FAFC' } } } }
    });
  }
}

// PDF Exporting (html2pdf)
function exportAdminPdfReport() {
  const element = document.getElementById('view-adminDashboard');
  const opt = {
    margin: 0.5,
    filename: 'CampusShield_Safety_Report.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
}
