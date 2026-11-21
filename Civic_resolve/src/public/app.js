/**
 * CivicResolve: Full Interactive Client Application Logic
 * Role-Aware Civic Grievance Management, Multimodal AI Triage, and Geospatial Mapping
 */

// Application State
const STATE = {
  currentRole: 'CITIZEN',
  currentUser: {
    id: 'user-alex',
    name: 'Alex Rivera',
    role: 'CITIZEN',
    badge: 'Citizen',
    avatar: 'AR'
  },
  currentTab: 'feed',
  issues: [],
  filteredIssues: [],
  stats: null,
  selectedIssueId: null,
  filters: {
    category: 'ALL',
    urgency: 'ALL',
    status: 'ALL',
    search: ''
  },
  // Form State
  draftImageBase64: null,
  draftImageMime: 'image/jpeg',
  draftLocation: {
    lat: 37.7749,
    lng: -122.4194,
    address: '420 Market Street, Near Central Metro Transit Hub'
  },
  draftAiTriage: null,
  // Leaflet Map instances
  cityMap: null,
  cityMapMarkers: [],
  miniReportMap: null,
  miniReportMarker: null
};

// Role Profiles Configuration
const PROFILES = {
  CITIZEN: {
    id: 'user-alex',
    name: 'Alex Rivera',
    role: 'CITIZEN',
    badge: 'Citizen',
    avatar: 'AR'
  },
  ADMIN: {
    id: 'user-davis',
    name: 'Commissioner Davis',
    role: 'ADMIN',
    badge: 'City Triage Admin',
    avatar: 'CD'
  },
  FIELD_OFFICER: {
    id: 'user-chen',
    name: 'Officer Marcus Chen',
    role: 'FIELD_OFFICER',
    badge: 'Field Tech',
    department: 'Department of Public Works',
    avatar: 'MC'
  }
};

// Category Display Maps
const CATEGORY_NAMES = {
  ROADS_BRIDGES: 'Roads & Bridges',
  SANITATION_WASTE: 'Sanitation & Waste',
  WATER_SEWERAGE: 'Water & Sewerage',
  ELECTRICAL_LIGHTING: 'Power & Streetlights',
  PUBLIC_SAFETY: 'Public Safety',
  PARKS_RECREATION: 'Parks & Forestry'
};

const CATEGORY_ICONS = {
  ROADS_BRIDGES: '🛣️',
  SANITATION_WASTE: '🗑️',
  WATER_SEWERAGE: '💧',
  ELECTRICAL_LIGHTING: '⚡',
  PUBLIC_SAFETY: '🚨',
  PARKS_RECREATION: '🌳'
};

// Lifecycle Stages
const STAGES = ['REPORTED', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED'];

// Sample Preset Images for instant demo testing
const SAMPLE_IMAGES = {
  pothole: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
  water: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
  wire: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80'
};

// -------------------------------------------------------------
// INITIALIZATION
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) window.lucide.createIcons();
  updateNavigationForRole(STATE.currentRole);
  await loadSettingsStatus();
  await refreshData();
});

// -------------------------------------------------------------
// DATA FETCHING & STATE
// -------------------------------------------------------------
async function refreshData() {
  try {
    const [issuesRes, statsRes] = await Promise.all([
      fetch('/api/issues'),
      fetch('/api/stats')
    ]);

    const issuesData = await issuesRes.json();
    const statsData = await statsRes.json();

    if (issuesData.success) {
      STATE.issues = issuesData.data;
      applyFilters();
    }
    if (statsData.success) {
      STATE.stats = statsData.data;
      renderAdminStats();
    }

    renderCurrentView();
    updateMapMarkers();
  } catch (err) {
    console.error('Failed to load civic data:', err);
    showToast('Failed to connect to local server', 'error');
  }
}

async function loadSettingsStatus() {
  try {
    const res = await fetch('/api/settings/status');
    const data = await res.json();
    if (data.success) {
      const previewEl = document.getElementById('settingsCurrentKeyPreview');
      if (previewEl) previewEl.textContent = data.keyPreview;
      const tickerEl = document.getElementById('aiStatusTicker');
      if (tickerEl) {
        tickerEl.textContent = data.isConfigured
          ? `Gemini 2.5 Flash connected (${data.keyPreview}) • Real-time Multimodal Vision Enabled`
          : 'High-Fidelity Heuristic Engine Active • Ready for Live Gemini API Key';
      }
    }
  } catch (e) {
    console.warn(e);
  }
}

// -------------------------------------------------------------
// NAVIGATION & ROLE SWITCHER
// -------------------------------------------------------------
function updateNavigationForRole(roleKey) {
  const feedBtn = document.getElementById('nav-tab-feed');
  const mapBtn = document.getElementById('nav-tab-map');
  const adminBtn = document.getElementById('nav-tab-admin');
  const officerBtn = document.getElementById('nav-tab-officer');

  // Feed & Map are public citizen views - always visible
  if (feedBtn) feedBtn.style.display = 'flex';
  if (mapBtn) mapBtn.style.display = 'flex';

  if (roleKey === 'CITIZEN') {
    // Citizens ONLY see Citizen Feed and City Map Explorer
    if (adminBtn) adminBtn.style.display = 'none';
    if (officerBtn) officerBtn.style.display = 'none';

    // Prevent citizens from accessing internal admin or officer dashboards
    if (STATE.currentTab === 'admin' || STATE.currentTab === 'officer') {
      switchTab('feed');
    }
  } else if (roleKey === 'ADMIN') {
    // City Admin sees Admin Command Hub, Map, and Feed (to review citizen issues)
    if (adminBtn) adminBtn.style.display = 'flex';
    if (officerBtn) officerBtn.style.display = 'none';

    if (STATE.currentTab === 'officer') {
      switchTab('admin');
    }
  } else if (roleKey === 'FIELD_OFFICER') {
    // Field Officer sees Field Officer Dispatch, Map, and Feed
    if (adminBtn) adminBtn.style.display = 'none';
    if (officerBtn) officerBtn.style.display = 'flex';

    if (STATE.currentTab === 'admin') {
      switchTab('officer');
    }
  }
}

function switchTab(tabName) {
  // Enforce role-based access control
  if (STATE.currentRole === 'CITIZEN' && (tabName === 'admin' || tabName === 'officer')) {
    showToast('Access restricted: Citizen role cannot access internal municipal hub.', 'error');
    tabName = 'feed';
  } else if (STATE.currentRole === 'ADMIN' && tabName === 'officer') {
    tabName = 'admin';
  } else if (STATE.currentRole === 'FIELD_OFFICER' && tabName === 'admin') {
    tabName = 'officer';
  }

  STATE.currentTab = tabName;

  // Tab views
  const views = ['feed', 'map', 'admin', 'officer'];
  views.forEach((v) => {
    const el = document.getElementById(`view-${v}`);
    const navBtn = document.getElementById(`nav-tab-${v}`);
    if (el) el.classList.toggle('hidden', v !== tabName);

    if (navBtn) {
      if (v === tabName) {
        navBtn.className =
          'flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all text-slate-800 bg-white shadow-sm';
      } else {
        navBtn.className =
          'flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all text-slate-600 hover:text-slate-900';
      }
    }
  });

  if (tabName === 'map') {
    setTimeout(initCityMap, 100);
  }

  renderCurrentView();
  if (window.lucide) window.lucide.createIcons();
}

function toggleRoleMenu() {
  const menu = document.getElementById('roleMenu');
  if (menu) menu.classList.toggle('hidden');
}

// Close role dropdown on outside click
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('roleDropdownBtn');
  const menu = document.getElementById('roleMenu');
  if (menu && dropdown && !dropdown.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.add('hidden');
  }
});

function selectRole(roleKey) {
  STATE.currentRole = roleKey;
  STATE.currentUser = PROFILES[roleKey];

  // Update UI Elements
  const avatar = document.getElementById('roleAvatar');
  const userName = document.getElementById('roleUserName');
  const userBadge = document.getElementById('roleUserBadge');

  if (avatar) avatar.textContent = STATE.currentUser.avatar;
  if (userName) userName.textContent = STATE.currentUser.name;
  if (userBadge) userBadge.textContent = STATE.currentUser.badge;

  const menu = document.getElementById('roleMenu');
  if (menu) menu.classList.add('hidden');

  // Enforce role-based navbar tab visibility
  updateNavigationForRole(roleKey);

  showToast(`Switched role to ${STATE.currentUser.name} (${STATE.currentUser.badge})`, 'info');

  // Auto navigate to relevant view
  if (roleKey === 'ADMIN') {
    switchTab('admin');
  } else if (roleKey === 'FIELD_OFFICER') {
    switchTab('officer');
  } else {
    switchTab('feed');
  }
}

// -------------------------------------------------------------
// FILTERING & SEARCH
// -------------------------------------------------------------
function handleSearch(val) {
  STATE.filters.search = val.toLowerCase().trim();
  applyFilters();
}

function filterCategory(cat) {
  STATE.filters.category = cat;
  document.querySelectorAll('.cat-pill').forEach((pill) => {
    pill.classList.remove('active', 'bg-slate-900', 'text-white', 'border-slate-900');
    pill.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
  });

  const activePill = document.getElementById(`filter-cat-${cat}`);
  if (activePill) {
    activePill.classList.add('active', 'bg-slate-900', 'text-white', 'border-slate-900');
    activePill.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
  }
  applyFilters();
}

function filterUrgency(urgency) {
  STATE.filters.urgency = urgency;
  applyFilters();
}

function filterStatus(status) {
  STATE.filters.status = status;
  document.querySelectorAll('.status-btn').forEach((btn) => {
    btn.classList.remove('bg-white', 'text-slate-800', 'shadow-xs', 'font-bold');
    btn.classList.add('text-slate-600', 'font-medium');
  });
  const activeBtn = document.getElementById(`status-btn-${status}`);
  if (activeBtn) {
    activeBtn.classList.add('bg-white', 'text-slate-800', 'shadow-xs', 'font-bold');
    activeBtn.classList.remove('text-slate-600', 'font-medium');
  }
  applyFilters();
}

function applyFilters() {
  let list = [...STATE.issues];
  const { category, urgency, status, search } = STATE.filters;

  if (category && category !== 'ALL') {
    list = list.filter((i) => i.category === category);
  }
  if (urgency && urgency !== 'ALL') {
    list = list.filter((i) => i.urgency === urgency);
  }
  if (status && status !== 'ALL') {
    list = list.filter((i) => i.status === status);
  }
  if (search) {
    list = list.filter(
      (i) =>
        i.title.toLowerCase().includes(search) ||
        i.description.toLowerCase().includes(search) ||
        i.ticketNumber.toLowerCase().includes(search) ||
        i.location.address.toLowerCase().includes(search)
    );
  }

  STATE.filteredIssues = list;
  const countEl = document.getElementById('issuesCountDisplay');
  if (countEl) countEl.textContent = list.length;

  renderFeedCards();
  renderAdminTable();
  renderFieldOrders();
  updateMapMarkers();
}

// -------------------------------------------------------------
// RENDERING VIEWS
// -------------------------------------------------------------
function renderCurrentView() {
  if (STATE.currentTab === 'feed') renderFeedCards();
  if (STATE.currentTab === 'admin') renderAdminTable();
  if (STATE.currentTab === 'officer') renderFieldOrders();
  if (window.lucide) window.lucide.createIcons();
}

function renderFeedCards() {
  const container = document.getElementById('grievanceCardsContainer');
  if (!container) return;

  if (STATE.filteredIssues.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200">
        <i data-lucide="inbox" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
        <h4 class="text-base font-bold text-slate-800">No grievances match your filter</h4>
        <p class="text-xs text-slate-500 mt-1">Try clearing filters or search keywords, or submit a new report.</p>
        <button onclick="resetFilters()" class="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-xl">Clear All Filters</button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = STATE.filteredIssues
    .map((issue) => {
      const urgencyClass = `badge-${issue.urgency.toLowerCase()}`;
      const statusClass = `badge-${issue.status.toLowerCase()}`;
      const hasUpvoted = (issue.upvotedBy || []).includes(STATE.currentUser.id);

      return `
        <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group">
          <div>
            <!-- Image Thumbnail & Badges Header -->
            <div class="relative h-44 bg-slate-100 overflow-hidden cursor-pointer" onclick="openDetailModal('${issue.id}')">
              <img src="${issue.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'}" alt="${issue.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
              
              <!-- Top Floating Pills -->
              <div class="absolute top-3 left-3 flex items-center space-x-1.5">
                <span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-white/95 text-slate-900 shadow-sm border border-slate-200">
                  ${issue.ticketNumber}
                </span>
                <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md shadow-sm ${urgencyClass}">
                  ${issue.urgency}
                </span>
              </div>

              <div class="absolute top-3 right-3">
                <span class="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md shadow-sm bg-white/95 text-slate-800 border border-slate-200">
                  ${issue.status.replace('_', ' ')}
                </span>
              </div>

              <!-- Bottom Overlay info -->
              <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent p-3 pt-6 text-white flex items-center justify-between text-xs">
                <span class="font-bold flex items-center space-x-1 truncate">
                  <span>${CATEGORY_ICONS[issue.category] || '📍'}</span>
                  <span>${CATEGORY_NAMES[issue.category] || issue.category}</span>
                </span>
                <span class="text-[11px] text-emerald-300 font-semibold font-mono">SLA: ${issue.aiTriage?.estimatedSla || '24h'}</span>
              </div>
            </div>

            <!-- Card Content Body -->
            <div class="p-4 space-y-2.5">
              <h3 onclick="openDetailModal('${issue.id}')" class="text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors line-clamp-2 cursor-pointer leading-snug">
                ${issue.title}
              </h3>
              
              <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                ${issue.description}
              </p>

              <!-- Address Pin -->
              <div class="flex items-center text-[11px] text-slate-600 pt-1">
                <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0"></i>
                <span class="truncate">${issue.location?.address || 'Municipal Ward 1'}</span>
              </div>

              <!-- AI Triage Recommendation Pill -->
              <div class="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[11px]">
                <div class="flex items-center space-x-1.5 truncate">
                  <i data-lucide="bot" class="w-3.5 h-3.5 text-brand-600 shrink-0"></i>
                  <span class="text-slate-600 truncate">Routed to: <strong class="text-slate-900 font-semibold">${issue.department}</strong></span>
                </div>
                <span class="text-[10px] text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">AI Verified</span>
              </div>
            </div>
          </div>

          <!-- Card Bottom Footer Actions -->
          <div class="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
            <!-- Upvote Button -->
            <button onclick="toggleUpvote('${issue.id}')" class="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
              hasUpvoted
                ? 'bg-brand-50 text-brand-700 border-brand-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }">
              <i data-lucide="arrow-big-up" class="w-4 h-4 ${hasUpvoted ? 'text-brand-600 fill-brand-600' : ''}"></i>
              <span>${issue.upvotes || 0}</span>
              <span class="text-[10px] hidden sm:inline">${hasUpvoted ? 'Upvoted' : 'I also face this'}</span>
            </button>

            <!-- Track & View Details -->
            <button onclick="openDetailModal('${issue.id}')" class="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center space-x-1">
              <span>Track Resolution</span>
              <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `;
    })
    .join('');

  if (window.lucide) window.lucide.createIcons();
}

function resetFilters() {
  STATE.filters = { category: 'ALL', urgency: 'ALL', status: 'ALL', search: '' };
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  filterCategory('ALL');
  filterStatus('ALL');
  const urgencySelect = document.getElementById('urgencyFilterSelect');
  if (urgencySelect) urgencySelect.value = 'ALL';
}

// -------------------------------------------------------------
// LEAFLET INTERACTIVE CITY MAP EXPLORER
// -------------------------------------------------------------
function initCityMap() {
  const mapContainer = document.getElementById('cityMap');
  if (!mapContainer) return;

  if (STATE.cityMap) {
    STATE.cityMap.invalidateSize();
    return;
  }

  // Initialize Map centered around City Center (San Francisco demo area)
  STATE.cityMap = L.map('cityMap', {
    center: [37.7749, -122.4194],
    zoom: 13,
    zoomControl: true
  });

  // OpenStreetMap Tile Layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors | CivicResolve AI'
  }).addTo(STATE.cityMap);

  updateMapMarkers();
}

function updateMapMarkers() {
  if (!STATE.cityMap) return;

  // Clear existing markers
  STATE.cityMapMarkers.forEach((m) => STATE.cityMap.removeLayer(m));
  STATE.cityMapMarkers = [];

  STATE.filteredIssues.forEach((issue) => {
    if (!issue.location || !issue.location.lat || !issue.location.lng) return;

    // Pin color logic
    let pinClass = 'pin-medium';
    if (issue.status === 'RESOLVED' || issue.status === 'VERIFIED') {
      pinClass = 'pin-resolved';
    } else if (issue.urgency === 'CRITICAL') {
      pinClass = 'pin-critical';
    } else if (issue.urgency === 'HIGH') {
      pinClass = 'pin-high';
    } else if (issue.urgency === 'LOW') {
      pinClass = 'pin-low';
    }

    const iconHtml = `
      <div class="custom-map-pin ${pinClass}">
        <span style="font-size: 15px;">${CATEGORY_ICONS[issue.category] || '📍'}</span>
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'leaflet-div-icon',
      html: iconHtml,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -19]
    });

    const marker = L.marker([issue.location.lat, issue.location.lng], { icon: customIcon }).addTo(
      STATE.cityMap
    );

    // Rich popup card
    const popupHtml = `
      <div style="width: 240px; font-family: 'Plus Jakarta Sans', sans-serif;">
        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 2px;">
          ${issue.ticketNumber} • ${issue.urgency}
        </div>
        <div style="font-weight: 800; font-size: 13px; color: #0f172a; line-height: 1.3; margin-bottom: 4px;">
          ${issue.title}
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
          ${issue.location.address}
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
          <span style="font-weight: 700; color: #059669;">${issue.status.replace('_', ' ')}</span>
          <button onclick="openDetailModal('${issue.id}')" style="background: #059669; color: white; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">
            View Details
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    STATE.cityMapMarkers.push(marker);
  });
}

// -------------------------------------------------------------
// REPORT ISSUE MODAL & MINI MAP
// -------------------------------------------------------------
function openReportModal() {
  const modal = document.getElementById('reportModal');
  if (modal) modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');

  // Clear previous draft
  STATE.draftImageBase64 = null;
  STATE.draftAiTriage = null;

  const titleInput = document.getElementById('reportTitle');
  const descInput = document.getElementById('reportDescription');
  const addrInput = document.getElementById('reportAddress');
  const previewContainer = document.getElementById('imagePreviewContainer');
  const aiCard = document.getElementById('aiPredictionCard');
  const titleAiBadge = document.getElementById('titleAiBadge');
  const descAiBadge = document.getElementById('descAiBadge');

  if (titleInput) titleInput.value = '';
  if (descInput) descInput.value = '';
  if (addrInput) addrInput.value = STATE.draftLocation.address;
  if (previewContainer) previewContainer.classList.add('hidden');
  if (aiCard) aiCard.classList.add('hidden');
  if (titleAiBadge) titleAiBadge.classList.add('hidden');
  if (descAiBadge) descAiBadge.classList.add('hidden');

  const voiceCard = document.getElementById('voiceTranscriptCard');
  const voiceStatus = document.getElementById('voiceStatusMsg');
  if (voiceCard) voiceCard.classList.add('hidden');
  if (voiceStatus) voiceStatus.textContent = 'Press the button and speak about the civic problem in your language';

  setTimeout(initMiniReportMap, 150);
  if (window.lucide) window.lucide.createIcons();
}

function closeReportModal() {
  const modal = document.getElementById('reportModal');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

function initMiniReportMap() {
  const container = document.getElementById('reportMiniMap');
  if (!container) return;

  if (STATE.miniReportMap) {
    STATE.miniReportMap.invalidateSize();
    return;
  }

  STATE.miniReportMap = L.map('reportMiniMap', {
    center: [STATE.draftLocation.lat, STATE.draftLocation.lng],
    zoom: 14,
    zoomControl: false
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(STATE.miniReportMap);

  STATE.miniReportMarker = L.marker([STATE.draftLocation.lat, STATE.draftLocation.lng], {
    draggable: true
  }).addTo(STATE.miniReportMap);

  STATE.miniReportMarker.on('dragend', function (e) {
    const coord = e.target.getLatLng();
    setCoords(coord.lat, coord.lng);
  });

  STATE.miniReportMap.on('click', function (e) {
    setCoords(e.latlng.lat, e.latlng.lng);
  });
}

function setCoords(lat, lng, label) {
  STATE.draftLocation.lat = lat;
  STATE.draftLocation.lng = lng;

  if (STATE.miniReportMarker) {
    STATE.miniReportMarker.setLatLng([lat, lng]);
  }
  if (STATE.miniReportMap) {
    STATE.miniReportMap.panTo([lat, lng]);
  }

  const addrInput = document.getElementById('reportAddress');
  if (label && addrInput) {
    addrInput.value = label;
    STATE.draftLocation.address = label;
  } else if (addrInput) {
    addrInput.value = `Pinned Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    STATE.draftLocation.address = addrInput.value;
  }
}

function setPresetLocation(lat, lng, address) {
  setCoords(lat, lng, address);
}

function detectCurrentLocation() {
  if ('geolocation' in navigator) {
    showToast('Detecting device GPS...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(pos.coords.latitude, pos.coords.longitude, 'Detected GPS Location (Current)');
        showToast('GPS coordinates locked successfully!', 'success');
      },
      (err) => {
        console.warn('Geolocation denied, using city default:', err);
        setCoords(37.7749, -122.4194, 'Civic Center Plaza, Downtown');
        showToast('Defaulted to Downtown Civic Center', 'info');
      }
    );
  } else {
    showToast('Geolocation not supported by browser', 'error');
  }
}

// Image File Upload and Automatic AI Multi-modal Perception
function handleImageSelection(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    STATE.draftImageBase64 = e.target.result;
    STATE.draftImageMime = file.type || 'image/jpeg';

    const previewImg = document.getElementById('imagePreviewImg');
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (previewImg) previewImg.src = e.target.result;
    if (previewContainer) previewContainer.classList.remove('hidden');

    showToast('Photo uploaded! Gemini AI is auto-filling title and description...', 'info');
    await runAiAutoFillFromImage();
  };
  reader.readAsDataURL(file);
}

// Preset Scenario Selector with Instant AI Auto-Fill
async function loadSampleImage(type) {
  const url = SAMPLE_IMAGES[type];
  if (!url) return;

  STATE.draftImageBase64 = url;
  const previewImg = document.getElementById('imagePreviewImg');
  const previewContainer = document.getElementById('imagePreviewContainer');
  if (previewImg) previewImg.src = url;
  if (previewContainer) previewContainer.classList.remove('hidden');

  showToast(`Sample ${type} scenario attached! Running Gemini auto-fill...`, 'info');
  await runAiAutoFillFromImage(type);
}

// Instant AI Perception & Auto-Fill Engine
async function runAiAutoFillFromImage(sampleHint = '') {
  const titleInput = document.getElementById('reportTitle');
  const descInput = document.getElementById('reportDescription');
  const titleAiBadge = document.getElementById('titleAiBadge');
  const descAiBadge = document.getElementById('descAiBadge');
  const statusSubtext = document.getElementById('imageStatusSubtext');
  const card = document.getElementById('aiPredictionCard');
  const btnText = document.getElementById('aiTriageBtnText');

  if (statusSubtext) {
    statusSubtext.innerHTML = '<span class="text-indigo-600 font-bold animate-pulse">✨ Gemini AI analyzing photo... Auto-filling title & description...</span>';
  }
  if (btnText) btnText.textContent = '🤖 Analyzing image features...';

  try {
    const res = await fetch('/api/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: titleInput?.value?.trim() || '',
        description: descInput?.value?.trim() || '',
        imageBase64: STATE.draftImageBase64,
        mimeType: STATE.draftImageMime,
        sampleHint
      })
    });

    const data = await res.json();
    if (data.success && data.data) {
      const triage = data.data;
      STATE.draftAiTriage = triage;

      // Automatically fill the Title and Description while keeping them editable
      if (titleInput && triage.suggestedTitle) {
        titleInput.value = triage.suggestedTitle;
        titleInput.classList.add('ring-2', 'ring-emerald-400');
        setTimeout(() => titleInput.classList.remove('ring-2', 'ring-emerald-400'), 2500);
      }
      if (descInput && triage.suggestedDescription) {
        descInput.value = triage.suggestedDescription;
        descInput.classList.add('ring-2', 'ring-emerald-400');
        setTimeout(() => descInput.classList.remove('ring-2', 'ring-emerald-400'), 2500);
      }

      if (titleAiBadge) titleAiBadge.classList.remove('hidden');
      if (descAiBadge) descAiBadge.classList.remove('hidden');

      if (statusSubtext) {
        statusSubtext.innerHTML = '✨ <strong>Gemini AI auto-filled title & description</strong> below. You can freely edit or refine any text!';
      }

      // Populate AI prediction card
      document.getElementById('aiPredictedCategory').textContent =
        CATEGORY_NAMES[triage.category] || triage.category;
      document.getElementById('aiPredictedUrgency').textContent = `${triage.urgency} (Hazard: ${
        triage.publicHazardScore || 8
      }/10)`;
      document.getElementById('aiPredictedDept').textContent = triage.department;
      document.getElementById('aiPredictedSla').textContent = triage.estimatedSla || '24 Hours';
      document.getElementById('aiReasoningText').textContent = `"${triage.aiReasoning}"`;
      document.getElementById('aiConfidenceBadge').textContent = `${Math.round(
        (triage.confidence || 0.95) * 100
      )}% Confidence`;

      if (card) card.classList.remove('hidden');
      showToast('✨ Title & description auto-filled by AI! Feel free to edit.', 'success');
    }
  } catch (err) {
    console.error('Image auto-fill failed:', err);
    if (statusSubtext) {
      statusSubtext.textContent = 'Photo attached. Ready for description input.';
    }
  } finally {
    if (btnText) btnText.textContent = '⚡ Re-Analyze with Google Gemini Multimodal AI';
    if (window.lucide) window.lucide.createIcons();
  }
}

// -------------------------------------------------------------
// REAL-TIME GEMINI MULTIMODAL AI TRIAGE (MANUAL TRIGGER)
// -------------------------------------------------------------
async function runAiTriagePreview() {
  const title = document.getElementById('reportTitle')?.value?.trim();
  const description = document.getElementById('reportDescription')?.value?.trim();

  if (!title && !description) {
    showToast('Please enter an issue title or description first', 'error');
    return;
  }

  const btn = document.getElementById('aiTriageBtn');
  const btnText = document.getElementById('aiTriageBtnText');
  const card = document.getElementById('aiPredictionCard');

  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = '🤖 Gemini 2.5 Flash analyzing damage...';

  try {
    const res = await fetch('/api/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        imageBase64: STATE.draftImageBase64,
        mimeType: STATE.draftImageMime
      })
    });

    const data = await res.json();
    if (data.success && data.data) {
      const triage = data.data;
      STATE.draftAiTriage = triage;

      // Populate AI prediction card
      document.getElementById('aiPredictedCategory').textContent =
        CATEGORY_NAMES[triage.category] || triage.category;
      document.getElementById('aiPredictedUrgency').textContent = `${triage.urgency} (Hazard: ${
        triage.publicHazardScore || 8
      }/10)`;
      document.getElementById('aiPredictedDept').textContent = triage.department;
      document.getElementById('aiPredictedSla').textContent = triage.estimatedSla || '24 Hours';
      document.getElementById('aiReasoningText').textContent = `"${triage.aiReasoning}"`;
      document.getElementById('aiConfidenceBadge').textContent = `${Math.round(
        (triage.confidence || 0.95) * 100
      )}% Confidence`;

      if (card) card.classList.remove('hidden');
      showToast('AI Triage completed successfully!', 'success');
    }
  } catch (err) {
    console.error('Triage failed:', err);
    showToast('AI triage engine error, fell back to rules', 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = '⚡ Re-Analyze with Google Gemini Multimodal AI';
  }
}

// Submit Form
async function submitReportForm(event) {
  event.preventDefault();

  const title = document.getElementById('reportTitle')?.value?.trim();
  const description = document.getElementById('reportDescription')?.value?.trim();
  const address = document.getElementById('reportAddress')?.value?.trim();

  if (!title || !description) return;

  const submitBtn = document.getElementById('submitComplaintBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Submitting...</span>`;
  }

  try {
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        imageBase64: STATE.draftImageBase64?.startsWith('data:') ? STATE.draftImageBase64 : null,
        imageUrl: STATE.draftImageBase64?.startsWith('http') ? STATE.draftImageBase64 : null,
        location: {
          lat: STATE.draftLocation.lat,
          lng: STATE.draftLocation.lng,
          address: address || STATE.draftLocation.address
        },
        reportedBy: {
          name: STATE.currentUser.name,
          phone: '+1 (555) 789-3210'
        },
        aiTriage: STATE.draftAiTriage
      })
    });

    const data = await res.json();
    if (data.success && data.data) {
      showToast(`Complaint ${data.data.ticketNumber} registered successfully!`, 'success');
      closeReportModal();
      await refreshData();
      openDetailModal(data.data.id);
    } else {
      showToast(data.error || 'Failed to submit complaint', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to submit report', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="send" class="w-4 h-4"></i><span>Submit Civic Complaint</span>`;
    }
    if (window.lucide) window.lucide.createIcons();
  }
}

// -------------------------------------------------------------
// COMMUNITY UPVOTING
// -------------------------------------------------------------
async function toggleUpvote(id) {
  try {
    const res = await fetch(`/api/issues/${id}/upvote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: STATE.currentUser.id })
    });
    const data = await res.json();
    if (data.success) {
      const issue = STATE.issues.find((i) => i.id === id);
      if (issue) {
        issue.upvotes = data.data.upvotes;
        if (data.data.hasUpvoted) {
          if (!issue.upvotedBy.includes(STATE.currentUser.id)) issue.upvotedBy.push(STATE.currentUser.id);
          showToast('Upvoted! Community counter updated.', 'success');
        } else {
          issue.upvotedBy = issue.upvotedBy.filter((u) => u !== STATE.currentUser.id);
          showToast('Upvote removed', 'info');
        }
      }
      applyFilters();
    }
  } catch (err) {
    console.error(err);
  }
}

// -------------------------------------------------------------
// 5-STAGE LIFECYCLE & DETAIL MODAL
// -------------------------------------------------------------
function openDetailModal(id) {
  const issue = STATE.issues.find((i) => i.id === id);
  if (!issue) return;

  STATE.selectedIssueId = id;
  const modal = document.getElementById('detailModal');
  const content = document.getElementById('detailModalContent');
  if (!modal || !content) return;

  const currentStageIndex = STAGES.indexOf(issue.status);
  const isResolvedOrVerified = issue.status === 'RESOLVED' || issue.status === 'VERIFIED';

  content.innerHTML = `
    <!-- Modal Header -->
    <div class="border-b border-slate-200 pb-4 mb-5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center space-x-2">
          <span class="px-2.5 py-1 text-xs font-mono font-bold bg-slate-900 text-white rounded-lg">${issue.ticketNumber}</span>
          <span class="px-2.5 py-1 text-xs font-bold uppercase rounded-lg badge-${issue.urgency.toLowerCase()}">${issue.urgency} URGENCY</span>
          <span class="text-xs text-slate-500">• Reported by ${issue.reportedBy?.name || 'Citizen'}</span>
        </div>
        <span class="px-3 py-1 text-xs font-extrabold uppercase rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
          Status: ${issue.status.replace('_', ' ')}
        </span>
      </div>
      <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-2 leading-snug">${issue.title}</h2>
      <p class="text-xs text-slate-600 flex items-center mt-1">
        <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400 mr-1"></i>
        ${issue.location?.address || 'Municipal Ward'}
      </p>
    </div>

    <!-- 5-Stage Stepper Progress -->
    <div class="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
      <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">5-Stage Redressal Lifecycle</p>
      <div class="grid grid-cols-5 gap-1 relative">
        ${STAGES.map((stage, idx) => {
          const isDone = idx <= currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const stageLabels = {
            REPORTED: '1. Reported',
            TRIAGED: '2. Triaged',
            IN_PROGRESS: '3. In Progress',
            RESOLVED: '4. Resolved',
            VERIFIED: '5. Verified'
          };
          return `
            <div class="text-center">
              <div class="h-2 rounded-full mb-2 ${
                isDone ? 'bg-brand-600' : 'bg-slate-200'
              } ${isCurrent ? 'ring-2 ring-brand-400 animate-pulse' : ''}"></div>
              <span class="text-[10px] font-bold block ${
                isDone ? 'text-slate-900' : 'text-slate-400'
              }">${stageLabels[stage]}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Before & After Comparison Photos -->
    <div class="mb-6 grid grid-cols-1 ${issue.afterImageUrl ? 'sm:grid-cols-2' : ''} gap-4">
      <div>
        <p class="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center justify-between">
          <span>Initial Complaint Photo</span>
          <span class="text-[10px] text-slate-400 font-normal">Before Fix</span>
        </p>
        <img src="${issue.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'}" alt="Before" class="w-full h-48 object-cover rounded-xl border border-slate-200 shadow-xs">
      </div>

      ${
        issue.afterImageUrl
          ? `
        <div>
          <p class="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1 flex items-center justify-between">
            <span>Verified Resolution Proof</span>
            <span class="text-[10px] text-emerald-600 font-bold">After Fix</span>
          </p>
          <img src="${issue.afterImageUrl}" alt="After" class="w-full h-48 object-cover rounded-xl border border-emerald-200 shadow-xs">
        </div>
      `
          : ''
      }
    </div>

    <!-- Issue Description & Official Remarks -->
    <div class="space-y-3 mb-6 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
      <div>
        <strong class="text-slate-900 block mb-0.5">Citizen Description:</strong>
        <p class="leading-relaxed text-slate-600">${issue.description}</p>
      </div>

      ${
        issue.resolutionNotes
          ? `
        <div class="pt-2 border-t border-slate-200">
          <strong class="text-emerald-800 block mb-0.5">Official Department Resolution Report:</strong>
          <p class="leading-relaxed text-emerald-950 font-medium">${issue.resolutionNotes}</p>
        </div>
      `
          : ''
      }
    </div>

    <!-- Google Gemini AI Triage Breakdown -->
    <div class="mb-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2.5">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
          <i data-lucide="bot" class="w-4 h-4 text-indigo-600"></i>
          <span>Google Gemini AI Triage Breakdown</span>
        </h4>
        <span class="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
          ${issue.aiTriage?.modelUsed || 'Gemini 2.5 Flash'}
        </span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div class="bg-white p-2 rounded-xl border border-indigo-100">
          <span class="text-[10px] text-slate-400 font-bold uppercase block">Hazard Score</span>
          <span class="font-extrabold text-rose-600 text-sm">${issue.aiTriage?.publicHazardScore || 7} / 10</span>
        </div>
        <div class="bg-white p-2 rounded-xl border border-indigo-100">
          <span class="text-[10px] text-slate-400 font-bold uppercase block">Target SLA</span>
          <span class="font-extrabold text-brand-700 text-sm">${issue.aiTriage?.estimatedSla || '24h'}</span>
        </div>
        <div class="bg-white p-2 rounded-xl border border-indigo-100 col-span-2">
          <span class="text-[10px] text-slate-400 font-bold uppercase block">Assigned Bureau</span>
          <span class="font-extrabold text-slate-900 text-xs truncate block">${issue.department}</span>
        </div>
      </div>

      <p class="text-[11px] text-slate-600 italic leading-relaxed">
        <strong>Triage Rationale:</strong> "${issue.aiTriage?.aiReasoning || 'Triage completed based on reported keywords and spatial proximity.'}"
      </p>
    </div>

    <!-- Action Audit Timeline -->
    <div class="mb-6">
      <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center space-x-1.5">
        <i data-lucide="history" class="w-4 h-4 text-slate-500"></i>
        <span>Action Audit Log & Timeline</span>
      </h4>
      <div class="space-y-2">
        ${(issue.timeline || [])
          .map((item) => {
            const dateStr = new Date(item.timestamp).toLocaleString();
            return `
            <div class="flex items-start space-x-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span class="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0"></span>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-900">${item.actor} <span class="text-slate-400 font-normal">(${item.actorRole})</span></span>
                  <span class="text-[10px] font-mono text-slate-400">${dateStr}</span>
                </div>
                <p class="text-slate-700 mt-0.5">${item.action}</p>
                ${item.notes ? `<p class="text-[11px] text-slate-500 italic mt-0.5">"${item.notes}"</p>` : ''}
              </div>
            </div>
          `;
          })
          .join('')}
      </div>
    </div>

    <!-- ROLE-SPECIFIC CONTEXTUAL ACTION PANELS -->
    <div class="pt-4 border-t border-slate-200">
      
      <!-- 1. FIELD OFFICER ACTIONS: Update to In Progress or Resolved with Proof Photo -->
      ${
        STATE.currentRole === 'FIELD_OFFICER'
          ? `
        <div class="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
              <i data-lucide="hard-hat" class="w-4 h-4 text-amber-700"></i>
              <span>Field Technician Action Desk</span>
            </span>
            <span class="text-[10px] text-amber-700 font-mono">Officer Marcus Chen</span>
          </div>

          <div class="space-y-2">
            <div>
              <label class="block text-[11px] font-bold text-amber-900 mb-1">Work Completion Notes & Materials Used</label>
              <textarea id="officerResolutionNotes" rows="2" placeholder="e.g. Cleared drain blockage, vacuumed silt, and restored storm grating..." class="w-full text-xs p-2.5 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"></textarea>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-amber-900 mb-1">Attach 'After Fix' Resolution Photo</label>
              <input id="officerProofPhoto" type="file" accept="image/*" class="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-200 file:text-amber-800">
            </div>
          </div>

          <div class="flex items-center justify-end space-x-2 pt-2">
            <button onclick="updateIssueStatusAsOfficer('${issue.id}', 'IN_PROGRESS')" class="px-3.5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs">
              Mark In Progress
            </button>
            <button onclick="updateIssueStatusAsOfficer('${issue.id}', 'RESOLVED')" class="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs">
              Submit Resolution Proof
            </button>
          </div>
        </div>
      `
          : ''
      }

      <!-- 2. ADMIN ACTIONS: Route Department, Override Urgency or Status -->
      ${
        STATE.currentRole === 'ADMIN'
          ? `
        <div class="bg-indigo-50 p-4 rounded-2xl border border-indigo-200 space-y-3">
          <span class="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
            <i data-lucide="sliders" class="w-4 h-4 text-indigo-700"></i>
            <span>Administrator Triage Controls</span>
          </span>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Update Status</label>
              <select id="adminStatusSelect" class="w-full p-2 bg-white border border-indigo-200 rounded-xl font-semibold">
                <option value="REPORTED" ${issue.status === 'REPORTED' ? 'selected' : ''}>Reported</option>
                <option value="TRIAGED" ${issue.status === 'TRIAGED' ? 'selected' : ''}>Triaged</option>
                <option value="IN_PROGRESS" ${issue.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                <option value="RESOLVED" ${issue.status === 'RESOLVED' ? 'selected' : ''}>Resolved</option>
                <option value="VERIFIED" ${issue.status === 'VERIFIED' ? 'selected' : ''}>Verified</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Re-Route Department</label>
              <select id="adminDeptSelect" class="w-full p-2 bg-white border border-indigo-200 rounded-xl font-semibold">
                <option value="Department of Public Works" ${issue.department === 'Department of Public Works' ? 'selected' : ''}>Department of Public Works</option>
                <option value="Municipal Sanitation Board" ${issue.department === 'Municipal Sanitation Board' ? 'selected' : ''}>Municipal Sanitation Board</option>
                <option value="Water Supply & Sewerage Authority" ${issue.department === 'Water Supply & Sewerage Authority' ? 'selected' : ''}>Water Supply Authority</option>
                <option value="City Power & Street Lighting" ${issue.department === 'City Power & Street Lighting' ? 'selected' : ''}>City Power & Lighting</option>
                <option value="Traffic & Public Safety Bureau" ${issue.department === 'Traffic & Public Safety Bureau' ? 'selected' : ''}>Traffic & Safety Bureau</option>
                <option value="Parks & Urban Forestry Dept" ${issue.department === 'Parks & Urban Forestry Dept' ? 'selected' : ''}>Parks & Urban Forestry</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Urgency Override</label>
              <select id="adminUrgencySelect" class="w-full p-2 bg-white border border-indigo-200 rounded-xl font-semibold">
                <option value="CRITICAL" ${issue.urgency === 'CRITICAL' ? 'selected' : ''}>CRITICAL</option>
                <option value="HIGH" ${issue.urgency === 'HIGH' ? 'selected' : ''}>HIGH</option>
                <option value="MEDIUM" ${issue.urgency === 'MEDIUM' ? 'selected' : ''}>MEDIUM</option>
                <option value="LOW" ${issue.urgency === 'LOW' ? 'selected' : ''}>LOW</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end pt-1">
            <button onclick="saveAdminTriage('${issue.id}')" class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs">
              Apply Admin Overrides
            </button>
          </div>
        </div>
      `
          : ''
      }

      <!-- 3. CITIZEN ACTIONS: Satisfaction Rating if Resolved -->
      ${
        STATE.currentRole === 'CITIZEN' && isResolvedOrVerified
          ? `
        <div class="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
              <i data-lucide="star" class="w-4 h-4 text-emerald-600"></i>
              <span>Citizen Verification & Satisfaction Rating</span>
            </span>
            ${
              issue.satisfactionRating
                ? `<span class="text-xs font-bold text-emerald-800">Rated: ${'★'.repeat(
                    issue.satisfactionRating.rating
                  )} (${issue.satisfactionRating.rating}/5)</span>`
                : ''
            }
          </div>

          ${
            !issue.satisfactionRating
              ? `
            <div class="space-y-2">
              <p class="text-xs text-emerald-800">Has the municipal crew resolved this issue to your satisfaction? Please rate the quality of the fix:</p>
              <div class="flex items-center space-x-2">
                <select id="citizenRatingSelect" class="p-2 text-xs bg-white border border-emerald-300 rounded-xl font-bold">
                  <option value="5">⭐⭐⭐⭐⭐ Excellent (5 Stars)</option>
                  <option value="4">⭐⭐⭐⭐ Good (4 Stars)</option>
                  <option value="3">⭐⭐⭐ Acceptable (3 Stars)</option>
                  <option value="2">⭐⭐ Needs Improvement (2 Stars)</option>
                  <option value="1">⭐ Unsatisfactory (1 Star)</option>
                </select>
                <input id="citizenFeedbackInput" type="text" placeholder="Optional comments on the repair..." class="flex-1 p-2 text-xs bg-white border border-emerald-300 rounded-xl">
                <button onclick="submitCitizenRating('${issue.id}')" class="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs">
                  Verify & Submit
                </button>
              </div>
            </div>
          `
              : `
            <p class="text-xs text-emerald-900 font-medium italic">
              "${issue.satisfactionRating.feedback || 'Resolution confirmed by citizen.'}"
            </p>
          `
          }
        </div>
      `
          : ''
      }

    </div>
  `;

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeDetailModal() {
  const modal = document.getElementById('detailModal');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  STATE.selectedIssueId = null;
}

// Officer Action Handler
async function updateIssueStatusAsOfficer(id, newStatus) {
  const notes = document.getElementById('officerResolutionNotes')?.value?.trim();
  const fileInput = document.getElementById('officerProofPhoto');

  let afterImageBase64 = null;
  if (fileInput && fileInput.files[0]) {
    afterImageBase64 = await readFileAsBase64(fileInput.files[0]);
  } else if (newStatus === 'RESOLVED') {
    // Default high-quality resolved photo for demo purposes
    afterImageBase64 = 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80';
  }

  try {
    const res = await fetch(`/api/issues/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newStatus,
        actorName: STATE.currentUser.name,
        actorRole: 'FIELD_OFFICER',
        notes: notes || (newStatus === 'RESOLVED' ? 'Field crew completed repair and inspected site.' : 'Crew en route with tools.'),
        afterImageUrl: afterImageBase64?.startsWith('http') ? afterImageBase64 : undefined,
        afterImageBase64: afterImageBase64?.startsWith('data:') ? afterImageBase64 : undefined,
        assignedOfficer: {
          officerName: STATE.currentUser.name,
          badgeId: 'DPW-774',
          department: STATE.currentUser.department || 'Department of Public Works'
        }
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast(`Work Order updated to ${newStatus}`, 'success');
      await refreshData();
      openDetailModal(id);
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to update status', 'error');
  }
}

// Admin Action Handler
async function saveAdminTriage(id) {
  const newStatus = document.getElementById('adminStatusSelect')?.value;
  const newDept = document.getElementById('adminDeptSelect')?.value;
  const newUrgency = document.getElementById('adminUrgencySelect')?.value;

  try {
    const res = await fetch(`/api/issues/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newStatus,
        overrideDepartment: newDept,
        overrideUrgency: newUrgency,
        actorName: STATE.currentUser.name,
        actorRole: 'ADMIN',
        notes: `Administrator routed to ${newDept} with ${newUrgency} priority.`
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast('Admin triage overrides applied!', 'success');
      await refreshData();
      openDetailModal(id);
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to save triage overrides', 'error');
  }
}

// Citizen Rating Submission
async function submitCitizenRating(id) {
  const rating = document.getElementById('citizenRatingSelect')?.value || 5;
  const feedback = document.getElementById('citizenFeedbackInput')?.value?.trim();

  try {
    const res = await fetch(`/api/issues/${id}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, feedback })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Verified! Awarded ${rating} stars. Thank you!`, 'success');
      await refreshData();
      openDetailModal(id);
    }
  } catch (err) {
    console.error(err);
  }
}

// -------------------------------------------------------------
// ADMIN COMMAND HUB RENDERING
// -------------------------------------------------------------
function renderAdminStats() {
  if (!STATE.stats) return;
  const s = STATE.stats;

  const totalEl = document.getElementById('statTotalIssues');
  const criticalEl = document.getElementById('statCriticalIssues');
  const inProgEl = document.getElementById('statInProgressIssues');
  const resRateEl = document.getElementById('statResolutionRate');

  if (totalEl) totalEl.textContent = s.total;
  if (criticalEl) criticalEl.textContent = s.critical;
  if (inProgEl) inProgEl.textContent = s.inProgress;
  if (resRateEl) resRateEl.textContent = `${s.resolutionRate}%`;

  // Badge count on admin nav
  const badgeCritical = document.getElementById('badge-critical-count');
  if (badgeCritical) badgeCritical.textContent = s.critical;

  // Department Workloads
  const deptContainer = document.getElementById('deptWorkloadContainer');
  if (deptContainer && s.deptCounts) {
    const depts = [
      'Department of Public Works',
      'Municipal Sanitation Board',
      'Water Supply & Sewerage Authority',
      'City Power & Street Lighting',
      'Parks & Urban Forestry Dept'
    ];

    deptContainer.innerHTML = depts
      .map((d) => {
        const count = s.deptCounts[d] || 0;
        const pct = s.total > 0 ? Math.round((count / s.total) * 100) : 0;
        return `
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="font-bold text-slate-800 truncate">${d}</span>
              <span class="font-mono text-slate-500 font-bold">${count} issues</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div class="bg-brand-600 h-1.5 rounded-full" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      })
      .join('');
  }
}

function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;

  tbody.innerHTML = STATE.filteredIssues
    .map((issue) => {
      const urgencyClass = `badge-${issue.urgency.toLowerCase()}`;
      return `
        <tr class="hover:bg-slate-50/80 transition-colors cursor-pointer" onclick="openDetailModal('${issue.id}')">
          <td class="py-3 px-4 font-mono font-bold text-slate-900">${issue.ticketNumber}</td>
          <td class="py-3 px-4">
            <p class="font-bold text-slate-900 truncate max-w-xs">${issue.title}</p>
            <p class="text-[11px] text-slate-400 truncate">${issue.location?.address || ''}</p>
          </td>
          <td class="py-3 px-4">
            <span class="inline-flex items-center space-x-1">
              <span>${CATEGORY_ICONS[issue.category] || '📍'}</span>
              <span class="font-semibold text-slate-700">${CATEGORY_NAMES[issue.category] || issue.category}</span>
            </span>
          </td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 font-bold uppercase rounded text-[10px] ${urgencyClass}">${issue.urgency}</span>
          </td>
          <td class="py-3 px-4 text-slate-700 font-medium truncate max-w-[180px]">${issue.department}</td>
          <td class="py-3 px-4">
            <span class="font-bold text-slate-800 text-[11px]">${issue.status.replace('_', ' ')}</span>
          </td>
          <td class="py-3 px-4 text-right" onclick="event.stopPropagation()">
            <button onclick="openDetailModal('${issue.id}')" class="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg">
              Triage & Route
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
}

// -------------------------------------------------------------
// FIELD OFFICER PORTAL RENDERING
// -------------------------------------------------------------
function renderFieldOrders() {
  const container = document.getElementById('fieldOrdersContainer');
  if (!container) return;

  // Filter issues for Public Works department (or active officer)
  const myOrders = STATE.issues.filter(
    (i) => i.department === 'Department of Public Works' || i.urgency === 'CRITICAL'
  );

  container.innerHTML = myOrders
    .map((issue) => {
      const isResolved = issue.status === 'RESOLVED' || issue.status === 'VERIFIED';
      return `
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 text-slate-800 rounded-lg">${issue.ticketNumber}</span>
            <span class="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded badge-${issue.urgency.toLowerCase()}">${issue.urgency}</span>
          </div>

          <div>
            <h4 class="text-sm font-bold text-slate-900">${issue.title}</h4>
            <p class="text-xs text-slate-500 mt-1 flex items-center">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 mr-1 text-slate-400"></i>
              ${issue.location?.address}
            </p>
          </div>

          <div class="p-2.5 bg-slate-50 rounded-xl text-xs flex items-center justify-between">
            <span class="text-slate-500">Status: <strong class="text-slate-800">${issue.status.replace('_', ' ')}</strong></span>
            <span class="text-emerald-700 font-mono font-bold">Target: ${issue.aiTriage?.estimatedSla || '24h'}</span>
          </div>

          <div class="pt-2 flex items-center justify-between">
            <button onclick="openDetailModal('${issue.id}')" class="text-xs font-bold text-brand-700 hover:text-brand-800">
              View Work Instructions
            </button>
            <button onclick="openDetailModal('${issue.id}')" class="px-3.5 py-1.5 text-xs font-bold ${
              isResolved
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            } rounded-xl shadow-xs">
              ${isResolved ? '✓ Completed' : 'Update Status / Proof'}
            </button>
          </div>
        </div>
      `;
    })
    .join('');

  if (window.lucide) window.lucide.createIcons();
}

// -------------------------------------------------------------
// AI SETTINGS & RESET DEMO DATA
// -------------------------------------------------------------
function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  loadSettingsStatus();
  if (window.lucide) window.lucide.createIcons();
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

async function saveApiKeySettings() {
  const keyInput = document.getElementById('settingsApiKeyInput');
  const apiKey = keyInput?.value || '';

  try {
    const res = await fetch('/api/settings/key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    const data = await res.json();
    if (data.success) {
      showToast(
        data.isConfigured ? 'Gemini API key saved & verified!' : 'Switched to offline heuristic simulation',
        'success'
      );
      closeSettingsModal();
      loadSettingsStatus();
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to save settings', 'error');
  }
}

async function resetDemoData() {
  if (!confirm('Reset all civic grievances back to the default seed dataset?')) return;

  try {
    const res = await fetch('/api/admin/reset', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Demo dataset restored with 8 realistic issues!', 'success');
      await refreshData();
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to reset dataset', 'error');
  }
}

// -------------------------------------------------------------
// UTILITIES: TOAST NOTIFICATIONS & FILE HELPERS
// -------------------------------------------------------------
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-slate-900 border-emerald-500 text-white',
    error: 'bg-rose-900 border-rose-500 text-white',
    info: 'bg-slate-900 border-indigo-500 text-white'
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  toast.className = `px-4 py-3 rounded-2xl shadow-xl border flex items-center space-x-2.5 text-xs font-medium pointer-events-auto transition-all transform translate-y-2 opacity-0 ${
    bgColors[type] || bgColors.info
  }`;

  toast.innerHTML = `
    <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs bg-white/20">${
      icons[type] || '•'
    }</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  // Auto remove
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Global keyboard accessibility: dismiss open modals on Escape key
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeReportModal();
    closeDetailModal();
    closeSettingsModal();
  }
});

// -------------------------------------------------------------
// ACCESSIBILITY / ELDER-FRIENDLY MODE
// -------------------------------------------------------------
let a11yModeOn = false;

function toggleAccessibilityMode() {
  a11yModeOn = !a11yModeOn;
  document.body.classList.toggle('a11y-mode', a11yModeOn);
  const btn = document.getElementById('a11yToggleBtn');
  if (btn) {
    btn.classList.toggle('bg-brand-100', a11yModeOn);
    btn.classList.toggle('border-brand-400', a11yModeOn);
    btn.title = a11yModeOn ? 'Large Text Mode: ON (click to turn off)' : 'Large Text / Accessibility Mode (for elderly users)';
  }
  showToast(
    a11yModeOn ? '👁️ Accessibility Mode ON — Large text & bigger buttons' : 'Accessibility Mode OFF',
    a11yModeOn ? 'success' : 'info'
  );
}
