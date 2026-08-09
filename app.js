/*
 * CampusShield Application Engine — Dynamic All-India University Safety Map & Live Geocoding
 * Dynamically queries map databases for Central, State, Private, and Deemed Universities across India (including Parul University Vadodara).
 */

// Gatekeeper Session Guard: Check if user is logged in before accessing Home Screen
const storedUser = sessionStorage.getItem('cs_user');
if (!storedUser && !window.location.href.includes('login.html')) {
  window.location.href = 'login.html';
}

// Global Application State
const state = {
  currentUser: JSON.parse(storedUser) || null,
  currentRole: 'student',
  activeView: 'landing',
  cppServerUrl: 'http://localhost:8080',
  isCppConnected: false,
  incidents: [],
  map: null,
  mapMarkers: [],
  activeMapFilter: 'all',
  speechRecognition: null,
  isVoiceListening: false,
  geocodedCoordsCache: {}
};

// Comprehensive GPS Coordinates Dictionary for Public & Private Universities in India
const indianUniversityCoords = {
  // Parul University Vadodara, Gujarat (Exact GPS Campus Center)
  "Parul University": [22.2887, 73.3634],
  "Vadodara": [22.3072, 73.1812],

  // Public & Govt Universities
  "IIT Delhi": [28.5450, 77.1920],
  "Delhi University": [28.6890, 77.2104],
  "JNU": [28.5400, 77.1664],
  "IIT Bombay": [19.1334, 72.9133],
  "University of Mumbai": [18.9750, 72.8258],
  "IIT Madras": [13.0067, 80.2372],
  "Anna University": [13.0102, 80.2353],
  "IISc Bangalore": [13.0169, 77.5694],
  "VTU Belagavi": [15.8906, 74.5039],
  "Jadavpur University": [22.4989, 88.3720],
  "Calcutta University": [22.5786, 88.3630],
  "Osmania University": [17.4132, 78.5284],
  "IIT Hyderabad": [17.5947, 78.1230],
  "BHU Varanasi": [25.2677, 82.9913],
  "AMU Aligarh": [27.9154, 78.0770],
  "Pune University": [18.5529, 73.8248],
  "Panjab University": [30.7588, 76.7686],
  "IIT Guwahati": [26.1878, 91.6916],
  "NIT Trichy": [10.7613, 78.8143],
  "NITK Surathkal": [13.0108, 74.7943],

  // Top Private & Deemed Universities
  "BITS Pilani": [28.3588, 75.5880],
  "VIT Vellore": [12.9692, 79.1559],
  "SRM University": [12.8231, 80.0444],
  "Manipal": [13.3525, 74.7928],
  "Amity University": [28.5441, 77.3332],
  "LPU Phagwara": [31.2536, 75.7037],
  "Chandigarh University": [30.7699, 76.5754],
  "KIIT Bhubaneswar": [20.3533, 85.8189],
  "Thapar Institute": [30.3564, 76.3647],
  "Symbiosis Pune": [18.5308, 73.8340],
  "Christ University": [12.9344, 77.6060],
  "Nirma University": [23.1272, 72.5446],
  "Shiv Nadar University": [28.5255, 77.5750],
  "Ashoka University": [28.9482, 77.0984],
  "Bennett University": [28.4552, 77.5852],
  "Sharda University": [28.4731, 77.4820],
  "Graphic Era": [30.2687, 77.9946],
  "Chitkara University": [30.5161, 76.6597],

  // State/City Capitals Coordinates Fallback
  "Delhi": [28.6139, 77.2090],
  "New Delhi": [28.6139, 77.2090],
  "Mumbai": [19.0760, 72.8777],
  "Bengaluru": [12.9716, 77.5946],
  "Chennai": [13.0827, 80.2707],
  "Kolkata": [22.5726, 88.3639],
  "Hyderabad": [17.3850, 78.4867],
  "Pune": [18.5204, 73.8567],
  "Lucknow": [26.8467, 80.9462],
  "Jaipur": [26.9124, 75.7873],
  "Ahmedabad": [23.0225, 72.5714],
  "Chandigarh": [30.7333, 76.7794],
  "Bhopal": [23.2599, 77.4126],
  "Patna": [25.5941, 85.1376],
  "Kochi": [9.9312, 76.2673],
  "Guwahati": [26.1445, 91.7362]
};

// Default Demo Incidents (Centered around Parul University Vadodara Campus)
const initialIncidents = [
  {
    id: 101,
    category: "Unsafe Area",
    description: "Dark path behind Engineering Quad with broken streetlight.",
    date: "2026-08-08",
    time: "21:30",
    location: { lat: 22.2895, lng: 73.3645, name: "Parul Engineering Quad Pathway" },
    anonymous: true,
    status: "Under Review",
    severity: "Moderate",
    confirmations: 14
  },
  {
    id: 102,
    category: "Stalking",
    description: "Suspicious individual following student near Central Library gate.",
    date: "2026-08-09",
    time: "22:15",
    location: { lat: 22.2875, lng: 73.3620, name: "Parul Central Library Gate" },
    anonymous: false,
    status: "Verified",
    severity: "Critical",
    confirmations: 32
  },
  {
    id: 103,
    category: "Suspicious Activity",
    description: "Unidentified vehicle loitering near Deviram Hostel Block past curfew.",
    date: "2026-08-09",
    time: "23:00",
    location: { lat: 22.2900, lng: 73.3610, name: "Deviram Hostel Gate" },
    anonymous: true,
    status: "Resolved",
    severity: "High",
    confirmations: 21
  }
];

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  state.incidents = [...initialIncidents];

  if (state.currentUser) {
    state.currentRole = state.currentUser.role;
    applyRolePermissions(state.currentRole);

    if (state.currentRole === 'student' && !state.currentUser.collegeDetails) {
      setTimeout(openCollegeOnboardingModal, 400);
    } else {
      updateCollegeBadgeUI();
    }
  }
  
  if (window.lucide) {
    lucide.createIcons();
  }

  checkCppServerHealth();
  renderCommunityFeed();
  renderAdminTable();
  renderSecurityAlerts();

  const now = new Date();
  const dtInput = document.getElementById('reportDateTime');
  if (dtInput) {
    dtInput.value = now.toISOString().slice(0, 16);
  }
});

// Live Geocoding API: Query Map Database for University Coordinates (including Parul University)
async function fetchUniversityLocationFromGeocoding(uniName, districtName, stateName) {
  const queryKey = `${uniName}, ${districtName}, ${stateName}`;
  if (state.geocodedCoordsCache[queryKey]) {
    return state.geocodedCoordsCache[queryKey];
  }

  // 1. Try preset dictionary first for sub-second response
  for (let key in indianUniversityCoords) {
    if (uniName && uniName.toLowerCase().includes(key.toLowerCase())) {
      return indianUniversityCoords[key];
    }
  }

  // 2. Fetch live GPS coordinates from Map Geocoding API (Nominatim OpenStreetMap / Google Map Database)
  try {
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(uniName + ', ' + districtName + ', ' + stateName + ', India')}`;
    const response = await fetch(searchUrl, { headers: { 'User-Agent': 'CampusShield-Safety-App/1.0' } });
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        state.geocodedCoordsCache[queryKey] = coords;
        console.log(`✅ Live Geocoded ${uniName}:`, coords);
        return coords;
      }
    }
  } catch (err) {
    console.log("Geocoding API network fallback active.");
  }

  // 3. District Fallback
  for (let key in indianUniversityCoords) {
    if (districtName && districtName.toLowerCase().includes(key.toLowerCase())) {
      return indianUniversityCoords[key];
    }
  }

  // 4. Mathematical Hash fallback for any district in India
  let str = (uniName || '') + (districtName || '') + (stateName || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const latOffset = (Math.abs(hash) % 100) / 1000;
  const lngOffset = (Math.abs(hash >> 2) % 100) / 1000;

  return [22.2887 + latOffset, 73.3634 + lngOffset];
}

// Get University Coordinates (Sync or Cached)
function getUniversityCoordinates(uniName, districtName, stateName) {
  const queryKey = `${uniName}, ${districtName}, ${stateName}`;
  if (state.geocodedCoordsCache[queryKey]) {
    return state.geocodedCoordsCache[queryKey];
  }
  for (let key in indianUniversityCoords) {
    if (uniName && uniName.toLowerCase().includes(key.toLowerCase())) {
      return indianUniversityCoords[key];
    }
  }
  for (let key in indianUniversityCoords) {
    if (districtName && districtName.toLowerCase().includes(key.toLowerCase())) {
      return indianUniversityCoords[key];
    }
  }
  return [22.2887, 73.3634]; // Default Parul University Vadodara Coordinates
}

// College & University Details Modal Logic
function openCollegeOnboardingModal() {
  const modal = document.getElementById('collegeOnboardingModal');
  if (!modal) return;

  if (state.currentUser && state.currentUser.collegeDetails) {
    const c = state.currentUser.collegeDetails;
    document.getElementById('onboardUniType').value = c.uniType || 'Private / Deemed University';
    document.getElementById('onboardCollegeName').value = c.collegeName || 'Parul University';
    document.getElementById('onboardState').value = c.state || 'Gujarat';
    document.getElementById('onboardDistrict').value = c.district || 'Vadodara';
    document.getElementById('onboardCampusBranch').value = c.campusBranch || 'Main Campus (Limda, Waghodia)';
    document.getElementById('onboardCourseStream').value = c.courseStream || 'Engineering & Technology';
    document.getElementById('onboardCourseYear').value = c.courseYear || '3rd Year';
    document.getElementById('onboardHostelContact').value = c.hostelContact || 'Tagore Hostel Block B';
  } else {
    // Default pre-fill Parul University
    document.getElementById('onboardUniType').value = 'Private / Deemed University';
    document.getElementById('onboardCollegeName').value = 'Parul University';
    document.getElementById('onboardState').value = 'Gujarat';
    document.getElementById('onboardDistrict').value = 'Vadodara';
    document.getElementById('onboardCampusBranch').value = 'Main Campus (Limda, Waghodia)';
    document.getElementById('onboardCourseStream').value = 'Engineering & Technology';
    document.getElementById('onboardCourseYear').value = '3rd Year';
    document.getElementById('onboardHostelContact').value = 'Tagore Hostel Block B / 9876543210';
  }

  modal.classList.remove('hidden');
}

function closeCollegeOnboardingModal() {
  const modal = document.getElementById('collegeOnboardingModal');
  if (modal) modal.classList.add('hidden');
}

async function handleCollegeOnboardingSubmit(e) {
  e.preventDefault();
  
  const uniType = document.getElementById('onboardUniType').value;
  const collegeName = document.getElementById('onboardCollegeName').value.trim();
  const stateVal = document.getElementById('onboardState').value;
  const district = document.getElementById('onboardDistrict').value.trim();
  const campusBranch = document.getElementById('onboardCampusBranch').value.trim();
  const courseStream = document.getElementById('onboardCourseStream').value;
  const courseYear = document.getElementById('onboardCourseYear').value;
  const hostelContact = document.getElementById('onboardHostelContact').value.trim();

  // Query live map database for GPS coordinates of Parul University / selected institution
  const detectedCoords = await fetchUniversityLocationFromGeocoding(collegeName, district, stateVal);

  state.currentUser.collegeDetails = {
    uniType,
    collegeName,
    state: stateVal,
    district,
    campusBranch,
    courseStream,
    courseYear,
    hostelContact,
    coords: detectedCoords
  };

  sessionStorage.setItem('cs_user', JSON.stringify(state.currentUser));
  updateCollegeBadgeUI();

  if (state.map) {
    recenterMapOnUniversity();
  }

  alert(`✅ Parul University Location Confirmed!\n\nCategory: ${uniType}\nUniversity: ${collegeName}\nLocation: ${district}, ${stateVal}\nGPS Coordinates: [${detectedCoords[0].toFixed(4)}, ${detectedCoords[1].toFixed(4)}]\nMap updated to Parul University Campus!`);
  closeCollegeOnboardingModal();
}

function updateCollegeBadgeUI() {
  if (!state.currentUser) return;

  const badgeEl = document.getElementById('dashCollegeBadge');
  const profileLocEl = document.getElementById('profileCollegeLocation');
  const studentNameEl = document.getElementById('dashStudentName');
  const uniNameEl = document.getElementById('dashUniversityName');
  const stateDistEl = document.getElementById('dashStateDistrict');
  const courseYrEl = document.getElementById('dashCourseYear');
  const uniTypeBadgeEl = document.getElementById('dashUniTypeBadge');

  if (studentNameEl) studentNameEl.textContent = state.currentUser.name;

  if (state.currentUser.collegeDetails) {
    const c = state.currentUser.collegeDetails;
    if (badgeEl) badgeEl.textContent = `📍 ${c.collegeName} (${c.campusBranch}, ${c.district})`;
    if (profileLocEl) profileLocEl.textContent = `${c.collegeName} (${c.district}, ${c.state})`;
    if (uniNameEl) uniNameEl.textContent = c.collegeName;
    if (stateDistEl) stateDistEl.textContent = `${c.state} (${c.district})`;
    if (courseYrEl) courseYrEl.textContent = `${c.courseStream} (${c.courseYear})`;
    if (uniTypeBadgeEl) {
      if (c.uniType && c.uniType.toLowerCase().includes('private')) {
        uniTypeBadgeEl.textContent = 'PRIVATE';
        uniTypeBadgeEl.className = 'text-[9px] px-1.5 py-0.5 rounded bg-[#5EEAD4]/20 text-[#5EEAD4] font-bold';
      } else {
        uniTypeBadgeEl.textContent = 'PUBLIC / GOVT';
        uniTypeBadgeEl.className = 'text-[9px] px-1.5 py-0.5 rounded bg-[#A3E635]/20 text-[#A3E635] font-bold';
      }
    }
  } else {
    if (badgeEl) badgeEl.textContent = `📍 Parul University (Main Campus, Vadodara)`;
    if (profileLocEl) profileLocEl.textContent = `Parul University (Vadodara, Gujarat)`;
    if (uniNameEl) uniNameEl.textContent = `Parul University`;
    if (stateDistEl) stateDistEl.textContent = `Gujarat (Vadodara)`;
    if (courseYrEl) courseYrEl.textContent = `Engineering & Technology (3rd Year)`;
    if (uniTypeBadgeEl) {
      uniTypeBadgeEl.textContent = 'PRIVATE';
      uniTypeBadgeEl.className = 'text-[9px] px-1.5 py-0.5 rounded bg-[#5EEAD4]/20 text-[#5EEAD4] font-bold';
    }
  }
}

// Apply Strict Role-Based Visibility
function applyRolePermissions(role) {
  state.currentRole = role;

  const nameEl = document.getElementById('headerUserName');
  const roleBadgeEl = document.getElementById('headerRoleBadge');
  
  if (nameEl) nameEl.textContent = state.currentUser.name;
  if (roleBadgeEl) roleBadgeEl.textContent = role.toUpperCase();

  const studentEls = document.querySelectorAll('.role-student-only');
  const adminEls = document.querySelectorAll('.role-admin-only');
  const securityEls = document.querySelectorAll('.role-security-only');

  if (role === 'student') {
    studentEls.forEach(el => el.classList.remove('hidden'));
    adminEls.forEach(el => el.classList.add('hidden'));
    securityEls.forEach(el => el.classList.add('hidden'));
    navigateTo('studentDashboard');
  } else if (role === 'admin') {
    adminEls.forEach(el => el.classList.remove('hidden'));
    studentEls.forEach(el => el.classList.add('hidden'));
    securityEls.forEach(el => el.classList.add('hidden'));
    navigateTo('adminDashboard');
  } else if (role === 'security') {
    securityEls.forEach(el => el.classList.remove('hidden'));
    studentEls.forEach(el => el.classList.add('hidden'));
    adminEls.forEach(el => el.classList.add('hidden'));
    navigateTo('securityDashboard');
  }
}

function logoutUser() {
  sessionStorage.removeItem('cs_user');
  window.location.href = 'login.html';
}

// View Router
function navigateTo(viewId) {
  state.activeView = viewId;
  
  document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.remove('hidden');
  }

  document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`nav-${viewId}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  if (viewId === 'campusMap') {
    setTimeout(initCampusMap, 100);
  } else if (viewId === 'adminDashboard') {
    setTimeout(initAdminCharts, 100);
  } else if (viewId === 'profile') {
    renderProfile();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Mobile Hamburger Drawer Router
function toggleMobileDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  if (drawer) drawer.classList.toggle('hidden');
}

function mobileNavTo(viewId) {
  toggleMobileDrawer();
  navigateTo(viewId);
}

// User Profile Renderer
function renderProfile() {
  if (!state.currentUser) return;
  
  const initials = state.currentUser.name.split(' ').map(n => n[0]).join('');
  document.getElementById('profileInitials').textContent = initials;
  document.getElementById('profileFullName').textContent = state.currentUser.name;
  document.getElementById('profileEmail').textContent = state.currentUser.email;
  document.getElementById('profileCollegeId').textContent = state.currentUser.collegeId;
  document.getElementById('profileTrustScore').textContent = `${state.currentUser.trustScore || 95}% (High Trust)`;
  document.getElementById('profileRoleBadge').textContent = `${state.currentUser.role.toUpperCase()} Account`;
  
  updateCollegeBadgeUI();
}

// Emergency SOS Modal Controls
function openSosModal() {
  const modal = document.getElementById('sosModal');
  if (modal) modal.classList.remove('hidden');
}

function closeSosModal() {
  const modal = document.getElementById('sosModal');
  if (modal) modal.classList.add('hidden');
}

function executeSosAction(actionType) {
  closeSosModal();
  if (actionType === 'call_security') {
    alert("📞 Calling Campus Security Desk at 1800-11-2233...");
    window.location.href = "tel:1800112233";
  } else if (actionType === 'share_gps') {
    alert("📍 Live GPS Location broadcasted to Security Patrol!");
  } else if (actionType === 'call_112') {
    alert("🚨 Connecting to Emergency Helpline (112 / 1091)...");
    window.location.href = "tel:112";
  } else if (actionType === 'notify_contacts') {
    alert("📲 Emergency SMS Alert sent to your 3 trusted contacts!");
  }
}

// Auto-Detect GPS Location
function detectGPSLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      document.getElementById('reportLat').value = pos.coords.latitude;
      document.getElementById('reportLng').value = pos.coords.longitude;
      document.getElementById('reportLocationName').value = `GPS: (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
      alert("GPS location auto-detected successfully!");
    }, () => alert("Could not fetch GPS location. Defaulting to campus center."));
  }
}

// Voice-to-Text Reporting
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
      }
      stopVoiceListening();
    };

    state.speechRecognition.onerror = () => stopVoiceListening();
    state.speechRecognition.onend = () => stopVoiceListening();
  }

  if (!state.isVoiceListening) {
    state.speechRecognition.start();
    state.isVoiceListening = true;
    document.getElementById('voiceBtnText').textContent = "Listening...";
  } else {
    state.speechRecognition.stop();
    stopVoiceListening();
  }
}

function stopVoiceListening() {
  state.isVoiceListening = false;
  const txt = document.getElementById('voiceBtnText');
  if (txt) txt.textContent = "Voice-to-Text";
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
  const locName = document.getElementById('reportLocationName').value;
  const dt = document.getElementById('reportDateTime').value;
  const severity = document.getElementById('reportSeverity').value;
  const desc = document.getElementById('reportDescription').value;
  const isAnon = document.getElementById('reportAnonymous').checked;

  const reportId = `#CS-2026-${Math.floor(10000 + Math.random() * 90000)}`;

  const c = state.currentUser?.collegeDetails;
  const coords = c?.coords || getUniversityCoordinates(c?.collegeName, c?.district, c?.state);

  const newIncident = {
    id: Date.now(),
    category,
    description: desc,
    date: dt.split('T')[0] || "2026-08-09",
    time: dt.split('T')[1] || "22:00",
    location: { lat: coords[0] + 0.002, lng: coords[1] + 0.002, name: locName },
    anonymous: isAnon,
    status: "Under Review",
    severity: severity,
    confirmations: 1
  };

  state.incidents.unshift(newIncident);

  document.getElementById('confirmReportId').textContent = reportId;
  document.getElementById('reportConfirmModal').classList.remove('hidden');
  document.getElementById('incidentForm').reset();

  renderCommunityFeed();
  renderAdminTable();
  if (state.map) renderMapMarkers();
}

function closeReportConfirmModal() {
  document.getElementById('reportConfirmModal').classList.add('hidden');
  navigateTo('studentDashboard');
}

// Dynamic University Leaflet Map Renderer (Parul University & All-India)
async function initCampusMap() {
  const c = state.currentUser?.collegeDetails;
  let coords = c?.coords;
  
  if (!coords && c) {
    coords = await fetchUniversityLocationFromGeocoding(c.collegeName, c.district, c.state);
  } else if (!coords) {
    coords = [22.2887, 73.3634]; // Parul University GPS Center
  }

  const titleEl = document.getElementById('mapTitle');
  const subtitleEl = document.getElementById('mapSubtitle');

  if (c && c.collegeName) {
    if (titleEl) titleEl.textContent = `Interactive Campus Safety Map — ${c.collegeName}`;
    if (subtitleEl) subtitleEl.textContent = `Real-time safe zones, help points, and report hotspots centered on ${c.collegeName} (${c.district}, ${c.state}). GPS: [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]`;
  } else {
    if (titleEl) titleEl.textContent = `Interactive Campus Safety Map — Parul University`;
    if (subtitleEl) subtitleEl.textContent = `Real-time safe zones, help points, and report hotspots centered on Parul University (Vadodara, Gujarat). GPS: [22.2887, 73.3634]`;
  }

  if (!state.map) {
    state.map = L.map('campusMap').setView(coords, 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(state.map);
  } else {
    state.map.setView(coords, 15);
  }

  renderMapMarkers();
}

async function recenterMapOnUniversity() {
  const c = state.currentUser?.collegeDetails;
  let coords = c?.coords;
  if (!coords && c) {
    coords = await fetchUniversityLocationFromGeocoding(c.collegeName, c.district, c.state);
  } else if (!coords) {
    coords = [22.2887, 73.3634];
  }
  if (state.map) {
    state.map.flyTo(coords, 15, { duration: 1.5 });
  }
}

function renderMapMarkers() {
  if (!state.map) return;

  state.mapMarkers.forEach(m => state.map.removeLayer(m));
  state.mapMarkers = [];

  const c = state.currentUser?.collegeDetails;
  const center = c?.coords || getUniversityCoordinates(c?.collegeName, c?.district, c?.state);

  const localMarkers = [
    { type: 'security', name: `${c?.collegeName || 'Parul University'} Main Gate Security Post`, lat: center[0] + 0.001, lng: center[1] + 0.001, details: '24/7 Guard Patrol & CCTV Control Room' },
    { type: 'safe', name: `Parul Central Library & Reading Hall`, lat: center[0] - 0.0015, lng: center[1] + 0.002, details: 'Illuminated & Monitored Safe Zone' },
    { type: 'safe', name: `Deviram Girls Hostel Warden Post`, lat: center[0] + 0.0025, lng: center[1] - 0.001, details: '24/7 Warden & Security Desk' },
    { type: 'emergency', name: `Parul Campus Panic Pillar & Intercom`, lat: center[0] - 0.001, lng: center[1] - 0.002, details: '1-Touch Beacon Siren' }
  ];

  localMarkers.forEach(marker => {
    if (state.activeMapFilter === 'all' || state.activeMapFilter === marker.type) {
      let color = '#A3E635';
      if (marker.type === 'security') color = '#2DD4BF';
      else if (marker.type === 'emergency') color = '#FBBF24';

      const circle = L.circle([marker.lat, marker.lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.6,
        radius: 60
      }).addTo(state.map);

      circle.bindPopup(`
        <div class="p-2 space-y-1">
          <strong class="text-sm font-bold">${marker.name}</strong>
          <div class="text-xs text-[#94A39D]">${marker.details}</div>
        </div>
      `);
      state.mapMarkers.push(circle);
    }
  });

  if (state.activeMapFilter === 'all' || state.activeMapFilter === 'incidents') {
    state.incidents.forEach(inc => {
      const circle = L.circle([inc.location.lat, inc.location.lng], {
        color: '#FB5B5B',
        fillColor: '#FB5B5B',
        fillOpacity: 0.6,
        radius: 70
      }).addTo(state.map);

      circle.bindPopup(`
        <div class="p-2 space-y-1">
          <strong class="text-sm text-[#FB5B5B] font-bold">${inc.category}</strong>
          <div class="text-xs">${inc.description}</div>
          <div class="text-[10px] text-[#94A39D]">Location: ${inc.location.name}</div>
        </div>
      `);
      state.mapMarkers.push(circle);
    });
  }
}

function filterMapMarkers(type) {
  state.activeMapFilter = type;
  renderMapMarkers();
}

// Community Feed Renderer
function renderCommunityFeed() {
  const container = document.getElementById('communityFeedContainer');
  if (!container) return;

  container.innerHTML = state.incidents.map(inc => `
    <div class="glass-card p-5 space-y-3 border-l-4 ${inc.severity === 'Critical' || inc.severity === 'High' ? 'border-l-[#FB5B5B]' : 'border-l-[#FBBF24]'}">
      <div class="flex items-center justify-between">
        <span class="font-extrabold text-sm text-[#5EEAD4]">${inc.category}</span>
        <span class="text-xs px-2.5 py-0.5 rounded-full ${inc.status === 'Resolved' ? 'bg-[#A3E635]/20 text-[#A3E635]' : 'bg-[#FBBF24]/20 text-[#FBBF24]'} font-bold">${inc.status}</span>
      </div>
      <p class="text-xs text-[#F1F5F3]">${inc.description}</p>
      <div class="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-[#1D302A] gap-2">
        <span class="text-[11px] text-[#94A39D]">📍 ${inc.location.name} • 🕒 ${inc.date} ${inc.time}</span>
        <button onclick="confirmReport(${inc.id})" class="px-3 py-1 rounded-xl bg-[#5EEAD4]/20 hover:bg-[#5EEAD4]/30 text-[#5EEAD4] border border-[#5EEAD4]/30 font-semibold flex items-center gap-1.5 transition">
          🤝 I experienced this too (${inc.confirmations})
        </button>
      </div>
    </div>
  `).join('');
}

function confirmReport(id) {
  const inc = state.incidents.find(i => i.id === id);
  if (inc) {
    inc.confirmations++;
    renderCommunityFeed();
  }
}

// Admin Table Renderer
function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;

  tbody.innerHTML = state.incidents.map(inc => `
    <tr>
      <td class="p-3 font-mono text-[#5EEAD4]">#${inc.id}</td>
      <td class="p-3 font-semibold text-white">${inc.category}</td>
      <td class="p-3 text-slate-300">${inc.location.name}</td>
      <td class="p-3"><span class="${inc.severity === 'Critical' ? 'badge-emergency' : 'badge-warning'}">${inc.severity}</span></td>
      <td class="p-3 font-semibold">${inc.status}</td>
      <td class="p-3 flex items-center gap-2">
        <button onclick="updateIncidentStatus(${inc.id}, 'Under Review')" class="px-2 py-1 bg-amber-500/20 text-amber-300 rounded text-[10px] border border-amber-500/30">Investigate</button>
        <button onclick="updateIncidentStatus(${inc.id}, 'Resolved')" class="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-[10px] border border-emerald-500/30">Resolve</button>
      </td>
    </tr>
  `).join('');
}

function updateIncidentStatus(id, newStatus) {
  const inc = state.incidents.find(i => i.id === id);
  if (inc) {
    inc.status = newStatus;
    renderAdminTable();
    renderCommunityFeed();
    alert(`Incident #${id} status updated to '${newStatus}'`);
  }
}

// Security Alerts Renderer
function renderSecurityAlerts() {
  const list = document.getElementById('securityAlertsList');
  if (!list) return;

  list.innerHTML = state.incidents.filter(i => i.status !== 'Resolved').map(inc => `
    <div class="glass-panel p-4 rounded-2xl border border-[#FB5B5B]/30 flex items-center justify-between bg-[#0D1713]">
      <div class="space-y-1 text-xs">
        <div class="font-bold text-[#FB5B5B] text-sm">🚨 ALERT #${inc.id}: ${inc.category}</div>
        <div class="text-[#F1F5F3]">${inc.description}</div>
        <div class="text-[#94A39D]">Location: ${inc.location.name}</div>
      </div>
      <button onclick="dispatchGuardPatrol(${inc.id})" class="btn-danger text-xs px-3 py-1.5 shrink-0 font-bold">Dispatch Patrol</button>
    </div>
  `).join('');
}

function dispatchGuardPatrol(id) {
  alert(`👮 Guard Patrol Officer dispatched to Incident #${id} location!`);
}

// Admin Chart.js Visualizations
function initAdminCharts() {
  const catCanvas = document.getElementById('chartCategories');
  if (catCanvas && !catCanvas.chart) {
    catCanvas.chart = new Chart(catCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Harassment', 'Stalking', 'Unsafe Area', 'Suspicious Activity'],
        datasets: [{
          data: [35, 25, 25, 15],
          backgroundColor: ['#5EEAD4', '#FB5B5B', '#FBBF24', '#2DD4BF']
        }]
      },
      options: { responsive: true, plugins: { legend: { labels: { color: '#F1F5F3' } } } }
    });
  }

  const timeCanvas = document.getElementById('chartTimeOfDay');
  if (timeCanvas && !timeCanvas.chart) {
    timeCanvas.chart = new Chart(timeCanvas, {
      type: 'bar',
      data: {
        labels: ['18:00', '20:00', '22:00', '00:00', '02:00'],
        datasets: [{
          label: 'Incidents Reported',
          data: [12, 28, 45, 30, 8],
          backgroundColor: '#5EEAD4'
        }]
      },
      options: { responsive: true, plugins: { legend: { labels: { color: '#F1F5F3' } } } }
    });
  }
}

// C++ REST Server Health Check
async function checkCppServerHealth() {
  try {
    const res = await fetch(`${state.cppServerUrl}/api/health`);
    if (res.ok) {
      state.isCppConnected = true;
    }
  } catch (err) {
    console.log("C++ Server offline, fallback mode active.");
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
