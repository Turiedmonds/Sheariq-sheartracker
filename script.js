const SHELLY_ENDPOINT = "http://192.168.33.1/status";
const POLL_INTERVAL_MS = 200;

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
  }
};

const elements = {
  runStatus: document.getElementById("runStatus"),
  farmInput: document.getElementById("farmInput"),
  runType: document.getElementById("runType"),
  customHours: document.getElementById("customHours"),
  targetSheepInput: document.getElementById("targetSheepInput"),
  startRunBtn: document.getElementById("startRunBtn"),
  stopRunBtn: document.getElementById("stopRunBtn"),
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
  sheepLogBody: document.getElementById("sheepLogBody")
};

function formatSeconds(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0.0s";
  return `${seconds.toFixed(1)}s`;
}

function formatClock(timestamp) {
  return new Date(timestamp).toLocaleTimeString();
}

function getRunLengthSeconds() {
  if (elements.runType.value === "custom") {
    const customHours = Number(elements.customHours.value) || 0;
    return Math.max(customHours * 3600, 0);
  }
  return Number(elements.runType.value) * 3600;
}

// Start a new run and reset cycle data while preserving the run configuration.
function startRun() {
  appState.runActive = true;
  appState.runStartTime = Date.now();
  appState.sheep = [];
  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = appState.runStartTime;
  appState.farm = elements.farmInput.value.trim();
  appState.target.sheep = Math.max(Number(elements.targetSheepInput.value) || 0, 0);
  appState.target.runLengthSeconds = getRunLengthSeconds();

  elements.startRunBtn.disabled = true;
  elements.stopRunBtn.disabled = false;
  elements.runStatus.textContent = "Running";

  updateDashboard();
}

// Stop run and clear active cycle markers.
function stopRun() {
  appState.runActive = false;
  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = null;

  elements.startRunBtn.disabled = false;
  elements.stopRunBtn.disabled = true;
  elements.runStatus.textContent = "Stopped";

  updateDashboard();
}

// Record motor-on transition as shear start for current sheep.
function handleMotorOn() {
  if (!appState.runActive || appState.currentCycle.motorOn) return;

  const now = Date.now();
  appState.currentCycle.motorOn = true;
  appState.currentCycle.shearStart = now;

  if (!appState.currentCycle.catchStart) {
    appState.currentCycle.catchStart = now;
  }
}

// Record motor-off transition and finalize one sheep cycle.
function handleMotorOff() {
  if (!appState.runActive || !appState.currentCycle.motorOn || !appState.currentCycle.shearStart) return;

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

  calculateAverages();
  updateDashboard();
}

// Calculate current averages and sheep/hour based on completed sheep records.
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

// Compute target metrics for required pacing and projected totals.
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

// Produce human-readable pace guidance.
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

// Compute performance stats for a trailing time block.
function calculateBlockData(minutes) {
  const windowSeconds = Math.max(Number(minutes) || 0, 1) * 60;
  const now = Date.now();
  const entries = appState.sheep.filter((item) => now - item.endTime <= windowSeconds * 1000);

  if (!entries.length) {
    return {
      count: 0,
      avgShear: 0,
      avgCatch: 0,
      avgCycle: 0,
      rate: 0
    };
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

// Central render routine for all live dashboard values.
function updateDashboard() {
  calculateAverages();
  const target = calculateTargetMetrics();

  const shearCurrent = appState.currentCycle.motorOn && appState.currentCycle.shearStart
    ? (Date.now() - appState.currentCycle.shearStart) / 1000
    : 0;

  const catchCurrent = appState.runActive && !appState.currentCycle.motorOn && appState.currentCycle.catchStart
    ? (Date.now() - appState.currentCycle.catchStart) / 1000
    : 0;

  elements.totalSheep.textContent = String(appState.sheep.length);
  elements.avgShear.textContent = formatSeconds(appState.currentStats.avgShear);
  elements.avgCatch.textContent = formatSeconds(appState.currentStats.avgCatch);
  elements.avgCycle.textContent = formatSeconds(appState.currentStats.avgCycle);
  elements.sheepPerHour.textContent = appState.currentStats.sheepPerHour.toFixed(2);

  elements.motorState.textContent = appState.currentCycle.motorOn ? "ON" : "OFF";
  elements.currentShear.textContent = formatSeconds(shearCurrent);
  elements.currentCatch.textContent = formatSeconds(catchCurrent);

  elements.requiredCycle.textContent = formatSeconds(target.requiredCycle);
  elements.requiredRate.textContent = target.requiredRate.toFixed(2);
  elements.projectedTotal.textContent = String(target.projectedTotal);
  elements.catchPrediction.textContent = predictCatch();

  renderLogTable();
}

// Poll local Shelly endpoint and detect motor state transitions.
async function pollShelly() {
  if (!appState.runActive) return;

  try {
    const response = await fetch(SHELLY_ENDPOINT, { cache: "no-store" });
    if (!response.ok) return;

    const data = await response.json();
    const switchState = Boolean(data?.inputs?.[0]?.input ?? data?.relays?.[0]?.ison ?? false);

    if (appState.lastMotorState === null) {
      appState.lastMotorState = switchState;
    } else if (switchState !== appState.lastMotorState) {
      appState.lastMotorState = switchState;
      if (switchState) {
        handleMotorOn();
      } else {
        handleMotorOff();
      }
    }
  } catch (error) {
    console.debug("Shelly poll failed", error);
  }
}

function renderBlock(minutes) {
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
  elements.startRunBtn.addEventListener("click", startRun);
  elements.stopRunBtn.addEventListener("click", stopRun);

  elements.runType.addEventListener("change", () => {
    elements.customHours.disabled = elements.runType.value !== "custom";
  });

  elements.blockMinutes.addEventListener("change", () => {
    renderBlock(Number(elements.blockMinutes.value));
  });

  document.querySelectorAll(".block-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const minutes = Number(button.dataset.minutes);
      elements.blockMinutes.value = String(minutes);
      renderBlock(minutes);
    });
  });
}

function startRealtimeLoops() {
  setInterval(pollShelly, POLL_INTERVAL_MS);

  const frame = () => {
    updateDashboard();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

bindEvents();
elements.customHours.disabled = elements.runType.value !== "custom";
startRealtimeLoops();
updateDashboard();
