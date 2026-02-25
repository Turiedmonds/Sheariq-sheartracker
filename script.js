const CONNECTION_STORAGE_KEY = "sheariq.connectionSettings";
const SAVED_FARMS_STORAGE_KEY = "sheariq.savedFarms";
const PANEL_ORDER_STORAGE_KEY = "sheariq.panelOrder";
const PANEL_COLLAPSED_STORAGE_KEY = "sheariq.panelCollapsed";
const PANEL_SIZES_STORAGE_KEY = "sheariq.panelSizes";
const AUTOSAVE_STORAGE_KEY = "sheariq.autosave";
const SESSION_DATE_STORAGE_KEY = "sheariq.sessionDate";
const AUTOSAVE_ENABLED_STORAGE_KEY = "sheariq.autosaveEnabled";
const CONTROLS_DOCK_ENABLED_STORAGE_KEY = "sheariq.controlsDockEnabled";
const CONTROLS_DOCK_POS_STORAGE_KEY = "sheariq.controlsDockPos";
const PANEL_LAYOUT_STORAGE_KEY = "sheariq.panelLayout";

const DEFAULT_CONNECTION_SETTINGS = {
  ip: "192.168.33.1",
  mode: "legacy",
  pollInterval: 200
};

const ENDPOINT_PATHS = {
  legacy: "/status",
  rpcStatus: "/rpc/Shelly.GetStatus",
  rpcSwitch: "/rpc/Switch.GetStatus?id=0"
};

const DAY_SCHEDULES = {
  "9": [7200, 6300, 6300, 6300, 6300],
  "8": [7200, 7200, 7200, 7200]
};

const appState = {
  runActive: false,
  runStartTime: null,
  sheep: [],
  currentCycle: {
    motorOn: false,
    shearStart: null,
    catchStart: null
  },
  target: {
    sheep: 0,
    runLengthSeconds: 0
  },
  farm: "",
  lastMotorState: null,
  currentStats: {
    avgShear: 0,
    avgCatch: 0,
    avgCycle: 0,
    sheepPerHour: 0
  },
  connection: { ...DEFAULT_CONNECTION_SETTINGS },
  simulationMode: false,
  currentMotorDisplay: "OFF",
  connectionDebug: "",
  lastResponseTimeMs: null,
  pollTimerId: null,
  liveTimerId: null,
  statsTimerId: null,
  paused: false,
  pauseStartedAtMs: null,
  runEndTimeMs: null,
  currentRunIndex: 0,
  dayClockStartRealMs: null,
  dayClockStartSecondsFromMidnight: 0,
  dayStartTimeTouched: false,
  dayClockTimerId: null,
  savedFarms: [],
  panelCollapsed: {},
  draggedPanelId: null,
  resetModalOpen: false,
  resetModalReturnFocusEl: null,
  effectiveElapsedBeforePauseMs: 0,
  effectiveResumeRealMs: null,
  trendBucketMinutes: 15,
  trendBuckets: {},
  reviewBlocks: [],
  nextReviewBlockIndex: 1,
  runReviewText: "Run review will be generated when you stop a run.",
  trendFlags: ["Set a target to enable trend flags."],
  panelSizes: {},
  autosaveTimerId: null,
  trendGraphRenderPoints: [],
  selectedTrendBucketKey: null,
  autosaveEnabled: true,
  controlsDockEnabled: false,
  controlsDockPos: { x: 20, y: 90 },
  pointerPanelDrag: null,
  controlsDockDrag: null,
  absolutePanelDrag: null,
  panelResize: null,
  layoutEditMode: false,
  panelLayout: { mode: "absolute", panels: {}, nextZ: 1 },
  scrollLockCount: 0,
  sessionDate: ""
};

const elements = {
  runStatus: document.getElementById("runStatus"),
  farmInput: document.getElementById("farmInput"),
  sessionDate: document.getElementById("sessionDate"),
  runType: document.getElementById("runType"),
  dayStartTimeInput: document.getElementById("dayStartTimeInput"),
  customHours: document.getElementById("customHours"),
  targetSheepInput: document.getElementById("targetSheepInput"),
  startRunBtn: document.getElementById("startRunBtn"),
  stopRunBtn: document.getElementById("stopRunBtn"),
  pauseRunBtn: document.getElementById("pauseRunBtn"),
  resetRunBtn: document.getElementById("resetRunBtn"),
  totalSheep: document.getElementById("totalSheep"),
  avgShear: document.getElementById("avgShear"),
  avgCatch: document.getElementById("avgCatch"),
  avgCycle: document.getElementById("avgCycle"),
  sheepPerHour: document.getElementById("sheepPerHour"),
  motorState: document.getElementById("motorState"),
  currentShear: document.getElementById("currentShear"),
  currentCatch: document.getElementById("currentCatch"),
  runCountdown: document.getElementById("runCountdown"),
  runBadge: document.getElementById("runBadge"),
  dayClock: document.getElementById("dayClock"),
  requiredCycle: document.getElementById("requiredCycle"),
  requiredRate: document.getElementById("requiredRate"),
  projectedTotal: document.getElementById("projectedTotal"),
  catchPrediction: document.getElementById("catchPrediction"),
  blockMinutes: document.getElementById("blockMinutes"),
  blockResults: document.getElementById("blockResults"),
  sheepLogBody: document.getElementById("sheepLogBody"),
  shellyIpInput: document.getElementById("shellyIpInput"),
  endpointMode: document.getElementById("endpointMode"),
  pollIntervalInput: document.getElementById("pollIntervalInput"),
  testConnectionBtn: document.getElementById("testConnectionBtn"),
  connectionStatus: document.getElementById("connectionStatus"),
  connectionSummary: document.getElementById("connectionSummary"),
  connectionDebug: document.getElementById("connectionDebug"),
  simulationModeToggle: document.getElementById("simulationModeToggle"),
  simulationBanner: document.getElementById("simulationBanner"),
  simulationControls: document.getElementById("simulationControls"),
  simMotorOnBtn: document.getElementById("simMotorOnBtn"),
  simMotorOffBtn: document.getElementById("simMotorOffBtn"),
  farmDropdown: document.getElementById("farmDropdown"),
  farmDropdownToggle: document.getElementById("farmDropdownToggle"),
  farmDropdownMenu: document.getElementById("farmDropdownMenu"),
  dashboardPanels: document.getElementById("dashboardPanels"),
  resetModalOverlay: document.getElementById("resetModalOverlay"),
  resetModalDialog: document.querySelector("#resetModalOverlay .modal-dialog"),
  confirmResetBtn: document.getElementById("confirmResetBtn"),
  cancelResetBtn: document.getElementById("cancelResetBtn"),
  loadLastSaveBtn: document.getElementById("loadLastSaveBtn"),
  currentSheepNumber: document.getElementById("currentSheepNumber"),
  trendBucketSize: document.getElementById("trendBucketSize"),
  trendGraphCanvas: document.getElementById("trendGraphCanvas"),
  trendGraphMessage: document.getElementById("trendGraphMessage"),
  trendLatestSummary: document.getElementById("trendLatestSummary"),
  trendGraphTooltip: document.getElementById("trendGraphTooltip"),
  reviewList: document.getElementById("reviewList"),
  runReviewText: document.getElementById("runReviewText"),
  trendFlags: document.getElementById("trendFlags"),
  autosaveToggle: document.getElementById("autosaveToggle"),
  autosaveStatus: document.getElementById("autosaveStatus"),
  controlsDockToggle: document.getElementById("controlsDockToggle"),
  controlsDockReset: document.getElementById("controlsDockReset"),
  panelSim: document.getElementById("panel-sim"),
  layoutEditModeToggle: document.getElementById("layoutEditModeToggle")
};

function parseStoredBoolean(rawValue, fallback = true) {
  if (rawValue === null) return fallback;
  return rawValue === "true";
}

function formatDateYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sanitizeSessionDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? value : "";
}

function getAutosaveStorageKey() {
  const sessionDate = sanitizeSessionDate(appState.sessionDate) || formatDateYYYYMMDD(new Date());
  return `${AUTOSAVE_STORAGE_KEY}.${sessionDate}`;
}

function initializeSessionDate() {
  const storedSessionDate = sanitizeSessionDate(localStorage.getItem(SESSION_DATE_STORAGE_KEY));
  const sessionDate = storedSessionDate || formatDateYYYYMMDD(new Date());
  appState.sessionDate = sessionDate;
  localStorage.setItem(SESSION_DATE_STORAGE_KEY, sessionDate);
  if (elements.sessionDate) elements.sessionDate.value = sessionDate;
}

function setSessionDate(value) {
  const nextSessionDate = sanitizeSessionDate(value);
  if (!nextSessionDate) return;
  appState.sessionDate = nextSessionDate;
  localStorage.setItem(SESSION_DATE_STORAGE_KEY, nextSessionDate);
  if (appState.autosaveEnabled) autosaveState();
}

function isDashboardPage() {
  return Boolean(elements.startRunBtn);
}

function shouldStartRealtimeLoops() {
  return Boolean(elements.motorState);
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function setHTML(element, value) {
  if (element) element.innerHTML = value;
}

function formatSeconds(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0.000s";
  return `${seconds.toFixed(3)}s`;
}

function formatCountdown(totalSeconds) {
  const safeSeconds = Math.max(Math.floor(Number(totalSeconds) || 0), 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getEffectiveElapsedSeconds() {
  if (!appState.runActive && appState.effectiveResumeRealMs === null) {
    return appState.effectiveElapsedBeforePauseMs / 1000;
  }
  if (appState.paused || appState.effectiveResumeRealMs === null) {
    return appState.effectiveElapsedBeforePauseMs / 1000;
  }
  return (appState.effectiveElapsedBeforePauseMs + Math.max(Date.now() - appState.effectiveResumeRealMs, 0)) / 1000;
}

function formatElapsedMMSS(seconds) {
  const safe = Math.max(Math.floor(seconds || 0), 0);
  const mm = Math.floor(safe / 60);
  const ss = safe % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function parseTimeToSecondsFromMidnight(value) {
  if (typeof value !== "string" || !value.includes(":")) return 0;
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return (Math.max(hours, 0) * 3600) + (Math.max(minutes, 0) * 60);
}

function formatSecondsFromMidnightClock(secondsFromMidnight) {
  const daySeconds = 24 * 3600;
  const safeSeconds = ((Math.floor(secondsFromMidnight) % daySeconds) + daySeconds) % daySeconds;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatClock(timestamp) {
  return new Date(timestamp).toLocaleTimeString();
}

function normalizeIp(value) {
  return (value || "").trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function sanitizePollInterval(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms)) return DEFAULT_CONNECTION_SETTINGS.pollInterval;
  return Math.min(Math.max(Math.round(ms), 100), 5000);
}

function normalizeFarmName(value) {
  return (value || "").trim();
}

function parseSavedFarmList(rawValue) {
  if (!Array.isArray(rawValue)) return [];
  const unique = [];
  const seen = new Set();

  rawValue.forEach((item) => {
    const normalized = normalizeFarmName(typeof item === "string" ? item : "");
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(normalized);
  });

  return unique;
}

function loadSavedFarms() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_FARMS_STORAGE_KEY) || "[]");
    appState.savedFarms = parseSavedFarmList(parsed);
  } catch (error) {
    appState.savedFarms = [];
    console.debug("Failed to load saved farms", error);
  }
}

function persistSavedFarms() {
  localStorage.setItem(SAVED_FARMS_STORAGE_KEY, JSON.stringify(appState.savedFarms));
}

function addSavedFarm(name) {
  const normalized = normalizeFarmName(name);
  if (!normalized) return false;

  const exists = appState.savedFarms.some((farm) => farm.toLowerCase() === normalized.toLowerCase());
  if (exists) return false;

  appState.savedFarms.push(normalized);
  persistSavedFarms();
  return true;
}

function removeSavedFarm(name) {
  const normalized = normalizeFarmName(name).toLowerCase();
  if (!normalized) return;

  appState.savedFarms = appState.savedFarms.filter((farm) => farm.toLowerCase() !== normalized);

  if (elements.farmInput && normalizeFarmName(elements.farmInput.value).toLowerCase() === normalized) {
    elements.farmInput.value = "";
  }

  persistSavedFarms();
  renderFarmDropdown();
}

function getFilteredSavedFarms() {
  if (!elements.farmInput) return appState.savedFarms;
  const term = normalizeFarmName(elements.farmInput.value).toLowerCase();
  if (!term) return appState.savedFarms;
  return appState.savedFarms.filter((farm) => farm.toLowerCase().includes(term));
}

function closeFarmDropdown() {
  if (!elements.farmDropdownMenu || !elements.farmDropdownToggle) return;
  elements.farmDropdownMenu.hidden = true;
  elements.farmDropdownToggle.setAttribute("aria-expanded", "false");
}

function openFarmDropdown() {
  if (!elements.farmDropdownMenu || !elements.farmDropdownToggle) return;
  renderFarmDropdown();
  elements.farmDropdownMenu.hidden = false;
  elements.farmDropdownToggle.setAttribute("aria-expanded", "true");
}

function renderFarmDropdown() {
  if (!elements.farmDropdownMenu) return;
  elements.farmDropdownMenu.innerHTML = "";

  const farms = getFilteredSavedFarms();
  if (!farms.length) {
    const empty = document.createElement("div");
    empty.className = "farm-dropdown-empty";
    empty.textContent = "No saved farms.";
    elements.farmDropdownMenu.appendChild(empty);
    return;
  }

  farms.forEach((farm) => {
    const row = document.createElement("div");
    row.className = "farm-dropdown-item";

    const selectBtn = document.createElement("button");
    selectBtn.type = "button";
    selectBtn.className = "farm-select-btn";
    selectBtn.dataset.farmName = farm;
    selectBtn.textContent = farm;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "farm-delete-btn";
    deleteBtn.dataset.farmName = farm;
    deleteBtn.textContent = "✕";
    deleteBtn.setAttribute("aria-label", `Delete ${farm}`);

    row.appendChild(selectBtn);
    row.appendChild(deleteBtn);
    elements.farmDropdownMenu.appendChild(row);
  });
}

function saveFarmFromInput() {
  if (!elements.farmInput) return;
  const changed = addSavedFarm(elements.farmInput.value);
  if (changed) {
    renderFarmDropdown();
  }
}

function loadConnectionSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(CONNECTION_STORAGE_KEY) || "null");
    if (!stored) return;
    appState.connection = {
      ip: normalizeIp(stored.ip) || DEFAULT_CONNECTION_SETTINGS.ip,
      mode: ENDPOINT_PATHS[stored.mode] ? stored.mode : DEFAULT_CONNECTION_SETTINGS.mode,
      pollInterval: sanitizePollInterval(stored.pollInterval)
    };
  } catch (error) {
    console.debug("Failed to load connection settings", error);
  }
}

function saveConnectionSettings() {
  const payload = {
    ip: appState.connection.ip,
    mode: appState.connection.mode,
    pollInterval: appState.connection.pollInterval
  };
  localStorage.setItem(CONNECTION_STORAGE_KEY, JSON.stringify(payload));
}

function updateConnectionInputs() {
  if (!elements.shellyIpInput || !elements.endpointMode || !elements.pollIntervalInput) return;
  elements.shellyIpInput.value = appState.connection.ip;
  elements.endpointMode.value = appState.connection.mode;
  elements.pollIntervalInput.value = String(appState.connection.pollInterval);
}

function getShellyUrl() {
  const ip = normalizeIp(appState.connection.ip) || DEFAULT_CONNECTION_SETTINGS.ip;
  return `http://${ip}${ENDPOINT_PATHS[appState.connection.mode]}`;
}

function getRunLengthSeconds() {
  if (!elements.runType || !elements.customHours) return 0;
  if (elements.runType.value === "custom") {
    const customHours = Number(elements.customHours.value) || 0;
    return Math.max(customHours * 3600, 0);
  }
  return Number(elements.runType.value) * 3600;
}

function getScheduleForCurrentType() {
  if (!elements.runType || !elements.customHours) return [0];
  if (elements.runType.value === "custom") {
    return [Math.max((Number(elements.customHours.value) || 0) * 3600, 0)];
  }
  return DAY_SCHEDULES[elements.runType.value] || DAY_SCHEDULES["8"];
}

function getCurrentRunDurationSeconds() {
  const schedule = getScheduleForCurrentType();
  const index = Math.min(appState.currentRunIndex, schedule.length - 1);
  return schedule[Math.max(index, 0)] || 0;
}

function getDefaultDayStartTime() {
  if (!elements.runType) return "07:00";
  if (elements.runType.value === "9") return "05:00";
  if (elements.runType.value === "8") return "07:00";
  return "07:00";
}

function updateRunBadge() {
  const schedule = getScheduleForCurrentType();
  const runNumber = Math.min(appState.currentRunIndex + 1, schedule.length);
  setText(elements.runBadge, `Run ${Math.max(runNumber, 1)}`);
}

function updateDayClockDisplay() {
  if (!elements.dayClock || appState.dayClockStartRealMs === null) {
    setText(elements.dayClock, "00:00:00");
    return;
  }
  const elapsedSeconds = (Date.now() - appState.dayClockStartRealMs) / 1000;
  const dayClockSeconds = appState.dayClockStartSecondsFromMidnight + elapsedSeconds;
  setText(elements.dayClock, formatSecondsFromMidnightClock(dayClockSeconds));
}

function resetRunState() {
  appState.runActive = false;
  appState.runStartTime = null;
  appState.sheep = [];
  appState.lastMotorState = null;
  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = null;
  appState.currentMotorDisplay = "OFF";
  appState.paused = false;
  appState.pauseStartedAtMs = null;
  appState.runEndTimeMs = null;
  appState.currentRunIndex = 0;
  appState.dayClockStartRealMs = null;
  appState.dayClockStartSecondsFromMidnight = parseTimeToSecondsFromMidnight(getDefaultDayStartTime());
  appState.effectiveElapsedBeforePauseMs = 0;
  appState.effectiveResumeRealMs = null;
  appState.trendBuckets = {};
  appState.reviewBlocks = [];
  appState.nextReviewBlockIndex = 1;
  appState.runReviewText = "Run review will be generated when you stop a run.";
  appState.trendFlags = ["Set a target to enable trend flags."];
  calculateAverages();
}

function startRun() {
  if (!elements.farmInput || !elements.targetSheepInput || !elements.startRunBtn || !elements.stopRunBtn || !elements.runStatus) {
    return;
  }

  saveFarmFromInput();

  appState.runActive = true;
  if (appState.runStartTime !== null) {
    const schedule = getScheduleForCurrentType();
    appState.currentRunIndex = Math.min(appState.currentRunIndex + 1, schedule.length - 1);
  }
  appState.runStartTime = Date.now();
  appState.sheep = [];
  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = appState.runStartTime;
  appState.lastMotorState = null;
  appState.farm = normalizeFarmName(elements.farmInput.value);
  appState.target.sheep = Math.max(Number(elements.targetSheepInput.value) || 0, 0);
  appState.target.runLengthSeconds = getRunLengthSeconds();
  const runDurationSeconds = getCurrentRunDurationSeconds();
  appState.runEndTimeMs = appState.runStartTime + (runDurationSeconds * 1000);
  if (elements.dayStartTimeInput) {
    appState.dayClockStartSecondsFromMidnight = parseTimeToSecondsFromMidnight(elements.dayStartTimeInput.value);
  }
  appState.dayClockStartRealMs = appState.runStartTime;
  appState.currentMotorDisplay = "OFF";
  appState.pauseStartedAtMs = null;
  appState.effectiveElapsedBeforePauseMs = 0;
  appState.effectiveResumeRealMs = appState.runStartTime;
  appState.trendBuckets = {};
  appState.reviewBlocks = [];
  appState.nextReviewBlockIndex = 1;
  appState.runReviewText = "Run review will be generated when you stop a run.";
  appState.trendFlags = ["Set a target to enable trend flags."];

  elements.startRunBtn.disabled = true;
  elements.stopRunBtn.disabled = false;

  setPaused(false);
  elements.runStatus.textContent = "Running";

  calculateAverages();
  updateStatsPanel();
  updateLivePanel();
  renderLogTable();
  renderReviewList();
  drawTrendGraph();
  updateTrendFlags();
}

function stopRun() {
  if (!elements.startRunBtn || !elements.stopRunBtn || !elements.runStatus) return;
  if (appState.effectiveResumeRealMs !== null) {
    appState.effectiveElapsedBeforePauseMs += Math.max(Date.now() - appState.effectiveResumeRealMs, 0);
    appState.effectiveResumeRealMs = null;
  }
  appState.runActive = false;
  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = null;
  appState.currentMotorDisplay = "OFF";
  appState.pauseStartedAtMs = null;
  appState.runEndTimeMs = null;

  elements.startRunBtn.disabled = false;
  elements.stopRunBtn.disabled = true;

  setPaused(false);
  elements.runStatus.textContent = "Stopped";
  updatePauseButtonUI();
  updateLivePanel();
  generateRunReview();
  renderReviewList();
  drawTrendGraph();
  updateTrendFlags();
  updateStatsPanel();
}

function resetRun() {
  if (!elements.startRunBtn || !elements.stopRunBtn || !elements.runStatus || !elements.blockMinutes) return;
  resetRunState();
  elements.startRunBtn.disabled = false;
  elements.stopRunBtn.disabled = true;

  setPaused(false);
  elements.runStatus.textContent = "Idle";
  updatePauseButtonUI();
  renderLogTable();
  renderBlock(Number(elements.blockMinutes.value) || 15);
  updateLivePanel();
  if (elements.runReviewText) elements.runReviewText.textContent = appState.runReviewText;
  renderReviewList();
  drawTrendGraph();
  updateTrendFlags();
  updateStatsPanel();
}

function handleMotorOn() {
  if (!appState.runActive || appState.paused || appState.currentCycle.motorOn) return;

  const now = Date.now();
  appState.currentCycle.motorOn = true;
  appState.currentCycle.shearStart = now;
  appState.currentMotorDisplay = "ON";

  if (!appState.currentCycle.catchStart) {
    appState.currentCycle.catchStart = now;
  }

  updateLivePanel();
}

function handleMotorOff() {
  if (!appState.runActive || appState.paused) return;

  if (!appState.currentCycle.motorOn || !appState.currentCycle.shearStart) {
    appState.currentCycle.motorOn = false;
    appState.currentMotorDisplay = "OFF";
    updateLivePanel();
    return;
  }

  const now = Date.now();
  const shearDuration = (now - appState.currentCycle.shearStart) / 1000;
  const catchStart = appState.currentCycle.catchStart ?? appState.currentCycle.shearStart;
  const catchDuration = Math.max((appState.currentCycle.shearStart - catchStart) / 1000, 0);
  const fullCycle = shearDuration + catchDuration;

  const effectiveElapsedSeconds = getEffectiveElapsedSeconds();
  appState.sheep.push({
    number: appState.sheep.length + 1,
    startTime: appState.currentCycle.shearStart,
    endTime: now,
    shearDuration,
    catchDuration,
    fullCycle,
    effectiveElapsedSeconds
  });

  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = now;
  appState.currentMotorDisplay = "OFF";

  calculateAverages();
  updateStatsPanel();
  updateLivePanel();
  renderLogTable();
  renderReviewList();
  drawTrendGraph();
  updateTrendFlags();
}

function calculateAverages() {
  if (!appState.sheep.length || !appState.runStartTime) {
    appState.currentStats = { avgShear: 0, avgCatch: 0, avgCycle: 0, sheepPerHour: 0 };
    return appState.currentStats;
  }

  const totals = appState.sheep.reduce(
    (acc, entry) => {
      acc.shear += entry.shearDuration;
      acc.catch += entry.catchDuration;
      acc.cycle += entry.fullCycle;
      return acc;
    },
    { shear: 0, catch: 0, cycle: 0 }
  );

  const runElapsedSeconds = Math.max(
    getEffectiveElapsedSeconds(),
    1
  );
  appState.currentStats = {
    avgShear: totals.shear / appState.sheep.length,
    avgCatch: totals.catch / appState.sheep.length,
    avgCycle: totals.cycle / appState.sheep.length,
    sheepPerHour: (appState.sheep.length * 3600) / runElapsedSeconds
  };

  return appState.currentStats;
}

function calculateTargetMetrics() {
  const elapsedSeconds = Math.max(getEffectiveElapsedSeconds(), 0);
  const runLengthSeconds = appState.target.runLengthSeconds || 0;
  const targetSheep = appState.target.sheep || 0;

  const requiredRate = runLengthSeconds > 0 ? targetSheep / (runLengthSeconds / 3600) : 0;
  const requiredCycle = targetSheep > 0 && runLengthSeconds > 0 ? runLengthSeconds / targetSheep : 0;
  const projectedTotal = appState.currentStats.sheepPerHour > 0 && runLengthSeconds > 0
    ? Math.round((appState.currentStats.sheepPerHour * runLengthSeconds) / 3600)
    : appState.sheep.length;

  const remainingSeconds = Math.max(runLengthSeconds - elapsedSeconds, 0);
  const remainingSheep = Math.max(targetSheep - appState.sheep.length, 0);
  const requiredCycleRemaining = remainingSheep > 0 ? remainingSeconds / remainingSheep : 0;

  return { requiredRate, requiredCycle, projectedTotal, requiredCycleRemaining, remainingSheep };
}

function predictCatch() {
  const { requiredCycle } = calculateTargetMetrics();

  if (!appState.runActive || appState.target.sheep <= 0 || appState.target.runLengthSeconds <= 0) {
    return "Set a target and start a run.";
  }

  const avgCycle = appState.currentStats.avgCycle;
  if (avgCycle <= 0 || requiredCycle <= 0) return "Set a target and start a run.";

  if (avgCycle <= requiredCycle) {
    return `On pace — you have ${(requiredCycle - avgCycle).toFixed(3)}s to spare per sheep.`;
  }

  return `Behind pace — you are ${(avgCycle - requiredCycle).toFixed(3)}s over per sheep.`;
}

function calculateBlockData(minutes) {
  const windowSeconds = Math.max(Number(minutes) || 0, 1) * 60;
  const now = Date.now();
  const entries = appState.sheep.filter((item) => now - item.endTime <= windowSeconds * 1000);

  if (!entries.length) {
    return { count: 0, avgShear: 0, avgCatch: 0, avgCycle: 0, rate: 0 };
  }

  const totals = entries.reduce(
    (acc, entry) => {
      acc.shear += entry.shearDuration;
      acc.catch += entry.catchDuration;
      acc.cycle += entry.fullCycle;
      return acc;
    },
    { shear: 0, catch: 0, cycle: 0 }
  );

  return {
    count: entries.length,
    avgShear: totals.shear / entries.length,
    avgCatch: totals.catch / entries.length,
    avgCycle: totals.cycle / entries.length,
    rate: (entries.length * 3600) / windowSeconds
  };
}

function getBucketKey(effectiveElapsedSeconds, bucketMinutes = appState.trendBucketMinutes) {
  const bucketSeconds = Math.max(bucketMinutes, 1) * 60;
  return Math.floor(Math.max(effectiveElapsedSeconds, 0) / bucketSeconds);
}

function updateTrendDataForEntry(entry) {
  if (!entry) return;
  const key = getBucketKey(entry.effectiveElapsedSeconds);
  if (!appState.trendBuckets[key]) {
    appState.trendBuckets[key] = { count: 0, cycleTotal: 0, catchTotal: 0, startElapsed: key * appState.trendBucketMinutes * 60 };
  }
  appState.trendBuckets[key].count += 1;
  appState.trendBuckets[key].cycleTotal += entry.fullCycle;
  appState.trendBuckets[key].catchTotal += entry.catchDuration;
}

function getSortedBucketSummaries(bucketMinutes = appState.trendBucketMinutes) {
  const buckets = {};
  appState.sheep.forEach((entry) => {
    const key = getBucketKey(entry.effectiveElapsedSeconds || 0, bucketMinutes);
    if (!buckets[key]) buckets[key] = { count: 0, cycleTotal: 0, catchTotal: 0 };
    buckets[key].count += 1;
    buckets[key].cycleTotal += entry.fullCycle;
    buckets[key].catchTotal += entry.catchDuration;
  });
  return Object.entries(buckets).map(([key, value]) => ({
    key: Number(key),
    startElapsed: Number(key) * bucketMinutes * 60,
    avgCycle: value.count ? value.cycleTotal / value.count : 0,
    avgCatch: value.count ? value.catchTotal / value.count : 0,
    count: value.count
  })).sort((a, b) => a.key - b.key);
}

function renderReviewList() {
  if (!elements.reviewList) return;
  if (!appState.reviewBlocks.length) {
    elements.reviewList.innerHTML = '<div class="review-entry">No 15-minute reviews yet.</div>';
    return;
  }
  elements.reviewList.innerHTML = appState.reviewBlocks.map((block) => `
    <div class="review-entry">
      <div><strong>${block.range}</strong></div>
      <div>Sheep: ${block.count} • Avg catch-to-release: ${block.avgCycle.toFixed(3)}s</div>
      <div>${block.deltaText}</div>
      <div>${block.status}</div>
    </div>
  `).join("");
}

function buildRangeLabel(startSec, endSec) {
  if (appState.dayClockStartRealMs !== null) {
    const base = appState.dayClockStartSecondsFromMidnight;
    const startClock = formatSecondsFromMidnightClock(base + startSec);
    const endClock = formatSecondsFromMidnightClock(base + endSec);
    return `${startClock.slice(0, 5)}–${endClock.slice(0, 5)}`;
  }
  return `${formatElapsedMMSS(startSec)}–${formatElapsedMMSS(endSec)}`;
}

function maybeGenerate15MinuteReviews() {
  const blockSeconds = 15 * 60;
  const { requiredCycle } = calculateTargetMetrics();
  while (getEffectiveElapsedSeconds() >= appState.nextReviewBlockIndex * blockSeconds) {
    const blockIndex = appState.nextReviewBlockIndex - 1;
    const startSec = blockIndex * blockSeconds;
    const endSec = appState.nextReviewBlockIndex * blockSeconds;
    const items = appState.sheep.filter((item) => item.effectiveElapsedSeconds >= startSec && item.effectiveElapsedSeconds < endSec);
    const count = items.length;
    const avgCycle = count ? items.reduce((sum, item) => sum + item.fullCycle, 0) / count : 0;
    const delta = requiredCycle > 0 && count ? avgCycle - requiredCycle : 0;
    let status = "On pace";
    if (requiredCycle > 0 && count) {
      if (delta > 0.4) status = `Lost ${delta.toFixed(3)}s per sheep`;
      else if (delta < -0.4) status = "Strong recovery";
    }
    const deltaText = requiredCycle > 0 && count
      ? (delta <= 0 ? `Gained ${Math.abs(delta).toFixed(3)}s per sheep vs target.` : `Lost ${delta.toFixed(3)}s per sheep vs target.`)
      : "Set target for pace comparison.";
    appState.reviewBlocks.push({ range: buildRangeLabel(startSec, endSec), count, avgCycle, deltaText, status, startSec, endSec });
    appState.nextReviewBlockIndex += 1;
  }
  renderReviewList();
}

function generateRunReview() {
  if (!elements.runReviewText) return;
  if (!appState.sheep.length) {
    appState.runReviewText = "Run review will be generated when you stop a run.";
    elements.runReviewText.textContent = appState.runReviewText;
    return;
  }
  const totalElapsed = Math.max(...appState.sheep.map((s) => s.effectiveElapsedSeconds), 1);
  const quarterPoint = totalElapsed * 0.25;
  const halfPoint = totalElapsed * 0.5;
  const segs = getSortedBucketSummaries();
  const firstQuarter = appState.sheep.filter((s) => s.effectiveElapsedSeconds <= quarterPoint);
  const firstHalf = appState.sheep.filter((s) => s.effectiveElapsedSeconds <= halfPoint);
  const avg = (arr) => arr.length ? (arr.reduce((sum, i) => sum + i.fullCycle, 0) / arr.length).toFixed(3) : "n/a";
  const best = segs.reduce((a, b) => (!a || b.avgCycle < a.avgCycle ? b : a), null);
  const worst = segs.reduce((a, b) => (!a || b.avgCycle > a.avgCycle ? b : a), null);
  const verdict = segs.length > 1 && segs[segs.length - 1].avgCycle < segs[0].avgCycle ? "Strong finish" : "Maintained pace throughout";
  const lostRange = worst ? buildRangeLabel(worst.startElapsed, worst.startElapsed + appState.trendBucketMinutes * 60) : "n/a";
  const bestRange = best ? buildRangeLabel(best.startElapsed, best.startElapsed + appState.trendBucketMinutes * 60) : "n/a";
  appState.runReviewText = `First quarter averaged ${avg(firstQuarter)}s catch-to-release time. First half averaged ${avg(firstHalf)}s catch-to-release time. Best segment: ${bestRange}. Worst segment: ${lostRange}. Recovery strongest in ${bestRange}. ${verdict}.`;
  elements.runReviewText.textContent = appState.runReviewText;
}

function formatDeltaPlain(delta) {
  if (!Number.isFinite(delta)) return "0.000s";
  const sign = delta > 0 ? "+" : (delta < 0 ? "−" : "");
  return `${sign}${Math.abs(delta).toFixed(3)}s`;
}

function describeAheadBehind(delta) {
  if (delta > 0.05) return `behind by ${formatDeltaPlain(delta)} per sheep`;
  if (delta < -0.05) return `ahead by ${formatDeltaPlain(delta)} per sheep`;
  return "on target pace";
}

function updateTrendLatestSummary(points, requiredCycle) {
  if (!elements.trendLatestSummary) return;
  const bucketMinutes = appState.trendBucketMinutes;
  const latest = points.length ? points[points.length - 1] : null;
  if (!latest) {
    elements.trendLatestSummary.textContent = `Last ${bucketMinutes} min: 0 sheep • Avg catch-to-release 0.000s • Target ${formatSeconds(requiredCycle)} • No buckets yet.`;
    return;
  }
  const delta = latest.avgCycle - requiredCycle;
  const meaning = describeAheadBehind(delta);
  elements.trendLatestSummary.textContent = `Last ${bucketMinutes} min: ${latest.count} sheep • Avg catch-to-release ${formatSeconds(latest.avgCycle)} • Target ${formatSeconds(requiredCycle)} • ${formatDeltaPlain(delta)} ${meaning}`;
}

function updateTrendGraphTooltip(point) {
  if (!elements.trendGraphTooltip) return;
  if (!point) {
    elements.trendGraphTooltip.hidden = false;
    elements.trendGraphTooltip.textContent = "Tap graph points to see bucket details.";
    return;
  }
  const bucketEnd = point.startElapsed + appState.trendBucketMinutes * 60;
  const delta = point.avgCycle - point.requiredCycle;
  elements.trendGraphTooltip.hidden = false;
  elements.trendGraphTooltip.innerHTML = [
    `Bucket: ${buildRangeLabel(point.startElapsed, bucketEnd)}`,
    `Count: ${point.count} sheep`,
    `Avg catch-to-release: ${formatSeconds(point.avgCycle)}`,
    `Avg catch: ${formatSeconds(point.avgCatch)}`,
    `Target catch-to-release: ${formatSeconds(point.requiredCycle)}`,
    `Delta: ${formatDeltaPlain(delta)} (${describeAheadBehind(delta)})`
  ].map((line) => `<div>${line}</div>`).join("");
}

function handleTrendGraphPointSelection(event) {
  if (!elements.trendGraphCanvas || !appState.trendGraphRenderPoints.length) return;
  const canvas = elements.trendGraphCanvas;
  const rect = canvas.getBoundingClientRect();
  const source = event.changedTouches && event.changedTouches.length ? event.changedTouches[0] : event;
  if (!source || typeof source.clientX !== "number" || typeof source.clientY !== "number") return;
  const clickX = source.clientX - rect.left;
  const clickY = source.clientY - rect.top;

  let closest = null;
  let minDistSq = Infinity;
  appState.trendGraphRenderPoints.forEach((point) => {
    const dx = point.x - clickX;
    const dy = point.cycleY - clickY;
    const distSq = dx * dx + dy * dy;
    if (distSq < minDistSq) {
      minDistSq = distSq;
      closest = point;
    }
  });

  if (closest) {
    appState.selectedTrendBucketKey = closest.key;
    updateTrendGraphTooltip(closest);
  }
}

function updateTrendFlags() {
  if (!elements.trendFlags) return;
  const { requiredCycle } = calculateTargetMetrics();
  if (requiredCycle <= 0) {
    appState.trendFlags = ["Set a target to enable trend flags."];
    elements.trendFlags.textContent = appState.trendFlags[0];
    return;
  }
  const cycles = appState.sheep.map((s) => s.fullCycle);
  const flags = [];
  if (cycles.length >= 5) {
    const last5 = cycles.slice(-5);
    const avgLast5 = last5.reduce((a, b) => a + b, 0) / last5.length;
    const deltaLast5 = avgLast5 - requiredCycle;
    if (last5.every((v) => v > requiredCycle)) {
      flags.push(`Sustained behind: last 5 sheep all over target (all > ${formatSeconds(requiredCycle)}). Last 5 avg catch-to-release time is ${formatSeconds(avgLast5)} vs target ${formatSeconds(requiredCycle)} (${formatDeltaPlain(deltaLast5)} behind per sheep).`);
    }
  }
  if (cycles.length >= 10) {
    const prev5 = cycles.slice(-10, -5);
    const recent5 = cycles.slice(-5);
    const prevAvg = prev5.reduce((a, b) => a + b, 0) / prev5.length;
    const recentAvg = recent5.reduce((a, b) => a + b, 0) / recent5.length;
    const recentDelta = recentAvg - requiredCycle;
    if (recentAvg > prevAvg + 0.2) {
      flags.push(`Pace slipping: last 5 avg catch-to-release time is ${formatSeconds(recentAvg)} vs target ${formatSeconds(requiredCycle)} (${formatDeltaPlain(recentDelta)} behind per sheep). Previous 5 avg was ${formatSeconds(prevAvg)}.`);
    }
    if (prevAvg > recentAvg + 0.2) {
      const improve = prevAvg - recentAvg;
      flags.push(`Recovery: avg improved from ${formatSeconds(prevAvg)} to ${formatSeconds(recentAvg)} over last 10 sheep (${formatDeltaPlain(-improve)} per sheep). Target is ${formatSeconds(requiredCycle)}, so recent pace is ${describeAheadBehind(recentDelta)}.`);
    }
  }

  if (!flags.length && cycles.length >= 5) {
    const last5 = cycles.slice(-5);
    const avgLast5 = last5.reduce((a, b) => a + b, 0) / last5.length;
    const delta = avgLast5 - requiredCycle;
    flags.push(`No trend warnings. Last 5 avg ${formatSeconds(avgLast5)} vs target ${formatSeconds(requiredCycle)} (${describeAheadBehind(delta)}).`);
  }

  if (!flags.length) {
    flags.push(`No trend warnings yet. Need at least 5 sheep to compare with target ${formatSeconds(requiredCycle)}.`);
  }

  appState.trendFlags = flags;
  elements.trendFlags.innerHTML = appState.trendFlags.map((f) => `<div>${f}</div>`).join("");
}

function drawTrendGraph() {
  if (!elements.trendGraphCanvas) return;
  const canvas = elements.trendGraphCanvas;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width > 0 && Math.round(rect.width) !== canvas.width) {
    canvas.width = Math.round(rect.width);
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  appState.trendGraphRenderPoints = [];

  const { requiredCycle } = calculateTargetMetrics();
  const points = getSortedBucketSummaries(appState.trendBucketMinutes);
  updateTrendLatestSummary(points, requiredCycle);

  if (requiredCycle <= 0) {
    if (elements.trendGraphMessage) elements.trendGraphMessage.hidden = false;
    updateTrendGraphTooltip(null);
    return;
  }
  if (elements.trendGraphMessage) elements.trendGraphMessage.hidden = true;

  const margins = { left: 42, right: 12, top: 12, bottom: 28 };
  const width = canvas.width - margins.left - margins.right;
  const height = canvas.height - margins.top - margins.bottom;
  const maxX = Math.max(points.length ? points[points.length - 1].startElapsed / 60 : appState.trendBucketMinutes, appState.trendBucketMinutes);
  const maxY = Math.max(requiredCycle, ...points.map((p) => p.avgCycle), ...points.map((p) => p.avgCatch), 1) * 1.2;
  const x = (minute) => margins.left + (minute / maxX) * width;
  const y = (sec) => margins.top + height - (sec / maxY) * height;

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  const gridLines = 4;
  for (let i = 1; i <= gridLines; i += 1) {
    const yVal = margins.top + (height / (gridLines + 1)) * i;
    ctx.beginPath();
    ctx.moveTo(margins.left, yVal);
    ctx.lineTo(margins.left + width, yVal);
    ctx.stroke();
  }

  ctx.strokeStyle = "#94a3b8";
  ctx.beginPath();
  ctx.moveTo(margins.left, margins.top);
  ctx.lineTo(margins.left, margins.top + height);
  ctx.lineTo(margins.left + width, margins.top + height);
  ctx.stroke();
  ctx.fillStyle = "#475569";
  ctx.font = "12px Arial";
  ctx.fillText("seconds", 4, margins.top + 10);
  ctx.fillText("minutes", canvas.width - 56, canvas.height - 6);

  ctx.strokeStyle = "#f59e0b";
  ctx.beginPath();
  ctx.moveTo(x(0), y(requiredCycle));
  ctx.lineTo(x(maxX), y(requiredCycle));
  ctx.stroke();

  if (points.length) {
    ctx.strokeStyle = "#2563eb";
    ctx.beginPath();
    points.forEach((p, i) => {
      const px = x(p.startElapsed / 60);
      const py = y(p.avgCycle);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();

    ctx.strokeStyle = "#16a34a";
    ctx.beginPath();
    points.forEach((p, i) => {
      const px = x(p.startElapsed / 60);
      const py = y(p.avgCatch);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();

    points.forEach((p) => {
      const px = x(p.startElapsed / 60);
      const cycleY = y(p.avgCycle);
      const catchY = y(p.avgCatch);
      ctx.fillStyle = "#2563eb";
      ctx.beginPath();
      ctx.arc(px, cycleY, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#16a34a";
      ctx.beginPath();
      ctx.arc(px, catchY, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#334155";
      ctx.font = "11px Arial";
      ctx.fillText(`n=${p.count}`, px + 4, cycleY - 6);

      appState.trendGraphRenderPoints.push({
        key: p.key,
        x: px,
        cycleY,
        count: p.count,
        avgCycle: p.avgCycle,
        avgCatch: p.avgCatch,
        requiredCycle,
        startElapsed: p.startElapsed
      });
    });

    const selected = appState.trendGraphRenderPoints.find((item) => item.key === appState.selectedTrendBucketKey);
    if (selected) {
      updateTrendGraphTooltip(selected);
    } else {
      updateTrendGraphTooltip(appState.trendGraphRenderPoints[appState.trendGraphRenderPoints.length - 1]);
    }
  } else {
    updateTrendGraphTooltip(null);
  }
}

function renderLogTable() {
  if (!elements.sheepLogBody) return;
  elements.sheepLogBody.innerHTML = "";

  const { requiredCycle } = calculateTargetMetrics();
  appState.sheep.forEach((entry) => {
    const row = document.createElement("tr");
    const fullCycleClass = requiredCycle > 0
      ? (entry.fullCycle < requiredCycle - 0.05 ? "pace-good" : (entry.fullCycle > requiredCycle + 0.05 ? "pace-bad" : "pace-neutral"))
      : "pace-neutral";
    row.innerHTML = `
      <td>${entry.number}</td>
      <td>${formatClock(entry.startTime)}</td>
      <td>${formatClock(entry.endTime)}</td>
      <td>${formatSeconds(entry.shearDuration)}</td>
      <td>${formatSeconds(entry.catchDuration)}</td>
      <td class="${fullCycleClass}">${formatSeconds(entry.fullCycle)}</td>
    `;
    elements.sheepLogBody.appendChild(row);
  });
}

function updateLivePanel() {
  const shearCurrent = appState.currentCycle.motorOn && appState.currentCycle.shearStart
    ? (Date.now() - appState.currentCycle.shearStart) / 1000
    : 0;

  const catchCurrent = appState.runActive && !appState.currentCycle.motorOn && appState.currentCycle.catchStart
    ? (Date.now() - appState.currentCycle.catchStart) / 1000
    : 0;
  const countdownSeconds = appState.runEndTimeMs ? Math.max((appState.runEndTimeMs - Date.now()) / 1000, 0) : 0;

  setText(elements.motorState, appState.currentMotorDisplay);
  setText(elements.currentShear, formatSeconds(shearCurrent));
  setText(elements.currentCatch, formatSeconds(catchCurrent));
  setText(elements.runCountdown, formatCountdown(countdownSeconds));
  updateRunBadge();
  updateDayClockDisplay();
  setText(elements.totalSheep, String(appState.sheep.length));
  const currentSheepNumber = !appState.runActive ? 0 : (appState.currentCycle.motorOn && appState.currentCycle.shearStart ? appState.sheep.length + 1 : appState.sheep.length);
  setText(elements.currentSheepNumber, String(currentSheepNumber));
  setText(elements.projectedTotal, String(calculateTargetMetrics().projectedTotal));
}

function updateStatsPanel() {
  calculateAverages();
  const target = calculateTargetMetrics();

  setText(elements.totalSheep, String(appState.sheep.length));
  setText(elements.avgShear, formatSeconds(appState.currentStats.avgShear));
  setText(elements.avgCatch, formatSeconds(appState.currentStats.avgCatch));
  setText(elements.avgCycle, formatSeconds(appState.currentStats.avgCycle));
  setText(elements.sheepPerHour, appState.currentStats.sheepPerHour.toFixed(2));
  setText(elements.requiredCycle, formatSeconds(target.requiredCycle));
  setText(elements.requiredRate, target.requiredRate.toFixed(2));
  setText(elements.projectedTotal, String(target.projectedTotal));
  setText(elements.catchPrediction, predictCatch());
  updateTrendFlags();

  if (elements.avgCycle) {
    const onPaceClass = target.requiredCycle > 0
      ? (appState.currentStats.avgCycle < target.requiredCycle - 0.05 ? "on-pace-good" : (appState.currentStats.avgCycle > target.requiredCycle + 0.05 ? "on-pace-bad" : "on-pace-neutral"))
      : "on-pace-neutral";
    elements.avgCycle.classList.remove("on-pace-good", "on-pace-bad", "on-pace-neutral");
    elements.avgCycle.classList.add(onPaceClass);
  }
}

function updateConnectionStatus({ ok, parsedState, responseTimeMs, debugText }) {
  const stateLabel = parsedState === null ? "Unknown" : parsedState ? "ON" : "OFF";
  const outcome = ok ? "ok" : "fail";
  const responsePart = Number.isFinite(responseTimeMs) ? `${Math.round(responseTimeMs)}ms` : "n/a";

  if (elements.connectionStatus) {
    elements.connectionStatus.innerHTML = `Connection: <strong>${outcome}</strong>, Motor: <strong>${stateLabel}</strong>, Response: <strong>${responsePart}</strong>`;
  }

  if (elements.connectionSummary) {
    elements.connectionSummary.textContent = `Shelly: ${outcome} • Response: ${responsePart}`;
  }

  if (elements.connectionDebug) {
    elements.connectionDebug.textContent = debugText || "No debug details.";
  }
}

function getTopLevelKeys(data) {
  return data && typeof data === "object" ? Object.keys(data).join(", ") : "not-an-object";
}

function getMotorStateFromResponse(data, mode) {
  const switchLike = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value > 0;
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (["on", "true", "1"].includes(lower)) return true;
      if (["off", "false", "0"].includes(lower)) return false;
    }
    return null;
  };

  const readSwitchState = (obj) => {
    if (!obj || typeof obj !== "object") return null;
    const fields = ["output", "ison", "on", "state", "input"];
    for (const key of fields) {
      const parsed = switchLike(obj[key]);
      if (parsed !== null) return parsed;
    }
    return null;
  };

  if (!data || typeof data !== "object") return null;

  if (mode === "legacy") {
    return readSwitchState(data?.inputs?.[0]) ?? readSwitchState(data?.relays?.[0]);
  }

  if (mode === "rpcSwitch") {
    return readSwitchState(data);
  }

  if (mode === "rpcStatus") {
    const components = data?.components;
    if (components && typeof components === "object") {
      for (const [key, value] of Object.entries(components)) {
        if (key.toLowerCase().startsWith("switch:0") || key.toLowerCase().startsWith("input:0")) {
          const parsed = readSwitchState(value);
          if (parsed !== null) return parsed;
        }
      }
      for (const value of Object.values(components)) {
        const parsed = readSwitchState(value);
        if (parsed !== null) return parsed;
      }
    }

    const directCandidates = [data?.switches?.[0], data?.inputs?.[0], data?.["switch:0"], data?.["input:0"]];
    for (const candidate of directCandidates) {
      const parsed = readSwitchState(candidate);
      if (parsed !== null) return parsed;
    }
  }

  return null;
}

async function fetchShellyState() {
  const url = getShellyUrl();
  const started = performance.now();
  const response = await fetch(url, { cache: "no-store" });
  const responseTimeMs = performance.now() - started;

  if (!response.ok) {
    return { ok: false, parsedState: null, responseTimeMs, debugText: `HTTP ${response.status}` };
  }

  const data = await response.json();
  const parsedState = getMotorStateFromResponse(data, appState.connection.mode);
  const debugText = parsedState === null
    ? `unable to parse for mode=${appState.connection.mode}; keys=[${getTopLevelKeys(data)}]`
    : `mode=${appState.connection.mode}`;

  return { ok: true, parsedState, responseTimeMs, debugText };
}

async function pollShelly() {
  if (!appState.runActive || appState.simulationMode || appState.paused) return;

  try {
    const result = await fetchShellyState();
    appState.lastResponseTimeMs = result.responseTimeMs;
    appState.connectionDebug = result.debugText;

    if (!result.ok) {
      updateConnectionStatus(result);
      return;
    }

    const nextState = result.parsedState;
    if (nextState === null) {
      appState.currentMotorDisplay = "Unknown";
      updateLivePanel();
      updateConnectionStatus(result);
      return;
    }

    appState.currentMotorDisplay = nextState ? "ON" : "OFF";

    if (appState.lastMotorState === null) {
      appState.lastMotorState = nextState;
    } else if (nextState !== appState.lastMotorState) {
      appState.lastMotorState = nextState;
      if (nextState) {
        handleMotorOn();
      } else {
        handleMotorOff();
      }
    }

    updateLivePanel();
    updateConnectionStatus(result);
  } catch (error) {
    updateConnectionStatus({
      ok: false,
      parsedState: null,
      responseTimeMs: null,
      debugText: error.message || "fetch failed"
    });
  }
}

async function testConnection() {
  try {
    const result = await fetchShellyState();
    updateConnectionStatus(result);
  } catch (error) {
    updateConnectionStatus({
      ok: false,
      parsedState: null,
      responseTimeMs: null,
      debugText: error.message || "test failed"
    });
  }
}

function startPollingLoop() {
  if (appState.pollTimerId) {
    clearInterval(appState.pollTimerId);
  }

  appState.pollTimerId = setInterval(pollShelly, appState.connection.pollInterval);
}

function stopPollingLoop() {
  if (!appState.pollTimerId) return;
  clearInterval(appState.pollTimerId);
  appState.pollTimerId = null;
}

function startLiveLoop() {
  if (appState.liveTimerId) {
    clearInterval(appState.liveTimerId);
  }

  appState.liveTimerId = setInterval(() => {
    updateLivePanel();
  }, 100);
}

function startDayClockLoop() {
  if (appState.dayClockTimerId) {
    clearInterval(appState.dayClockTimerId);
  }
  appState.dayClockTimerId = setInterval(updateDayClockDisplay, 1000);
}

function startStatsLoop() {
  if (appState.statsTimerId) {
    clearInterval(appState.statsTimerId);
  }

  appState.statsTimerId = setInterval(() => {
    updateStatsPanel();
    maybeGenerate15MinuteReviews();
    drawTrendGraph();
  }, 1000);
}

function stopLiveAndStatsLoops() {
  if (appState.liveTimerId) {
    clearInterval(appState.liveTimerId);
    appState.liveTimerId = null;
  }

  if (appState.statsTimerId) {
    clearInterval(appState.statsTimerId);
    appState.statsTimerId = null;
  }
}

function updatePauseButtonUI() {
  if (!elements.pauseRunBtn) return;

  elements.pauseRunBtn.disabled = !appState.runActive;
  elements.pauseRunBtn.textContent = appState.paused ? "Unpause" : "Pause";
}

function setPaused(paused) {
  const nextPaused = Boolean(paused);
  if (appState.paused === nextPaused) return;

  appState.paused = nextPaused;

  if (appState.paused) {
    appState.pauseStartedAtMs = Date.now();
    if (appState.effectiveResumeRealMs !== null) {
      appState.effectiveElapsedBeforePauseMs += Math.max(Date.now() - appState.effectiveResumeRealMs, 0);
      appState.effectiveResumeRealMs = null;
    }
    stopPollingLoop();
    stopLiveAndStatsLoops();
    if (appState.runActive && elements.runStatus) {
      elements.runStatus.textContent = "Paused";
    }
    updatePauseButtonUI();
    return;
  }

  if (appState.pauseStartedAtMs !== null) {
    const pauseDurationMs = Math.max(Date.now() - appState.pauseStartedAtMs, 0);
    if (appState.runStartTime) {
      appState.runStartTime += pauseDurationMs;
    }
    if (appState.currentCycle.shearStart) {
      appState.currentCycle.shearStart += pauseDurationMs;
    }
    if (appState.currentCycle.catchStart) {
      appState.currentCycle.catchStart += pauseDurationMs;
    }
    if (appState.runEndTimeMs) {
      appState.runEndTimeMs += pauseDurationMs;
    }
    appState.pauseStartedAtMs = null;
  }

  if (appState.runActive && appState.effectiveResumeRealMs === null) {
    appState.effectiveResumeRealMs = Date.now();
  }

  if (isDashboardPage()) {
    startPollingLoop();
    startLiveLoop();
    startStatsLoop();
  }

  if (appState.runActive && elements.runStatus) {
    elements.runStatus.textContent = appState.paused ? "Paused" : "Running";
  }

  updatePauseButtonUI();
}

function togglePauseRun() {
  if (!appState.runActive) return;
  setPaused(!appState.paused);
}

function getPanelElements() {
  if (!elements.dashboardPanels) return [];
  return Array.from(elements.dashboardPanels.querySelectorAll(".panel[id]"));
}

function persistPanelOrder() {
  const order = getPanelElements().map((panel) => panel.id);
  localStorage.setItem(PANEL_ORDER_STORAGE_KEY, JSON.stringify(order));
}

function loadPanelState() {
  try {
    const storedOrder = JSON.parse(localStorage.getItem(PANEL_ORDER_STORAGE_KEY) || "[]");
    if (Array.isArray(storedOrder) && elements.dashboardPanels) {
      const byId = new Map(getPanelElements().map((panel) => [panel.id, panel]));
      storedOrder.forEach((id) => {
        const panel = byId.get(id);
        if (panel) elements.dashboardPanels.appendChild(panel);
      });
    }
  } catch (error) {
    console.debug("Failed to load panel order", error);
  }

  try {
    const collapsed = JSON.parse(localStorage.getItem(PANEL_COLLAPSED_STORAGE_KEY) || "{}");
    appState.panelCollapsed = collapsed && typeof collapsed === "object" ? collapsed : {};
  } catch (error) {
    appState.panelCollapsed = {};
    console.debug("Failed to load panel collapsed state", error);
  }
}

function persistPanelCollapsed() {
  localStorage.setItem(PANEL_COLLAPSED_STORAGE_KEY, JSON.stringify(appState.panelCollapsed));
}

function loadPanelSizes() {
  try {
    const stored = JSON.parse(localStorage.getItem(PANEL_SIZES_STORAGE_KEY) || "{}");
    appState.panelSizes = stored && typeof stored === "object" ? stored : {};
  } catch (error) {
    appState.panelSizes = {};
  }
}

function persistPanelSizes() {
  localStorage.setItem(PANEL_SIZES_STORAGE_KEY, JSON.stringify(appState.panelSizes));
}

function applyPanelSizes() {
  getPanelElements().forEach((panel) => {
    const size = appState.panelSizes[panel.id];
    if (!size) return;
    panel.style.width = `${Math.max(size.width || 280, 260)}px`;
    panel.style.height = `${Math.max(size.height || 130, 130)}px`;
  });
}

function loadPanelLayout() {
  try {
    const stored = JSON.parse(localStorage.getItem(PANEL_LAYOUT_STORAGE_KEY) || "null");
    if (!stored || typeof stored !== "object") return;
    appState.panelLayout = {
      mode: stored.mode === "absolute" ? "absolute" : "absolute",
      panels: stored.panels && typeof stored.panels === "object" ? stored.panels : {},
      nextZ: Number.isFinite(stored.nextZ) ? stored.nextZ : 1
    };
    appState.layoutEditMode = stored.layoutEditMode === true;
  } catch (error) {
    console.debug("Failed to load panel layout", error);
  }
}

function persistPanelLayout() {
  localStorage.setItem(PANEL_LAYOUT_STORAGE_KEY, JSON.stringify({
    mode: "absolute",
    layoutEditMode: appState.layoutEditMode,
    nextZ: appState.panelLayout.nextZ,
    panels: appState.panelLayout.panels
  }));
}

function getDashboardRect() {
  if (!elements.dashboardPanels) {
    return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  }
  const rect = elements.dashboardPanels.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: Math.max(rect.width, window.innerWidth - rect.left),
    height: Math.max(rect.height, window.innerHeight - rect.top)
  };
}

function normalizePanelLayoutItem(layoutItem, fallbackX = 8, fallbackY = 8, fallbackW = 280, fallbackH = 130) {
  return {
    x: Number.isFinite(layoutItem?.x) ? layoutItem.x : fallbackX,
    y: Number.isFinite(layoutItem?.y) ? layoutItem.y : fallbackY,
    width: Math.max(Number.isFinite(layoutItem?.width) ? layoutItem.width : fallbackW, 260),
    height: Math.max(Number.isFinite(layoutItem?.height) ? layoutItem.height : fallbackH, 130),
    z: Number.isFinite(layoutItem?.z) ? layoutItem.z : 1
  };
}

function clampLayoutItem(layoutItem) {
  const dashboardRect = getDashboardRect();
  const maxX = Math.max(dashboardRect.width - layoutItem.width - 4, 4);
  const maxY = Math.max(dashboardRect.height - layoutItem.height - 4, 4);
  layoutItem.x = Math.min(Math.max(layoutItem.x, 4), maxX);
  layoutItem.y = Math.min(Math.max(layoutItem.y, 4), maxY);
}

function ensureInitialPanelLayout() {
  const panelIds = getPanelElements().map((panel) => panel.id);
  const hasAllPanels = panelIds.every((id) => appState.panelLayout.panels[id]);
  if (hasAllPanels) return;

  const dashboardRect = getDashboardRect();
  let nextZ = appState.panelLayout.nextZ || 1;
  getPanelElements().forEach((panel, index) => {
    if (appState.panelLayout.panels[panel.id]) {
      nextZ = Math.max(nextZ, Number(appState.panelLayout.panels[panel.id].z) || 1);
      return;
    }
    const rect = panel.getBoundingClientRect();
    const item = normalizePanelLayoutItem({
      x: rect.left - dashboardRect.left,
      y: rect.top - dashboardRect.top,
      width: rect.width || panel.offsetWidth,
      height: rect.height || panel.offsetHeight,
      z: nextZ + index
    });
    clampLayoutItem(item);
    appState.panelLayout.panels[panel.id] = item;
  });
  appState.panelLayout.nextZ = nextZ + panelIds.length + 1;
  persistPanelLayout();
}

function updateDashboardCanvasSize() {
  if (!elements.dashboardPanels || !appState.layoutEditMode) return;
  let maxRight = 0;
  let maxBottom = 0;
  getPanelElements().forEach((panel) => {
    if (panel.id === "panel-sim" && appState.controlsDockEnabled) return;
    const layout = appState.panelLayout.panels[panel.id];
    if (!layout) return;
    maxRight = Math.max(maxRight, layout.x + layout.width);
    maxBottom = Math.max(maxBottom, layout.y + layout.height);
  });
  elements.dashboardPanels.style.minHeight = `${Math.max(window.innerHeight, maxBottom + 20)}px`;
  elements.dashboardPanels.style.minWidth = `${Math.max(window.innerWidth - 16, maxRight + 20)}px`;
}

function applyPanelLayout() {
  document.body.classList.toggle("layout-edit-on", appState.layoutEditMode);

  getPanelElements().forEach((panel) => {
    const item = appState.panelLayout.panels[panel.id];
    if (appState.layoutEditMode && item) {
      const layout = normalizePanelLayoutItem(item);
      appState.panelLayout.panels[panel.id] = layout;
      panel.style.left = `${layout.x}px`;
      panel.style.top = `${layout.y}px`;
      panel.style.width = `${layout.width}px`;
      panel.style.height = `${layout.height}px`;
      panel.style.zIndex = String(layout.z || 1);
    } else {
      if (!(panel.id === "panel-sim" && appState.controlsDockEnabled)) {
        panel.style.left = "";
        panel.style.top = "";
      }
      panel.style.zIndex = "";
    }
  });

  if (!appState.layoutEditMode && elements.dashboardPanels) {
    elements.dashboardPanels.style.minHeight = "";
    elements.dashboardPanels.style.minWidth = "";
  }

  updateDashboardCanvasSize();
}

function setLayoutScrollLock(locked) {
  appState.scrollLockCount += locked ? 1 : -1;
  appState.scrollLockCount = Math.max(appState.scrollLockCount, 0);
  document.body.classList.toggle("layout-scroll-lock", appState.scrollLockCount > 0);
}

function bringPanelToFront(panel) {
  const panelLayout = appState.panelLayout.panels[panel.id];
  if (!panelLayout) return;
  appState.panelLayout.nextZ = Math.max(appState.panelLayout.nextZ + 1, (panelLayout.z || 1) + 1);
  panelLayout.z = appState.panelLayout.nextZ;
  panel.style.zIndex = String(panelLayout.z);
}

function setLayoutEditMode(enabled) {
  appState.layoutEditMode = Boolean(enabled);
  if (appState.layoutEditMode) ensureInitialPanelLayout();
  applyPanelLayout();
  if (elements.layoutEditModeToggle) elements.layoutEditModeToggle.checked = appState.layoutEditMode;
  persistPanelLayout();
}

function startAbsolutePanelDrag(panel, header, startEvent) {
  if (!appState.layoutEditMode || !elements.dashboardPanels) return;
  if (!(startEvent.target instanceof HTMLElement)) return;
  if (startEvent.target.closest("button, input, select, label, a, .resize-handle")) return;
  if (startEvent.pointerType === "mouse" && startEvent.button !== 0) return;

  startEvent.preventDefault();
  const panelLayout = appState.panelLayout.panels[panel.id];
  if (!panelLayout) return;
  bringPanelToFront(panel);
  header.setPointerCapture(startEvent.pointerId);
  setLayoutScrollLock(true);
  appState.absolutePanelDrag = {
    panel,
    header,
    pointerId: startEvent.pointerId,
    startX: startEvent.clientX,
    startY: startEvent.clientY,
    startLeft: panelLayout.x,
    startTop: panelLayout.y
  };
  panel.classList.add("panel-dragging");
}

function moveAbsolutePanelDrag(moveEvent) {
  const drag = appState.absolutePanelDrag;
  if (!drag || moveEvent.pointerId !== drag.pointerId) return;
  moveEvent.preventDefault();
  const panelLayout = appState.panelLayout.panels[drag.panel.id];
  if (!panelLayout) return;

  panelLayout.x = drag.startLeft + (moveEvent.clientX - drag.startX);
  panelLayout.y = drag.startTop + (moveEvent.clientY - drag.startY);
  clampLayoutItem(panelLayout);

  drag.panel.style.left = `${panelLayout.x}px`;
  drag.panel.style.top = `${panelLayout.y}px`;
  updateDashboardCanvasSize();
}

function endAbsolutePanelDrag(endEvent) {
  const drag = appState.absolutePanelDrag;
  if (!drag || endEvent.pointerId !== drag.pointerId) return;
  if (drag.header.hasPointerCapture?.(drag.pointerId)) {
    drag.header.releasePointerCapture(drag.pointerId);
  }
  drag.panel.classList.remove("panel-dragging");
  appState.absolutePanelDrag = null;
  setLayoutScrollLock(false);
  persistPanelLayout();
}

function startPanelResize(panel, handle, startEvent) {
  if (!appState.layoutEditMode) return;
  if (startEvent.pointerType === "mouse" && startEvent.button !== 0) return;
  const panelLayout = appState.panelLayout.panels[panel.id];
  if (!panelLayout) return;

  startEvent.preventDefault();
  handle.setPointerCapture(startEvent.pointerId);
  setLayoutScrollLock(true);
  bringPanelToFront(panel);

  appState.panelResize = {
    panel,
    handle,
    pointerId: startEvent.pointerId,
    dir: handle.dataset.dir || "se",
    startX: startEvent.clientX,
    startY: startEvent.clientY,
    startLeft: panelLayout.x,
    startTop: panelLayout.y,
    startWidth: panelLayout.width,
    startHeight: panelLayout.height
  };
}

function movePanelResize(moveEvent) {
  const resize = appState.panelResize;
  if (!resize || moveEvent.pointerId !== resize.pointerId) return;
  moveEvent.preventDefault();

  const item = appState.panelLayout.panels[resize.panel.id];
  if (!item) return;

  const dx = moveEvent.clientX - resize.startX;
  const dy = moveEvent.clientY - resize.startY;

  let x = resize.startLeft;
  let y = resize.startTop;
  let width = resize.startWidth;
  let height = resize.startHeight;

  if (resize.dir.includes("e")) width = resize.startWidth + dx;
  if (resize.dir.includes("s")) height = resize.startHeight + dy;
  if (resize.dir.includes("w")) {
    width = resize.startWidth - dx;
    x = resize.startLeft + dx;
  }
  if (resize.dir.includes("n")) {
    height = resize.startHeight - dy;
    y = resize.startTop + dy;
  }

  width = Math.max(width, 260);
  height = Math.max(height, 130);

  if (resize.dir.includes("w")) {
    x = resize.startLeft + (resize.startWidth - width);
  }
  if (resize.dir.includes("n")) {
    y = resize.startTop + (resize.startHeight - height);
  }

  const dashboardRect = getDashboardRect();
  x = Math.max(4, Math.min(x, Math.max(dashboardRect.width - width - 4, 4)));
  y = Math.max(4, Math.min(y, Math.max(dashboardRect.height - height - 4, 4)));

  item.x = x;
  item.y = y;
  item.width = width;
  item.height = height;

  resize.panel.style.left = `${x}px`;
  resize.panel.style.top = `${y}px`;
  resize.panel.style.width = `${width}px`;
  resize.panel.style.height = `${height}px`;
  updateDashboardCanvasSize();
}

function endPanelResize(endEvent) {
  const resize = appState.panelResize;
  if (!resize || endEvent.pointerId !== resize.pointerId) return;
  if (resize.handle.hasPointerCapture?.(resize.pointerId)) {
    resize.handle.releasePointerCapture(resize.pointerId);
  }
  appState.panelResize = null;
  setLayoutScrollLock(false);
  persistPanelLayout();
}

function attachResizeHandles(panel) {
  const dirs = ["nw", "ne", "sw", "se"];
  dirs.forEach((dir) => {
    if (panel.querySelector(`.resize-handle[data-dir="${dir}"]`)) return;
    const handle = document.createElement("div");
    handle.className = "resize-handle";
    handle.dataset.dir = dir;
    panel.appendChild(handle);

    handle.addEventListener("pointerdown", (event) => startPanelResize(panel, handle, event));
    handle.addEventListener("pointermove", movePanelResize);
    handle.addEventListener("pointerup", endPanelResize);
    handle.addEventListener("pointercancel", endPanelResize);
  });
}

function getAutosavePayload() {
  return {
    state: {
      runActive: appState.runActive,
      runStartTime: appState.runStartTime,
      sheep: appState.sheep,
      currentCycle: appState.currentCycle,
      target: appState.target,
      farm: appState.farm,
      paused: appState.paused,
      pauseStartedAtMs: appState.pauseStartedAtMs,
      runEndTimeMs: appState.runEndTimeMs,
      currentRunIndex: appState.currentRunIndex,
      dayClockStartRealMs: appState.dayClockStartRealMs,
      dayClockStartSecondsFromMidnight: appState.dayClockStartSecondsFromMidnight,
      trendBucketMinutes: appState.trendBucketMinutes,
      trendBuckets: appState.trendBuckets,
      reviewBlocks: appState.reviewBlocks,
      nextReviewBlockIndex: appState.nextReviewBlockIndex,
      runReviewText: appState.runReviewText,
      trendFlags: appState.trendFlags,
      panelCollapsed: appState.panelCollapsed,
      effectiveElapsedBeforePauseMs: appState.effectiveElapsedBeforePauseMs,
      effectiveResumeRealMs: appState.effectiveResumeRealMs
    },
    panelOrder: getPanelElements().map((panel) => panel.id),
    panelSizes: appState.panelSizes,
    panelLayout: appState.panelLayout,
    layoutEditMode: appState.layoutEditMode,
    savedAt: Date.now()
  };
}

function autosaveState() {
  if (!appState.autosaveEnabled) return;
  localStorage.setItem(getAutosaveStorageKey(), JSON.stringify(getAutosavePayload()));
}

function updateAutosaveUI() {
  if (elements.autosaveToggle) elements.autosaveToggle.checked = appState.autosaveEnabled;
  if (elements.autosaveStatus) {
    elements.autosaveStatus.textContent = appState.autosaveEnabled
      ? "Autosave: ON (every 60s)"
      : "Autosave: OFF";
  }
}

function stopAutosaveLoop() {
  if (appState.autosaveTimerId) {
    clearInterval(appState.autosaveTimerId);
    appState.autosaveTimerId = null;
  }
}

function startAutosaveLoop() {
  if (!appState.autosaveEnabled) {
    stopAutosaveLoop();
    return;
  }
  stopAutosaveLoop();
  appState.autosaveTimerId = setInterval(autosaveState, 60000);
}

function setAutosaveEnabled(enabled) {
  appState.autosaveEnabled = Boolean(enabled);
  localStorage.setItem(AUTOSAVE_ENABLED_STORAGE_KEY, String(appState.autosaveEnabled));
  updateAutosaveUI();
  if (appState.autosaveEnabled) {
    autosaveState();
    startAutosaveLoop();
  } else {
    stopAutosaveLoop();
  }
}

function loadAutosaveSettings() {
  appState.autosaveEnabled = parseStoredBoolean(localStorage.getItem(AUTOSAVE_ENABLED_STORAGE_KEY), true);
}

function applyControlsDockPosition() {
  if (!elements.panelSim || !appState.controlsDockEnabled) return;
  elements.panelSim.style.left = `${Math.max(appState.controlsDockPos.x, 8)}px`;
  elements.panelSim.style.top = `${Math.max(appState.controlsDockPos.y, 8)}px`;
}

function persistControlsDockPosition() {
  localStorage.setItem(CONTROLS_DOCK_POS_STORAGE_KEY, JSON.stringify(appState.controlsDockPos));
}

function updateControlsDockUI() {
  const docked = appState.controlsDockEnabled;
  if (elements.panelSim) {
    elements.panelSim.classList.toggle("panel-docked", docked);
    if (!docked) {
      elements.panelSim.style.left = "";
      elements.panelSim.style.top = "";
    } else {
      applyControlsDockPosition();
    }
  }
  if (elements.controlsDockToggle) elements.controlsDockToggle.textContent = docked ? "Undock" : "Dock";
  if (elements.controlsDockReset) elements.controlsDockReset.hidden = !docked;
}

function setControlsDockEnabled(enabled) {
  appState.controlsDockEnabled = Boolean(enabled);
  localStorage.setItem(CONTROLS_DOCK_ENABLED_STORAGE_KEY, String(appState.controlsDockEnabled));
  updateControlsDockUI();
  applyPanelLayout();
}

function resetControlsDockPosition() {
  appState.controlsDockPos = { x: 20, y: 90 };
  persistControlsDockPosition();
  applyControlsDockPosition();
}

function loadControlsDockSettings() {
  appState.controlsDockEnabled = parseStoredBoolean(localStorage.getItem(CONTROLS_DOCK_ENABLED_STORAGE_KEY), false);
  try {
    const raw = JSON.parse(localStorage.getItem(CONTROLS_DOCK_POS_STORAGE_KEY) || "null");
    if (raw && Number.isFinite(raw.x) && Number.isFinite(raw.y)) {
      appState.controlsDockPos = { x: raw.x, y: raw.y };
    }
  } catch (error) {
    console.debug("Failed to parse controls dock position", error);
  }
}

function loadLastSave() {
  try {
    const autosaveKey = getAutosaveStorageKey();
    const raw = JSON.parse(localStorage.getItem(autosaveKey) || localStorage.getItem(AUTOSAVE_STORAGE_KEY) || 'null');
    if (!raw || !raw.state) return;
    Object.assign(appState, raw.state);
    if (Array.isArray(raw.panelOrder) && elements.dashboardPanels) {
      const byId = new Map(getPanelElements().map((panel) => [panel.id, panel]));
      raw.panelOrder.forEach((id) => {
        const panel = byId.get(id);
        if (panel) elements.dashboardPanels.appendChild(panel);
      });
    }
    appState.panelSizes = raw.panelSizes || appState.panelSizes;
    if (raw.panelLayout && typeof raw.panelLayout === "object") {
      appState.panelLayout = {
        mode: raw.panelLayout.mode === "absolute" ? "absolute" : "absolute",
        panels: raw.panelLayout.panels && typeof raw.panelLayout.panels === "object" ? raw.panelLayout.panels : appState.panelLayout.panels,
        nextZ: Number.isFinite(raw.panelLayout.nextZ) ? raw.panelLayout.nextZ : appState.panelLayout.nextZ
      };
    }
    if (raw.layoutEditMode === true || raw.layoutEditMode === false) {
      appState.layoutEditMode = raw.layoutEditMode;
    }
    if (elements.trendBucketSize) elements.trendBucketSize.value = String(appState.trendBucketMinutes || 15);
    applyPanelState();
    applyPanelSizes();
    if (appState.layoutEditMode) ensureInitialPanelLayout();
    applyPanelLayout();
    if (elements.runStatus) elements.runStatus.textContent = appState.runActive ? (appState.paused ? 'Paused' : 'Running') : 'Stopped';
    if (elements.startRunBtn) elements.startRunBtn.disabled = appState.runActive;
    if (elements.stopRunBtn) elements.stopRunBtn.disabled = !appState.runActive;
    renderLogTable();
    renderReviewList();
    drawTrendGraph();
    if (elements.runReviewText) elements.runReviewText.textContent = appState.runReviewText;
    updateTrendFlags();
    updateLivePanel();
    updateStatsPanel();
    updatePauseButtonUI();
    if (appState.runActive) {
      if (appState.paused) {
        stopPollingLoop();
        stopLiveAndStatsLoops();
      } else {
        startRealtimeLoops();
      }
    }
  } catch (error) {
    console.debug('Failed to load autosave', error);
  }
}

function applyPanelState() {
  getPanelElements().forEach((panel) => {
    const collapsed = Boolean(appState.panelCollapsed[panel.id]);
    panel.classList.toggle("collapsed", collapsed);
    const collapseBtn = panel.querySelector(".panel-collapse");
    if (collapseBtn) {
      collapseBtn.setAttribute("aria-expanded", String(!collapsed));
      collapseBtn.textContent = collapsed ? "+" : "−";
    }
  });
}

function movePanel(panelId, direction) {
  const panels = getPanelElements();
  const index = panels.findIndex((panel) => panel.id === panelId);
  if (index < 0) return;
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= panels.length || !elements.dashboardPanels) return;
  const target = panels[nextIndex];
  const current = panels[index];

  if (direction < 0) {
    elements.dashboardPanels.insertBefore(current, target);
  } else {
    elements.dashboardPanels.insertBefore(target, current);
  }

  persistPanelOrder();
}

function getPanelDropTarget(clientY, draggingPanel, placeholder) {
  const panels = getPanelElements().filter((panel) => panel !== draggingPanel && panel !== placeholder && !panel.classList.contains("panel-docked"));
  let closest = null;
  let closestOffset = Number.NEGATIVE_INFINITY;

  panels.forEach((panel) => {
    const rect = panel.getBoundingClientRect();
    const offset = clientY - (rect.top + (rect.height / 2));
    if (offset < 0 && offset > closestOffset) {
      closestOffset = offset;
      closest = panel;
    }
  });

  return closest;
}

function startPanelReorderDrag(panel, header, startEvent) {
  if (appState.layoutEditMode) return;
  if (!elements.dashboardPanels || panel.id === "panel-sim" && appState.controlsDockEnabled) return;
  if (!(startEvent.target instanceof HTMLElement)) return;
  if (startEvent.target.closest("button, input, select, label, a")) return;
  if (startEvent.pointerType === "mouse" && startEvent.button !== 0) return;

  const placeholder = document.createElement("div");
  placeholder.className = "panel-drop-placeholder";
  placeholder.style.height = `${panel.offsetHeight}px`;

  appState.pointerPanelDrag = {
    panel,
    header,
    pointerId: startEvent.pointerId,
    placeholder
  };

  panel.classList.add("panel-dragging");
  elements.dashboardPanels.insertBefore(placeholder, panel.nextSibling);
  header.setPointerCapture(startEvent.pointerId);
}

function movePanelReorderDrag(moveEvent) {
  if (appState.layoutEditMode) return;
  const drag = appState.pointerPanelDrag;
  if (!drag || moveEvent.pointerId !== drag.pointerId || !elements.dashboardPanels) return;
  moveEvent.preventDefault();

  const target = getPanelDropTarget(moveEvent.clientY, drag.panel, drag.placeholder);
  if (!target) {
    elements.dashboardPanels.appendChild(drag.placeholder);
  } else {
    elements.dashboardPanels.insertBefore(drag.placeholder, target);
  }
}

function endPanelReorderDrag(endEvent) {
  if (appState.layoutEditMode) return;
  const drag = appState.pointerPanelDrag;
  if (!drag || endEvent.pointerId !== drag.pointerId || !elements.dashboardPanels) return;

  drag.panel.classList.remove("panel-dragging");
  elements.dashboardPanels.insertBefore(drag.panel, drag.placeholder);
  drag.placeholder.remove();
  if (drag.header.hasPointerCapture?.(drag.pointerId)) {
    drag.header.releasePointerCapture(drag.pointerId);
  }
  appState.pointerPanelDrag = null;
  persistPanelOrder();
}

function startControlsDockDrag(startEvent) {
  if (!elements.panelSim || !appState.controlsDockEnabled || !(startEvent.target instanceof HTMLElement)) return;
  if (startEvent.target.closest("button, input, select, a")) return;
  if (startEvent.pointerType === "mouse" && startEvent.button !== 0) return;

  startEvent.preventDefault();
  const captureEl = startEvent.currentTarget instanceof HTMLElement ? startEvent.currentTarget : null;
  captureEl?.setPointerCapture?.(startEvent.pointerId);

  const panelRect = elements.panelSim.getBoundingClientRect();
  appState.controlsDockDrag = {
    pointerId: startEvent.pointerId,
    offsetX: startEvent.clientX - panelRect.left,
    offsetY: startEvent.clientY - panelRect.top,
    captureEl
  };
  elements.panelSim.classList.add("panel-docked-dragging");
}

function moveControlsDockDrag(moveEvent) {
  if (!appState.controlsDockDrag || moveEvent.pointerId !== appState.controlsDockDrag.pointerId || !elements.panelSim) return;
  moveEvent.preventDefault();
  const maxX = Math.max(window.innerWidth - elements.panelSim.offsetWidth - 8, 8);
  const maxY = Math.max(window.innerHeight - elements.panelSim.offsetHeight - 8, 8);
  appState.controlsDockPos = {
    x: Math.min(Math.max(moveEvent.clientX - appState.controlsDockDrag.offsetX, 8), maxX),
    y: Math.min(Math.max(moveEvent.clientY - appState.controlsDockDrag.offsetY, 8), maxY)
  };
  applyControlsDockPosition();
}

function endControlsDockDrag(endEvent) {
  if (!appState.controlsDockDrag || endEvent.pointerId !== appState.controlsDockDrag.pointerId || !elements.panelSim) return;
  if (appState.controlsDockDrag.captureEl?.hasPointerCapture?.(endEvent.pointerId)) {
    appState.controlsDockDrag.captureEl.releasePointerCapture(endEvent.pointerId);
  }
  elements.panelSim.classList.remove("panel-docked-dragging");
  persistControlsDockPosition();
  appState.controlsDockDrag = null;
}

function openResetModal(triggerEl) {
  if (!elements.resetModalOverlay || !elements.resetModalDialog || !elements.confirmResetBtn) return;
  appState.resetModalOpen = true;
  appState.resetModalReturnFocusEl = triggerEl || null;
  elements.resetModalOverlay.hidden = false;
  elements.resetModalDialog.focus();
}

function closeResetModal() {
  if (!elements.resetModalOverlay) return;
  appState.resetModalOpen = false;
  elements.resetModalOverlay.hidden = true;
  if (appState.resetModalReturnFocusEl instanceof HTMLElement) {
    appState.resetModalReturnFocusEl.focus();
  }
  appState.resetModalReturnFocusEl = null;
}

function applyConnectionSettingsFromUI() {
  if (!elements.shellyIpInput || !elements.endpointMode || !elements.pollIntervalInput) return;
  appState.connection.ip = normalizeIp(elements.shellyIpInput.value) || DEFAULT_CONNECTION_SETTINGS.ip;
  appState.connection.mode = ENDPOINT_PATHS[elements.endpointMode.value] ? elements.endpointMode.value : DEFAULT_CONNECTION_SETTINGS.mode;
  appState.connection.pollInterval = sanitizePollInterval(elements.pollIntervalInput.value);

  updateConnectionInputs();
  saveConnectionSettings();
  if (!appState.paused) {
    startPollingLoop();
  }
}

function setSimulationMode(enabled) {
  appState.simulationMode = Boolean(enabled);
  if (elements.simulationModeToggle) elements.simulationModeToggle.checked = appState.simulationMode;
  if (elements.simulationBanner) elements.simulationBanner.hidden = !appState.simulationMode;
  if (elements.simulationControls) elements.simulationControls.hidden = !appState.simulationMode;

  if (appState.simulationMode) {
    appState.lastMotorState = null;
    updateConnectionStatus({
      ok: true,
      parsedState: appState.currentCycle.motorOn,
      responseTimeMs: appState.lastResponseTimeMs,
      debugText: "simulation mode enabled"
    });
  }
}

function renderBlock(minutes) {
  if (!elements.blockResults) return;
  const block = calculateBlockData(minutes);
  elements.blockResults.innerHTML = `
    <p><strong>Window:</strong> ${minutes} minutes</p>
    <p><strong>Sheep completed:</strong> ${block.count}</p>
    <p><strong>Average shear:</strong> ${formatSeconds(block.avgShear)}</p>
    <p><strong>Average catch:</strong> ${formatSeconds(block.avgCatch)}</p>
    <p><strong>Average catch-to-release time:</strong> ${formatSeconds(block.avgCycle)}</p>
    <p><strong>Rate:</strong> ${block.rate.toFixed(2)} sheep/hour</p>
  `;
}

function bindEvents() {
  if (elements.startRunBtn) elements.startRunBtn.addEventListener("click", startRun);
  if (elements.stopRunBtn) elements.stopRunBtn.addEventListener("click", stopRun);
  if (elements.pauseRunBtn) elements.pauseRunBtn.addEventListener("click", togglePauseRun);
  if (elements.loadLastSaveBtn) elements.loadLastSaveBtn.addEventListener("click", loadLastSave);
  if (elements.trendBucketSize) {
    elements.trendBucketSize.addEventListener("change", () => {
      appState.trendBucketMinutes = Number(elements.trendBucketSize.value) || 15;
      appState.selectedTrendBucketKey = null;
      drawTrendGraph();
    });
  }
  if (elements.trendGraphCanvas) {
    elements.trendGraphCanvas.addEventListener("click", handleTrendGraphPointSelection);
    elements.trendGraphCanvas.addEventListener("touchend", (event) => {
      event.preventDefault();
      handleTrendGraphPointSelection(event);
    }, { passive: false });
  }
  if (elements.resetRunBtn) {
    elements.resetRunBtn.addEventListener("click", (event) => {
      openResetModal(event.currentTarget);
    });
  }

  if (elements.confirmResetBtn) {
    elements.confirmResetBtn.addEventListener("click", () => {
      resetRun();
      closeResetModal();
    });
  }

  if (elements.cancelResetBtn) {
    elements.cancelResetBtn.addEventListener("click", closeResetModal);
  }

  if (elements.resetModalOverlay) {
    elements.resetModalOverlay.addEventListener("click", (event) => {
      if (event.target === elements.resetModalOverlay) {
        closeResetModal();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && appState.resetModalOpen) {
      closeResetModal();
    }
  });

  if (elements.farmInput) {
    elements.farmInput.addEventListener("focus", openFarmDropdown);
    elements.farmInput.addEventListener("input", () => {
      renderFarmDropdown();
      if (elements.farmDropdownMenu?.hidden) openFarmDropdown();
    });
    elements.farmInput.addEventListener("blur", () => {
      window.setTimeout(() => {
        saveFarmFromInput();
      }, 80);
    });
    elements.farmInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        saveFarmFromInput();
        closeFarmDropdown();
      }
    });
  }

  if (elements.farmDropdownToggle) {
    elements.farmDropdownToggle.addEventListener("click", () => {
      if (elements.farmDropdownMenu?.hidden) {
        openFarmDropdown();
      } else {
        closeFarmDropdown();
      }
    });
  }

  if (elements.farmDropdownMenu) {
    elements.farmDropdownMenu.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const farmName = target.dataset.farmName || "";
      if (target.classList.contains("farm-select-btn")) {
        if (elements.farmInput) elements.farmInput.value = farmName;
        saveFarmFromInput();
        closeFarmDropdown();
      } else if (target.classList.contains("farm-delete-btn")) {
        removeSavedFarm(farmName);
      }
    });
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node) || !elements.farmDropdown) return;
    if (!elements.farmDropdown.contains(target)) {
      closeFarmDropdown();
    }
  });

  if (elements.runType && elements.customHours) {
    elements.runType.addEventListener("change", () => {
      elements.customHours.disabled = elements.runType.value !== "custom";
      if (elements.dayStartTimeInput && !appState.dayStartTimeTouched) {
        elements.dayStartTimeInput.value = getDefaultDayStartTime();
      }
      updateRunBadge();
    });
  }

  if (elements.dayStartTimeInput) {
    elements.dayStartTimeInput.addEventListener("input", () => {
      appState.dayStartTimeTouched = true;
    });
  }

  if (elements.sessionDate) {
    elements.sessionDate.addEventListener("change", () => {
      setSessionDate(elements.sessionDate.value);
    });
  }

  if (elements.blockMinutes) {
    elements.blockMinutes.addEventListener("change", () => {
      renderBlock(Number(elements.blockMinutes.value));
    });
  }

  document.querySelectorAll(".block-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!elements.blockMinutes) return;
      const minutes = Number(button.dataset.minutes);
      elements.blockMinutes.value = String(minutes);
      renderBlock(minutes);
    });
  });

  [elements.shellyIpInput, elements.endpointMode, elements.pollIntervalInput]
    .filter(Boolean)
    .forEach((input) => {
      input.addEventListener("change", applyConnectionSettingsFromUI);
    });

  document.querySelectorAll(".poll-quick-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!elements.pollIntervalInput) return;
      elements.pollIntervalInput.value = button.dataset.ms;
      applyConnectionSettingsFromUI();
    });
  });

  if (elements.testConnectionBtn) elements.testConnectionBtn.addEventListener("click", testConnection);
  if (elements.simulationModeToggle) {
    elements.simulationModeToggle.addEventListener("change", () => {
      setSimulationMode(elements.simulationModeToggle.checked);
    });
  }

  if (elements.simMotorOnBtn) elements.simMotorOnBtn.addEventListener("click", handleMotorOn);
  if (elements.simMotorOffBtn) elements.simMotorOffBtn.addEventListener("click", handleMotorOff);
  if (elements.autosaveToggle) {
    elements.autosaveToggle.addEventListener("change", () => {
      setAutosaveEnabled(elements.autosaveToggle.checked);
    });
  }
  if (elements.controlsDockToggle) {
    elements.controlsDockToggle.addEventListener("click", () => {
      setControlsDockEnabled(!appState.controlsDockEnabled);
    });
  }
  if (elements.controlsDockReset) {
    elements.controlsDockReset.addEventListener("click", resetControlsDockPosition);
  }
  if (elements.layoutEditModeToggle) {
    elements.layoutEditModeToggle.addEventListener("change", () => {
      setLayoutEditMode(elements.layoutEditModeToggle.checked);
    });
  }

  getPanelElements().forEach((panel) => {
    attachResizeHandles(panel);
    const header = panel.querySelector(".panel-header");
    const collapseBtn = panel.querySelector(".panel-collapse");
    const moveUpBtn = panel.querySelector(".panel-move-up");
    const moveDownBtn = panel.querySelector(".panel-move-down");

    if (collapseBtn) {
      collapseBtn.addEventListener("click", () => {
        const next = !panel.classList.contains("collapsed");
        panel.classList.toggle("collapsed", next);
        appState.panelCollapsed[panel.id] = next;
        persistPanelCollapsed();
        applyPanelState();
      });
    }

    if (moveUpBtn) moveUpBtn.addEventListener("click", () => movePanel(panel.id, -1));
    if (moveDownBtn) moveDownBtn.addEventListener("click", () => movePanel(panel.id, 1));

    if (header) {
      panel.draggable = false;
      header.draggable = false;
      header.addEventListener("pointerdown", (event) => {
        if (panel.id === "panel-sim" && appState.controlsDockEnabled) {
          startControlsDockDrag(event);
          return;
        }
        if (appState.layoutEditMode) {
          startAbsolutePanelDrag(panel, header, event);
          return;
        }
        startPanelReorderDrag(panel, header, event);
      });
      header.addEventListener("pointermove", (event) => {
        movePanelReorderDrag(event);
        moveControlsDockDrag(event);
        moveAbsolutePanelDrag(event);
      });
      header.addEventListener("pointerup", (event) => {
        endPanelReorderDrag(event);
        endControlsDockDrag(event);
        endAbsolutePanelDrag(event);
      });
      header.addEventListener("pointercancel", (event) => {
        endPanelReorderDrag(event);
        endControlsDockDrag(event);
        endAbsolutePanelDrag(event);
      });
    }
  });

  window.addEventListener("resize", () => {
    if (appState.controlsDockEnabled) {
      const maxX = Math.max(window.innerWidth - (elements.panelSim?.offsetWidth || 0) - 8, 8);
      const maxY = Math.max(window.innerHeight - (elements.panelSim?.offsetHeight || 0) - 8, 8);
      appState.controlsDockPos = {
        x: Math.min(appState.controlsDockPos.x, maxX),
        y: Math.min(appState.controlsDockPos.y, maxY)
      };
      applyControlsDockPosition();
      persistControlsDockPosition();
    }
    if (appState.layoutEditMode) {
      updateDashboardCanvasSize();
      persistPanelLayout();
    }
  });
}

function startRealtimeLoops() {
  startPollingLoop();
  startLiveLoop();
  startStatsLoop();
}

function initialize() {
  loadConnectionSettings();
  loadSavedFarms();
  loadPanelState();
  loadPanelSizes();
  loadPanelLayout();
  loadAutosaveSettings();
  initializeSessionDate();
  loadControlsDockSettings();
  updateConnectionInputs();
  bindEvents();
  applyPanelState();
  applyPanelSizes();
  ensureInitialPanelLayout();
  applyPanelLayout();
  renderFarmDropdown();

  if (elements.customHours && elements.runType) {
    elements.customHours.disabled = elements.runType.value !== "custom";
  }

  if (elements.dayStartTimeInput) {
    elements.dayStartTimeInput.value = getDefaultDayStartTime();
    appState.dayClockStartSecondsFromMidnight = parseTimeToSecondsFromMidnight(elements.dayStartTimeInput.value);
  }

  setSimulationMode(false);
  if (elements.trendBucketSize) elements.trendBucketSize.value = String(appState.trendBucketMinutes);

  if (elements.blockMinutes) {
    renderBlock(Number(elements.blockMinutes.value) || 15);
  }

  renderLogTable();
  renderReviewList();
  if (elements.runReviewText) elements.runReviewText.textContent = appState.runReviewText;
  updatePauseButtonUI();
  updateLivePanel();
  updateStatsPanel();
  updateRunBadge();
  updateDayClockDisplay();
  updateConnectionStatus({ ok: true, parsedState: null, responseTimeMs: null, debugText: "Waiting for connection test." });
  drawTrendGraph();
  updateTrendFlags();
  updateAutosaveUI();
  updateControlsDockUI();
  if (elements.layoutEditModeToggle) elements.layoutEditModeToggle.checked = appState.layoutEditMode;
  if (appState.layoutEditMode) applyPanelLayout();
  startDayClockLoop();
  startAutosaveLoop();

  if (shouldStartRealtimeLoops()) {
    startRealtimeLoops();
  }
}

initialize();
