const CONNECTION_STORAGE_KEY = "sheariq.connectionSettings";

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
  statsTimerId: null
};

const elements = {
  runStatus: document.getElementById("runStatus"),
  farmInput: document.getElementById("farmInput"),
  runType: document.getElementById("runType"),
  customHours: document.getElementById("customHours"),
  targetSheepInput: document.getElementById("targetSheepInput"),
  startRunBtn: document.getElementById("startRunBtn"),
  stopRunBtn: document.getElementById("stopRunBtn"),
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
  simMotorOffBtn: document.getElementById("simMotorOffBtn")
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
  calculateAverages();
}

function startRun() {
  if (!elements.farmInput || !elements.targetSheepInput || !elements.startRunBtn || !elements.stopRunBtn || !elements.runStatus) {
    return;
  }
  appState.runActive = true;
  appState.runStartTime = Date.now();
  appState.sheep = [];
  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = appState.runStartTime;
  appState.farm = elements.farmInput.value.trim();
  appState.target.sheep = Math.max(Number(elements.targetSheepInput.value) || 0, 0);
  appState.target.runLengthSeconds = getRunLengthSeconds();
  appState.currentMotorDisplay = "OFF";

  elements.startRunBtn.disabled = true;
  elements.stopRunBtn.disabled = false;
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

  elements.startRunBtn.disabled = false;
  elements.stopRunBtn.disabled = true;
  elements.runStatus.textContent = "Stopped";

  updateLivePanel();
  updateStatsPanel();
}

function resetRun() {
  if (!elements.startRunBtn || !elements.stopRunBtn || !elements.runStatus || !elements.blockMinutes) return;
  const ok = window.confirm("Reset run data? This will clear sheep log and timers.");
  if (!ok) return;

  resetRunState();
  elements.startRunBtn.disabled = false;
  elements.stopRunBtn.disabled = true;
  elements.runStatus.textContent = "Idle";
  renderLogTable();
  renderBlock(Number(elements.blockMinutes.value) || 15);
  updateLivePanel();
  updateStatsPanel();
}

function handleMotorOn() {
  if (!appState.runActive || appState.currentCycle.motorOn) return;

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
  if (!appState.runActive || !appState.currentCycle.motorOn || !appState.currentCycle.shearStart) {
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

  const runElapsedSeconds = Math.max((Date.now() - appState.runStartTime) / 1000, 1);
  appState.currentStats = {
    avgShear: totals.shear / appState.sheep.length,
    avgCatch: totals.catch / appState.sheep.length,
    avgCycle: totals.cycle / appState.sheep.length,
    sheepPerHour: (appState.sheep.length * 3600) / runElapsedSeconds
  };

  return appState.currentStats;
}

function calculateTargetMetrics() {
  const elapsedSeconds = appState.runStartTime ? (Date.now() - appState.runStartTime) / 1000 : 0;
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
  if (!appState.runActive || appState.simulationMode) return;

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

function applyConnectionSettingsFromUI() {
  if (!elements.shellyIpInput || !elements.endpointMode || !elements.pollIntervalInput) return;
  appState.connection.ip = normalizeIp(elements.shellyIpInput.value) || DEFAULT_CONNECTION_SETTINGS.ip;
  appState.connection.mode = ENDPOINT_PATHS[elements.endpointMode.value] ? elements.endpointMode.value : DEFAULT_CONNECTION_SETTINGS.mode;
  appState.connection.pollInterval = sanitizePollInterval(elements.pollIntervalInput.value);

  updateConnectionInputs();
  saveConnectionSettings();
  startPollingLoop();
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
  if (elements.resetRunBtn) elements.resetRunBtn.addEventListener("click", resetRun);

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
}

function startRealtimeLoops() {
  startPollingLoop();

  appState.liveTimerId = setInterval(() => {
    updateLivePanel();
  }, 250);

  appState.statsTimerId = setInterval(() => {
    updateStatsPanel();
  }, 1000);
}

function initialize() {
  loadConnectionSettings();
  updateConnectionInputs();
  bindEvents();

  if (elements.customHours && elements.runType) {
    elements.customHours.disabled = elements.runType.value !== "custom";
  }

  setSimulationMode(false);

  if (elements.blockMinutes) {
    renderBlock(Number(elements.blockMinutes.value) || 15);
  }

  renderLogTable();
  updateLivePanel();
  updateStatsPanel();
  updateConnectionStatus({ ok: true, parsedState: null, responseTimeMs: null, debugText: "Waiting for connection test." });

  if (isDashboardPage()) {
    startRealtimeLoops();
  }
}

initialize();
