const CONNECTION_STORAGE_KEY = "sheariq.connectionSettings";
const SAVED_FARMS_STORAGE_KEY = "sheariq.savedFarms";
const PANEL_ORDER_STORAGE_KEY = "sheariq.panelOrder";
const PANEL_COLLAPSED_STORAGE_KEY = "sheariq.panelCollapsed";

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
  savedFarms: [],
  panelCollapsed: {},
  draggedPanelId: null,
  resetModalOpen: false,
  resetModalReturnFocusEl: null
};

const elements = {
  runStatus: document.getElementById("runStatus"),
  farmInput: document.getElementById("farmInput"),
  runType: document.getElementById("runType"),
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
  cancelResetBtn: document.getElementById("cancelResetBtn")
};

function isDashboardPage() {
  return Boolean(elements.startRunBtn);
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function setHTML(element, value) {
  if (element) element.innerHTML = value;
}

function formatSeconds(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0.0s";
  return `${seconds.toFixed(1)}s`;
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
  calculateAverages();
}

function startRun() {
  if (!elements.farmInput || !elements.targetSheepInput || !elements.startRunBtn || !elements.stopRunBtn || !elements.runStatus) {
    return;
  }

  saveFarmFromInput();

  appState.runActive = true;
  appState.runStartTime = Date.now();
  appState.sheep = [];
  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = appState.runStartTime;
  appState.lastMotorState = null;
  appState.farm = normalizeFarmName(elements.farmInput.value);
  appState.target.sheep = Math.max(Number(elements.targetSheepInput.value) || 0, 0);
  appState.target.runLengthSeconds = getRunLengthSeconds();
  appState.currentMotorDisplay = "OFF";
  appState.pauseStartedAtMs = null;

  elements.startRunBtn.disabled = true;
  elements.stopRunBtn.disabled = false;

  setPaused(false);
  elements.runStatus.textContent = "Running";

  calculateAverages();
  updateStatsPanel();
  updateLivePanel();
  renderLogTable();
}

function stopRun() {
  if (!elements.startRunBtn || !elements.stopRunBtn || !elements.runStatus) return;
  appState.runActive = false;
  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = null;
  appState.currentMotorDisplay = "OFF";
  appState.pauseStartedAtMs = null;

  elements.startRunBtn.disabled = false;
  elements.stopRunBtn.disabled = true;

  setPaused(false);
  elements.runStatus.textContent = "Stopped";
  updatePauseButtonUI();
  updateLivePanel();
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

  appState.sheep.push({
    number: appState.sheep.length + 1,
    startTime: appState.currentCycle.shearStart,
    endTime: now,
    shearDuration,
    catchDuration,
    fullCycle
  });

  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = now;
  appState.currentMotorDisplay = "OFF";

  calculateAverages();
  updateStatsPanel();
  updateLivePanel();
  renderLogTable();
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
    (Date.now() - appState.runStartTime) / 1000,
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
  const elapsedSeconds = appState.runStartTime
    ? Math.max((Date.now() - appState.runStartTime) / 1000, 0)
    : 0;
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
  const { requiredCycleRemaining, remainingSheep } = calculateTargetMetrics();

  if (!appState.runActive) return "Run is not active.";
  if (appState.target.sheep <= 0 || appState.target.runLengthSeconds <= 0) return "Set target sheep and run length.";
  if (remainingSheep === 0) return "Target reached. Maintain quality and finish strong.";

  const avgCycle = appState.currentStats.avgCycle;
  if (avgCycle <= 0) return "Collect more cycles for prediction.";

  if (avgCycle <= requiredCycleRemaining) {
    return `On pace. Maintain ≤ ${requiredCycleRemaining.toFixed(1)}s per cycle.`;
  }

  const delta = avgCycle - requiredCycleRemaining;
  return `Behind pace by ${delta.toFixed(1)}s per cycle. Tighten catch transitions.`;
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

function renderLogTable() {
  if (!elements.sheepLogBody) return;
  elements.sheepLogBody.innerHTML = "";

  appState.sheep.forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.number}</td>
      <td>${formatClock(entry.startTime)}</td>
      <td>${formatClock(entry.endTime)}</td>
      <td>${formatSeconds(entry.shearDuration)}</td>
      <td>${formatSeconds(entry.catchDuration)}</td>
      <td>${formatSeconds(entry.fullCycle)}</td>
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

  setText(elements.motorState, appState.currentMotorDisplay);
  setText(elements.currentShear, formatSeconds(shearCurrent));
  setText(elements.currentCatch, formatSeconds(catchCurrent));
  setText(elements.totalSheep, String(appState.sheep.length));
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
  }, 250);
}

function startStatsLoop() {
  if (appState.statsTimerId) {
    clearInterval(appState.statsTimerId);
  }

  appState.statsTimerId = setInterval(() => {
    updateStatsPanel();
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
    appState.pauseStartedAtMs = null;
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
    <p><strong>Average cycle:</strong> ${formatSeconds(block.avgCycle)}</p>
    <p><strong>Rate:</strong> ${block.rate.toFixed(2)} sheep/hour</p>
  `;
}

function bindEvents() {
  if (elements.startRunBtn) elements.startRunBtn.addEventListener("click", startRun);
  if (elements.stopRunBtn) elements.stopRunBtn.addEventListener("click", stopRun);
  if (elements.pauseRunBtn) elements.pauseRunBtn.addEventListener("click", togglePauseRun);
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

  getPanelElements().forEach((panel) => {
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
      header.addEventListener("dragstart", () => {
        appState.draggedPanelId = panel.id;
      });
    }

    panel.addEventListener("dragover", (event) => {
      event.preventDefault();
      panel.classList.add("drag-over");
    });

    panel.addEventListener("dragleave", () => {
      panel.classList.remove("drag-over");
    });

    panel.addEventListener("drop", (event) => {
      event.preventDefault();
      panel.classList.remove("drag-over");
      const dragged = appState.draggedPanelId ? document.getElementById(appState.draggedPanelId) : null;
      if (!dragged || dragged === panel || !elements.dashboardPanels) return;
      const panels = getPanelElements();
      const draggedIdx = panels.findIndex((item) => item === dragged);
      const dropIdx = panels.findIndex((item) => item === panel);
      if (draggedIdx < dropIdx) {
        elements.dashboardPanels.insertBefore(dragged, panel.nextElementSibling);
      } else {
        elements.dashboardPanels.insertBefore(dragged, panel);
      }
      persistPanelOrder();
    });
  });

  document.addEventListener("dragend", () => {
    appState.draggedPanelId = null;
    getPanelElements().forEach((panel) => panel.classList.remove("drag-over"));
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
  updateConnectionInputs();
  bindEvents();
  applyPanelState();
  renderFarmDropdown();

  if (elements.customHours && elements.runType) {
    elements.customHours.disabled = elements.runType.value !== "custom";
  }

  setSimulationMode(false);

  if (elements.blockMinutes) {
    renderBlock(Number(elements.blockMinutes.value) || 15);
  }

  renderLogTable();
  updatePauseButtonUI();
  updateLivePanel();
  updateStatsPanel();
  updateConnectionStatus({ ok: true, parsedState: null, responseTimeMs: null, debugText: "Waiting for connection test." });

  if (isDashboardPage()) {
    startRealtimeLoops();
  }
}

initialize();
