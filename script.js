const CONNECTION_STORAGE_KEY = "sheariq.connectionSettings";
const SAVED_FARMS_STORAGE_KEY = "sheariq.savedFarms";
const PANEL_ORDER_STORAGE_KEY = "sheariq.panelOrder";
const PANEL_COLLAPSED_STORAGE_KEY = "sheariq.panelCollapsed";
const PANEL_SIZES_STORAGE_KEY = "sheariq.panelSizes";
const AUTOSAVE_STORAGE_KEY = "sheariq.autosave";
const SESSION_DATE_STORAGE_KEY = "sheariq.sessionDate";
const AUTOSAVE_ENABLED_STORAGE_KEY = "sheariq.autosaveEnabled";
const AUTOSAVE_INTERVAL_STORAGE_KEY = "sheariq.autosaveIntervalSeconds";
const MANUAL_SAVE_INDEX_STORAGE_KEY = "sheariq.manualSaves.index";
const MANUAL_SAVE_STORAGE_PREFIX = "sheariq.manualSaves.";
const FOLLOW_LATEST_STORAGE_KEY = "sheariq.followLatest";
const CONTROLS_DOCK_ENABLED_STORAGE_KEY = "sheariq.controlsDockEnabled";
const CONTROLS_DOCK_POS_STORAGE_KEY = "sheariq.controlsDockPos";
const PANEL_LAYOUT_STORAGE_KEY = "sheariq.panelLayout";
const SNAP_TO_GRID_ENABLED_STORAGE_KEY = "sheariq.snapToGridEnabled";
const SNAP_GRID_SIZE_STORAGE_KEY = "sheariq.snapGridSize";
const PANEL_LOCKS_STORAGE_KEY = "sheariq.panelLocks";
const TARGET_PACE_SECTIONS_ORDER_STORAGE_KEY = "sheariq.targetPaceSectionsOrder";
const TARGET_PACE_SECTIONS_COLLAPSED_STORAGE_KEY = "sheariq.targetPaceSectionsCollapsed";
const SIM_SECTIONS_COLLAPSED_STORAGE_KEY = "sheariq.simSectionsCollapsed";
const SIM_SECTIONS_ORDER_STORAGE_KEY = "sheariq.simSectionsOrder";
const PERFORMANCE_SECTIONS_COLLAPSED_STORAGE_KEY = "sheariq.performanceSectionsCollapsed";
const PERFORMANCE_SECTIONS_ORDER_STORAGE_KEY = "sheariq.performanceSectionsOrder";
const DAY_CONFIG_SECTIONS_COLLAPSED_STORAGE_KEY = "sheariq.dayConfigSectionsCollapsed";
const DEFAULT_PERFORMANCE_SECTION_ORDER = ["sheepCount", "averages", "latestExtremes"];
const DEFAULT_SIM_SECTION_ORDER = ["simulationMode", "runControls", "autosave", "manualSave", "sessionTransfer", "status"];
const SHEEP_LOG_SORT_STORAGE_KEY = "sheariq.sheepLogSort";
const SHEEP_LOG_FILL_DIRECTION_STORAGE_KEY = "sheariq.sheepLogFillDirection";
const SHEEP_LOG_MARKERS_VISIBLE_STORAGE_KEY = "sheariq.sheepLogMarkersVisible";
const SHEEP_LOG_MARKER_SETTINGS_STORAGE_KEY = "sheariq.sheepLogMarkerSettings";
const KEYBOARD_SHORTCUTS_STORAGE_KEY = "sheariq.keyboardShortcuts";
const KEYBOARD_SHORTCUTS_VERSION_STORAGE_KEY = "sheariq.keyboardShortcuts.version";
const CURRENT_KEYBOARD_SHORTCUTS_VERSION = "2";
const SW_CACHE_NAME = "sheariq-shear-tracker-v7";
const SHEEP_NOTE_MAX_LENGTH = 200;
const DEFAULT_AUTOSAVE_INTERVAL_SECONDS = 60;
const SESSION_TRANSFER_APP = "SHEARiQ Shear Tracker";
const SESSION_TRANSFER_KIND = "sheariq.sheartracker.sessionTransfer";
const SESSION_TRANSFER_VERSION = 1;
const SESSION_IMPORT_MAX_BYTES = 5 * 1024 * 1024;
const AUTOSAVE_INTERVAL_OPTIONS_SECONDS = Object.freeze([15, 30, 60, 120, 300]);
const QUALITY_RATING_PERIOD_SECONDS = 1800;
const QUALITY_WARNING_REASONS = Object.freeze([
  "Quality rating over standard",
  "Rule breach",
  "Damaged sheep / cut",
  "Sheep handling / porthole issue",
  "Other"
]);

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

const FINAL_FILL_IDEAL_BEFORE_END_SECONDS = 180;
const FINAL_FILL_MIN_BEFORE_END_SECONDS = 120;
const FINAL_FILL_MAX_BEFORE_END_SECONDS = 240;
const FINAL_FILL_ANALYSIS_START_SECONDS = 1800;

const PEN_RULES_BY_RECORD_TYPE = {
  strongWoolLambs: {
    label: "Strong wool lambs",
    maxPen: 20,
    refillTriggerLeft: 5,
    defaultRefillAmount: 15
  },
  strongWoolEwes: {
    label: "Strong wool ewes",
    maxPen: 10,
    refillTriggerLeft: 2,
    defaultRefillAmount: 8
  }
};

const PEN_FILL_EVENT_SOURCE = {
  FULL: "full",
  RECOMMENDED: "recommended",
  MINUS_ONE: "minusOne",
  CUSTOM: "custom",
  ASSUMED_FULL: "assumedFull",
  MANUAL_CURRENT_PEN_COUNT_CORRECTION: "manual-current-pen-count-correction"
};

function getPenRule(recordType) {
  return PEN_RULES_BY_RECORD_TYPE[recordType] || null;
}

const SHEEP_STATUS = {
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  PENDING: "pending"
};

const MANUAL_MARKER_TYPES = {
  drink: "Drink",
  cutter: "Cutter",
  comb: "Comb"
};
const MANUAL_MARKER_CUSTOM_TYPE = "custom";
let sheepLogMarkerNoteEditorSheepId = "";
let selectedSheepLogIds = new Set();

function isValidManualMarkerType(type) {
  return Object.prototype.hasOwnProperty.call(MANUAL_MARKER_TYPES, type);
}

function buildManualMarker(type, customLabel = "") {
  if (type === MANUAL_MARKER_CUSTOM_TYPE) {
    const normalizedCustomLabel = normalizeManualMarkerCustomLabel(customLabel);
    if (!normalizedCustomLabel) return null;
    return {
      type: MANUAL_MARKER_CUSTOM_TYPE,
      label: normalizedCustomLabel,
      customLabel: normalizedCustomLabel,
      timestamp: Date.now()
    };
  }
  if (!isValidManualMarkerType(type)) return null;
  return {
    type,
    label: MANUAL_MARKER_TYPES[type],
    customLabel: "",
    timestamp: Date.now()
  };
}

function normalizeManualMarkerCustomLabel(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 60);
}

function sanitizeManualMarker(manualMarker) {
  if (typeof manualMarker === "string" && isValidManualMarkerType(manualMarker)) {
    return buildManualMarker(manualMarker);
  }
  if (!manualMarker || typeof manualMarker !== "object") return null;
  const timestamp = Number(manualMarker.timestamp);
  if (manualMarker.type === MANUAL_MARKER_CUSTOM_TYPE) {
    const customLabel = normalizeManualMarkerCustomLabel(manualMarker.customLabel || manualMarker.label);
    if (!customLabel) return null;
    return {
      type: MANUAL_MARKER_CUSTOM_TYPE,
      label: customLabel,
      customLabel,
      timestamp: Number.isFinite(timestamp) ? timestamp : Date.now()
    };
  }
  if (!isValidManualMarkerType(manualMarker.type)) return null;
  return {
    type: manualMarker.type,
    label: MANUAL_MARKER_TYPES[manualMarker.type],
    customLabel: "",
    timestamp: Number.isFinite(timestamp) ? timestamp : Date.now()
  };
}

function getManualMarkerDisplayLabel(manualMarker) {
  const sanitizedMarker = sanitizeManualMarker(manualMarker);
  return sanitizedMarker ? sanitizedMarker.label : "";
}

function getManualMarkerDedupKey(manualMarker) {
  const sanitizedMarker = sanitizeManualMarker(manualMarker);
  if (!sanitizedMarker) return "";
  if (sanitizedMarker.type === MANUAL_MARKER_CUSTOM_TYPE) {
    const normalizedCustomLabel = normalizeManualMarkerCustomLabel(sanitizedMarker.customLabel || sanitizedMarker.label);
    return normalizedCustomLabel ? `${MANUAL_MARKER_CUSTOM_TYPE}:${normalizedCustomLabel.toLowerCase()}` : "";
  }
  return isValidManualMarkerType(sanitizedMarker.type) ? `builtin:${sanitizedMarker.type}` : "";
}

function dedupeManualMarkers(manualMarkers) {
  if (!Array.isArray(manualMarkers)) return [];
  const seenKeys = new Set();
  return manualMarkers.reduce((markers, marker) => {
    const sanitizedMarker = sanitizeManualMarker(marker);
    const dedupKey = getManualMarkerDedupKey(sanitizedMarker);
    if (!sanitizedMarker || !dedupKey || seenKeys.has(dedupKey)) return markers;
    seenKeys.add(dedupKey);
    markers.push(sanitizedMarker);
    return markers;
  }, []);
}

function sanitizeManualMarkerArray(manualMarkers) {
  return dedupeManualMarkers(Array.isArray(manualMarkers) ? manualMarkers : []);
}

function unionManualMarkers(...manualMarkerGroups) {
  return dedupeManualMarkers(manualMarkerGroups.flatMap((manualMarkers) => {
    if (!manualMarkers) return [];
    if (Array.isArray(manualMarkers)) return manualMarkers;
    return [manualMarkers];
  }));
}

function getConfirmedManualMarkersForEntry(entry) {
  if (!entry || typeof entry !== "object") return [];
  const manualMarkers = sanitizeManualMarkerArray(entry.manualMarkers);
  if (manualMarkers.length) return manualMarkers;
  const manualMarker = sanitizeManualMarker(entry.manualMarker);
  return manualMarker ? [manualMarker] : [];
}

function syncLegacyManualMarkerToFirstManualMarker(entry, manualMarkers = getConfirmedManualMarkersForEntry(entry)) {
  if (!entry || typeof entry !== "object") return;
  if (manualMarkers.length) {
    entry.manualMarker = { ...manualMarkers[0] };
  } else {
    delete entry.manualMarker;
  }
}

function getManualMarkersDisplayLabel(manualMarkers) {
  return sanitizeManualMarkerArray(manualMarkers)
    .map((manualMarker) => manualMarker.type === MANUAL_MARKER_CUSTOM_TYPE
      ? `Custom: ${getManualMarkerDisplayLabel(manualMarker)}`
      : getManualMarkerDisplayLabel(manualMarker))
    .filter(Boolean)
    .join(" + ");
}

function getSheepStatus(entry) {
  return entry && entry.status ? entry.status : SHEEP_STATUS.ACCEPTED;
}


function normalizeSheepStatusReason(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 160);
}

function findSheepEntryIndexById(entries, sheepId) {
  if (!Array.isArray(entries) || !sheepId) return -1;
  return entries.findIndex((entry) => entry?.id === sheepId);
}

function updateSheepStatusById(sheepId, status, metadata = {}) {
  if (!sheepId) return { success: false, error: "Missing sheep ID." };
  if (![SHEEP_STATUS.ACCEPTED, SHEEP_STATUS.REJECTED, SHEEP_STATUS.PENDING].includes(status)) {
    return { success: false, error: "Invalid sheep status." };
  }

  const runIndex = findSheepEntryIndexById(appState.sheep, sheepId);
  const dayIndex = findSheepEntryIndexById(appState.daySheep, sheepId);
  if (runIndex === -1 || dayIndex === -1) {
    return { success: false, error: "Matching run/day sheep entries were not found; status was not changed." };
  }

  const statusUpdate = { ...metadata, status };
  Object.keys(statusUpdate).forEach((key) => {
    if (statusUpdate[key] === undefined) delete statusUpdate[key];
  });

  Object.assign(appState.sheep[runIndex], statusUpdate);
  Object.assign(appState.daySheep[dayIndex], statusUpdate);

  return { success: true, sheep: appState.sheep[runIndex], daySheep: appState.daySheep[dayIndex] };
}

function rejectSheepById(sheepId, options = {}) {
  const rejectedReason = normalizeSheepStatusReason(options.reason || options.rejectedReason);
  return updateSheepStatusById(sheepId, SHEEP_STATUS.REJECTED, {
    rejectedAt: Date.now(),
    rejectedReason: rejectedReason || undefined
  });
}

function restoreSheepById(sheepId, options = {}) {
  const restoreReason = normalizeSheepStatusReason(options.reason || options.restoreReason);
  return updateSheepStatusById(sheepId, SHEEP_STATUS.ACCEPTED, {
    restoredAt: Date.now(),
    restoreReason: restoreReason || undefined
  });
}

function isOfficialCounted(entry) {
  return getSheepStatus(entry) !== SHEEP_STATUS.REJECTED;
}

function isRejectedSheep(entry) {
  return getSheepStatus(entry) === SHEEP_STATUS.REJECTED;
}

function getLegacyRejectedDaySheepCount() {
  return Array.isArray(appState.daySheep) ? appState.daySheep.filter(isRejectedSheep).length : 0;
}

function sanitizeOfficialRejectedAdjustment(value, physicalCount = getPhysicalDaySheepCount()) {
  const safePhysicalCount = Math.max(Math.floor(Number(physicalCount)) || 0, 0);
  const safeValue = Math.max(Math.floor(Number(value)) || 0, 0);
  return Math.min(safeValue, safePhysicalCount);
}

function getOfficialRejectedAdjustmentCount() {
  return sanitizeOfficialRejectedAdjustment(appState.officialRejectedAdjustment);
}

// Official counts use a day-level rejected adjustment. Legacy per-row rejected statuses are a fallback until restored sessions migrate them.
function getRejectedDaySheepCount() {
  return sanitizeOfficialRejectedAdjustment(getOfficialRejectedAdjustmentCount() + getLegacyRejectedDaySheepCount());
}

function getOfficialDaySheepCount() {
  return Math.max(getPhysicalDaySheepCount() - getRejectedDaySheepCount(), 0);
}

function getRejectedRunSheepCount() {
  return Math.min(getRejectedDaySheepCount(), getPhysicalRunSheepCount());
}

function getOfficialRunSheepCount() {
  return Math.max(getPhysicalRunSheepCount() - getRejectedRunSheepCount(), 0);
}

function setOfficialRejectedAdjustmentCount(value) {
  appState.officialRejectedAdjustment = sanitizeOfficialRejectedAdjustment(value);
  return appState.officialRejectedAdjustment;
}

function migrateLegacyRejectedSheepStatusesToAdjustment() {
  const legacyRejectedCount = getLegacyRejectedDaySheepCount();
  if (!legacyRejectedCount) {
    setOfficialRejectedAdjustmentCount(appState.officialRejectedAdjustment);
    return 0;
  }

  const migratedAt = Date.now();
  setOfficialRejectedAdjustmentCount(getOfficialRejectedAdjustmentCount() + legacyRejectedCount);
  [appState.daySheep, appState.sheep].forEach((entries) => {
    if (!Array.isArray(entries)) return;
    entries.forEach((entry) => {
      if (!isRejectedSheep(entry)) return;
      entry.legacyRejectedStatus = true;
      entry.legacyRejectedMigratedAt = migratedAt;
      entry.status = SHEEP_STATUS.ACCEPTED;
    });
  });
  return legacyRejectedCount;
}

// Physical counts are used for timing, pen movement, and refill planning.
function getPhysicalRunSheepCount() {
  return Array.isArray(appState.sheep) ? appState.sheep.length : 0;
}

function getPhysicalDaySheepCount() {
  return Array.isArray(appState.daySheep) ? appState.daySheep.length : 0;
}

function getPhysicalSheepTakenFromPen() {
  const sheepCompletedCount = getPhysicalRunSheepCount();
  const hasActiveSheepOnBoard = Boolean(
    appState.runActive
    && appState.currentCycle.motorOn
    && appState.currentCycle.shearStart
  );
  return sheepCompletedCount + (hasActiveSheepOnBoard ? 1 : 0);
}

function getPenCycleSnapshot(recordType = appState.recordType) {
  const rule = getPenRule(recordType);
  if (!rule) return null;

  const sheepTakenFromPen = getPhysicalSheepTakenFromPen();
  const cycleSize = rule.defaultRefillAmount;
  if (!Number.isFinite(cycleSize) || cycleSize <= 0) return null;

  const sheepIntoCycle = sheepTakenFromPen % cycleSize;
  const sheepUntilRefill = sheepIntoCycle === 0 ? 0 : cycleSize - sheepIntoCycle;

  return {
    rule,
    sheepTakenFromPen,
    cycleSize,
    sheepIntoCycle,
    sheepUntilRefill,
    refillAllowed: sheepTakenFromPen > 0 && sheepIntoCycle === 0
  };
}


function getPenFillRunEndForecastCap(options = {}) {
  const rule = options.rule || getPenRule(options.recordType || appState.recordType);
  const defaultRefillAmount = Number(rule?.defaultRefillAmount);
  const refillTriggerLeft = Number(rule?.refillTriggerLeft);
  const avgCycleSeconds = Object.prototype.hasOwnProperty.call(options, "avgCycleSeconds")
    ? Number(options.avgCycleSeconds)
    : Number(appState.currentStats.avgCycle);
  const effectiveElapsedSeconds = Object.prototype.hasOwnProperty.call(options, "effectiveElapsedSeconds")
    ? Number(options.effectiveElapsedSeconds)
    : Number(getEffectiveElapsedSeconds());
  const runDurationSeconds = Object.prototype.hasOwnProperty.call(options, "runDurationSeconds")
    ? Number(options.runDurationSeconds)
    : Number(getCurrentRunDurationSeconds());

  if (
    !Number.isFinite(defaultRefillAmount)
    || defaultRefillAmount <= 0
    || !Number.isFinite(avgCycleSeconds)
    || avgCycleSeconds <= 0
    || !Number.isFinite(effectiveElapsedSeconds)
    || effectiveElapsedSeconds < 0
    || !Number.isFinite(runDurationSeconds)
    || runDurationSeconds <= 0
  ) {
    return 0;
  }

  const remainingRunSeconds = Math.max(runDurationSeconds - effectiveElapsedSeconds, 0);
  const projectedRemainingSheep = Math.ceil(remainingRunSeconds / avgCycleSeconds);
  const smallestExpectedRefillInterval = Number.isFinite(refillTriggerLeft) && refillTriggerLeft > 0
    ? Math.max(1, Math.min(defaultRefillAmount, refillTriggerLeft))
    : defaultRefillAmount;
  const projectedRefillCount = Math.ceil(projectedRemainingSheep / smallestExpectedRefillInterval) + 2;
  const minimumForecastCap = Number.isFinite(options.minimumForecastCap)
    ? Math.max(Math.floor(options.minimumForecastCap), 1)
    : 10;
  const hardForecastCap = Number.isFinite(options.hardForecastCap)
    ? Math.max(Math.floor(options.hardForecastCap), minimumForecastCap)
    : 1000;

  return Math.min(Math.max(projectedRefillCount, minimumForecastCap), hardForecastCap);
}

function forecastFullFillRefillPoints(options = {}) {
  const maxForecastPoints = Number.isFinite(options.maxForecastPoints)
    ? Math.max(Math.floor(options.maxForecastPoints), 0)
    : 10;
  if (maxForecastPoints <= 0) return [];

  const recordType = options.recordType || appState.recordType;
  const rule = getPenRule(recordType);
  if (!recordType || recordType === "none" || !rule) return [];
  if (!appState.runActive) return [];

  const cycleSize = rule.defaultRefillAmount;
  const sheepTakenFromPen = Object.prototype.hasOwnProperty.call(options, "physicalSheepTakenFromPen")
    ? Number(options.physicalSheepTakenFromPen)
    : Number(getPhysicalSheepTakenFromPen());
  const avgCycleSeconds = Object.prototype.hasOwnProperty.call(options, "avgCycleSeconds")
    ? Number(options.avgCycleSeconds)
    : Number(appState.currentStats.avgCycle);
  const elapsedSeconds = Object.prototype.hasOwnProperty.call(options, "effectiveElapsedSeconds")
    ? Number(options.effectiveElapsedSeconds)
    : Number(getEffectiveElapsedSeconds());
  const runDurationSeconds = Object.prototype.hasOwnProperty.call(options, "runDurationSeconds")
    ? Number(options.runDurationSeconds)
    : Number(getCurrentRunDurationSeconds());

  if (
    !Number.isFinite(cycleSize)
    || cycleSize <= 0
    || !Number.isFinite(sheepTakenFromPen)
    || sheepTakenFromPen <= 0
    || !Number.isFinite(avgCycleSeconds)
    || avgCycleSeconds <= 0
    || !Number.isFinite(elapsedSeconds)
    || elapsedSeconds <= 0
    || !Number.isFinite(runDurationSeconds)
    || runDurationSeconds <= 0
  ) {
    return [];
  }

  const points = [];
  const sheepIntoCycle = sheepTakenFromPen % cycleSize;
  let nextRefillSheepNumber = sheepTakenFromPen + (sheepIntoCycle === 0 ? cycleSize : cycleSize - sheepIntoCycle);

  while (points.length < maxForecastPoints) {
    const sheepUntilRefill = nextRefillSheepNumber - sheepTakenFromPen;
    const secondsFromNow = sheepUntilRefill * avgCycleSeconds;
    const effectiveElapsedSeconds = elapsedSeconds + secondsFromNow;
    if (effectiveElapsedSeconds > runDurationSeconds) break;

    points.push({
      refillNumber: points.length + 1,
      sheepNumber: nextRefillSheepNumber,
      secondsFromNow,
      effectiveElapsedSeconds,
      secondsBeforeRunEnd: Math.max(runDurationSeconds - effectiveElapsedSeconds, 0),
      label: `Sheep ${nextRefillSheepNumber}`
    });

    nextRefillSheepNumber += cycleSize;
  }

  return points;
}

function getCurrentPenFillOpportunityPoint(recordType = appState.recordType) {
  if (!recordType || recordType === "none" || !getPenRule(recordType)) return null;
  if (!appState.runActive) return null;

  const cycleSnapshot = getPenCycleSnapshot(recordType);
  if (!cycleSnapshot?.refillAllowed) return null;

  const sheepTakenFromPen = getPhysicalSheepTakenFromPen();
  const effectiveElapsedSeconds = getEffectiveElapsedSeconds();
  const runDurationSeconds = getCurrentRunDurationSeconds();

  if (
    !Number.isFinite(sheepTakenFromPen)
    || sheepTakenFromPen <= 0
    || !Number.isFinite(effectiveElapsedSeconds)
    || effectiveElapsedSeconds < 0
    || !Number.isFinite(runDurationSeconds)
    || runDurationSeconds <= 0
  ) {
    return null;
  }

  const secondsBeforeRunEnd = runDurationSeconds - effectiveElapsedSeconds;
  if (!Number.isFinite(secondsBeforeRunEnd) || secondsBeforeRunEnd < 0) return null;

  return {
    refillNumber: 0,
    sheepNumber: sheepTakenFromPen,
    secondsFromNow: 0,
    effectiveElapsedSeconds,
    secondsBeforeRunEnd,
    label: `Sheep ${sheepTakenFromPen}`,
    isCurrentFill: true
  };
}

function buildPenFillForecastPoint(sheepNumber, physicalSheepTakenFromPen, avgCycleSeconds, effectiveElapsedSeconds, runDurationSeconds, overrides = {}) {
  const normalizedSheepNumber = Number(sheepNumber);
  const currentPhysicalSheep = Number(physicalSheepTakenFromPen);
  const cycleSeconds = Number(avgCycleSeconds);
  const elapsedSeconds = Number(effectiveElapsedSeconds);
  const durationSeconds = Number(runDurationSeconds);
  if (
    !Number.isFinite(normalizedSheepNumber)
    || !Number.isFinite(currentPhysicalSheep)
    || !Number.isFinite(cycleSeconds)
    || !Number.isFinite(elapsedSeconds)
    || !Number.isFinite(durationSeconds)
  ) {
    return null;
  }

  const sheepUntilRefill = Math.max(normalizedSheepNumber - currentPhysicalSheep, 0);
  const secondsFromNow = sheepUntilRefill * cycleSeconds;
  const pointElapsedSeconds = elapsedSeconds + secondsFromNow;
  if (pointElapsedSeconds > durationSeconds) return null;

  return {
    refillNumber: 0,
    sheepNumber: normalizedSheepNumber,
    secondsFromNow,
    effectiveElapsedSeconds: pointElapsedSeconds,
    secondsBeforeRunEnd: Math.max(durationSeconds - pointElapsedSeconds, 0),
    label: `Sheep ${normalizedSheepNumber}`,
    ...overrides
  };
}

function getPenFillUnconfirmedAssumptionState(penState, options = {}) {
  const rule = options.rule || penState?.rule || getPenRule(options.recordType || appState.recordType);
  if (!rule || !penState) return false;

  const physicalSheepTakenFromPen = Number(penState.physicalSheepTakenFromPen ?? options.physicalSheepTakenFromPen);
  const fullFillAmount = Number(rule.defaultRefillAmount);
  const refillTriggerLeft = Number(rule.refillTriggerLeft);
  const currentPenCount = Number(penState.currentPenCount);
  const hasConfirmedEvents = Boolean(options.hasConfirmedEvents ?? penState.source === "confirmed");

  if (!Number.isFinite(physicalSheepTakenFromPen) || physicalSheepTakenFromPen <= 0) return false;
  if (!Number.isFinite(fullFillAmount) || fullFillAmount <= 0) return false;

  if (!hasConfirmedEvents) {
    return physicalSheepTakenFromPen > fullFillAmount && physicalSheepTakenFromPen % fullFillAmount !== 0;
  }

  return Number.isFinite(currentPenCount)
    && Number.isFinite(refillTriggerLeft)
    && currentPenCount < refillTriggerLeft
    && !findActivePenFillEventAtCurrentPoint(physicalSheepTakenFromPen);
}

function forecastPenFillPointsFromEvents(options = {}) {
  const maxForecastPoints = Number.isFinite(options.maxForecastPoints)
    ? Math.max(Math.floor(options.maxForecastPoints), 0)
    : 10;
  if (maxForecastPoints <= 0) return [];

  const recordType = Object.prototype.hasOwnProperty.call(options, "recordType") ? options.recordType : appState.recordType;
  const rule = options.rule || getPenRule(recordType);
  if (!recordType || recordType === "none" || !rule) return [];

  const runActive = Object.prototype.hasOwnProperty.call(options, "runActive") ? Boolean(options.runActive) : Boolean(appState.runActive);
  if (!runActive) return [];

  const avgCycleSeconds = Object.prototype.hasOwnProperty.call(options, "avgCycleSeconds")
    ? Number(options.avgCycleSeconds)
    : Number(appState.currentStats.avgCycle);
  const effectiveElapsedSeconds = Object.prototype.hasOwnProperty.call(options, "effectiveElapsedSeconds")
    ? Number(options.effectiveElapsedSeconds)
    : Number(getEffectiveElapsedSeconds());
  const runDurationSeconds = Object.prototype.hasOwnProperty.call(options, "runDurationSeconds")
    ? Number(options.runDurationSeconds)
    : Number(getCurrentRunDurationSeconds());
  const physicalSheepTakenFromPen = Object.prototype.hasOwnProperty.call(options, "physicalSheepTakenFromPen")
    ? Number(options.physicalSheepTakenFromPen)
    : Number(getPhysicalSheepTakenFromPen());

  if (
    !Number.isFinite(avgCycleSeconds)
    || avgCycleSeconds <= 0
    || !Number.isFinite(effectiveElapsedSeconds)
    || effectiveElapsedSeconds < 0
    || !Number.isFinite(runDurationSeconds)
    || runDurationSeconds <= 0
    || !Number.isFinite(physicalSheepTakenFromPen)
    || physicalSheepTakenFromPen < 0
  ) {
    return [];
  }

  const events = Object.prototype.hasOwnProperty.call(options, "events")
    ? getCurrentRunPenFillEvents(options.events)
    : getCurrentRunPenFillEvents();
  if (!events.length) {
    return forecastFullFillRefillPoints({
      ...options,
      recordType,
      rule,
      maxForecastPoints,
      avgCycleSeconds,
      effectiveElapsedSeconds,
      runDurationSeconds,
      physicalSheepTakenFromPen
    });
  }

  const penState = getCurrentPenStateFromEvents({
    recordType,
    rule,
    events,
    physicalSheepTakenFromPen
  });
  if (!penState) return [];

  const defaultRefillAmount = Number(rule.defaultRefillAmount);
  const nextRefillAllowedInSheep = Number(penState.nextRefillAllowedInSheep);
  if (!Number.isFinite(defaultRefillAmount) || defaultRefillAmount <= 0 || !Number.isFinite(nextRefillAllowedInSheep)) return [];

  const alreadyConfirmedAtCurrentPoint = events.some((event) => (
    isPenFillAmountEvent(event)
    && Number(event.physicalSheepTakenFromPen) === physicalSheepTakenFromPen
  ));
  let nextRefillSheepNumber = null;
  if (penState.refillAllowedNow && !alreadyConfirmedAtCurrentPoint) {
    nextRefillSheepNumber = physicalSheepTakenFromPen;
  } else if (nextRefillAllowedInSheep > 0) {
    nextRefillSheepNumber = physicalSheepTakenFromPen + nextRefillAllowedInSheep;
  }

  if (!Number.isFinite(nextRefillSheepNumber)) return [];

  const points = [];
  while (points.length < maxForecastPoints) {
    const point = buildPenFillForecastPoint(
      nextRefillSheepNumber,
      physicalSheepTakenFromPen,
      avgCycleSeconds,
      effectiveElapsedSeconds,
      runDurationSeconds,
      {
        refillNumber: points.length + 1,
        fullFillAmount: defaultRefillAmount,
        fillAmount: defaultRefillAmount,
        source: points.length === 0 ? "confirmedState" : "projectedFullFill",
        isCurrentFill: nextRefillSheepNumber === physicalSheepTakenFromPen
      }
    );
    if (!point) break;
    points.push(point);
    nextRefillSheepNumber += defaultRefillAmount;
  }

  return points;
}

function getPenFillForecastPoints(options = {}) {
  const recordType = Object.prototype.hasOwnProperty.call(options, "recordType") ? options.recordType : appState.recordType;
  const rule = options.rule || getPenRule(recordType);
  const physicalSheepTakenFromPen = Object.prototype.hasOwnProperty.call(options, "physicalSheepTakenFromPen")
    ? Number(options.physicalSheepTakenFromPen)
    : Number(getPhysicalSheepTakenFromPen());
  const events = Object.prototype.hasOwnProperty.call(options, "events")
    ? getCurrentRunPenFillEvents(options.events)
    : getCurrentRunPenFillEvents();
  const hasConfirmedEvents = events.length > 0;
  const penState = getCurrentPenStateFromEvents({ recordType, rule, events, physicalSheepTakenFromPen });
  const fillNotConfirmed = getPenFillUnconfirmedAssumptionState(penState, { rule, hasConfirmedEvents, physicalSheepTakenFromPen });

  if (hasConfirmedEvents) {
    return {
      points: forecastPenFillPointsFromEvents({ ...options, recordType, rule, events, physicalSheepTakenFromPen }),
      assumption: fillNotConfirmed ? "Refill not confirmed — assuming full refills" : "Using confirmed refills",
      hasConfirmedEvents,
      fillNotConfirmed,
      penState
    };
  }

  const fullFillPoints = forecastFullFillRefillPoints({ ...options, recordType, rule });
  const currentFillPoint = getCurrentPenFillOpportunityPoint(recordType);
  const points = currentFillPoint ? [currentFillPoint, ...fullFillPoints] : fullFillPoints;
  return {
    points,
    assumption: fillNotConfirmed ? "Refill not confirmed — assuming full refills" : "Assuming full refills",
    hasConfirmedEvents,
    fillNotConfirmed,
    penState
  };
}

function getPenFillForecastPointsToRunEnd(options = {}) {
  const maxForecastPoints = getPenFillRunEndForecastCap(options);
  if (maxForecastPoints <= 0) {
    return {
      points: [],
      assumption: getPenFillForecastAssumption(options),
      hasConfirmedEvents: false,
      fillNotConfirmed: false,
      penState: null
    };
  }

  return getPenFillForecastPoints({
    ...options,
    maxForecastPoints
  });
}

function getPenFillForecastAssumption(options = {}) {
  return getPenFillForecastPoints(options).assumption;
}

const DRINK_REFILL_CLASH_WINDOW_SECONDS = 90;
const DRINK_REFILL_EARLY_NOTICE_SECONDS = 120;
const DRINK_REFILL_ALLOWED_SHIFT_SECONDS = 70;
const DRINK_REFILL_DELAYED_SHEEP_AFTER_REFILL = 2;
const DRINK_REFILL_MIN_SECONDS_BEFORE_REFILL_TO_SUGGEST_EARLY = 20;

function getDrinkRefillEarlyOptionMessage(sheepUntilRefill, delayedOptionTooLate = false) {
  if (delayedOptionTooLate) {
    return "Drink timing — drink before refill; delay too late.";
  }
  if (Number.isFinite(sheepUntilRefill) && sheepUntilRefill <= 1) {
    return "Drink timing — drink on next catch.";
  }
  if (sheepUntilRefill === 2) {
    return "Drink timing — drink after next sheep.";
  }
  return "Drink timing — drink before next refill.";
}

function getNextDrinkRefillClashAdvisory(options = {}) {
  const effectiveElapsedSeconds = Object.prototype.hasOwnProperty.call(options, "effectiveElapsedSeconds")
    ? Number(options.effectiveElapsedSeconds)
    : Number(getEffectiveElapsedSeconds());
  const plannedTimingMinutes = Object.prototype.hasOwnProperty.call(options, "plannedTimingMinutes")
    ? Number(options.plannedTimingMinutes)
    : Number(appState.markerSettings?.drink?.plannedTimingMinutes);
  const avgCycleSeconds = Object.prototype.hasOwnProperty.call(options, "avgCycleSeconds")
    ? Number(options.avgCycleSeconds)
    : Number(appState.currentStats?.avgCycle);
  const drinkIntervalSeconds = plannedTimingMinutes * 60;

  if (
    !Number.isFinite(effectiveElapsedSeconds)
    || effectiveElapsedSeconds < 0
    || !Number.isFinite(drinkIntervalSeconds)
    || drinkIntervalSeconds <= 0
    || !Number.isFinite(avgCycleSeconds)
    || avgCycleSeconds <= 0
  ) {
    return null;
  }

  const nextDrinkEffectiveElapsedSeconds = (Math.floor(effectiveElapsedSeconds / drinkIntervalSeconds) + 1) * drinkIntervalSeconds;
  const forecast = getPenFillForecastPoints({
    ...options,
    effectiveElapsedSeconds,
    avgCycleSeconds,
    maxForecastPoints: 1
  });
  const nextRefill = Array.isArray(forecast?.points) ? forecast.points[0] : null;
  const nextRefillEffectiveElapsedSeconds = Number(nextRefill?.effectiveElapsedSeconds);

  if (!Number.isFinite(nextRefillEffectiveElapsedSeconds) || nextRefillEffectiveElapsedSeconds < effectiveElapsedSeconds) {
    return null;
  }

  const secondsBetweenDrinkAndRefill = nextDrinkEffectiveElapsedSeconds - nextRefillEffectiveElapsedSeconds;
  const drinkDueAfterRefill = secondsBetweenDrinkAndRefill > 0;
  const inClashWindowAfterRefill = secondsBetweenDrinkAndRefill <= DRINK_REFILL_CLASH_WINDOW_SECONDS;
  const inEarlyNoticeAfterRefill = secondsBetweenDrinkAndRefill <= DRINK_REFILL_EARLY_NOTICE_SECONDS;

  if (!drinkDueAfterRefill || (!inClashWindowAfterRefill && !inEarlyNoticeAfterRefill)) {
    return null;
  }

  const nextRefillSheepNumber = Number(nextRefill?.sheepNumber);
  const currentPhysicalSheepCount = Object.prototype.hasOwnProperty.call(options, "physicalSheepTakenFromPen")
    ? Number(options.physicalSheepTakenFromPen)
    : Number(getPhysicalSheepTakenFromPen());
  const sheepUntilRefill = Number.isFinite(nextRefillSheepNumber) && Number.isFinite(currentPhysicalSheepCount)
    ? Math.ceil(nextRefillSheepNumber - currentPhysicalSheepCount)
    : null;
  const suggestedSheepNumber = Number.isFinite(nextRefillSheepNumber) && nextRefillSheepNumber > 0
    ? nextRefillSheepNumber
    : null;
  const earlyOptionEffectiveElapsedSeconds = Math.max(
    effectiveElapsedSeconds,
    nextRefillEffectiveElapsedSeconds - avgCycleSeconds
  );
  const delayedOptionEffectiveElapsedSeconds = nextRefillEffectiveElapsedSeconds
    + (DRINK_REFILL_DELAYED_SHEEP_AFTER_REFILL * avgCycleSeconds);
  const earlyOptionDistanceSeconds = Math.abs(nextDrinkEffectiveElapsedSeconds - earlyOptionEffectiveElapsedSeconds);
  const delayedOptionDistanceSeconds = Math.abs(nextDrinkEffectiveElapsedSeconds - delayedOptionEffectiveElapsedSeconds);
  const delayedOptionWithinAllowedShift = delayedOptionDistanceSeconds <= DRINK_REFILL_ALLOWED_SHIFT_SECONDS;
  const delayedOptionTooLate = delayedOptionEffectiveElapsedSeconds > nextDrinkEffectiveElapsedSeconds + DRINK_REFILL_ALLOWED_SHIFT_SECONDS;
  const delayedOptionCloserThanEarly = delayedOptionDistanceSeconds < earlyOptionDistanceSeconds;
  const preferDelayedOption = delayedOptionWithinAllowedShift && delayedOptionCloserThanEarly;

  const message = preferDelayedOption
    ? "Drink timing — wait 2 sheep after refill."
    : getDrinkRefillEarlyOptionMessage(sheepUntilRefill, delayedOptionTooLate);

  return {
    type: "drinkRefillClash",
    message,
    nextDrinkEffectiveElapsedSeconds,
    nextRefillEffectiveElapsedSeconds,
    nextRefillSheepNumber: Number.isFinite(nextRefillSheepNumber) ? nextRefillSheepNumber : null,
    secondsBetweenDrinkAndRefill,
    suggestedSheepNumber,
    recommendedDrinkTiming: preferDelayedOption ? "delayed" : "early",
    earlyOptionEffectiveElapsedSeconds,
    delayedOptionEffectiveElapsedSeconds,
    delayedOptionSheepAfterRefill: DRINK_REFILL_DELAYED_SHEEP_AFTER_REFILL
  };
}

if (typeof window !== "undefined") {
  window.getNextDrinkRefillClashAdvisory = getNextDrinkRefillClashAdvisory;
}

function getMinimumRecommendedFillAmount(rule) {
  if (!rule) return null;
  if (rule.defaultRefillAmount === 15) return 12;
  if (rule.defaultRefillAmount === 8) return 6;
  return Math.max(1, Math.ceil(rule.defaultRefillAmount * 0.65));
}

function normalizePenFillReduction(reduction, fullFillAmount) {
  const normalizedReduction = Number.isFinite(reduction) ? Math.max(Math.floor(reduction), 0) : 0;
  return Math.min(normalizedReduction, Math.max(fullFillAmount - 1, 0));
}

function createPenFillEventId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `pen-fill-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isManualCurrentPenCountCorrectionEvent(event) {
  return event?.source === PEN_FILL_EVENT_SOURCE.MANUAL_CURRENT_PEN_COUNT_CORRECTION;
}

function isPenFillAmountEvent(event) {
  return Boolean(
    event
    && typeof event === "object"
    && !isManualCurrentPenCountCorrectionEvent(event)
    && Number.isFinite(Number(event.actualFillAmount))
    && Number(event.actualFillAmount) > 0
  );
}

function isActivePenFillEvent(event) {
  if (
    !event
    || typeof event !== "object"
    || event.undone
    || event.undoneAt
    || !Number.isFinite(Number(event.runIndex))
    || !Number.isFinite(Number(event.physicalSheepTakenFromPen))
    || !Number.isFinite(Number(event.resultingPenCount))
  ) {
    return false;
  }

  if (isManualCurrentPenCountCorrectionEvent(event)) {
    return Number.isInteger(Number(event.correctedCurrentPenCount))
      && Number(event.correctedCurrentPenCount) >= 0;
  }

  return isPenFillAmountEvent(event);
}


function getPenFillEventTimingPoint(event) {
  const effectiveElapsedSeconds = Number(event?.effectiveElapsedSeconds);
  if (Number.isFinite(effectiveElapsedSeconds) && effectiveElapsedSeconds >= 0) {
    return { seconds: effectiveElapsedSeconds, source: "effectiveElapsedSeconds" };
  }

  const wallClockTime = Number(event?.wallClockTime);
  if (Number.isFinite(wallClockTime) && wallClockTime > 0) {
    return { seconds: wallClockTime / 1000, source: "wallClockTime" };
  }

  const createdAt = Number(event?.createdAt);
  if (Number.isFinite(createdAt) && createdAt > 0) {
    return { seconds: createdAt / 1000, source: "createdAt" };
  }

  return null;
}

function getConfirmedPenFillIntervalEvents(refillEvents = []) {
  if (!Array.isArray(refillEvents)) return [];

  return refillEvents
    .filter((event) => event && typeof event === "object" && !event.undone && !event.undoneAt && isPenFillAmountEvent(event))
    .map((event, originalIndex) => ({
      event,
      originalIndex,
      timing: getPenFillEventTimingPoint(event)
    }))
    .filter((entry) => entry.timing)
    .sort((a, b) => {
      const timingDiff = a.timing.seconds - b.timing.seconds;
      if (timingDiff !== 0) return timingDiff;
      const sheepDiff = Number(a.event?.physicalSheepTakenFromPen ?? a.event?.sheepNumber)
        - Number(b.event?.physicalSheepTakenFromPen ?? b.event?.sheepNumber);
      if (Number.isFinite(sheepDiff) && sheepDiff !== 0) return sheepDiff;
      return a.originalIndex - b.originalIndex;
    });
}

function getPenFillIntervalPairs(refillEvents = []) {
  const confirmedEvents = getConfirmedPenFillIntervalEvents(refillEvents);
  if (confirmedEvents.length < 2) return [];

  const intervals = [];
  for (let index = 1; index < confirmedEvents.length; index += 1) {
    const from = confirmedEvents[index - 1];
    const to = confirmedEvents[index];
    if (from.timing.source !== to.timing.source) continue;

    const seconds = to.timing.seconds - from.timing.seconds;
    if (!Number.isFinite(seconds) || seconds < 0) continue;

    intervals.push({
      fromEvent: from.event,
      toEvent: to.event,
      seconds
    });
  }

  return intervals;
}

function calculateAverageFillInterval(refillEvents = []) {
  const intervals = getPenFillIntervalPairs(refillEvents);
  if (intervals.length < 1) return null;

  const totalSeconds = intervals.reduce((total, interval) => total + interval.seconds, 0);
  return {
    averageSeconds: totalSeconds / intervals.length,
    intervalCount: intervals.length
  };
}

function getRecentFillIntervals(refillEvents = [], limit = 3) {
  const safeLimit = Math.max(Math.floor(Number(limit) || 0), 0);
  if (safeLimit <= 0) return [];

  return getPenFillIntervalPairs(refillEvents)
    .slice(-safeLimit)
    .map((interval) => ({
      fromSheepNumber: Number.isFinite(Number(interval.fromEvent?.sheepNumber))
        ? Number(interval.fromEvent.sheepNumber)
        : (Number.isFinite(Number(interval.fromEvent?.physicalSheepTakenFromPen)) ? Number(interval.fromEvent.physicalSheepTakenFromPen) : null),
      toSheepNumber: Number.isFinite(Number(interval.toEvent?.sheepNumber))
        ? Number(interval.toEvent.sheepNumber)
        : (Number.isFinite(Number(interval.toEvent?.physicalSheepTakenFromPen)) ? Number(interval.toEvent.physicalSheepTakenFromPen) : null),
      seconds: interval.seconds
    }));
}

function getCurrentRunPenFillEvents(events = appState.penFillEvents) {
  if (!Array.isArray(events)) return [];
  const currentRunIndex = Number(appState.currentRunIndex);
  return events
    .filter((event) => isActivePenFillEvent(event) && Number(event.runIndex) === currentRunIndex)
    .sort((a, b) => {
      const sheepDiff = Number(a.physicalSheepTakenFromPen) - Number(b.physicalSheepTakenFromPen);
      if (sheepDiff !== 0) return sheepDiff;
      return Number(a.createdAt || 0) - Number(b.createdAt || 0);
    });
}

function getLatestPenFillEvent(events = getCurrentRunPenFillEvents()) {
  const activeEvents = Array.isArray(events)
    ? events.filter(isActivePenFillEvent)
    : [];
  if (!activeEvents.length) return null;
  return activeEvents.sort((a, b) => {
    const sheepDiff = Number(a.physicalSheepTakenFromPen) - Number(b.physicalSheepTakenFromPen);
    if (sheepDiff !== 0) return sheepDiff;
    return Number(a.createdAt || 0) - Number(b.createdAt || 0);
  })[activeEvents.length - 1];
}

function getCurrentPenStateFromEvents(options = {}) {
  const recordType = Object.prototype.hasOwnProperty.call(options, "recordType") ? options.recordType : appState.recordType;
  const rule = options.rule || getPenRule(recordType);
  if (!recordType || recordType === "none" || !rule) return null;

  const fullFillAmount = Number(rule.defaultRefillAmount);
  if (!Number.isFinite(fullFillAmount) || fullFillAmount <= 0) return null;

  const physicalSheepTakenFromPen = Object.prototype.hasOwnProperty.call(options, "physicalSheepTakenFromPen")
    ? Number(options.physicalSheepTakenFromPen)
    : Number(getPhysicalSheepTakenFromPen());
  if (!Number.isFinite(physicalSheepTakenFromPen) || physicalSheepTakenFromPen < 0) return null;

  const events = Object.prototype.hasOwnProperty.call(options, "events")
    ? options.events
    : getCurrentRunPenFillEvents();
  const lastFillEvent = getLatestPenFillEvent(events);

  if (lastFillEvent) {
    const baselineSheepNumber = Number(lastFillEvent.physicalSheepTakenFromPen);
    const sheepTakenSinceLastFill = Math.max(physicalSheepTakenFromPen - baselineSheepNumber, 0);
    const baselinePenCount = isManualCurrentPenCountCorrectionEvent(lastFillEvent)
      ? Number(lastFillEvent.correctedCurrentPenCount)
      : Number(lastFillEvent.resultingPenCount);
    const currentPenCount = baselinePenCount - sheepTakenSinceLastFill;
    const nextRefillAllowedInSheep = Math.max(currentPenCount - Number(rule.refillTriggerLeft), 0);
    const stateSource = isManualCurrentPenCountCorrectionEvent(lastFillEvent) ? "manualCorrection" : "confirmed";
    return {
      recordType,
      rule,
      source: stateSource,
      physicalSheepTakenFromPen,
      currentPenCount,
      sheepLeftInPen: currentPenCount,
      sheepTakenSinceLastFill,
      nextRefillAllowedInSheep,
      refillAllowedNow: currentPenCount <= Number(rule.refillTriggerLeft),
      lastFillEvent,
      lastFillAmount: isPenFillAmountEvent(lastFillEvent) ? Number(lastFillEvent.actualFillAmount) : null,
      lastFillSheepNumber: baselineSheepNumber,
      lastFillTime: lastFillEvent.wallClockTime || lastFillEvent.createdAt || null,
      manualCurrentPenCountCorrection: isManualCurrentPenCountCorrectionEvent(lastFillEvent) ? lastFillEvent : null,
      assumption: isManualCurrentPenCountCorrectionEvent(lastFillEvent)
        ? "Using manual current pen count correction."
        : "Using confirmed refills."
    };
  }

  const sheepIntoFullFillCycle = physicalSheepTakenFromPen % fullFillAmount;
  const sheepTakenSinceLastFill = physicalSheepTakenFromPen > 0 && sheepIntoFullFillCycle === 0
    ? fullFillAmount
    : sheepIntoFullFillCycle;
  const currentPenCount = Number(rule.maxPen) - sheepTakenSinceLastFill;
  const nextRefillAllowedInSheep = Math.max(currentPenCount - Number(rule.refillTriggerLeft), 0);

  return {
    recordType,
    rule,
    source: "assumedFull",
    physicalSheepTakenFromPen,
    currentPenCount,
    sheepLeftInPen: currentPenCount,
    sheepTakenSinceLastFill,
    nextRefillAllowedInSheep,
    refillAllowedNow: physicalSheepTakenFromPen > 0 && currentPenCount <= Number(rule.refillTriggerLeft),
    lastFillEvent: null,
    lastFillAmount: null,
    lastFillSheepNumber: null,
    lastFillTime: null,
    assumption: "Assuming full refills."
  };
}

function validatePenFillAmount(amount, penState, rule) {
  const numericAmount = Number(amount);
  const currentRule = rule || penState?.rule || null;
  const maxPen = Number(currentRule?.maxPen);
  const fullFillAmount = Number(currentRule?.defaultRefillAmount);
  const currentPenCount = Number(penState?.currentPenCount ?? penState?.sheepLeftInPen);
  const minRecommended = getMinimumRecommendedFillAmount(currentRule);
  const maxAllowedByPen = Number.isFinite(maxPen) && Number.isFinite(currentPenCount)
    ? Math.max(maxPen - currentPenCount, 0)
    : null;
  const maxAllowed = Number.isFinite(maxAllowedByPen) && Number.isFinite(fullFillAmount)
    ? Math.min(maxAllowedByPen, fullFillAmount)
    : fullFillAmount;
  const resultingPenCount = Number.isFinite(currentPenCount) && Number.isFinite(numericAmount)
    ? currentPenCount + numericAmount
    : null;
  const reductionAmount = Number.isFinite(fullFillAmount) && Number.isFinite(numericAmount)
    ? fullFillAmount - numericAmount
    : null;

  const result = {
    valid: false,
    amount: numericAmount,
    reason: "",
    maxAllowed,
    minRecommended,
    resultingPenCount,
    reductionAmount
  };

  if (!currentRule || !Number.isFinite(maxPen) || !Number.isFinite(fullFillAmount) || fullFillAmount <= 0) {
    return { ...result, reason: "Missing pen rule." };
  }
  if (!Number.isInteger(numericAmount)) {
    return { ...result, reason: "Refill amount must be a whole number." };
  }
  if (numericAmount <= 0) {
    return { ...result, reason: "Refill amount must be greater than 0." };
  }
  if (!Number.isFinite(currentPenCount)) {
    return { ...result, reason: "Missing current pen count." };
  }
  if (numericAmount > fullFillAmount) {
    return { ...result, reason: "Refill amount cannot exceed the full refill amount." };
  }
  if (resultingPenCount > maxPen) {
    return { ...result, reason: "Resulting pen count cannot exceed pen capacity." };
  }
  if (Number.isFinite(minRecommended) && numericAmount < minRecommended) {
    return { ...result, reason: "Refill amount is below the minimum recommended refill." };
  }

  return { ...result, valid: true, reason: "" };
}

function validateCurrentPenCountCorrection(correctedCurrentPenCount, rule = getPenRule(appState.recordType)) {
  const numericCount = Number(correctedCurrentPenCount);
  const maxPen = Number(rule?.maxPen);
  const result = {
    valid: false,
    correctedCurrentPenCount: numericCount,
    reason: ""
  };

  if (!rule || !Number.isFinite(maxPen)) {
    return { ...result, reason: "Missing pen rule." };
  }
  if (!Number.isInteger(numericCount)) {
    return { ...result, reason: "Current pen count must be a whole number." };
  }
  if (numericCount < 0) {
    return { ...result, reason: "Current pen count cannot be negative." };
  }
  if (numericCount > maxPen) {
    return { ...result, reason: `Current pen count cannot exceed ${maxPen}.` };
  }

  return { ...result, valid: true, reason: "" };
}

function createCurrentPenCountCorrectionEventDraft(options = {}) {
  const recordType = Object.prototype.hasOwnProperty.call(options, "recordType") ? options.recordType : appState.recordType;
  const rule = options.rule || getPenRule(recordType);
  const validation = validateCurrentPenCountCorrection(options.correctedCurrentPenCount, rule);
  if (!validation.valid) {
    return { error: validation.reason, validation };
  }

  const physicalSheepTakenFromPen = Object.prototype.hasOwnProperty.call(options, "physicalSheepTakenFromPen")
    ? Number(options.physicalSheepTakenFromPen)
    : Number(getPhysicalSheepTakenFromPen());
  if (!Number.isFinite(physicalSheepTakenFromPen) || physicalSheepTakenFromPen < 0) {
    return { error: "Missing current sheep count." };
  }

  const effectiveElapsedSeconds = Object.prototype.hasOwnProperty.call(options, "effectiveElapsedSeconds")
    ? Number(options.effectiveElapsedSeconds)
    : Number(getEffectiveElapsedSeconds());
  const wallClockTime = Object.prototype.hasOwnProperty.call(options, "wallClockTime")
    ? options.wallClockTime
    : Date.now();
  const createdAt = Date.now();
  const sheepNumber = Number.isFinite(physicalSheepTakenFromPen) ? physicalSheepTakenFromPen : null;

  return {
    id: createPenFillEventId(),
    recordType,
    runIndex: appState.currentRunIndex,
    sheepNumber,
    sheepId: options.sheepId || appState.sheep.find((entry) => Number(entry?.number) === sheepNumber)?.id || null,
    physicalSheepTakenFromPen,
    correctedCurrentPenCount: validation.correctedCurrentPenCount,
    actualFillAmount: null,
    resultingPenCount: validation.correctedCurrentPenCount,
    source: PEN_FILL_EVENT_SOURCE.MANUAL_CURRENT_PEN_COUNT_CORRECTION,
    note: options.note || "Manual current pen count correction",
    effectiveElapsedSeconds: Number.isFinite(effectiveElapsedSeconds) ? effectiveElapsedSeconds : null,
    wallClockTime,
    mode: appState.simulationMode ? "simulation" : "real",
    simulationRunLengthMode: appState.simulationMode ? appState.simulationRunLengthMode : "real",
    createdAt,
    updatedAt: createdAt
  };
}

function recordCurrentPenCountCorrection(correctedCurrentPenCount, options = {}) {
  const draft = createCurrentPenCountCorrectionEventDraft({
    ...options,
    correctedCurrentPenCount
  });

  if (draft?.error) {
    return { success: false, event: null, message: draft.error, error: draft.error, validation: draft.validation };
  }

  appState.penFillEvents.push(draft);
  autosaveState();
  refreshPenFillConfirmationDisplays(`Corrected current pen count — ${draft.correctedCurrentPenCount}.`);
  return { success: true, event: draft, message: "Corrected current pen count.", error: null };
}

function createPenFillEventDraft(options = {}) {
  const recordType = Object.prototype.hasOwnProperty.call(options, "recordType") ? options.recordType : appState.recordType;
  const rule = options.rule || getPenRule(recordType);
  const penState = options.penState || getCurrentPenStateFromEvents({ recordType, rule });
  const physicalSheepTakenFromPen = Object.prototype.hasOwnProperty.call(options, "physicalSheepTakenFromPen")
    ? Number(options.physicalSheepTakenFromPen)
    : Number(penState?.physicalSheepTakenFromPen ?? getPhysicalSheepTakenFromPen());
  const source = Object.values(PEN_FILL_EVENT_SOURCE).includes(options.source)
    ? options.source
    : PEN_FILL_EVENT_SOURCE.CUSTOM;
  const actualFillAmount = Number(options.actualFillAmount);
  const validation = validatePenFillAmount(actualFillAmount, penState, rule);
  if (!validation.valid) {
    return { error: validation.reason, validation };
  }

  const cycleSnapshot = Object.prototype.hasOwnProperty.call(options, "cycleSnapshot")
    ? options.cycleSnapshot
    : getPenCycleSnapshot(recordType);
  const effectiveElapsedSeconds = Object.prototype.hasOwnProperty.call(options, "effectiveElapsedSeconds")
    ? Number(options.effectiveElapsedSeconds)
    : Number(getEffectiveElapsedSeconds());
  const wallClockTime = Object.prototype.hasOwnProperty.call(options, "wallClockTime")
    ? options.wallClockTime
    : Date.now();
  const createdAt = Date.now();
  const sheepNumber = Number.isFinite(physicalSheepTakenFromPen)
    ? physicalSheepTakenFromPen
    : null;
  const sheepId = options.sheepId || appState.sheep.find((entry) => Number(entry?.number) === sheepNumber)?.id || null;

  return {
    id: createPenFillEventId(),
    recordType,
    runIndex: appState.currentRunIndex,
    sheepNumber,
    sheepId,
    physicalSheepTakenFromPen,
    effectiveElapsedSeconds: Number.isFinite(effectiveElapsedSeconds) ? effectiveElapsedSeconds : null,
    wallClockTime,
    fullFillAmount: Number(rule.defaultRefillAmount),
    recommendedFillAmount: Number.isFinite(Number(options.recommendedFillAmount))
      ? Number(options.recommendedFillAmount)
      : actualFillAmount,
    actualFillAmount,
    reductionAmount: validation.reductionAmount,
    sheepLeftBeforeFill: penState.currentPenCount,
    resultingPenCount: validation.resultingPenCount,
    source,
    mode: appState.simulationMode ? "simulation" : "real",
    simulationRunLengthMode: appState.simulationMode ? appState.simulationRunLengthMode : "real",
    cycleSnapshot,
    createdAt,
    updatedAt: createdAt
  };
}

function getPenFillPlannerRecommendation(options = {}) {
  const plannerOptions = {
    recordType: appState.recordType,
    rule: options.rule || getPenRule(appState.recordType),
    physicalSheepTakenFromPen: getPhysicalSheepTakenFromPen(),
    cycleSnapshot: getPenCycleSnapshot(appState.recordType),
    avgCycleSeconds: appState.currentStats.avgCycle,
    effectiveElapsedSeconds: getEffectiveElapsedSeconds(),
    runDurationSeconds: getCurrentRunDurationSeconds()
  };
  if (Number.isFinite(Number(options.remainingRunSeconds))) {
    plannerOptions.remainingRunSeconds = Number(options.remainingRunSeconds);
  }
  if (Array.isArray(options.forecastPoints)) {
    plannerOptions.forecastPoints = options.forecastPoints;
  } else {
    plannerOptions.forecastPoints = getPenFillForecastPoints(plannerOptions).points;
  }
  return planFinalFillStrategy(plannerOptions);
}

function findActivePenFillEventAtCurrentPoint(physicalSheepTakenFromPen = getPhysicalSheepTakenFromPen()) {
  const currentRunIndex = Number(appState.currentRunIndex);
  const currentPhysicalSheep = Number(physicalSheepTakenFromPen);
  if (!Number.isFinite(currentRunIndex) || !Number.isFinite(currentPhysicalSheep)) return null;

  return getCurrentRunPenFillEvents().find((event) => (
    isPenFillAmountEvent(event)
    && Number(event.runIndex) === currentRunIndex
    && Number(event.physicalSheepTakenFromPen) === currentPhysicalSheep
  )) || null;
}

function maybeRecordAssumedPenFillEvent(context = {}) {
  const recordType = Object.prototype.hasOwnProperty.call(context, "recordType") ? context.recordType : appState.recordType;
  const rule = context.rule || getPenRule(recordType);
  if (!appState.runActive || appState.paused || !recordType || recordType === "none" || !rule) return null;

  const fullFillAmount = Number(rule.defaultRefillAmount);
  if (!Number.isInteger(fullFillAmount) || fullFillAmount <= 0) return null;
  const physicalSheepTakenFromPen = Object.prototype.hasOwnProperty.call(context, "physicalSheepTakenFromPen")
    ? Number(context.physicalSheepTakenFromPen)
    : Number(getPhysicalSheepTakenFromPen());
  if (!Number.isFinite(physicalSheepTakenFromPen) || physicalSheepTakenFromPen < fullFillAmount) return null;

  const assumedFillSheepNumber = Math.floor(physicalSheepTakenFromPen / fullFillAmount) * fullFillAmount;
  if (!Number.isFinite(assumedFillSheepNumber) || assumedFillSheepNumber <= 0) return null;
  if (findActivePenFillEventAtCurrentPoint(assumedFillSheepNumber)) return null;

  const promptKey = getPenFillPromptKey(assumedFillSheepNumber);
  if (
    appState.penFillPromptModal?.open
    || appState.pendingPenFillPromptKey === promptKey
    || appState.dismissedPenFillPromptKey === promptKey
  ) {
    return null;
  }

  const penStateAtFillPoint = getCurrentPenStateFromEvents({
    recordType,
    rule,
    physicalSheepTakenFromPen: assumedFillSheepNumber
  });
  if (!penStateAtFillPoint?.refillAllowedNow) return null;

  const instructionModel = getPenFillInstructionModel({
    recordType,
    rule,
    physicalSheepTakenFromPen: assumedFillSheepNumber,
    penState: penStateAtFillPoint
  });
  const recommendedFillAmount = Number(instructionModel?.recommendedFillAmount);
  if (
    !Number.isInteger(recommendedFillAmount)
    || recommendedFillAmount !== fullFillAmount
    || penFillInstructionNeedsConfirmation(instructionModel, rule)
  ) {
    return null;
  }

  const sheepPastFillPoint = Math.max(physicalSheepTakenFromPen - assumedFillSheepNumber, 0);
  const currentEffectiveElapsedSeconds = Number(getEffectiveElapsedSeconds());
  const avgCycleSeconds = Number(appState.currentStats.avgCycle);
  const effectiveElapsedSeconds = Number.isFinite(currentEffectiveElapsedSeconds)
    ? Math.max(currentEffectiveElapsedSeconds - (Number.isFinite(avgCycleSeconds) && avgCycleSeconds > 0 ? sheepPastFillPoint * avgCycleSeconds : 0), 0)
    : null;
  const wallClockTime = Number.isFinite(avgCycleSeconds) && avgCycleSeconds > 0
    ? Date.now() - (sheepPastFillPoint * avgCycleSeconds * 1000)
    : Date.now();

  const draft = createPenFillEventDraft({
    recordType,
    rule,
    penState: penStateAtFillPoint,
    physicalSheepTakenFromPen: assumedFillSheepNumber,
    actualFillAmount: fullFillAmount,
    recommendedFillAmount: fullFillAmount,
    source: PEN_FILL_EVENT_SOURCE.ASSUMED_FULL,
    effectiveElapsedSeconds,
    wallClockTime
  });
  if (draft?.error) return null;

  appState.penFillEvents.push(draft);
  autosaveState();
  return draft;
}

function refreshPenFillConfirmationDisplays(message = "") {
  updatePenFillForecastDisplay();
  updatePenStateDisplay();
  updatePenFillEarlyReminderDisplay();
  updatePenFillConfirmationControls({ statusOverride: message });
  maybeShowPenFillConfirmationPrompt();
  updatePenRefillAlertDisplay();
}

function getPenFillAmountErrorMessage(error) {
  if (error === "Refill amount is below the minimum recommended refill.") {
    return "Refill amount below minimum recommended.";
  }
  return error || "Unable to record refill.";
}

function recordPenFillEvent(options = {}) {
  const recordType = appState.recordType;
  const rule = getPenRule(recordType);
  const physicalSheepTakenFromPen = getPhysicalSheepTakenFromPen();
  const source = Object.values(PEN_FILL_EVENT_SOURCE).includes(options.source)
    ? options.source
    : PEN_FILL_EVENT_SOURCE.CUSTOM;
  const existingFillEvent = findActivePenFillEventAtCurrentPoint(physicalSheepTakenFromPen);
  const shouldOverrideAssumedFill = Boolean(
    existingFillEvent
    && existingFillEvent.source === PEN_FILL_EVENT_SOURCE.ASSUMED_FULL
    && source !== PEN_FILL_EVENT_SOURCE.ASSUMED_FULL
  );
  const penStateEvents = shouldOverrideAssumedFill
    ? getCurrentRunPenFillEvents().filter((event) => event.id !== existingFillEvent.id)
    : undefined;
  const penState = getCurrentPenStateFromEvents({
    recordType,
    rule,
    physicalSheepTakenFromPen,
    ...(penStateEvents ? { events: penStateEvents } : {})
  });

  const fail = (message, error = message) => {
    updatePenFillConfirmationControls({ statusOverride: message });
    return { success: false, event: null, message, error };
  };

  if (!recordType || recordType === "none") {
    return fail("Select record type");
  }
  if (!appState.runActive) {
    return fail("Start run");
  }
  if (appState.paused) {
    return fail("Run paused");
  }
  if (!rule || !penState) {
    return fail("Select record type", "Missing pen rule.");
  }
  if (!penState.refillAllowedNow) {
    return fail("Refill not due yet");
  }
  if (existingFillEvent && !shouldOverrideAssumedFill) {
    return fail("Refill already confirmed");
  }

  const draft = createPenFillEventDraft({
    recordType,
    rule,
    penState,
    physicalSheepTakenFromPen,
    actualFillAmount: options.actualFillAmount,
    recommendedFillAmount: options.recommendedFillAmount,
    source
  });

  if (draft?.error) {
    const message = getPenFillAmountErrorMessage(draft.error);
    return fail(message, draft.error);
  }

  if (shouldOverrideAssumedFill) {
    const now = Date.now();
    existingFillEvent.undone = true;
    existingFillEvent.undoneAt = now;
    existingFillEvent.overriddenAt = now;
    existingFillEvent.updatedAt = now;
  }
  appState.penFillEvents.push(draft);
  autosaveState();

  const sourceMessages = {
    [PEN_FILL_EVENT_SOURCE.FULL]: "Refill confirmed",
    [PEN_FILL_EVENT_SOURCE.RECOMMENDED]: "Refill confirmed",
    [PEN_FILL_EVENT_SOURCE.MINUS_ONE]: "Refill confirmed",
    [PEN_FILL_EVENT_SOURCE.CUSTOM]: "Different amount recorded"
  };
  const message = `${sourceMessages[draft.source] || "Refill confirmed"} — added ${draft.actualFillAmount}.`;
  refreshPenFillConfirmationDisplays(message);

  return { success: true, event: draft, message, error: null };
}

function getLatestActiveCurrentRunPenFillEvent() {
  return getLatestPenFillEvent(getCurrentRunPenFillEvents().filter(isPenFillAmountEvent));
}

async function undoLastPenFillEvent() {
  const latestEvent = getLatestActiveCurrentRunPenFillEvent();
  if (!latestEvent) {
    updatePenFillConfirmationControls({ statusOverride: "—" });
    return { success: false, event: null, message: "—", error: "No refill to undo." };
  }

  const confirmed = await confirmModal({
    title: "Undo last refill?",
    message: `Undo last refill at sheep ${latestEvent.physicalSheepTakenFromPen} — added ${latestEvent.actualFillAmount}?`,
    confirmText: "Undo refill",
    cancelText: "Cancel"
  });

  if (!confirmed) {
    updatePenFillConfirmationControls();
    return { success: false, event: latestEvent, message: "—", error: "Undo cancelled." };
  }

  const now = Date.now();
  latestEvent.undone = true;
  latestEvent.undoneAt = now;
  latestEvent.updatedAt = now;
  autosaveState();

  const message = "Undid last refill.";
  refreshPenFillConfirmationDisplays(message);
  return { success: true, event: latestEvent, message, error: null };
}


function getAssumedPenFillAmountForEvent(event, rule = getPenRule(event?.recordType || appState.recordType)) {
  const recommendedAmount = Number(event?.recommendedFillAmount);
  if (Number.isInteger(recommendedAmount) && recommendedAmount > 0) return recommendedAmount;
  const fullFillAmount = Number(event?.fullFillAmount);
  if (Number.isInteger(fullFillAmount) && fullFillAmount > 0) return fullFillAmount;
  const defaultFillAmount = Number(rule?.defaultRefillAmount);
  return Number.isInteger(defaultFillAmount) && defaultFillAmount > 0 ? defaultFillAmount : null;
}

function getPenFillAdjustmentValidation(amount, event = getLatestActiveCurrentRunPenFillEvent()) {
  if (!event) return { valid: false, reason: "No active refill event to adjust." };
  const rule = getPenRule(event.recordType || appState.recordType);
  if (!rule) return { valid: false, reason: "Missing pen rule." };
  const sheepLeftBeforeFill = Number(event.sheepLeftBeforeFill);
  const penStateAtOriginalFill = {
    rule,
    currentPenCount: Number.isFinite(sheepLeftBeforeFill) ? sheepLeftBeforeFill : 0,
    sheepLeftInPen: Number.isFinite(sheepLeftBeforeFill) ? sheepLeftBeforeFill : 0
  };
  return validatePenFillAmount(amount, penStateAtOriginalFill, rule);
}

function adjustLatestPenFillEventAmount(correctedAmount) {
  const latestEvent = getLatestActiveCurrentRunPenFillEvent();
  if (!latestEvent) {
    return { success: false, event: null, message: "No active refill event to adjust.", error: "No active refill event to adjust." };
  }

  const validation = getPenFillAdjustmentValidation(correctedAmount, latestEvent);
  if (!validation.valid) {
    return { success: false, event: latestEvent, message: validation.reason, error: validation.reason, validation };
  }

  const now = Date.now();
  latestEvent.undone = true;
  latestEvent.undoneAt = now;
  latestEvent.overriddenAt = now;
  latestEvent.adjustedAt = now;
  latestEvent.updatedAt = now;

  const replacementEvent = {
    ...latestEvent,
    id: createPenFillEventId(),
    actualFillAmount: validation.amount,
    reductionAmount: validation.reductionAmount,
    resultingPenCount: validation.resultingPenCount,
    manuallyAdjusted: true,
    adjustedFromEventId: latestEvent.id || null,
    originalActualFillAmount: Number.isFinite(Number(latestEvent.originalActualFillAmount))
      ? Number(latestEvent.originalActualFillAmount)
      : Number(latestEvent.actualFillAmount),
    undone: false,
    undoneAt: null,
    overriddenAt: null,
    adjustedAt: now,
    createdAt: now,
    updatedAt: now
  };

  appState.penFillEvents.push(replacementEvent);
  autosaveState();
  refreshPenFillConfirmationDisplays(`Adjusted last refill — added ${replacementEvent.actualFillAmount}.`);
  return { success: true, event: replacementEvent, message: "Adjusted last refill.", error: null };
}

function updatePenFillAdjustButton(latestEvent = getLatestActiveCurrentRunPenFillEvent()) {
  if (!elements.penFillAdjustBtn) return;
  const canCorrectPenCount = Boolean(appState.runActive && getPenRule(appState.recordType));
  const hasLatestEvent = Boolean(latestEvent);
  elements.penFillAdjustBtn.disabled = !hasLatestEvent && !canCorrectPenCount;
  elements.penFillAdjustBtn.title = hasLatestEvent
    ? "Adjust the latest recorded refill amount or current pen count"
    : (canCorrectPenCount ? "Correct the current pen count" : "Start a run with a pen refill record type to adjust");
}

function setPenFillAdjustValidation(message = "") {
  setText(elements.penFillAdjustValidation, message);
}

function getPenFillAdjustModalValidation() {
  const latestEvent = getLatestActiveCurrentRunPenFillEvent();
  const latestAmountRaw = elements.penFillAdjustAmountInput?.value ?? "";
  const currentCountRaw = elements.penFillAdjustCurrentCountInput?.value ?? "";
  const currentCountChanged = String(currentCountRaw).trim() !== "";
  let latestAmountValidation = { valid: true, reason: "" };
  let latestAmountChanged = false;

  if (latestEvent) {
    latestAmountValidation = getPenFillAdjustmentValidation(latestAmountRaw, latestEvent);
    if (!latestAmountValidation.valid) return latestAmountValidation;
    const originalLatestAmount = Number(latestEvent.actualFillAmount);
    latestAmountChanged = Number(latestAmountRaw) !== originalLatestAmount;
  } else if (!currentCountChanged) {
    return { valid: false, reason: "Enter a current pen count correction." };
  }
  let currentCountValidation = { valid: true, reason: "" };
  if (currentCountChanged) {
    currentCountValidation = validateCurrentPenCountCorrection(currentCountRaw, getPenRule(appState.recordType));
    if (!currentCountValidation.valid) return currentCountValidation;
  }

  return {
    valid: latestAmountChanged || currentCountChanged,
    reason: latestAmountChanged || currentCountChanged ? "" : "No correction entered.",
    latestAmountChanged,
    currentCountChanged,
    latestAmountValidation,
    currentCountValidation
  };
}

function validatePenFillAdjustModal() {
  const validation = getPenFillAdjustModalValidation();
  setPenFillAdjustValidation(validation.valid ? "" : validation.reason);
  if (elements.penFillAdjustSaveBtn) elements.penFillAdjustSaveBtn.disabled = !validation.valid;
  return validation;
}

function setPenFillAdjustAmount(value) {
  if (!elements.penFillAdjustAmountInput) return;
  elements.penFillAdjustAmountInput.value = value === null || typeof value === "undefined" ? "" : String(value);
  validatePenFillAdjustModal();
}

function openPenFillAdjustModal() {
  const latestEvent = getLatestActiveCurrentRunPenFillEvent();
  if (!elements.penFillAdjustModalOverlay) {
    updatePenFillAdjustButton(latestEvent);
    return;
  }

  if (latestEvent) {
    const sheepNumber = Number.isFinite(Number(latestEvent.sheepNumber))
      ? Number(latestEvent.sheepNumber)
      : Number(latestEvent.physicalSheepTakenFromPen);
    const assumedAmount = getAssumedPenFillAmountForEvent(latestEvent);
    setText(elements.penFillAdjustSheepNumber, Number.isFinite(sheepNumber) ? `Sheep ${sheepNumber}` : "—");
    setText(elements.penFillAdjustCurrentAmount, Number.isFinite(Number(latestEvent.actualFillAmount)) ? String(Number(latestEvent.actualFillAmount)) : "—");
    setText(elements.penFillAdjustAssumedAmount, Number.isFinite(assumedAmount) ? String(assumedAmount) : "—");
    if (elements.penFillAdjustAmountInput) elements.penFillAdjustAmountInput.disabled = false;
    setPenFillAdjustAmount(latestEvent.actualFillAmount);
  } else {
    setText(elements.penFillAdjustSheepNumber, "No refill recorded");
    setText(elements.penFillAdjustCurrentAmount, "—");
    setText(elements.penFillAdjustAssumedAmount, "—");
    if (elements.penFillAdjustAmountInput) {
      elements.penFillAdjustAmountInput.value = "";
      elements.penFillAdjustAmountInput.disabled = true;
    }
  }
  if (elements.penFillAdjustCurrentCountInput) elements.penFillAdjustCurrentCountInput.value = "";
  validatePenFillAdjustModal();

  appState.penFillAdjustModalReturnFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  appState.penFillAdjustModalOpen = true;
  elements.penFillAdjustModalOverlay.hidden = false;
  setLayoutScrollLock(true);
  elements.penFillAdjustAmountInput?.focus();
  elements.penFillAdjustAmountInput?.select();
}

function closePenFillAdjustModal() {
  if (!elements.penFillAdjustModalOverlay) return;
  appState.penFillAdjustModalOpen = false;
  elements.penFillAdjustModalOverlay.hidden = true;
  setLayoutScrollLock(false);
  if (appState.penFillAdjustModalReturnFocusEl instanceof HTMLElement) {
    appState.penFillAdjustModalReturnFocusEl.focus();
  }
  appState.penFillAdjustModalReturnFocusEl = null;
}

function adjustPenFillModalAmountBy(delta) {
  const currentAmount = Number(elements.penFillAdjustAmountInput?.value);
  setPenFillAdjustAmount((Number.isFinite(currentAmount) ? currentAmount : 0) + delta);
}

function resetPenFillAdjustModalAmountToAssumed() {
  const latestEvent = getLatestActiveCurrentRunPenFillEvent();
  const assumedAmount = getAssumedPenFillAmountForEvent(latestEvent);
  if (Number.isFinite(assumedAmount)) setPenFillAdjustAmount(assumedAmount);
}

function savePenFillAdjustModal(event) {
  event?.preventDefault();
  const validation = getPenFillAdjustModalValidation();
  if (!validation.valid) {
    setPenFillAdjustValidation(validation.reason || "Unable to save correction.");
    if (elements.penFillAdjustSaveBtn) elements.penFillAdjustSaveBtn.disabled = true;
    return;
  }

  let latestResult = { success: true };
  if (validation.latestAmountChanged) {
    latestResult = adjustLatestPenFillEventAmount(elements.penFillAdjustAmountInput?.value);
    if (!latestResult.success) {
      setPenFillAdjustValidation(latestResult.error || "Unable to adjust refill.");
      if (elements.penFillAdjustSaveBtn) elements.penFillAdjustSaveBtn.disabled = true;
      return;
    }
  }

  let currentCountResult = { success: true };
  if (validation.currentCountChanged) {
    currentCountResult = recordCurrentPenCountCorrection(elements.penFillAdjustCurrentCountInput?.value);
    if (!currentCountResult.success) {
      setPenFillAdjustValidation(currentCountResult.error || "Unable to correct current pen count.");
      if (elements.penFillAdjustSaveBtn) elements.penFillAdjustSaveBtn.disabled = true;
      return;
    }
  }

  if (!validation.latestAmountChanged && validation.currentCountChanged) {
    refreshPenFillConfirmationDisplays(currentCountResult.message || "Corrected current pen count.");
  } else if (validation.latestAmountChanged && validation.currentCountChanged) {
    refreshPenFillConfirmationDisplays("Adjusted last refill and corrected current pen count.");
  }
  closePenFillAdjustModal();
}

function promptForCustomPenFillAmount(message = "What amount was actually added to the pen?") {
  const fullFillAmount = Number(getPenRule(appState.recordType)?.defaultRefillAmount);
  const promptSuffix = Number.isFinite(fullFillAmount) ? ` (1-${fullFillAmount})` : "";
  const rawAmount = window.prompt(`${message}${promptSuffix}`, "");
  if (rawAmount === null) return null;
  return rawAmount.trim();
}

function getPenFillInstructionModel(options = {}) {
  const recordType = Object.prototype.hasOwnProperty.call(options, "recordType") ? options.recordType : appState.recordType;
  const rule = options.rule || getPenRule(recordType);
  const fullFillAmount = Number(rule?.defaultRefillAmount);
  const physicalSheepTakenFromPen = Object.prototype.hasOwnProperty.call(options, "physicalSheepTakenFromPen")
    ? Number(options.physicalSheepTakenFromPen)
    : Number(getPhysicalSheepTakenFromPen());
  const penState = options.penState || getCurrentPenStateFromEvents({
    recordType,
    rule,
    physicalSheepTakenFromPen
  });
  const planner = options.planner || getPenFillPlannerRecommendation({ rule });
  const plannerRecommendedAmount = Number(planner?.recommendedFillAmount);
  const plannerReductionAmount = Number(planner?.reductionAmount);
  const plannerUsesReducedFill = planner?.status === "recommendReduction"
    && Number.isInteger(plannerRecommendedAmount)
    && plannerRecommendedAmount > 0;
  const plannerUsesFullFill = ["onTarget", "tooLate", "noGoodPlan", "noFutureFill", "notPlanningYet"].includes(planner?.status);
  const canUseFullFill = Number.isInteger(fullFillAmount) && fullFillAmount > 0;
  const recommendedFillAmount = plannerUsesReducedFill ? plannerRecommendedAmount : (plannerUsesFullFill && canUseFullFill ? fullFillAmount : null);
  const reductionAmount = plannerUsesReducedFill
    ? (Number.isFinite(plannerReductionAmount) ? plannerReductionAmount : fullFillAmount - recommendedFillAmount)
    : 0;
  const isFullFill = canUseFullFill && recommendedFillAmount === fullFillAmount;
  const selectedPlan = Array.isArray(planner?.plan) ? planner.plan : [];
  const firstReducedPlanIndex = selectedPlan.findIndex((fill) => Number(fill?.reduction) > 0);
  const hasLaterReducedFills = firstReducedPlanIndex > 0;
  const isLastFullFill = Boolean(isFullFill && hasLaterReducedFills && firstReducedPlanIndex === 1);
  const validation = Number.isInteger(recommendedFillAmount)
    ? validatePenFillAmount(recommendedFillAmount, penState, rule)
    : { valid: false, error: planner?.message || "Waiting for pace data" };
  const canConfirmNow = Boolean(
    recordType
    && recordType !== "none"
    && appState.runActive
    && !appState.paused
    && rule
    && penState
    && penState.refillAllowedNow
    && validation.valid
  );

  let instruction = "—";
  if (!recordType || recordType === "none") {
    instruction = "Select record type";
  } else if (!appState.runActive) {
    instruction = "Start run";
  } else if (appState.paused) {
    instruction = "Run paused";
  } else if (!rule || !penState) {
    instruction = "Select record type";
  } else if (!penState.refillAllowedNow) {
    instruction = "Refill not due yet";
  } else if (!validation.valid) {
    instruction = planner?.status === "waiting" ? "Waiting for pace data" : "—";
  } else if (isLastFullFill) {
    instruction = `Last full refill — add ${recommendedFillAmount}`;
  } else if (isFullFill) {
    instruction = "Keep full refills";
  } else {
    instruction = penState.refillAllowedNow ? `Add ${recommendedFillAmount} now` : `At next refill, add ${recommendedFillAmount}`;
  }

  const projectedFinalFillSecondsBeforeEnd = Number(planner?.projectedFinalFillSecondsBeforeEnd);
  const reasonByStatus = {
    onTarget: "Final refill on target",
    recommendReduction: "Final refill too early",
    tooEarly: "Final refill too early",
    tooLate: "Final refill too late",
    noGoodPlan: "Keep full refills",
    noFutureFill: "No final refill projected before end",
    notPlanningYet: `Monitoring — planning starts at ${formatCountdown(FINAL_FILL_ANALYSIS_START_SECONDS)} remaining`,
    waiting: "Waiting for pace data"
  };
  const reason = reasonByStatus[planner?.status]
    || (Number.isFinite(projectedFinalFillSecondsBeforeEnd) ? "Final refill on target" : (validation.error || "—"));
  const remainingFillPlan = Array.isArray(planner?.remainingFillPlan) ? planner.remainingFillPlan : [];
  const remainingFillsMessage = planner?.remainingFillsMessage || formatRemainingFillsMessage(remainingFillPlan, {
    status: planner?.status,
    hasReductionPlan: selectedPlan.some((fill) => Number(fill?.reduction) > 0)
  });
  const finalThreeMinutePrediction = getFinalThreeMinutePrediction();
  const finalThreeMinuteMessage = Number.isFinite(projectedFinalFillSecondsBeforeEnd)
    && projectedFinalFillSecondsBeforeEnd < FINAL_FILL_MIN_BEFORE_END_SECONDS
      ? "Final refill too late"
      : finalThreeMinutePrediction.message;
  let lastFullFillMessage = "Not yet";
  if (!canUseFullFill || !recordType || recordType === "none" || !appState.runActive) {
    lastFullFillMessage = "—";
  } else if (isLastFullFill) {
    lastFullFillMessage = `This refill — add ${recommendedFillAmount}`;
  } else if (isFullFill && planner?.status === "noFutureFill") {
    lastFullFillMessage = "Already passed";
  } else if (["onTarget", "tooLate", "noGoodPlan"].includes(planner?.status)) {
    lastFullFillMessage = "No full refill change needed";
  }

  return {
    instruction,
    recommendedFillAmount,
    fullFillAmount: canUseFullFill ? fullFillAmount : null,
    reductionAmount,
    isFullFill,
    isLastFullFill,
    lastFullFillMessage,
    remainingFillPlan,
    remainingFillsMessage,
    finalThreeMinutePrediction,
    finalThreeMinuteMessage,
    canConfirmNow,
    reason,
    planner,
    validation
  };
}

function updatePenFillPlannerStrategyDetails(options = {}) {
  const recordType = appState.recordType;
  const rule = getPenRule(recordType);
  const physicalSheepTakenFromPen = getPhysicalSheepTakenFromPen();
  const penState = getCurrentPenStateFromEvents({
    recordType,
    rule,
    physicalSheepTakenFromPen
  });
  const instructionModel = getPenFillInstructionModel({
    recordType,
    rule,
    physicalSheepTakenFromPen,
    penState,
    planner: options.planner
  });

  setText(elements.penFillPlannerReason, instructionModel.reason || "—");
  setText(elements.penFillPlannerLastFullFill, instructionModel.lastFullFillMessage || "—");
  setText(elements.penFillPlannerRemainingFills, instructionModel.remainingFillsMessage || "—");
  setText(elements.penFillPlannerFinalThreeMinutes, instructionModel.finalThreeMinuteMessage || "—");
}

function updatePenFillEarlyReminderDisplay() {
  const recordType = appState.recordType;
  const rule = getPenRule(recordType);
  const setReminder = (text) => setText(elements.penFillEarlyReminder, text);

  if (!recordType || recordType === "none") {
    setReminder("Select record type");
    return;
  }
  if (!appState.runActive) {
    setReminder("Start run");
    return;
  }
  if (appState.paused) {
    setReminder("Run paused");
    return;
  }
  if (!rule) {
    setReminder("Select record type");
    return;
  }

  const physicalSheepTakenFromPen = getPhysicalSheepTakenFromPen();
  const penState = getCurrentPenStateFromEvents({
    recordType,
    rule,
    physicalSheepTakenFromPen
  });
  if (!penState) {
    setReminder("—");
    return;
  }

  const instructionModel = getPenFillInstructionModel({
    recordType,
    rule,
    physicalSheepTakenFromPen,
    penState
  });
  const instructionAmount = Number(instructionModel?.recommendedFillAmount);
  const fallbackAmount = Number(rule.defaultRefillAmount);
  const recommendedFillAmount = Number.isInteger(instructionAmount) && instructionAmount > 0
    ? instructionAmount
    : (Number.isInteger(fallbackAmount) && fallbackAmount > 0 ? fallbackAmount : null);

  if (!Number.isInteger(recommendedFillAmount) || recommendedFillAmount <= 0) {
    setReminder("—");
    return;
  }

  if (penState.refillAllowedNow) {
    setReminder("Refill now");
    return;
  }

  const nextRefillAllowedInSheep = Number(penState.nextRefillAllowedInSheep);
  if (nextRefillAllowedInSheep === 1) {
    setReminder("1 sheep until refill");
    return;
  }
  if (nextRefillAllowedInSheep === 2) {
    setReminder("2 sheep until refill");
    return;
  }

  setReminder("—");
}

function penFillInstructionNeedsConfirmation(instructionModel, rule) {
  const recommendedFillAmount = Number(instructionModel?.recommendedFillAmount);
  const fullFillAmount = Number(rule?.defaultRefillAmount ?? instructionModel?.fullFillAmount);
  return Boolean(
    Number.isInteger(recommendedFillAmount)
    && Number.isInteger(fullFillAmount)
    && recommendedFillAmount > 0
    && fullFillAmount > 0
    && recommendedFillAmount < fullFillAmount
  );
}

function updatePenFillConfirmationControls(options = {}) {
  const recordType = appState.recordType;
  const rule = getPenRule(recordType);
  const physicalSheepTakenFromPen = getPhysicalSheepTakenFromPen();
  const penState = getCurrentPenStateFromEvents({
    recordType,
    rule,
    physicalSheepTakenFromPen
  });
  const instructionModel = getPenFillInstructionModel({
    recordType,
    rule,
    physicalSheepTakenFromPen,
    penState
  });
  const alreadyConfirmed = Boolean(findActivePenFillEventAtCurrentPoint(physicalSheepTakenFromPen));
  const needsConfirmation = penFillInstructionNeedsConfirmation(instructionModel, rule);
  const canShowConfirmation = Boolean(
    needsConfirmation
    && penState?.refillAllowedNow
    && !alreadyConfirmed
    && (instructionModel.canConfirmNow || options.statusOverride)
  );

  if (elements.penFillConfirmSection) {
    elements.penFillConfirmSection.hidden = !canShowConfirmation;
  }

  if (!canShowConfirmation) {
    setText(elements.penFillConfirmInstruction, "—");
    setText(elements.penFillConfirmStatus, "—");
    return;
  }

  const recommendedFillAmount = Number(instructionModel.recommendedFillAmount);
  let statusText = "Was this refill amount added?";
  if (options.statusOverride) {
    statusText = options.statusOverride;
  } else if (!recordType || recordType === "none") {
    statusText = "Select record type";
  } else if (!appState.runActive) {
    statusText = "Start run";
  } else if (appState.paused) {
    statusText = "Run paused";
  } else if (!rule || !penState) {
    statusText = "Select record type";
  } else if (!instructionModel.canConfirmNow) {
    statusText = "Waiting for pace data";
  }

  setText(elements.penFillConfirmInstruction, `Recommended: Add ${recommendedFillAmount}.`);
  setText(elements.penFillConfirmStatus, statusText);
}

function getPenFillPromptKey(physicalSheepTakenFromPen, runIndex = appState.currentRunIndex) {
  return `${runIndex}:${physicalSheepTakenFromPen}`;
}

function canShowPenFillConfirmationPrompt(context) {
  if (!context) return false;
  const { recordType, rule, penState, instructionModel, physicalSheepTakenFromPen, promptKey } = context;
  const recommendedFillAmount = Number(instructionModel?.recommendedFillAmount);
  const fullFillAmount = Number(rule?.defaultRefillAmount);
  return Boolean(
    appState.runActive
    && !appState.paused
    && recordType
    && recordType !== "none"
    && rule
    && penState
    && penState.refillAllowedNow
    && instructionModel?.canConfirmNow
    && Number.isInteger(recommendedFillAmount)
    && recommendedFillAmount > 0
    && Number.isInteger(fullFillAmount)
    && fullFillAmount > 0
    && recommendedFillAmount < fullFillAmount
    && !findActivePenFillEventAtCurrentPoint(physicalSheepTakenFromPen)
    && appState.pendingPenFillPromptKey !== promptKey
    && appState.dismissedPenFillPromptKey !== promptKey
  );
}

function getPenFillPromptContext() {
  const recordType = appState.recordType;
  const rule = getPenRule(recordType);
  const physicalSheepTakenFromPen = getPhysicalSheepTakenFromPen();
  const penState = getCurrentPenStateFromEvents({
    recordType,
    rule,
    physicalSheepTakenFromPen
  });
  const instructionModel = getPenFillInstructionModel({
    recordType,
    rule,
    physicalSheepTakenFromPen,
    penState
  });
  const promptKey = getPenFillPromptKey(physicalSheepTakenFromPen);
  return { recordType, rule, physicalSheepTakenFromPen, penState, instructionModel, promptKey };
}

async function maybeShowPenFillConfirmationPrompt() {
  const context = getPenFillPromptContext();
  if (!canShowPenFillConfirmationPrompt(context)) return;

  const { promptKey, instructionModel } = context;
  const recommendedFillAmount = Number(instructionModel.recommendedFillAmount);
  appState.pendingPenFillPromptKey = promptKey;

  try {
    const answer = await penFillConfirmationModal({ recommendedFillAmount });
    if (appState.pendingPenFillPromptKey !== promptKey) return;

    if (answer === "yes") {
      recordPenFillEvent({
        actualFillAmount: recommendedFillAmount,
        recommendedFillAmount,
        source: PEN_FILL_EVENT_SOURCE.RECOMMENDED
      });
      return;
    }

    if (answer === "different") {
      await promptForDifferentPenFillAmount(recommendedFillAmount, promptKey);
      return;
    }

    appState.dismissedPenFillPromptKey = promptKey;
    updatePenFillConfirmationControls({ statusOverride: "Refill not confirmed." });
  } finally {
    if (appState.pendingPenFillPromptKey === promptKey) {
      appState.pendingPenFillPromptKey = null;
    }
  }
}

async function promptForDifferentPenFillAmount(recommendedFillAmount, promptKey) {
  let promptMessage = "What amount was actually added to the pen?";
  while (appState.pendingPenFillPromptKey === promptKey) {
    const rawAmount = promptForCustomPenFillAmount(promptMessage);
    if (rawAmount === null) {
      appState.dismissedPenFillPromptKey = promptKey;
      updatePenFillConfirmationControls({ statusOverride: "Refill not confirmed." });
      return { success: false, message: "Refill not confirmed." };
    }

    if (!/^\d+$/.test(rawAmount)) {
      const message = "Refill amount must be a whole number.";
      updatePenFillConfirmationControls({ statusOverride: message });
      promptMessage = `${message}\n\nWhat amount was actually added to the pen?`;
      continue;
    }

    const actualFillAmount = Number(rawAmount);
    const result = recordPenFillEvent({
      actualFillAmount,
      recommendedFillAmount,
      source: PEN_FILL_EVENT_SOURCE.CUSTOM
    });

    if (result.success) return result;

    const message = result.message || "Unable to record refill.";
    updatePenFillConfirmationControls({ statusOverride: message });
    promptMessage = `${message}\n\nWhat amount was actually added to the pen?`;
  }
  return { success: false, message: "Refill not confirmed." };
}

function simulatePenFillPlan(options = {}) {
  const rule = options.rule || null;
  const fullFillAmount = Number(rule?.defaultRefillAmount);
  const physicalSheepTakenFromPen = Number(options.physicalSheepTakenFromPen);
  const avgCycleSeconds = Number(options.avgCycleSeconds);
  const effectiveElapsedSeconds = Number(options.effectiveElapsedSeconds);
  const runDurationSeconds = Number(options.runDurationSeconds);
  const reductions = Array.isArray(options.reductions) ? options.reductions : [];
  const maxForecastPoints = Number.isFinite(options.maxForecastPoints)
    ? Math.max(Math.floor(options.maxForecastPoints), 0)
    : 10;

  if (
    !rule
    || !Number.isFinite(fullFillAmount)
    || fullFillAmount <= 0
    || !Number.isFinite(physicalSheepTakenFromPen)
    || physicalSheepTakenFromPen < 0
    || !Number.isFinite(avgCycleSeconds)
    || avgCycleSeconds <= 0
    || !Number.isFinite(effectiveElapsedSeconds)
    || effectiveElapsedSeconds < 0
    || !Number.isFinite(runDurationSeconds)
    || runDurationSeconds <= 0
    || maxForecastPoints <= 0
  ) {
    return [];
  }

  const points = [];
  let simulatedSheepTakenFromPen = physicalSheepTakenFromPen;
  let elapsedAtLastRefill = effectiveElapsedSeconds;

  while (points.length < maxForecastPoints) {
    const reduction = normalizePenFillReduction(reductions[points.length], fullFillAmount);
    const fillAmount = fullFillAmount - reduction;
    const nextIntervalSheep = fillAmount;
    const secondsFromLastRefill = nextIntervalSheep * avgCycleSeconds;
    const pointElapsedSeconds = elapsedAtLastRefill + secondsFromLastRefill;
    if (pointElapsedSeconds > runDurationSeconds) break;

    simulatedSheepTakenFromPen += nextIntervalSheep;
    points.push({
      refillNumber: points.length + 1,
      sheepNumber: simulatedSheepTakenFromPen,
      secondsFromNow: pointElapsedSeconds - effectiveElapsedSeconds,
      effectiveElapsedSeconds: pointElapsedSeconds,
      secondsBeforeRunEnd: Math.max(runDurationSeconds - pointElapsedSeconds, 0),
      fillAmount,
      fullFillAmount,
      reduction,
      resultingPenCount: Number.isFinite(rule.refillTriggerLeft) ? rule.refillTriggerLeft + fillAmount : fillAmount,
      nextIntervalSheep,
      label: `Sheep ${simulatedSheepTakenFromPen}`
    });

    elapsedAtLastRefill = pointElapsedSeconds;
  }

  return points;
}

function buildFinalFillPlanLabel(reductions, fullFillAmount) {
  const changedFillCount = reductions.filter((reduction) => reduction > 0).length;
  const maxSingleReduction = reductions.reduce((max, reduction) => Math.max(max, reduction), 0);
  if (changedFillCount === 0) return "Full refills only";
  if (changedFillCount === 1) {
    return `Add ${fullFillAmount - maxSingleReduction} at next refill. Then full refills.`;
  }
  if (maxSingleReduction === 1) return `Add ${fullFillAmount - 1} for next ${changedFillCount} refills.`;
  return `Reduce next ${changedFillCount} refills by ${maxSingleReduction}.`;
}

function scoreFinalFillPlanCandidate(candidate, options = {}) {
  const finalSecondsBeforeEnd = Number(candidate?.finalFill?.secondsBeforeRunEnd);
  if (!Number.isFinite(finalSecondsBeforeEnd)) return Number.POSITIVE_INFINITY;

  const idealBeforeEndSeconds = Number.isFinite(options.idealBeforeEndSeconds)
    ? options.idealBeforeEndSeconds
    : FINAL_FILL_IDEAL_BEFORE_END_SECONDS;
  const minBeforeEndSeconds = Number.isFinite(options.minBeforeEndSeconds)
    ? options.minBeforeEndSeconds
    : FINAL_FILL_MIN_BEFORE_END_SECONDS;
  const maxBeforeEndSeconds = Number.isFinite(options.maxBeforeEndSeconds)
    ? options.maxBeforeEndSeconds
    : FINAL_FILL_MAX_BEFORE_END_SECONDS;

  const totalReduction = Number.isFinite(candidate.totalReduction) ? candidate.totalReduction : 0;
  const maxSingleReduction = Number.isFinite(candidate.maxSingleReduction) ? candidate.maxSingleReduction : 0;
  const changedFillCount = Number.isFinite(candidate.changedFillCount) ? candidate.changedFillCount : 0;
  const timingPenalty = Math.abs(finalSecondsBeforeEnd - idealBeforeEndSeconds) / 10;
  const isInsideWindow = finalSecondsBeforeEnd >= minBeforeEndSeconds && finalSecondsBeforeEnd <= maxBeforeEndSeconds;
  const windowPenalty = isInsideWindow ? 0 : 50;
  const totalReductionPenalty = totalReduction * 2;
  const singleReductionPenalty = Math.max(0, maxSingleReduction - 1) * 8;
  const spreadPenalty = changedFillCount > 1 && maxSingleReduction <= 1 ? 0 : Math.max(0, maxSingleReduction - changedFillCount) * 2;
  const complexityPenalty = changedFillCount * 1.5;
  const latePenalty = finalSecondsBeforeEnd < minBeforeEndSeconds
    ? (minBeforeEndSeconds - finalSecondsBeforeEnd) * 1.5 + 80
    : 0;
  const earlyPenalty = finalSecondsBeforeEnd > maxBeforeEndSeconds
    ? (finalSecondsBeforeEnd - maxBeforeEndSeconds) * 0.75 + 30
    : 0;

  return timingPenalty
    + windowPenalty
    + totalReductionPenalty
    + singleReductionPenalty
    + spreadPenalty
    + complexityPenalty
    + latePenalty
    + earlyPenalty;
}

function generateFinalFillPlanCandidates(options = {}) {
  const rule = options.rule || null;
  const fullFillAmount = Number(rule?.defaultRefillAmount);
  const maxPlannedFills = Number.isFinite(options.maxPlannedFills) ? Math.max(Math.floor(options.maxPlannedFills), 1) : 4;
  const maxReductionPerFill = Number.isFinite(options.maxReductionPerFill) ? Math.max(Math.floor(options.maxReductionPerFill), 0) : 3;
  const maxCandidates = Number.isFinite(options.maxCandidates) ? Math.max(Math.floor(options.maxCandidates), 1) : 24;
  const minFillAmount = Number.isFinite(options.minFillAmount)
    ? options.minFillAmount
    : getMinimumRecommendedFillAmount(rule);
  const maxForecastPoints = Number.isFinite(options.maxForecastPoints) ? options.maxForecastPoints : 10;

  if (!rule || !Number.isFinite(fullFillAmount) || fullFillAmount <= 0 || !Number.isFinite(minFillAmount)) return [];

  const requestedPlans = [
    [],
    [1],
    [1, 1],
    [1, 1, 1],
    [1, 1, 1, 1],
    [0, 1],
    [0, 1, 1],
    [0, 0, 1],
    [0, 0, 1, 1],
    [0, 0, 0, 1],
    [2],
    [2, 2],
    [2, 2, 2],
    [0, 2],
    [0, 0, 2],
    [3]
  ];
  const candidates = [];

  for (const reductions of requestedPlans) {
    if (candidates.length >= maxCandidates) break;
    const normalizedReductions = reductions.slice(0, maxPlannedFills).map((reduction) => normalizePenFillReduction(reduction, fullFillAmount));
    const changedFillCount = normalizedReductions.filter((reduction) => reduction > 0).length;
    const totalReduction = normalizedReductions.reduce((sum, reduction) => sum + reduction, 0);
    const maxSingleReduction = normalizedReductions.reduce((max, reduction) => Math.max(max, reduction), 0);
    const plan = normalizedReductions.map((reduction, index) => ({
      fillNumber: index + 1,
      fillAmount: fullFillAmount - reduction,
      fullFillAmount,
      reduction
    }));
    const label = buildFinalFillPlanLabel(normalizedReductions, fullFillAmount);
    const candidate = {
      id: normalizedReductions.length ? `reduce-${normalizedReductions.join("-")}` : "full-fills-only",
      label,
      reductions: normalizedReductions,
      plan,
      simulatedRefillPoints: [],
      finalFill: null,
      totalReduction,
      maxSingleReduction,
      changedFillCount,
      score: Number.POSITIVE_INFINITY,
      rejectionReason: null
    };

    const invalidPlanFill = plan.find((fill) => fill.fillAmount > fullFillAmount || fill.fillAmount < minFillAmount);
    if (invalidPlanFill) {
      candidate.rejectionReason = "fillAmountOutsideRecommendedRange";
      candidates.push(candidate);
      continue;
    }

    if (changedFillCount > maxPlannedFills || maxSingleReduction > maxReductionPerFill) {
      candidate.rejectionReason = "planTooComplex";
      candidates.push(candidate);
      continue;
    }

    candidate.simulatedRefillPoints = simulatePenFillPlan({
      ...options,
      rule,
      reductions: normalizedReductions,
      maxForecastPoints
    });
    candidate.finalFill = candidate.simulatedRefillPoints[candidate.simulatedRefillPoints.length - 1] || null;

    const overfilledPoint = candidate.simulatedRefillPoints.find((point) => point.resultingPenCount > rule.maxPen);
    if (overfilledPoint) {
      candidate.rejectionReason = "resultingPenCountAboveMax";
    } else if (!candidate.finalFill) {
      candidate.rejectionReason = "noUsefulFutureFinalFill";
    } else {
      candidate.score = scoreFinalFillPlanCandidate(candidate, options);
    }

    candidates.push(candidate);
  }

  return candidates;
}

function formatFinalFillPlanMessage(candidate, cycleSnapshot, hasActiveSheepOnBoard) {
  const fullPlan = Array.isArray(candidate?.plan) ? candidate.plan : [];
  const reducedPlan = fullPlan.filter((fill) => fill.reduction > 0);
  if (reducedPlan.length === 0) return "Keep full refills — final refill on target.";

  const firstFill = fullPlan[0] || reducedPlan[0];
  const firstReducedFill = reducedPlan[0];
  const allSameReduction = reducedPlan.every((fill) => fill.reduction === firstReducedFill.reduction);
  const fillAllowedNow = Boolean(cycleSnapshot?.refillAllowed);
  const nextRefillPrefix = fillAllowedNow
    ? (hasActiveSheepOnBoard ? "At this refill, add" : "Add")
    : "At next refill, add";

  if (firstFill && firstFill.reduction === 0) {
    const fullFillCountBeforeReduction = fullPlan.findIndex((fill) => fill.reduction > 0);
    if (fullFillCountBeforeReduction === 0) return `At next refill, add ${firstReducedFill.fillAmount}.`;
    const fillText = fullFillCountBeforeReduction === 1 ? "this full refill" : `${fullFillCountBeforeReduction} full refills`;
    return `Keep ${fillText}, then add ${firstReducedFill.fillAmount}.`;
  }

  if (reducedPlan.length === 1) {
    return fillAllowedNow && !hasActiveSheepOnBoard
      ? `Add ${firstReducedFill.fillAmount} now. Then full refills.`
      : `${nextRefillPrefix} ${firstReducedFill.fillAmount}. Then full refills.`;
  }

  if (allSameReduction && firstReducedFill.reduction === 1) {
    if (fillAllowedNow && !hasActiveSheepOnBoard) return `Add ${firstReducedFill.fillAmount} now. Then full refills.`;
    if (fillAllowedNow) return `At this refill, add ${firstReducedFill.fillAmount}. Then full refills.`;
    return `Add ${firstReducedFill.fillAmount} for next ${reducedPlan.length} refills.`;
  }

  if (allSameReduction) return `Reduce next ${reducedPlan.length} refills by ${firstReducedFill.reduction}.`;
  return candidate.label;
}

function buildRemainingFillPlanFromCandidate(candidate) {
  const points = Array.isArray(candidate?.simulatedRefillPoints) ? candidate.simulatedRefillPoints : [];
  if (points.length === 0) return [];

  return points.map((point, index) => ({
    fillNumber: index + 1,
    amount: Number.isFinite(Number(point.fillAmount)) ? Number(point.fillAmount) : null,
    sheepNumber: Number.isFinite(Number(point.sheepNumber)) ? Number(point.sheepNumber) : null,
    isFinalFill: index === points.length - 1,
    secondsBeforeRunEnd: Number.isFinite(Number(point.secondsBeforeRunEnd)) ? Number(point.secondsBeforeRunEnd) : null
  })).filter((fill) => Number.isInteger(fill.amount) && fill.amount > 0);
}

function formatRemainingFillsMessage(remainingFillPlan, options = {}) {
  const plannerStatus = options.status || "waiting";
  const hasReductionPlan = Boolean(options.hasReductionPlan);
  if (["waiting", "notPlanningYet"].includes(plannerStatus)) return "—";
  if (plannerStatus === "noFutureFill") return "No more projected refills";
  if (!Array.isArray(remainingFillPlan) || remainingFillPlan.length === 0) return "No more projected refills";
  if (!hasReductionPlan) return "Full refills";

  const amounts = remainingFillPlan
    .map((fill) => Number(fill.amount))
    .filter((amount) => Number.isInteger(amount) && amount > 0);
  if (amounts.length === 0) return "No more projected refills";

  const visibleAmounts = amounts.slice(0, 5).join(", ");
  return amounts.length > 5 ? `${visibleAmounts}, …` : visibleAmounts;
}

function getFinalThreeMinutePrediction(avgCycleSeconds = appState.currentStats.avgCycle) {
  const cycleSecondsUsed = Number(avgCycleSeconds);
  if (!Number.isFinite(cycleSecondsUsed) || cycleSecondsUsed <= 0) {
    return {
      predictedSheep: null,
      cycleSecondsUsed: null,
      message: "Waiting for pace data"
    };
  }

  const predictedSheep = Math.max(Math.floor(180 / cycleSecondsUsed), 0);
  return {
    predictedSheep,
    cycleSecondsUsed,
    message: `About ${predictedSheep} sheep`
  };
}

function buildFinalFillPlannerResult(overrides = {}) {
  return {
    status: "waiting",
    message: "Waiting for pace data.",
    recommendedFillAmount: null,
    fullFillAmount: null,
    reductionAmount: null,
    projectedFinalFillSecondsBeforeEnd: null,
    projectedFinalFillSheepNumber: null,
    projectedFinalFillEffectiveElapsedSeconds: null,
    currentFullFillFinalSecondsBeforeEnd: null,
    currentFullFillFinalSheepNumber: null,
    plan: [],
    remainingFillPlan: [],
    remainingFillsMessage: "—",
    assumption: "Assuming previous refills were full.",
    reason: "Waiting for physical sheep pace and run timing.",
    confidence: "low",
    candidates: [],
    ...overrides
  };
}

function planFinalFillStrategy(options = {}) {
  const recordType = Object.prototype.hasOwnProperty.call(options, "recordType") ? options.recordType : appState.recordType;
  const rule = options.rule || getPenRule(recordType);
  const fullFillAmount = Number(rule?.defaultRefillAmount);
  const avgCycleSeconds = Object.prototype.hasOwnProperty.call(options, "avgCycleSeconds")
    ? Number(options.avgCycleSeconds)
    : Number(appState.currentStats.avgCycle);
  const physicalSheepTakenFromPen = Object.prototype.hasOwnProperty.call(options, "physicalSheepTakenFromPen")
    ? Number(options.physicalSheepTakenFromPen)
    : Number(getPhysicalSheepTakenFromPen());
  const effectiveElapsedSeconds = Object.prototype.hasOwnProperty.call(options, "effectiveElapsedSeconds")
    ? Number(options.effectiveElapsedSeconds)
    : Number(getEffectiveElapsedSeconds());
  const runDurationSeconds = Object.prototype.hasOwnProperty.call(options, "runDurationSeconds")
    ? Number(options.runDurationSeconds)
    : Number(getCurrentRunDurationSeconds());
  const remainingRunSeconds = Object.prototype.hasOwnProperty.call(options, "remainingRunSeconds")
    ? Number(options.remainingRunSeconds)
    : runDurationSeconds - effectiveElapsedSeconds;
  const cycleSnapshot = Object.prototype.hasOwnProperty.call(options, "cycleSnapshot")
    ? options.cycleSnapshot
    : getPenCycleSnapshot(recordType);
  const hasActiveSheepOnBoard = Boolean(
    appState.runActive
    && appState.currentCycle.motorOn
    && appState.currentCycle.shearStart
  );
  const runActive = Object.prototype.hasOwnProperty.call(options, "runActive") ? Boolean(options.runActive) : Boolean(appState.runActive);
  const includeCandidates = Boolean(options.includeCandidates);

  if (!recordType || recordType === "none" || !rule) {
    return buildFinalFillPlannerResult({
      message: "Select record type.",
      reason: "Pen refill planning needs a record type with pen rules."
    });
  }

  if (!runActive) {
    return buildFinalFillPlannerResult({
      message: "Start run.",
      fullFillAmount,
      reason: "Pen refill planning starts when the run is active."
    });
  }

  if (
    !Number.isFinite(fullFillAmount)
    || fullFillAmount <= 0
    || !Number.isFinite(avgCycleSeconds)
    || avgCycleSeconds <= 0
    || !Number.isFinite(physicalSheepTakenFromPen)
    || physicalSheepTakenFromPen < 0
    || !Number.isFinite(effectiveElapsedSeconds)
    || effectiveElapsedSeconds < 0
    || !Number.isFinite(runDurationSeconds)
    || runDurationSeconds <= 0
    || !Number.isFinite(remainingRunSeconds)
  ) {
    return buildFinalFillPlannerResult();
  }

  if (remainingRunSeconds > FINAL_FILL_ANALYSIS_START_SECONDS) {
    return buildFinalFillPlannerResult({
      status: "notPlanningYet",
      message: `Monitoring — planning starts at ${formatCountdown(FINAL_FILL_ANALYSIS_START_SECONDS)} remaining`,
      fullFillAmount,
      reason: "Outside the final refill planning window."
    });
  }

  const runEndForecastCap = Number.isFinite(options.maxForecastPoints)
    ? Math.max(Math.floor(options.maxForecastPoints), 0)
    : getPenFillRunEndForecastCap({
      rule,
      avgCycleSeconds,
      effectiveElapsedSeconds,
      runDurationSeconds
    });
  const forecastPoints = Array.isArray(options.forecastPoints)
    ? options.forecastPoints
    : simulatePenFillPlan({
      rule,
      physicalSheepTakenFromPen,
      avgCycleSeconds,
      effectiveElapsedSeconds,
      runDurationSeconds,
      reductions: [],
      maxForecastPoints: runEndForecastCap
    });
  const finalRefillAnalysis = analyzeFinalFillWindow(forecastPoints, { remainingRunSeconds });
  const currentFinalFill = finalRefillAnalysis.finalFill || forecastPoints[forecastPoints.length - 1] || null;
  const currentFullFillFinalSecondsBeforeEnd = Number.isFinite(currentFinalFill?.secondsBeforeRunEnd)
    ? currentFinalFill.secondsBeforeRunEnd
    : null;
  const currentFullFillFinalSheepNumber = Number.isFinite(currentFinalFill?.sheepNumber) ? currentFinalFill.sheepNumber : null;
  const currentFullRemainingFillPlan = buildRemainingFillPlanFromCandidate({ simulatedRefillPoints: forecastPoints });

  if (forecastPoints.length === 0 || !currentFinalFill) {
    return buildFinalFillPlannerResult({
      status: "noFutureFill",
      message: "No final refill projected before end",
      fullFillAmount,
      currentFullFillFinalSecondsBeforeEnd,
      currentFullFillFinalSheepNumber,
      remainingFillPlan: [],
      remainingFillsMessage: "No more projected refills",
      reason: "No future final refill exists for the current run timing."
    });
  }

  if (finalRefillAnalysis.status === "onTarget") {
    return buildFinalFillPlannerResult({
      status: "onTarget",
      message: "Keep full refills",
      fullFillAmount,
      projectedFinalFillSecondsBeforeEnd: currentFullFillFinalSecondsBeforeEnd,
      projectedFinalFillSheepNumber: currentFullFillFinalSheepNumber,
      projectedFinalFillEffectiveElapsedSeconds: currentFinalFill.effectiveElapsedSeconds,
      currentFullFillFinalSecondsBeforeEnd,
      currentFullFillFinalSheepNumber,
      remainingFillPlan: currentFullRemainingFillPlan,
      remainingFillsMessage: formatRemainingFillsMessage(currentFullRemainingFillPlan, { status: "onTarget", hasReductionPlan: false }),
      reason: "Full refills already place the final refill in the target window.",
      confidence: "high"
    });
  }

  if (finalRefillAnalysis.status === "tooLate") {
    return buildFinalFillPlannerResult({
      status: "tooLate",
      message: "Keep full refills",
      fullFillAmount,
      projectedFinalFillSecondsBeforeEnd: currentFullFillFinalSecondsBeforeEnd,
      projectedFinalFillSheepNumber: currentFullFillFinalSheepNumber,
      projectedFinalFillEffectiveElapsedSeconds: currentFinalFill.effectiveElapsedSeconds,
      currentFullFillFinalSecondsBeforeEnd,
      currentFullFillFinalSheepNumber,
      remainingFillPlan: currentFullRemainingFillPlan,
      remainingFillsMessage: formatRemainingFillsMessage(currentFullRemainingFillPlan, { status: "tooLate", hasReductionPlan: false }),
      reason: "Reducing refills would move refill timing later, so no reduction is recommended.",
      confidence: "medium"
    });
  }

  if (finalRefillAnalysis.status !== "tooEarly") {
    return buildFinalFillPlannerResult({
      status: "waiting",
      message: "Waiting for pace data.",
      fullFillAmount,
      currentFullFillFinalSecondsBeforeEnd,
      currentFullFillFinalSheepNumber
    });
  }

  if (options.skipCandidatePlanning === true) {
    return buildFinalFillPlannerResult({
      status: "tooEarly",
      message: "Final refill too early",
      fullFillAmount,
      projectedFinalFillSecondsBeforeEnd: currentFullFillFinalSecondsBeforeEnd,
      projectedFinalFillSheepNumber: currentFullFillFinalSheepNumber,
      projectedFinalFillEffectiveElapsedSeconds: currentFinalFill.effectiveElapsedSeconds,
      currentFullFillFinalSecondsBeforeEnd,
      currentFullFillFinalSheepNumber,
      remainingFillPlan: currentFullRemainingFillPlan,
      remainingFillsMessage: formatRemainingFillsMessage(currentFullRemainingFillPlan, { status: "tooEarly", hasReductionPlan: false }),
      reason: "Candidate planning was skipped for this check.",
      confidence: "medium"
    });
  }

  const candidates = generateFinalFillPlanCandidates({
    rule,
    physicalSheepTakenFromPen,
    avgCycleSeconds,
    effectiveElapsedSeconds,
    runDurationSeconds,
    maxForecastPoints: runEndForecastCap
  });
  const viableCandidates = candidates
    .filter((candidate) => !candidate.rejectionReason && candidate.changedFillCount > 0 && Number.isFinite(candidate.score))
    .sort((a, b) => a.score - b.score);
  const bestCandidate = viableCandidates[0] || null;
  const currentScore = scoreFinalFillPlanCandidate({
    finalFill: currentFinalFill,
    totalReduction: 0,
    maxSingleReduction: 0,
    changedFillCount: 0
  });
  const bestSecondsBeforeEnd = Number(bestCandidate?.finalFill?.secondsBeforeRunEnd);
  const improvesTiming = bestCandidate
    && Number.isFinite(bestSecondsBeforeEnd)
    && Math.abs(bestSecondsBeforeEnd - FINAL_FILL_IDEAL_BEFORE_END_SECONDS) + 5 < Math.abs(currentFullFillFinalSecondsBeforeEnd - FINAL_FILL_IDEAL_BEFORE_END_SECONDS)
    && bestCandidate.score + 5 < currentScore
    && bestSecondsBeforeEnd >= FINAL_FILL_MIN_BEFORE_END_SECONDS;

  if (improvesTiming) {
    const firstPlannedFill = bestCandidate.plan[0] || bestCandidate.plan.find((fill) => fill.reduction > 0);
    const bestRemainingFillPlan = buildRemainingFillPlanFromCandidate(bestCandidate);
    return buildFinalFillPlannerResult({
      status: "recommendReduction",
      message: formatFinalFillPlanMessage(bestCandidate, cycleSnapshot, hasActiveSheepOnBoard),
      recommendedFillAmount: firstPlannedFill?.fillAmount || null,
      fullFillAmount,
      reductionAmount: firstPlannedFill?.reduction || null,
      projectedFinalFillSecondsBeforeEnd: bestCandidate.finalFill.secondsBeforeRunEnd,
      projectedFinalFillSheepNumber: bestCandidate.finalFill.sheepNumber,
      projectedFinalFillEffectiveElapsedSeconds: bestCandidate.finalFill.effectiveElapsedSeconds,
      currentFullFillFinalSecondsBeforeEnd,
      currentFullFillFinalSheepNumber,
      plan: bestCandidate.plan,
      remainingFillPlan: bestRemainingFillPlan,
      remainingFillsMessage: formatRemainingFillsMessage(bestRemainingFillPlan, { status: "recommendReduction", hasReductionPlan: true }),
      reason: "Full refills place the final refill too early.",
      confidence: bestCandidate.finalFill.secondsBeforeRunEnd <= FINAL_FILL_MAX_BEFORE_END_SECONDS ? "high" : "medium",
      candidates: includeCandidates ? candidates : []
    });
  }

  return buildFinalFillPlannerResult({
    status: "noGoodPlan",
    message: "Keep full refills",
    fullFillAmount,
    currentFullFillFinalSecondsBeforeEnd,
    currentFullFillFinalSheepNumber,
    remainingFillPlan: currentFullRemainingFillPlan,
    remainingFillsMessage: formatRemainingFillsMessage(currentFullRemainingFillPlan, { status: "noGoodPlan", hasReductionPlan: false }),
    reason: "Full refills place the final refill too early, but generated reductions did not safely improve timing.",
    confidence: "low",
    candidates: includeCandidates ? candidates : []
  });
}


const appState = {
  runActive: false,
  runStartTime: null,
  sheep: [],
  daySheep: [],
  penFillEvents: [],
  qualityRatings: [],
  qualityRatingEditId: "",
  officialRejectedAdjustment: 0,
  currentCycle: {
    motorOn: false,
    shearStart: null,
    catchStart: null
  },
  target: {
    sheep: 0,
    runLengthSeconds: 0
  },
  targetPacePredictionSnapshot: null,
  farm: "",
  recordType: "none",
  lastMotorState: null,
  currentStats: {
    avgShear: 0,
    avgCatch: 0,
    avgCycle: 0,
    sheepPerHour: 0
  },
  connection: { ...DEFAULT_CONNECTION_SETTINGS },
  simulationMode: false,
  simulationRunLengthMode: "real",
  simulationCustomMinutes: 10,
  currentMotorDisplay: "OFF",
  connectionDebug: "",
  lastResponseTimeMs: null,
  pollTimerId: null,
  pollInFlight: false,
  pollLatencySamples: [],
  autoAdjustedPollInterval: false,
  liveTimerId: null,
  statsTimerId: null,
  paused: false,
  pauseStartedAtMs: null,
  retryCatchOnResume: false,
  breakActive: false,
  breakStartedAtMs: null,
  breakSource: null,
  preparedForNextRunBreak: false,
  dayComplete: false,
  breakBannerDismissedForCurrentBreak: false,
  pendingBreakAfterCurrentSheep: false,
  pendingBreakStartedAtMs: null,
  pendingBreakSource: null,
  runEndTimeMs: null,
  officialRunEndTimeMs: null,
  currentRunIndex: 0,
  dayClockStartRealMs: null,
  dayClockStartSecondsFromMidnight: 0,
  dayClockPausedSecondsFromMidnight: null,
  dayStartTimeTouched: false,
  dayClockTimerId: null,
  savedFarms: [],
  panelCollapsed: {},
  draggedPanelId: null,
  confirmModal: {
    open: false,
    overlay: null,
    dialog: null,
    title: null,
    message: null,
    confirmBtn: null,
    cancelBtn: null,
    resolver: null,
    returnFocusEl: null
  },
  penFillAdjustModalOpen: false,
  penFillAdjustModalReturnFocusEl: null,
  penFillPromptModal: {
    open: false,
    overlay: null,
    dialog: null,
    title: null,
    message: null,
    yesBtn: null,
    noBtn: null,
    cancelBtn: null,
    resolver: null,
    returnFocusEl: null
  },
  pendingPenFillPromptKey: null,
  dismissedPenFillPromptKey: null,
  effectiveElapsedBeforePauseMs: 0,
  effectiveResumeRealMs: null,
  discardedResetElapsedMs: 0,
  trendBucketMinutes: 15,
  trendBuckets: {},
  reviewBlocks: [],
  nextReviewBlockIndex: 1,
  runReviewText: "Run review will be generated when you stop a run.",
  trendFlags: ["Set a target to enable trend flags."],
  latestCompletedRunSnapshot: null,
  panelSizes: {},
  autosaveTimerId: null,
  trendGraphRenderPoints: [],
  selectedTrendBucketKey: null,
  trendDetailsExpanded: false,
  autosaveEnabled: true,
  autosaveIntervalSeconds: DEFAULT_AUTOSAVE_INTERVAL_SECONDS,
  controlsDockEnabled: false,
  controlsDockPos: { x: 20, y: 90 },
  pointerPanelDrag: null,
  controlsDockDrag: null,
  absolutePanelDrag: null,
  panelResize: null,
  layoutEditMode: false,
  panelLayout: { mode: "absolute", panels: {}, nextZ: 1 },
  followLatestSheep: true,
  sheepLogScroller: null,
  sheepLogScrollListenerAttached: false,
  userScrolledUp: false,
  snapToGridEnabled: false,
  snapGridSize: 10,
  panelLocks: {},
  scrollLockCount: 0,
  sessionDate: "",
  predictedCatchClockMode: "day",
  sheepLogSort: {
    by: "number",
    order: "asc"
  },
  sheepLogFillDirection: "latestFirst",
  showPlannedDelayMarkers: true,
  markerSettingsOpen: false,
  markerSettings: {
    drink: { plannedTimingMinutes: 7.5, timeWindowSeconds: 25, minExtraSeconds: 2, maxExtraSeconds: 4 },
    cutter: { plannedTimingMinutes: 15, timeWindowSeconds: 25, minExtraSeconds: 4, maxExtraSeconds: 7 },
    comb: { plannedTimingMinutes: 60, timeWindowSeconds: 30, minExtraSeconds: 7, maxExtraSeconds: null }
  },
  keyboardShortcuts: {
    startRun: "S",
    stopRun: "X",
    pauseRun: "P",
    resetRun: "R",
    finishRunBreak: "+",
    motorOn: "0",
    motorOff: "ENTER",
    toggleSimulationMode: "M",
    resetCurrentSheep: "ARROWUP"
  }
};

const elements = {
  runStatus: document.getElementById("runStatus"),
  farmInput: document.getElementById("farmInput"),
  sessionDate: document.getElementById("sessionDate"),
  runType: document.getElementById("runType"),
  recordType: document.getElementById("recordType"),
  dayStartTimeInput: document.getElementById("dayStartTimeInput"),
  customHours: document.getElementById("customHours"),
  targetSheepInput: document.getElementById("targetSheepInput"),
  startRunBtn: document.getElementById("startRunBtn"),
  stopRunBtn: document.getElementById("stopRunBtn"),
  finishRunBreakBtn: document.getElementById("finishRunBreakBtn"),
  pauseRunBtn: document.getElementById("pauseRunBtn"),
  resetRunBtn: document.getElementById("resetRunBtn"),
  totalSheep: document.getElementById("totalSheep"),
  officialSheepCount: document.getElementById("officialSheepCount"),
  rejectedSheepCount: document.getElementById("rejectedSheepCount"),
  officialRejectModalOverlay: document.getElementById("officialRejectModalOverlay"),
  officialRejectModalCloseBtn: document.getElementById("officialRejectModalCloseBtn"),
  officialRejectCloseBtn: document.getElementById("officialRejectCloseBtn"),
  officialRejectForm: document.getElementById("officialRejectForm"),
  officialRejectCountInput: document.getElementById("officialRejectCountInput"),
  officialRejectPhysicalCount: document.getElementById("officialRejectPhysicalCount"),
  officialRejectOfficialCount: document.getElementById("officialRejectOfficialCount"),
  officialRejectCurrentCount: document.getElementById("officialRejectCurrentCount"),
  officialRejectValidation: document.getElementById("officialRejectValidation"),
  officialRejectIncrementBtn: document.getElementById("officialRejectIncrementBtn"),
  officialRejectDecrementBtn: document.getElementById("officialRejectDecrementBtn"),
  qualityRatingSummary: document.getElementById("qualityRatingSummary"),
  qualityRatingModalOverlay: document.getElementById("qualityRatingModalOverlay"),
  qualityRatingModalCloseBtn: document.getElementById("qualityRatingModalCloseBtn"),
  qualityRatingCloseBtn: document.getElementById("qualityRatingCloseBtn"),
  qualityRatingLatestSummary: document.getElementById("qualityRatingLatestSummary"),
  qualityRatingValidation: document.getElementById("qualityRatingValidation"),
  qualityRatingForm: document.getElementById("qualityRatingForm"),
  qualityRatingEditId: document.getElementById("qualityRatingEditId"),
  qualityRatingPeriodInput: document.getElementById("qualityRatingPeriodInput"),
  qualityRatingInput: document.getElementById("qualityRatingInput"),
  qualityRatingOfficialCountInput: document.getElementById("qualityRatingOfficialCountInput"),
  qualityRatingPhysicalCountInput: document.getElementById("qualityRatingPhysicalCountInput"),
  qualityRatingNotesInput: document.getElementById("qualityRatingNotesInput"),
  qualityRatingOfficialWarningInput: document.getElementById("qualityRatingOfficialWarningInput"),
  qualityRatingWarningReasonInput: document.getElementById("qualityRatingWarningReasonInput"),
  qualityRatingWarningNotesInput: document.getElementById("qualityRatingWarningNotesInput"),
  qualityRatingSaveBtn: document.getElementById("qualityRatingSaveBtn"),
  qualityRatingClearBtn: document.getElementById("qualityRatingClearBtn"),
  qualityRatingHistory: document.getElementById("qualityRatingHistory"),
  avgShear: document.getElementById("avgShear"),
  avgCatch: document.getElementById("avgCatch"),
  avgCycle: document.getElementById("avgCycle"),
  markerAvgDrink: document.getElementById("markerAvgDrink"),
  markerAvgCutter: document.getElementById("markerAvgCutter"),
  markerAvgComb: document.getElementById("markerAvgComb"),
  sheepPerHour: document.getElementById("sheepPerHour"),
  fastestSheepToday: document.getElementById("fastestSheepToday"),
  slowestSheepToday: document.getElementById("slowestSheepToday"),
  lastCatchTime: document.getElementById("lastCatchTime"),
  lastCatchTimeLabel: document.getElementById("lastCatchTimeLabel"),
  lastShearTime: document.getElementById("lastShearTime"),
  lastShearTimeLabel: document.getElementById("lastShearTimeLabel"),
  lastSheepTime: document.getElementById("lastSheepTime"),
  lastSheepTimeLabel: document.getElementById("lastSheepTimeLabel"),
  motorState: document.getElementById("motorState"),
  currentShear: document.getElementById("currentShear"),
  currentTotalSheepTime: document.getElementById("currentTotalSheepTime"),
  currentCatch: document.getElementById("currentCatch"),
  runClock: document.getElementById("runClock"),
  runCountdown: document.getElementById("runCountdown"),
  runBadge: document.getElementById("runBadge"),
  breakTimingRows: document.getElementById("breakTimingRows"),
  breakStatus: document.getElementById("breakStatus"),
  breakStartedTime: document.getElementById("breakStartedTime"),
  breakRemaining: document.getElementById("breakRemaining"),
  breakNextRun: document.getElementById("breakNextRun"),
  breakNextRunStarts: document.getElementById("breakNextRunStarts"),
  breakOverlayShowBtn: document.getElementById("breakOverlayShowBtn"),
  breakOverlay: document.getElementById("breakOverlay"),
  breakOverlayStatus: document.getElementById("breakOverlayStatus"),
  breakOverlayLabel: document.getElementById("breakOverlayLabel"),
  breakOverlayRemaining: document.getElementById("breakOverlayRemaining"),
  breakOverlayWarning: document.getElementById("breakOverlayWarning"),
  breakOverlayNextRun: document.getElementById("breakOverlayNextRun"),
  breakOverlayNextRunStarts: document.getElementById("breakOverlayNextRunStarts"),
  breakOverlayStarted: document.getElementById("breakOverlayStarted"),
  breakOverlayDismissBtn: document.getElementById("breakOverlayDismissBtn"),
  currentQuarter: document.getElementById("currentQuarter"),
  quarterClock: document.getElementById("quarterClock"),
  quarterSheepCount: document.getElementById("quarterSheepCount"),
  quarterTargetSheepCount: document.getElementById("quarterTargetSheepCount"),
  quarterTargetCompletionTime: document.getElementById("quarterTargetCompletionTime"),
  timingAlert: document.getElementById("timingAlert"),
  nextDrinkCountdown: document.getElementById("nextDrinkCountdown"),
  penRefillAlert: document.getElementById("penRefillAlert"),
  penFillForecastNext: document.getElementById("penFillForecastNext"),
  penFillForecastFinal: document.getElementById("penFillForecastFinal"),
  penFillForecastAssumption: document.getElementById("penFillForecastAssumption"),
  penFillForecastStatus: document.getElementById("penFillForecastStatus"),
  penFillStrategyRecommendation: document.getElementById("penFillStrategyRecommendation"),
  penFillPlannerReason: document.getElementById("penFillPlannerReason"),
  penFillPlannerLastFullFill: document.getElementById("penFillPlannerLastFullFill"),
  penFillPlannerRemainingFills: document.getElementById("penFillPlannerRemainingFills"),
  penFillPlannerFinalThreeMinutes: document.getElementById("penFillPlannerFinalThreeMinutes"),
  penFillEarlyReminder: document.getElementById("penFillEarlyReminder"),
  penFillAverageInterval: document.getElementById("penFillAverageInterval"),
  penFillRecentIntervals: document.getElementById("penFillRecentIntervals"),
  penStateCurrentCount: document.getElementById("penStateCurrentCount"),
  penStateRefillStatus: document.getElementById("penStateRefillStatus"),
  penStateLastConfirmedFill: document.getElementById("penStateLastConfirmedFill"),
  penFillAdjustBtn: document.getElementById("penFillAdjustBtn"),
  penFillAdjustModalOverlay: document.getElementById("penFillAdjustModalOverlay"),
  penFillAdjustForm: document.getElementById("penFillAdjustForm"),
  penFillAdjustSheepNumber: document.getElementById("penFillAdjustSheepNumber"),
  penFillAdjustCurrentAmount: document.getElementById("penFillAdjustCurrentAmount"),
  penFillAdjustAssumedAmount: document.getElementById("penFillAdjustAssumedAmount"),
  penFillAdjustAmountInput: document.getElementById("penFillAdjustAmountInput"),
  penFillAdjustCurrentCountInput: document.getElementById("penFillAdjustCurrentCountInput"),
  penFillAdjustMinusOneBtn: document.getElementById("penFillAdjustMinusOneBtn"),
  penFillAdjustPlusOneBtn: document.getElementById("penFillAdjustPlusOneBtn"),
  penFillAdjustResetBtn: document.getElementById("penFillAdjustResetBtn"),
  penFillAdjustValidation: document.getElementById("penFillAdjustValidation"),
  penFillAdjustCancelBtn: document.getElementById("penFillAdjustCancelBtn"),
  penFillAdjustSaveBtn: document.getElementById("penFillAdjustSaveBtn"),
  penStateModel: document.getElementById("penStateModel"),
  penFillConfirmSection: document.getElementById("penFillConfirmSection"),
  penFillConfirmInstruction: document.getElementById("penFillConfirmInstruction"),
  penFillConfirmStatus: document.getElementById("penFillConfirmStatus"),
  dayClock: document.getElementById("dayClock"),
  requiredCycle: document.getElementById("requiredCycle"),
  requiredRate: document.getElementById("requiredRate"),
  projectedTotal: document.getElementById("projectedTotal"),
  predictedQuarterTotal: document.getElementById("predictedQuarterTotal"),
  predictedHourTotal: document.getElementById("predictedHourTotal"),
  requiredDayTotalSheep: document.getElementById("requiredDayTotalSheep"),
  requiredRunTotalSheep: document.getElementById("requiredRunTotalSheep"),
  requiredQuarterTotal: document.getElementById("requiredQuarterTotal"),
  estimatedLastCatchTime: document.getElementById("estimatedLastCatchTime"),
  estimatedLastCatchTimeLabel: document.getElementById("estimatedLastCatchTimeLabel"),
  timeSpareToBell: document.getElementById("timeSpareToBell"),
  currentSheepTimeLeft: document.getElementById("currentSheepTimeLeft"),
  maxCatchTime: document.getElementById("maxCatchTime"),
  catchPrediction: document.getElementById("catchPrediction"),
  blockMinutes: document.getElementById("blockMinutes"),
  blockResults: document.getElementById("blockResults"),
  sheepLogBody: document.getElementById("sheepLogBody"),
  mergeSelectedSheepBtn: document.getElementById("mergeSelectedSheepBtn"),
  mergeSelectedSheepStatus: document.getElementById("mergeSelectedSheepStatus"),
  sheepLogSortBy: document.getElementById("sheepLogSortBy"),
  sheepLogSortOrder: document.getElementById("sheepLogSortOrder"),
  sheepLogFillDirection: document.getElementById("sheepLogFillDirection"),
  markerSettingsToggle: document.getElementById("markerSettingsToggle"),
  markerSettingsPanel: document.getElementById("markerSettingsPanel"),
  showPlannedDelayMarkers: document.getElementById("showPlannedDelayMarkers"),
  resetMarkerSettingsBtn: document.getElementById("resetMarkerSettingsBtn"),
  drinkTimingMinutes: document.getElementById("drinkTimingMinutes"),
  drinkWindowSeconds: document.getElementById("drinkWindowSeconds"),
  drinkMinExtraSeconds: document.getElementById("drinkMinExtraSeconds"),
  drinkMaxExtraSeconds: document.getElementById("drinkMaxExtraSeconds"),
  cutterTimingMinutes: document.getElementById("cutterTimingMinutes"),
  cutterWindowSeconds: document.getElementById("cutterWindowSeconds"),
  cutterMinExtraSeconds: document.getElementById("cutterMinExtraSeconds"),
  cutterMaxExtraSeconds: document.getElementById("cutterMaxExtraSeconds"),
  combTimingMinutes: document.getElementById("combTimingMinutes"),
  combWindowSeconds: document.getElementById("combWindowSeconds"),
  combMinExtraSeconds: document.getElementById("combMinExtraSeconds"),
  combMaxExtraSeconds: document.getElementById("combMaxExtraSeconds"),
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
  simulationRunLengthMode: document.getElementById("simulationRunLengthMode"),
  simulationCustomMinutes: document.getElementById("simulationCustomMinutes"),
  simulationCustomMinutesLabel: document.getElementById("simulationCustomMinutesLabel"),
  simulationRunLengthIndicator: document.getElementById("simulationRunLengthIndicator"),
  simMotorOnBtn: document.getElementById("simMotorOnBtn"),
  simMotorOffBtn: document.getElementById("simMotorOffBtn"),
  resetCurrentSheepBtn: document.getElementById("resetCurrentSheepBtn"),
  undoLastSheepBtn: document.getElementById("undoLastSheepBtn"),
  shortcutMessage: document.getElementById("shortcutMessage"),
  shortcutStartRun: document.getElementById("shortcutStartRun"),
  shortcutStopRun: document.getElementById("shortcutStopRun"),
  shortcutPauseRun: document.getElementById("shortcutPauseRun"),
  shortcutResetRun: document.getElementById("shortcutResetRun"),
  shortcutFinishRunBreak: document.getElementById("shortcutFinishRunBreak"),
  shortcutMotorOn: document.getElementById("shortcutMotorOn"),
  shortcutMotorOff: document.getElementById("shortcutMotorOff"),
  shortcutToggleSimulationMode: document.getElementById("shortcutToggleSimulationMode"),
  shortcutResetCurrentSheep: document.getElementById("shortcutResetCurrentSheep"),
  resetShortcutsBtn: document.getElementById("resetShortcutsBtn"),
  shortcutSettingsBtn: document.getElementById("shortcutSettingsBtn"),
  shortcutSettingsModalOverlay: document.getElementById("shortcutSettingsModalOverlay"),
  shortcutSettingsModalCloseBtn: document.getElementById("shortcutSettingsModalCloseBtn"),
  farmDropdown: document.getElementById("farmDropdown"),
  farmDropdownToggle: document.getElementById("farmDropdownToggle"),
  farmDropdownMenu: document.getElementById("farmDropdownMenu"),
  dashboardPanels: document.getElementById("dashboardPanels"),
  loadLastSaveBtn: document.getElementById("loadLastSaveBtn"),
  saveSessionBtn: document.getElementById("saveSessionBtn"),
  loadSessionBtn: document.getElementById("loadSessionBtn"),
  exportSessionBtn: document.getElementById("exportSessionBtn"),
  importSessionBtn: document.getElementById("importSessionBtn"),
  exportPdfBtn: document.getElementById("exportPdfBtn"),
  importSessionFileInput: document.getElementById("importSessionFileInput"),
  currentSheepNumber: document.getElementById("currentSheepNumber"),
  trendBucketSize: document.getElementById("trendBucketSize"),
  trendGraphCanvas: document.getElementById("trendGraphCanvas"),
  trendGraphMessage: document.getElementById("trendGraphMessage"),
  trendLatestSummary: document.getElementById("trendLatestSummary"),
  trendGraphTooltip: document.getElementById("trendGraphTooltip"),
  trendDetailsToggle: document.getElementById("trendDetailsToggle"),
  reviewList: document.getElementById("reviewList"),
  runReviewText: document.getElementById("runReviewText"),
  reviewRunBtn: document.getElementById("reviewRunBtn"),
  reviewRunModalTitle: document.getElementById("reviewRunModalTitle"),
  reviewRunModalOverlay: document.getElementById("reviewRunModalOverlay"),
  reviewRunModalCloseBtn: document.getElementById("reviewRunModalCloseBtn"),
  reviewRunModalContent: document.getElementById("reviewRunModalContent"),
  trendFlags: document.getElementById("trendFlags"),
  autosaveSettingsBtn: document.getElementById("autosaveSettingsBtn"),
  autosaveSettingsModalOverlay: document.getElementById("autosaveSettingsModalOverlay"),
  autosaveSettingsModalCloseBtn: document.getElementById("autosaveSettingsModalCloseBtn"),
  autosaveEnabledInput: document.getElementById("autosaveEnabledInput"),
  autosaveIntervalSelect: document.getElementById("autosaveIntervalSelect"),
  followLatestToggle: document.getElementById("followLatestToggle"),
  autosaveStatus: document.getElementById("autosaveStatus"),
  controlsDockToggle: document.getElementById("controlsDockToggle"),
  controlsDockReset: document.getElementById("controlsDockReset"),
  panelSim: document.getElementById("panel-sim"),
  layoutEditModeToggle: document.getElementById("layoutEditModeToggle"),
  snapToGridToggle: document.getElementById("snapToGridToggle"),
  gridSizeSelect: document.getElementById("gridSizeSelect"),
  swInstalledStatus: document.getElementById("swInstalledStatus"),
  offlineCachedStatus: document.getElementById("offlineCachedStatus"),
  networkStatus: document.getElementById("networkStatus"),
  dashboardTab: document.getElementById("dashboardTab"),
  settingsTab: document.getElementById("settingsTab"),
  settingsPanel: document.getElementById("settingsPanel"),
  targetPaceSettingsToggle: document.getElementById("targetPaceSettingsToggle"),
  targetPaceSettings: document.getElementById("targetPaceSettings"),
  targetPaceSections: document.getElementById("targetPaceSections"),
  predictedCatchClockMode: document.getElementById("predictedCatchClockMode"),
  timeSpareToBellLabel: document.getElementById("timeSpareToBellLabel"),
  currentSheepTimeLeftLabel: document.getElementById("currentSheepTimeLeftLabel"),
  dashboardConnectionHelpBtn: document.getElementById("dashboardConnectionHelpBtn"),
  settingsConnectionHelpBtn: document.getElementById("settingsConnectionHelpBtn"),
  connectionHelpModalOverlay: document.getElementById("connectionHelpModalOverlay"),
  connectionHelpModalCloseBtn: document.getElementById("connectionHelpModalCloseBtn"),
  connectionHelpModalContent: document.getElementById("connectionHelpModalContent"),
  dayConfigHelpBtn: document.getElementById("dayConfigHelpBtn"),
  dayConfigHelpModalOverlay: document.getElementById("dayConfigHelpModalOverlay"),
  dayConfigHelpModalCloseBtn: document.getElementById("dayConfigHelpModalCloseBtn"),
  sheepLogHelpBtn: document.getElementById("sheepLogHelpBtn"),
  sheepLogSettingsToggle: document.getElementById("sheepLogSettingsToggle"),
  sheepLogSettingsModalOverlay: document.getElementById("sheepLogSettingsModalOverlay"),
  sheepLogSettingsModalCloseBtn: document.getElementById("sheepLogSettingsModalCloseBtn"),
  sheepLogHelpModalOverlay: document.getElementById("sheepLogHelpModalOverlay"),
  sheepLogHelpModalCloseBtn: document.getElementById("sheepLogHelpModalCloseBtn"),
  targetPaceHelpBtn: document.getElementById("targetPaceHelpBtn"),
  targetPaceHelpModalOverlay: document.getElementById("targetPaceHelpModalOverlay"),
  targetPaceHelpModalCloseBtn: document.getElementById("targetPaceHelpModalCloseBtn"),
  timingPanelHelpBtn: document.getElementById("timingPanelHelpBtn"),
  timingPanelHelpModalOverlay: document.getElementById("timingPanelHelpModalOverlay"),
  timingPanelHelpModalCloseBtn: document.getElementById("timingPanelHelpModalCloseBtn"),
  penFillPlannerHelpBtn: document.getElementById("penFillPlannerHelpBtn"),
  penFillPlannerHelpModalOverlay: document.getElementById("penFillPlannerHelpModalOverlay"),
  penFillPlannerHelpModalCloseBtn: document.getElementById("penFillPlannerHelpModalCloseBtn"),
  performancePanelHelpBtn: document.getElementById("performancePanelHelpBtn"),
  performancePanelHelpModalOverlay: document.getElementById("performancePanelHelpModalOverlay"),
  performancePanelHelpModalCloseBtn: document.getElementById("performancePanelHelpModalCloseBtn"),
  simulationControlsHelpBtn: document.getElementById("simulationControlsHelpBtn"),
  simulationControlsHelpModalOverlay: document.getElementById("simulationControlsHelpModalOverlay"),
  simulationControlsHelpModalCloseBtn: document.getElementById("simulationControlsHelpModalCloseBtn")
};

const DEFAULT_KEYBOARD_SHORTCUTS = Object.freeze({
  startRun: "S",
  stopRun: "X",
  pauseRun: "P",
  resetRun: "R",
  finishRunBreak: "+",
  motorOn: "0",
  motorOff: "ENTER",
  toggleSimulationMode: "M",
  resetCurrentSheep: "ARROWUP"
});

const LEGACY_DEFAULT_KEYBOARD_SHORTCUTS = Object.freeze({
  startRun: "S",
  stopRun: "X",
  pauseRun: "P",
  resetRun: "R",
  finishRunBreak: "",
  motorOn: "O",
  motorOff: "F",
  toggleSimulationMode: "",
  resetCurrentSheep: ""
});

const SHORTCUT_ACTIONS = [
  { key: "startRun", label: "Start Run", elementKey: "shortcutStartRun", buttonKey: "startRunBtn", titleSuffix: "" },
  { key: "stopRun", label: "Stop Run", elementKey: "shortcutStopRun", buttonKey: "stopRunBtn", titleSuffix: "" },
  { key: "pauseRun", label: "Pause / Resume", elementKey: "shortcutPauseRun", buttonKey: "pauseRunBtn", titleSuffix: "" },
  { key: "resetRun", label: "Reset Run", elementKey: "shortcutResetRun", buttonKey: "resetRunBtn", titleSuffix: "" },
  { key: "finishRunBreak", label: "Finish Run / Break", elementKey: "shortcutFinishRunBreak", buttonKey: "finishRunBreakBtn", titleSuffix: "" },
  { key: "motorOn", label: "Motor ON", elementKey: "shortcutMotorOn", buttonKey: "simMotorOnBtn", titleSuffix: " — Simulation Mode only", canRun: canRunSimulationMotorOnShortcut },
  { key: "motorOff", label: "Motor OFF", elementKey: "shortcutMotorOff", buttonKey: "simMotorOffBtn", titleSuffix: " — Simulation Mode only", canRun: canRunSimulationMotorOffShortcut },
  { key: "toggleSimulationMode", label: "Toggle Simulation Mode", elementKey: "shortcutToggleSimulationMode", handler: toggleSimulationModeShortcut, titleSuffix: "" },
  { key: "resetCurrentSheep", label: "Reset Current Sheep", elementKey: "shortcutResetCurrentSheep", buttonKey: "resetCurrentSheepBtn", titleSuffix: " — Simulation Mode active run only", canRun: canResetCurrentSheepTiming }
];

const SPECIAL_SHORTCUT_KEYS = Object.freeze({
  " ": "SPACE",
  Spacebar: "SPACE",
  Enter: "ENTER",
  Escape: "ESCAPE",
  Esc: "ESCAPE",
  ArrowUp: "ARROWUP",
  ArrowDown: "ARROWDOWN",
  ArrowLeft: "ARROWLEFT",
  ArrowRight: "ARROWRIGHT"
});

const SHORTCUT_KEY_DISPLAY = Object.freeze({
  SPACE: "Space",
  ENTER: "Enter",
  ESCAPE: "Esc",
  ARROWUP: "↑",
  ARROWDOWN: "↓",
  ARROWLEFT: "←",
  ARROWRIGHT: "→"
});

function sanitizeShortcutKey(value) {
  if (typeof value !== "string") return "";
  if (Object.prototype.hasOwnProperty.call(SPECIAL_SHORTCUT_KEYS, value)) return SPECIAL_SHORTCUT_KEYS[value];
  const trimmed = value.trim().toUpperCase();
  if (Object.prototype.hasOwnProperty.call(SHORTCUT_KEY_DISPLAY, trimmed)) return trimmed;
  return trimmed.length === 1 ? trimmed : "";
}

function formatShortcutLabel(value) {
  return SHORTCUT_KEY_DISPLAY[value] || value;
}

function getFallbackShortcuts() {
  return { ...DEFAULT_KEYBOARD_SHORTCUTS };
}

function findShortcutConflict(value, actionKey, shortcuts) {
  return SHORTCUT_ACTIONS.find((action) => action.key !== actionKey && shortcuts[action.key] === value);
}

function shouldApplyDefaultShortcut(actionKey, hasStoredValue, storedValue) {
  if (!hasStoredValue) return true;
  const sanitized = sanitizeShortcutKey(storedValue);
  if (actionKey === "finishRunBreak") return sanitized === "";
  if (actionKey === "motorOn") return sanitized === "" || sanitized === LEGACY_DEFAULT_KEYBOARD_SHORTCUTS.motorOn;
  if (actionKey === "motorOff") return sanitized === "" || sanitized === LEGACY_DEFAULT_KEYBOARD_SHORTCUTS.motorOff;
  if (actionKey === "toggleSimulationMode" || actionKey === "resetCurrentSheep") return sanitized === "";
  return false;
}

function normalizeShortcuts(payload) {
  const source = payload && typeof payload === "object" ? payload : {};
  const next = {};
  const desired = {};
  const preservedExisting = {};

  for (const action of SHORTCUT_ACTIONS) {
    const hasStoredValue = Object.prototype.hasOwnProperty.call(source, action.key);
    if (!shouldApplyDefaultShortcut(action.key, hasStoredValue, source[action.key])) {
      preservedExisting[action.key] = sanitizeShortcutKey(source[action.key]);
    }
  }

  for (const action of SHORTCUT_ACTIONS) {
    const hasStoredValue = Object.prototype.hasOwnProperty.call(source, action.key);
    const storedValue = hasStoredValue ? sanitizeShortcutKey(source[action.key]) : "";
    const defaultValue = sanitizeShortcutKey(DEFAULT_KEYBOARD_SHORTCUTS[action.key]);

    if (shouldApplyDefaultShortcut(action.key, hasStoredValue, source[action.key])) {
      const conflict = findShortcutConflict(defaultValue, action.key, desired)
        || findShortcutConflict(defaultValue, action.key, preservedExisting);
      if (defaultValue && !conflict) {
        desired[action.key] = defaultValue;
      } else {
        desired[action.key] = "";
        if (defaultValue && conflict) {
          console.warn(`${action.label} shortcut default ${formatShortcutLabel(defaultValue)} was not applied because it conflicts with ${conflict.label}.`);
        }
      }
      continue;
    }

    desired[action.key] = storedValue;
  }

  for (const action of SHORTCUT_ACTIONS) {
    const candidate = desired[action.key];
    if (!candidate) {
      next[action.key] = "";
      continue;
    }

    const conflict = findShortcutConflict(candidate, action.key, next);
    if (conflict) {
      next[action.key] = "";
      console.warn(`${action.label} shortcut was left unset because ${formatShortcutLabel(candidate)} conflicts with ${conflict.label}.`);
      continue;
    }

    next[action.key] = candidate;
  }
  return next;
}

function matchesLegacyDefaultShortcuts(payload) {
  if (!payload || typeof payload !== "object") return false;
  return SHORTCUT_ACTIONS.every((action) => {
    const fallback = LEGACY_DEFAULT_KEYBOARD_SHORTCUTS[action.key] || "";
    const candidate = Object.prototype.hasOwnProperty.call(payload, action.key) ? payload[action.key] : fallback;
    return sanitizeShortcutKey(candidate) === sanitizeShortcutKey(fallback);
  });
}

function saveKeyboardShortcuts() {
  localStorage.setItem(KEYBOARD_SHORTCUTS_STORAGE_KEY, JSON.stringify(appState.keyboardShortcuts));
  localStorage.setItem(KEYBOARD_SHORTCUTS_VERSION_STORAGE_KEY, CURRENT_KEYBOARD_SHORTCUTS_VERSION);
}

function loadKeyboardShortcuts() {
  try {
    const stored = localStorage.getItem(KEYBOARD_SHORTCUTS_STORAGE_KEY);
    if (!stored) {
      appState.keyboardShortcuts = getFallbackShortcuts();
      saveKeyboardShortcuts();
      return;
    }

    const parsed = JSON.parse(stored);
    const storedVersion = localStorage.getItem(KEYBOARD_SHORTCUTS_VERSION_STORAGE_KEY);
    appState.keyboardShortcuts = normalizeShortcuts(parsed);
    if (storedVersion !== CURRENT_KEYBOARD_SHORTCUTS_VERSION) {
      console.info("Keyboard shortcuts were migrated to the current shortcut schema.");
    }
    saveKeyboardShortcuts();
  } catch (error) {
    console.warn("Keyboard shortcut settings could not be loaded; current defaults were restored.", error);
    appState.keyboardShortcuts = getFallbackShortcuts();
    saveKeyboardShortcuts();
  }
}

function setShortcutMessage(message) {
  if (!elements.shortcutMessage) return;
  if (!message) {
    elements.shortcutMessage.hidden = true;
    elements.shortcutMessage.textContent = "";
    return;
  }
  elements.shortcutMessage.hidden = false;
  elements.shortcutMessage.textContent = message;
}

function renderShortcutSettings() {
  SHORTCUT_ACTIONS.forEach((action) => {
    const shortcutLabel = formatShortcutLabel(appState.keyboardShortcuts[action.key]) || "Not set";
    const input = elements[action.elementKey];
    if (input) input.value = shortcutLabel;
    const button = elements[action.buttonKey];
    if (button) button.title = `Shortcut: ${shortcutLabel}${action.titleSuffix}`;
  });
}

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function applyShortcutAssignment(actionKey, proposedValue) {
  const value = sanitizeShortcutKey(proposedValue);
  if (!value) {
    setShortcutMessage("Press one key (letter/number/symbol/special key).");
    renderShortcutSettings();
    return;
  }
  const conflict = SHORTCUT_ACTIONS.find((action) => action.key !== actionKey && appState.keyboardShortcuts[action.key] === value);
  if (conflict) {
    setShortcutMessage(`That key is already used by ${conflict.label}.`);
    renderShortcutSettings();
    return;
  }
  appState.keyboardShortcuts[actionKey] = value;
  saveKeyboardShortcuts();
  setShortcutMessage("");
  renderShortcutSettings();
}

function canRunShortcutAction(action) {
  if (typeof action.canRun === "function" && !action.canRun()) return false;
  if (action.buttonKey) {
    const button = elements[action.buttonKey];
    return Boolean(button && !button.disabled);
  }
  return typeof action.handler === "function";
}

function runShortcutAction(action) {
  if (typeof action.handler === "function") {
    action.handler();
    return;
  }
  const button = elements[action.buttonKey];
  if (button && !button.disabled) button.click();
}

function handleShortcutKeydown(event) {
  if (event.repeat || isTypingTarget(event.target)) return;
  const key = sanitizeShortcutKey(event.key);
  if (!key) return;
  for (const action of SHORTCUT_ACTIONS) {
    if (appState.keyboardShortcuts[action.key] !== key) continue;
    if (!canRunShortcutAction(action)) return;
    event.preventDefault();
    event.stopPropagation();
    runShortcutAction(action);
    return;
  }
}

function openShortcutSettingsModal() {
  if (!elements.shortcutSettingsModalOverlay) return;
  renderShortcutSettings();
  elements.shortcutSettingsModalOverlay.hidden = false;
  document.body.classList.add("layout-scroll-lock");
}

function closeShortcutSettingsModal() {
  if (!elements.shortcutSettingsModalOverlay) return;
  elements.shortcutSettingsModalOverlay.hidden = true;
  if (
    elements.connectionHelpModalOverlay?.hidden !== false
    && elements.dayConfigHelpModalOverlay?.hidden !== false
    && elements.sheepLogHelpModalOverlay?.hidden !== false
    && elements.timingPanelHelpModalOverlay?.hidden !== false
    && elements.penFillPlannerHelpModalOverlay?.hidden !== false
    && elements.performancePanelHelpModalOverlay?.hidden !== false
    && elements.simulationControlsHelpModalOverlay?.hidden !== false
  ) {
    document.body.classList.remove("layout-scroll-lock");
  }
}

function initTargetPaceSections() {
  const container = elements.targetPaceSections;
  if (!container) return;
  const sectionElements = Array.from(container.querySelectorAll(".target-panel-section"));
  if (!sectionElements.length) return;

  let storedOrder = [];
  let storedCollapsed = {};
  try {
    storedOrder = JSON.parse(localStorage.getItem(TARGET_PACE_SECTIONS_ORDER_STORAGE_KEY) || "[]");
    storedCollapsed = JSON.parse(localStorage.getItem(TARGET_PACE_SECTIONS_COLLAPSED_STORAGE_KEY) || "{}");
  } catch (error) {
    storedOrder = [];
    storedCollapsed = {};
  }

  const sectionMap = new Map(sectionElements.map((section) => [section.dataset.sectionId, section]));
  storedOrder.forEach((sectionId) => {
    const section = sectionMap.get(sectionId);
    if (section) container.appendChild(section);
  });

  const persistState = () => {
    const currentSections = Array.from(container.querySelectorAll(".target-panel-section"));
    const order = currentSections.map((section) => section.dataset.sectionId).filter(Boolean);
    const collapsed = {};
    currentSections.forEach((section) => {
      const sectionId = section.dataset.sectionId;
      if (!sectionId) return;
      collapsed[sectionId] = section.classList.contains("is-collapsed");
    });
    localStorage.setItem(TARGET_PACE_SECTIONS_ORDER_STORAGE_KEY, JSON.stringify(order));
    localStorage.setItem(TARGET_PACE_SECTIONS_COLLAPSED_STORAGE_KEY, JSON.stringify(collapsed));
  };

  const updateMoveButtons = () => {
    const currentSections = Array.from(container.querySelectorAll(".target-panel-section"));
    currentSections.forEach((section, index) => {
      const upBtn = section.querySelector(".target-section-move-up");
      const downBtn = section.querySelector(".target-section-move-down");
      if (upBtn) upBtn.disabled = index === 0;
      if (downBtn) downBtn.disabled = index === currentSections.length - 1;
    });
  };

  sectionElements.forEach((section) => {
    const sectionId = section.dataset.sectionId;
    const toggleBtn = section.querySelector(".target-section-toggle");
    const upBtn = section.querySelector(".target-section-move-up");
    const downBtn = section.querySelector(".target-section-move-down");
    if (sectionId && storedCollapsed[sectionId]) {
      section.classList.add("is-collapsed");
    }
    const updateToggleState = () => {
      if (!toggleBtn) return;
      const isCollapsed = section.classList.contains("is-collapsed");
      toggleBtn.textContent = isCollapsed ? "+" : "−";
      toggleBtn.setAttribute("aria-expanded", String(!isCollapsed));
    };
    updateToggleState();

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        section.classList.toggle("is-collapsed");
        updateToggleState();
        persistState();
      });
    }
    if (upBtn) {
      upBtn.addEventListener("click", () => {
        const previous = section.previousElementSibling;
        if (!previous) return;
        container.insertBefore(section, previous);
        updateMoveButtons();
        persistState();
      });
    }
    if (downBtn) {
      downBtn.addEventListener("click", () => {
        const next = section.nextElementSibling;
        if (!next) return;
        container.insertBefore(next, section);
        updateMoveButtons();
        persistState();
      });
    }
  });
  updateMoveButtons();
  persistState();
}

function initializeSimulationSections() {
  const container = document.querySelector("#panel-sim .sim-controls-body");
  if (!container) return;
  const sections = Array.from(container.querySelectorAll(".sim-controls-section"));
  if (!sections.length) return;
  const sectionMap = new Map(
    sections
      .map((section) => [section.dataset.sectionId, section])
      .filter(([sectionId]) => Boolean(sectionId))
  );

  let storedOrder = [];
  let storedCollapsed = {};
  try {
    const rawOrder = JSON.parse(localStorage.getItem(SIM_SECTIONS_ORDER_STORAGE_KEY) || "[]");
    storedOrder = Array.isArray(rawOrder) ? rawOrder : [];
    const raw = JSON.parse(localStorage.getItem(SIM_SECTIONS_COLLAPSED_STORAGE_KEY) || "{}");
    storedCollapsed = raw && typeof raw === "object" ? raw : {};
  } catch (error) {
    storedOrder = [];
    storedCollapsed = {};
  }

  const validStoredOrder = storedOrder.filter((sectionId) => sectionMap.has(sectionId));
  const appliedOrder = [];
  validStoredOrder.forEach((sectionId) => {
    if (appliedOrder.includes(sectionId)) return;
    appliedOrder.push(sectionId);
  });
  if (sectionMap.has("manualSave") && !appliedOrder.includes("manualSave") && appliedOrder.includes("autosave")) {
    appliedOrder.splice(appliedOrder.indexOf("autosave") + 1, 0, "manualSave");
  }
  if (sectionMap.has("sessionTransfer") && !appliedOrder.includes("sessionTransfer") && appliedOrder.includes("manualSave")) {
    appliedOrder.splice(appliedOrder.indexOf("manualSave") + 1, 0, "sessionTransfer");
  }
  DEFAULT_SIM_SECTION_ORDER.forEach((sectionId) => {
    if (sectionMap.has(sectionId) && !appliedOrder.includes(sectionId)) appliedOrder.push(sectionId);
  });

  appliedOrder.forEach((sectionId) => {
    const section = sectionMap.get(sectionId);
    if (section) container.appendChild(section);
  });

  const persistState = () => {
    const currentSections = Array.from(container.querySelectorAll(".sim-controls-section"));
    const order = currentSections
      .map((section) => section.dataset.sectionId)
      .filter((sectionId) => Boolean(sectionId));
    const collapsed = {};
    currentSections.forEach((section) => {
      const sectionId = section.dataset.sectionId;
      if (!sectionId) return;
      collapsed[sectionId] = section.classList.contains("is-collapsed");
    });
    localStorage.setItem(SIM_SECTIONS_ORDER_STORAGE_KEY, JSON.stringify(order));
    localStorage.setItem(SIM_SECTIONS_COLLAPSED_STORAGE_KEY, JSON.stringify(collapsed));
  };

  const updateSimulationSectionMoveButtons = () => {
    const currentSections = Array.from(container.querySelectorAll(".sim-controls-section"));
    currentSections.forEach((section, index) => {
      const upBtn = section.querySelector(".sim-controls-section-move-up");
      const downBtn = section.querySelector(".sim-controls-section-move-down");
      if (upBtn) upBtn.disabled = index === 0;
      if (downBtn) downBtn.disabled = index === currentSections.length - 1;
    });
  };

  sections.forEach((section) => {
    const sectionId = section.dataset.sectionId;
    const toggleBtn = section.querySelector(".sim-controls-section-toggle");
    const upBtn = section.querySelector(".sim-controls-section-move-up");
    const downBtn = section.querySelector(".sim-controls-section-move-down");
    if (!sectionId || !toggleBtn) return;
    if (storedCollapsed[sectionId]) {
      section.classList.add("is-collapsed");
    } else {
      section.classList.remove("is-collapsed");
    }
    const updateToggleState = () => {
      const isCollapsed = section.classList.contains("is-collapsed");
      toggleBtn.textContent = isCollapsed ? "+" : "−";
      toggleBtn.setAttribute("aria-expanded", String(!isCollapsed));
    };
    updateToggleState();
    toggleBtn.addEventListener("click", () => {
      section.classList.toggle("is-collapsed");
      updateToggleState();
      persistState();
    });
    if (upBtn) {
      upBtn.addEventListener("click", () => {
        const previous = section.previousElementSibling;
        if (!previous) return;
        container.insertBefore(section, previous);
        updateSimulationSectionMoveButtons();
        persistState();
      });
    }
    if (downBtn) {
      downBtn.addEventListener("click", () => {
        const next = section.nextElementSibling;
        if (!next) return;
        container.insertBefore(next, section);
        updateSimulationSectionMoveButtons();
        persistState();
      });
    }
  });

  updateSimulationSectionMoveButtons();
  persistState();
}

function initializePerformanceSections() {
  const container = document.querySelector("#panel-performance .perf-sections");
  if (!container) return;
  const sections = Array.from(container.querySelectorAll(".perf-section"));
  if (!sections.length) return;

  let storedCollapsed = {};
  try {
    const raw = JSON.parse(localStorage.getItem(PERFORMANCE_SECTIONS_COLLAPSED_STORAGE_KEY) || "{}");
    storedCollapsed = raw && typeof raw === "object" ? raw : {};
  } catch (error) {
    storedCollapsed = {};
  }

  let storedOrder = [];
  try {
    const raw = JSON.parse(localStorage.getItem(PERFORMANCE_SECTIONS_ORDER_STORAGE_KEY) || "[]");
    storedOrder = Array.isArray(raw) ? raw : [];
  } catch (error) {
    storedOrder = [];
  }

  const sectionMap = new Map(
    sections
      .map((section) => [section.dataset.sectionId, section])
      .filter(([sectionId]) => Boolean(sectionId))
  );

  const validStoredOrder = storedOrder.filter((sectionId) => sectionMap.has(sectionId));
  const appliedOrder = [];

  validStoredOrder.forEach((sectionId) => {
    if (!appliedOrder.includes(sectionId)) appliedOrder.push(sectionId);
  });

  DEFAULT_PERFORMANCE_SECTION_ORDER.forEach((sectionId) => {
    if (sectionMap.has(sectionId) && !appliedOrder.includes(sectionId)) appliedOrder.push(sectionId);
  });

  sectionMap.forEach((_, sectionId) => {
    if (!appliedOrder.includes(sectionId)) appliedOrder.push(sectionId);
  });

  appliedOrder.forEach((sectionId) => {
    const section = sectionMap.get(sectionId);
    if (section) container.appendChild(section);
  });

  const persistState = () => {
    const currentSections = Array.from(container.querySelectorAll(".perf-section"));
    const order = currentSections
      .map((section) => section.dataset.sectionId)
      .filter((sectionId) => Boolean(sectionId));
    const collapsed = {};
    currentSections.forEach((section) => {
      const sectionId = section.dataset.sectionId;
      if (!sectionId) return;
      collapsed[sectionId] = section.classList.contains("is-collapsed");
    });
    localStorage.setItem(PERFORMANCE_SECTIONS_ORDER_STORAGE_KEY, JSON.stringify(order));
    localStorage.setItem(PERFORMANCE_SECTIONS_COLLAPSED_STORAGE_KEY, JSON.stringify(collapsed));
  };

  const updatePerformanceSectionMoveButtons = () => {
    const currentSections = Array.from(container.querySelectorAll(".perf-section"));
    currentSections.forEach((section, index) => {
      const upBtn = section.querySelector(".perf-section-move-up");
      const downBtn = section.querySelector(".perf-section-move-down");
      if (upBtn) upBtn.disabled = index === 0;
      if (downBtn) downBtn.disabled = index === currentSections.length - 1;
    });
  };

  sections.forEach((section) => {
    const sectionId = section.dataset.sectionId;
    const toggleBtn = section.querySelector(".perf-section-toggle");
    const upBtn = section.querySelector(".perf-section-move-up");
    const downBtn = section.querySelector(".perf-section-move-down");
    if (!sectionId || !toggleBtn) return;
    if (storedCollapsed[sectionId] === true) {
      section.classList.add("is-collapsed");
    } else {
      section.classList.remove("is-collapsed");
    }
    const updateToggleState = () => {
      const isCollapsed = section.classList.contains("is-collapsed");
      toggleBtn.textContent = isCollapsed ? "+" : "−";
      toggleBtn.setAttribute("aria-expanded", String(!isCollapsed));
    };
    updateToggleState();
    toggleBtn.addEventListener("click", () => {
      section.classList.toggle("is-collapsed");
      updateToggleState();
      persistState();
    });

    if (upBtn) {
      upBtn.addEventListener("click", () => {
        const previous = section.previousElementSibling;
        if (!previous) return;
        container.insertBefore(section, previous);
        updatePerformanceSectionMoveButtons();
        persistState();
      });
    }

    if (downBtn) {
      downBtn.addEventListener("click", () => {
        const next = section.nextElementSibling;
        if (!next) return;
        container.insertBefore(next, section);
        updatePerformanceSectionMoveButtons();
        persistState();
      });
    }
  });

  updatePerformanceSectionMoveButtons();
  persistState();
}

function initializeDayConfigSections() {
  const sections = Array.from(document.querySelectorAll("#panel-config .day-config-section"));
  if (!sections.length) return;

  let storedCollapsed = {};
  try {
    const raw = JSON.parse(localStorage.getItem(DAY_CONFIG_SECTIONS_COLLAPSED_STORAGE_KEY) || "{}");
    storedCollapsed = raw && typeof raw === "object" ? raw : {};
  } catch (error) {
    storedCollapsed = {};
  }

  const persistState = () => {
    const collapsed = {};
    sections.forEach((section) => {
      const sectionId = section.dataset.sectionId;
      if (!sectionId) return;
      collapsed[sectionId] = section.classList.contains("is-collapsed");
    });
    localStorage.setItem(DAY_CONFIG_SECTIONS_COLLAPSED_STORAGE_KEY, JSON.stringify(collapsed));
  };

  sections.forEach((section) => {
    const sectionId = section.dataset.sectionId;
    const toggleBtn = section.querySelector(".day-config-section-toggle");
    if (!sectionId || !toggleBtn) return;
    if (storedCollapsed[sectionId] === true) {
      section.classList.add("is-collapsed");
    } else {
      section.classList.remove("is-collapsed");
    }
    const updateToggleState = () => {
      const isCollapsed = section.classList.contains("is-collapsed");
      toggleBtn.textContent = isCollapsed ? "+" : "−";
      toggleBtn.setAttribute("aria-expanded", String(!isCollapsed));
    };
    updateToggleState();
    toggleBtn.addEventListener("click", () => {
      section.classList.toggle("is-collapsed");
      updateToggleState();
      persistState();
    });
  });

  persistState();
}

const METRIC_VALUE_IDS = new Set([
  "avgShear",
  "avgCatch",
  "avgCycle",
  "sheepPerHour",
  "fastestSheepToday",
  "slowestSheepToday",
  "lastSheepTime",
  "requiredCycle",
  "requiredRate",
  "projectedTotal",
  "requiredDayTotalSheep",
  "requiredRunTotalSheep",
  "estimatedLastCatchTime",
  "timeSpareToBell",
  "currentSheepTimeLeft",
  "maxCatchTime",
  "catchPrediction",
  "motorState",
  "currentShear",
  "currentTotalSheepTime",
  "currentCatch",
  "runClock",
  "runCountdown",
  "currentQuarter",
  "quarterClock",
  "quarterSheepCount",
  "quarterTargetCompletionTime",
  "dayClock",
  "totalSheep",
  "currentSheepNumber",
  "runBadge"
]);

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

function formatDurationValue(value) {
  return Number.isFinite(value) ? `${value.toFixed(3)}s` : "—";
}

function normalizeQualityWarningReason(value) {
  if (typeof value !== "string") return "";
  const reason = value.trim().slice(0, 80);
  return QUALITY_WARNING_REASONS.includes(reason) ? reason : "";
}

function sanitizeQualityRatingRecord(record) {
  if (!record || typeof record !== "object") return null;
  const rawRating = record.qualityRating;
  let qualityRating = "";
  if (typeof rawRating === "string") {
    qualityRating = rawRating.trim().slice(0, 20);
  } else if (Number.isFinite(rawRating)) {
    qualityRating = String(rawRating);
  }
  if (!qualityRating) return null;

  const sanitizeFiniteOrNull = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  };
  const sanitizeNotes = (value) => typeof value === "string" ? value.trim().slice(0, 200) : "";
  const officialWarning = record.officialWarning === true;
  const warningReason = officialWarning ? normalizeQualityWarningReason(record.warningReason) : "";
  const warningNotes = officialWarning ? sanitizeNotes(record.warningNotes) : "";
  const enteredAt = Number(record.enteredAt);

  return {
    id: typeof record.id === "string" && record.id.trim() ? record.id.trim().slice(0, 80) : `quality-${enteredAt || Date.now()}`,
    qualityRating,
    periodNumber: sanitizeFiniteOrNull(record.periodNumber),
    blockStartElapsedSeconds: sanitizeFiniteOrNull(record.blockStartElapsedSeconds),
    blockEndElapsedSeconds: sanitizeFiniteOrNull(record.blockEndElapsedSeconds),
    officialCountForPeriod: sanitizeFiniteOrNull(record.officialCountForPeriod),
    physicalCountForPeriod: sanitizeFiniteOrNull(record.physicalCountForPeriod),
    notes: sanitizeNotes(record.notes),
    officialWarning,
    warningReason,
    warningNotes,
    enteredAt: Number.isFinite(enteredAt) ? enteredAt : Date.now()
  };
}

function sanitizeQualityRatings(value) {
  if (!Array.isArray(value)) return [];
  return value.map(sanitizeQualityRatingRecord).filter(Boolean);
}

function getLatestQualityRating() {
  const currentRatings = Array.isArray(appState.qualityRatings) ? appState.qualityRatings : [];
  const ratings = sanitizeQualityRatings(currentRatings);
  if (ratings.length !== currentRatings.length || currentRatings !== appState.qualityRatings) {
    appState.qualityRatings = ratings;
  }
  if (!ratings.length) return null;
  return [...ratings].sort((a, b) => {
    const periodDelta = (Number(a.periodNumber) || 0) - (Number(b.periodNumber) || 0);
    if (periodDelta) return periodDelta;
    return (Number(a.enteredAt) || 0) - (Number(b.enteredAt) || 0);
  })[ratings.length - 1];
}

function formatQualityRatingSummary() {
  const latestRating = getLatestQualityRating();
  return latestRating ? latestRating.qualityRating : "—";
}

function getCurrentQualityPeriodNumber() {
  const effectiveElapsedSeconds = Math.max(Number(getEffectiveElapsedSeconds()) || 0, 0);
  return Math.floor(effectiveElapsedSeconds / QUALITY_RATING_PERIOD_SECONDS) + 1;
}

function getQualityPeriodBounds(periodNumber) {
  const safePeriodNumber = Math.max(Math.floor(Number(periodNumber)) || 1, 1);
  const start = (safePeriodNumber - 1) * QUALITY_RATING_PERIOD_SECONDS;
  return {
    periodNumber: safePeriodNumber,
    start,
    end: safePeriodNumber * QUALITY_RATING_PERIOD_SECONDS
  };
}

function formatQualityPeriodLabel(record) {
  const periodNumber = Math.max(Math.floor(Number(record?.periodNumber)) || 1, 1);
  const start = Number.isFinite(Number(record?.blockStartElapsedSeconds))
    ? Number(record.blockStartElapsedSeconds)
    : getQualityPeriodBounds(periodNumber).start;
  const end = Number.isFinite(Number(record?.blockEndElapsedSeconds))
    ? Number(record.blockEndElapsedSeconds)
    : getQualityPeriodBounds(periodNumber).end;
  return `Period ${periodNumber} (${formatCountdown(start)}–${formatCountdown(end)})`;
}

function getQualityPeriodDefaultCounts(periodNumber) {
  const bounds = getQualityPeriodBounds(periodNumber);
  const entries = Array.isArray(appState.sheep) ? appState.sheep.filter((entry) => {
    const elapsedSeconds = Number(entry?.effectiveElapsedSeconds);
    return Number.isFinite(elapsedSeconds) && elapsedSeconds >= bounds.start && elapsedSeconds < bounds.end;
  }) : [];
  const physicalCountForPeriod = entries.length;
  return {
    officialCountForPeriod: Math.max(physicalCountForPeriod - Math.min(getRejectedDaySheepCount(), physicalCountForPeriod), 0),
    physicalCountForPeriod
  };
}

function setQualityRatingValidation(message = "") {
  if (!elements.qualityRatingValidation) return;
  elements.qualityRatingValidation.textContent = message;
  elements.qualityRatingValidation.hidden = !message;
}

function updateQualityWarningFieldState() {
  const warningChecked = Boolean(elements.qualityRatingOfficialWarningInput?.checked);
  if (elements.qualityRatingWarningReasonInput) {
    elements.qualityRatingWarningReasonInput.disabled = !warningChecked;
    elements.qualityRatingWarningReasonInput.required = warningChecked;
  }
  if (elements.qualityRatingWarningNotesInput) {
    elements.qualityRatingWarningNotesInput.disabled = !warningChecked;
  }
}

function setQualityRatingCountDefaults(periodNumber) {
  const counts = getQualityPeriodDefaultCounts(periodNumber);
  if (elements.qualityRatingOfficialCountInput) elements.qualityRatingOfficialCountInput.value = String(counts.officialCountForPeriod);
  if (elements.qualityRatingPhysicalCountInput) elements.qualityRatingPhysicalCountInput.value = String(counts.physicalCountForPeriod);
}

function createQualityRatingRecordFromForm() {
  const periodNumber = Math.max(Math.floor(Number(elements.qualityRatingPeriodInput?.value)) || 0, 0);
  const qualityRating = (elements.qualityRatingInput?.value || "").trim();
  const notes = elements.qualityRatingNotesInput?.value || "";
  const officialWarning = Boolean(elements.qualityRatingOfficialWarningInput?.checked);
  const warningReason = officialWarning ? normalizeQualityWarningReason(elements.qualityRatingWarningReasonInput?.value || "") : "";
  const warningNotes = officialWarning ? (elements.qualityRatingWarningNotesInput?.value || "") : "";

  if (!qualityRating) return { error: "Enter a quality rating before saving." };
  if (periodNumber <= 0) return { error: "Enter a positive period number." };
  if (officialWarning && !warningReason) return { error: "Select a warning reason before saving an official warning." };

  const { officialCountForPeriod, physicalCountForPeriod } = getQualityPeriodDefaultCounts(periodNumber);
  const bounds = getQualityPeriodBounds(periodNumber);
  const editId = elements.qualityRatingEditId?.value || appState.qualityRatingEditId || "";
  return {
    record: {
      id: editId || `quality-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      qualityRating,
      periodNumber,
      blockStartElapsedSeconds: bounds.start,
      blockEndElapsedSeconds: bounds.end,
      officialCountForPeriod,
      physicalCountForPeriod,
      notes,
      officialWarning,
      warningReason,
      warningNotes,
      enteredAt: editId
        ? (appState.qualityRatings.find((rating) => rating.id === editId)?.enteredAt || Date.now())
        : Date.now()
    }
  };
}

function sortQualityRatings() {
  appState.qualityRatings = sanitizeQualityRatings(appState.qualityRatings).sort((a, b) => {
    const periodDelta = (Number(a.periodNumber) || 0) - (Number(b.periodNumber) || 0);
    if (periodDelta) return periodDelta;
    return (Number(a.enteredAt) || 0) - (Number(b.enteredAt) || 0);
  });
}

function saveQualityRatingFromForm(event) {
  if (event) event.preventDefault();
  const result = createQualityRatingRecordFromForm();
  if (result.error) {
    setQualityRatingValidation(result.error);
    return;
  }

  const sanitizedRecord = sanitizeQualityRatingRecord(result.record);
  if (!sanitizedRecord) {
    setQualityRatingValidation("Enter a valid quality rating before saving.");
    return;
  }

  const editId = elements.qualityRatingEditId?.value || appState.qualityRatingEditId || "";
  const ratings = sanitizeQualityRatings(appState.qualityRatings);
  const existingIndex = editId ? ratings.findIndex((rating) => rating.id === editId) : -1;
  if (existingIndex >= 0) ratings[existingIndex] = sanitizedRecord;
  else ratings.push(sanitizedRecord);
  appState.qualityRatings = ratings;
  sortQualityRatings();
  resetQualityRatingForm();
  updateStatsPanel();
  renderQualityRatingModal();
  autosaveState();
}

function editQualityRating(recordId) {
  const record = sanitizeQualityRatings(appState.qualityRatings).find((rating) => rating.id === recordId);
  if (!record) {
    setQualityRatingValidation("Could not find that quality rating.");
    return;
  }
  appState.qualityRatingEditId = record.id;
  if (elements.qualityRatingEditId) elements.qualityRatingEditId.value = record.id;
  if (elements.qualityRatingPeriodInput) elements.qualityRatingPeriodInput.value = record.periodNumber || getCurrentQualityPeriodNumber();
  if (elements.qualityRatingInput) elements.qualityRatingInput.value = record.qualityRating;
  if (elements.qualityRatingOfficialCountInput) elements.qualityRatingOfficialCountInput.value = record.officialCountForPeriod ?? "";
  if (elements.qualityRatingPhysicalCountInput) elements.qualityRatingPhysicalCountInput.value = record.physicalCountForPeriod ?? "";
  if (elements.qualityRatingNotesInput) elements.qualityRatingNotesInput.value = record.notes || "";
  if (elements.qualityRatingOfficialWarningInput) elements.qualityRatingOfficialWarningInput.checked = Boolean(record.officialWarning);
  if (elements.qualityRatingWarningReasonInput) elements.qualityRatingWarningReasonInput.value = record.warningReason || "";
  if (elements.qualityRatingWarningNotesInput) elements.qualityRatingWarningNotesInput.value = record.warningNotes || "";
  if (elements.qualityRatingSaveBtn) elements.qualityRatingSaveBtn.textContent = "Save Rating";
  updateQualityWarningFieldState();
  setQualityRatingValidation("");
  elements.qualityRatingInput?.focus();
}

async function deleteQualityRating(recordId) {
  const confirmed = await confirmModal({
    title: "Delete quality rating?",
    message: "Delete this quality rating record? This cannot be undone.",
    confirmText: "Delete",
    cancelText: "Cancel"
  });
  if (!confirmed) return;

  appState.qualityRatings = sanitizeQualityRatings(appState.qualityRatings).filter((rating) => rating.id !== recordId);
  if (appState.qualityRatingEditId === recordId) resetQualityRatingForm();
  updateStatsPanel();
  renderQualityRatingModal();
  autosaveState();
}

function renderQualityRatingModal() {
  const ratings = sanitizeQualityRatings(appState.qualityRatings);
  if (ratings.length !== appState.qualityRatings.length) appState.qualityRatings = ratings;
  const latestRating = getLatestQualityRating();
  const warningCount = ratings.filter((rating) => rating.officialWarning).length;
  setText(
    elements.qualityRatingLatestSummary,
    latestRating ? `Latest: ${latestRating.qualityRating} • Warnings: ${warningCount}` : "No quality ratings yet."
  );

  if (!elements.qualityRatingHistory) return;
  elements.qualityRatingHistory.innerHTML = "";
  if (!ratings.length) {
    elements.qualityRatingHistory.textContent = "No quality ratings yet.";
    return;
  }

  const fragment = document.createDocumentFragment();
  [...ratings].sort((a, b) => {
    const periodDelta = (Number(a.periodNumber) || 0) - (Number(b.periodNumber) || 0);
    if (periodDelta) return periodDelta;
    return (Number(a.enteredAt) || 0) - (Number(b.enteredAt) || 0);
  }).forEach((record) => {
    const row = document.createElement("div");
    row.className = "quality-rating-history-row";

    const details = document.createElement("div");
    details.className = "quality-rating-history-details";

    const heading = document.createElement("strong");
    heading.textContent = `${formatQualityPeriodLabel(record)} • Rating ${record.qualityRating}`;
    details.appendChild(heading);

    const meta = document.createElement("span");
    meta.textContent = `Official ${record.officialCountForPeriod ?? "—"} • Physical ${record.physicalCountForPeriod ?? "—"}`;
    details.appendChild(meta);

    if (record.officialWarning) {
      const warningBadge = document.createElement("span");
      warningBadge.className = "quality-rating-warning-badge";
      warningBadge.textContent = record.warningReason ? `Warning: ${record.warningReason}` : "Warning";
      details.appendChild(warningBadge);
    }

    if (record.notes) {
      const notes = document.createElement("span");
      notes.className = "quality-rating-history-notes";
      notes.textContent = record.notes.length > 80 ? `${record.notes.slice(0, 77)}…` : record.notes;
      details.appendChild(notes);
    }

    const actions = document.createElement("div");
    actions.className = "quality-rating-history-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.dataset.action = "editQualityRating";
    editBtn.dataset.ratingId = record.id;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.dataset.action = "deleteQualityRating";
    deleteBtn.dataset.ratingId = record.id;

    actions.append(editBtn, deleteBtn);
    row.append(details, actions);
    fragment.appendChild(row);
  });
  elements.qualityRatingHistory.appendChild(fragment);
}

function resetQualityRatingForm() {
  appState.qualityRatingEditId = "";
  const periodNumber = getCurrentQualityPeriodNumber();
  if (elements.qualityRatingEditId) elements.qualityRatingEditId.value = "";
  if (elements.qualityRatingPeriodInput) elements.qualityRatingPeriodInput.value = String(periodNumber);
  if (elements.qualityRatingInput) elements.qualityRatingInput.value = "";
  if (elements.qualityRatingNotesInput) elements.qualityRatingNotesInput.value = "";
  if (elements.qualityRatingOfficialWarningInput) elements.qualityRatingOfficialWarningInput.checked = false;
  if (elements.qualityRatingWarningReasonInput) elements.qualityRatingWarningReasonInput.value = "";
  if (elements.qualityRatingWarningNotesInput) elements.qualityRatingWarningNotesInput.value = "";
  if (elements.qualityRatingSaveBtn) elements.qualityRatingSaveBtn.textContent = "Save Rating";
  updateQualityWarningFieldState();
  setQualityRatingCountDefaults(periodNumber);
  setQualityRatingValidation("");
}

function openQualityRatingModal() {
  if (!elements.qualityRatingModalOverlay) return;
  resetQualityRatingForm();
  renderQualityRatingModal();
  elements.qualityRatingModalOverlay.hidden = false;
  setLayoutScrollLock(true);
  elements.qualityRatingInput?.focus();
}

function isAnyConnectionStyleModalOpen(excludedOverlay = null) {
  return [
    elements.connectionHelpModalOverlay,
    elements.dayConfigHelpModalOverlay,
    elements.sheepLogHelpModalOverlay,
    elements.sheepLogSettingsModalOverlay,
    elements.targetPaceHelpModalOverlay,
    elements.timingPanelHelpModalOverlay,
    elements.penFillPlannerHelpModalOverlay,
    elements.performancePanelHelpModalOverlay,
    elements.simulationControlsHelpModalOverlay,
    elements.autosaveSettingsModalOverlay,
    elements.shortcutSettingsModalOverlay,
    elements.qualityRatingModalOverlay,
    elements.officialRejectModalOverlay
  ].some((overlay) => overlay && overlay !== excludedOverlay && overlay.hidden === false);
}

function closeQualityRatingModal() {
  if (!elements.qualityRatingModalOverlay) return;
  elements.qualityRatingModalOverlay.hidden = true;
  setLayoutScrollLock(false);
  if (isAnyConnectionStyleModalOpen(elements.qualityRatingModalOverlay)) {
    document.body.classList.add("layout-scroll-lock");
  }
}


function setOfficialRejectValidation(message = "") {
  if (!elements.officialRejectValidation) return;
  elements.officialRejectValidation.textContent = message;
  elements.officialRejectValidation.hidden = !message;
}

function refreshOfficialRejectModal() {
  const physicalCount = getPhysicalDaySheepCount();
  const rejectedCount = getRejectedDaySheepCount();
  setText(elements.officialRejectPhysicalCount, String(physicalCount));
  setText(elements.officialRejectOfficialCount, String(getOfficialDaySheepCount()));
  setText(elements.officialRejectCurrentCount, String(rejectedCount));
  if (elements.officialRejectCountInput) {
    elements.officialRejectCountInput.max = String(physicalCount);
    elements.officialRejectCountInput.value = String(rejectedCount);
  }
}

function openOfficialRejectModal() {
  if (!elements.officialRejectModalOverlay) return;
  migrateLegacyRejectedSheepStatusesToAdjustment();
  refreshOfficialRejectModal();
  setOfficialRejectValidation("");
  elements.officialRejectModalOverlay.hidden = false;
  setLayoutScrollLock(true);
  elements.officialRejectCountInput?.focus();
  elements.officialRejectCountInput?.select?.();
}

function closeOfficialRejectModal() {
  if (!elements.officialRejectModalOverlay) return;
  elements.officialRejectModalOverlay.hidden = true;
  setLayoutScrollLock(false);
  if (isAnyConnectionStyleModalOpen(elements.officialRejectModalOverlay)) {
    document.body.classList.add("layout-scroll-lock");
  }
}

function saveOfficialRejectAdjustmentFromInput(event) {
  if (event) event.preventDefault();
  const physicalCount = getPhysicalDaySheepCount();
  const rawValue = elements.officialRejectCountInput?.value ?? "0";
  const rejectedCount = Number(rawValue);
  if (!Number.isFinite(rejectedCount) || Math.floor(rejectedCount) !== rejectedCount) {
    setOfficialRejectValidation("Rejected sheep count must be a whole number.");
    return false;
  }
  if (rejectedCount < 0) {
    setOfficialRejectValidation("Rejected sheep count cannot be negative.");
    return false;
  }
  if (rejectedCount > physicalCount) {
    setOfficialRejectValidation("Rejected sheep count cannot be greater than Total Sheep Shorn.");
    return false;
  }

  setOfficialRejectedAdjustmentCount(rejectedCount);
  setOfficialRejectValidation("");
  refreshOfficialRejectModal();
  updateTargetPacePredictionSnapshot(getLiveTargetPacePredictions());
  updateStatsPanel();
  updateLivePanel();
  renderQualityRatingModal();
  autosaveState();
  return true;
}

function adjustOfficialRejectCount(delta) {
  const currentValue = Number(elements.officialRejectCountInput?.value);
  const nextValue = Math.max(Math.min((Number.isFinite(currentValue) ? currentValue : getRejectedDaySheepCount()) + delta, getPhysicalDaySheepCount()), 0);
  if (elements.officialRejectCountInput) elements.officialRejectCountInput.value = String(nextValue);
  saveOfficialRejectAdjustmentFromInput();
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

function getDiscardedResetElapsedMs() {
  const discardedResetElapsedMs = Number(appState.discardedResetElapsedMs);
  return Number.isFinite(discardedResetElapsedMs) ? Math.max(discardedResetElapsedMs, 0) : 0;
}

function getEffectiveElapsedSeconds() {
  let elapsedMs = Number(appState.effectiveElapsedBeforePauseMs) || 0;
  if (appState.runActive && !appState.paused && appState.effectiveResumeRealMs !== null) {
    elapsedMs += Math.max(Date.now() - appState.effectiveResumeRealMs, 0);
  }
  return Math.max(elapsedMs - getDiscardedResetElapsedMs(), 0) / 1000;
}

function getCurrentAppTimelineMs() {
  if (Number.isFinite(appState.runStartTime)) {
    return appState.runStartTime + (getEffectiveElapsedSeconds() * 1000);
  }
  return Date.now();
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

function formatSecondsFromMidnightClockAmPm(secondsFromMidnight) {
  if (!Number.isFinite(secondsFromMidnight)) return "";
  const daySeconds = 24 * 3600;
  const safeSeconds = ((Math.floor(secondsFromMidnight) % daySeconds) + daySeconds) % daySeconds;
  const hours24 = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const hours12 = hours24 % 12 || 12;
  const meridiem = hours24 < 12 ? "AM" : "PM";
  return `${hours12}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} ${meridiem}`;
}

function formatClock(ms) {
  if (Number.isFinite(appState.runStartTime) && Number.isFinite(appState.dayClockStartSecondsFromMidnight)) {
    const elapsedSecondsFromRunStart = (ms - appState.runStartTime) / 1000;
    return formatSecondsFromMidnightClock(appState.dayClockStartSecondsFromMidnight + elapsedSecondsFromRunStart);
  }
  const date = new Date(ms);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function getFiniteClockNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value === "string" && value.trim() !== "") {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : NaN;
  }
  return NaN;
}

function getDayClockSecondsFromEffectiveElapsed(effectiveElapsedSeconds) {
  const dayClockStartSeconds = getFiniteClockNumber(appState.dayClockStartSecondsFromMidnight);
  const elapsedSeconds = getFiniteClockNumber(effectiveElapsedSeconds);
  if (!Number.isFinite(dayClockStartSeconds) || !Number.isFinite(elapsedSeconds)) return NaN;
  return dayClockStartSeconds + elapsedSeconds;
}

function formatTargetPaceCountdownDisplay(totalSeconds) {
  const safeSeconds = Math.max(Math.floor(Number(totalSeconds) || 0), 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}

function formatTargetPaceDayClock(runSeconds) {
  if (!Number.isFinite(runSeconds) || runSeconds < 0 || !Number.isFinite(appState.dayClockStartSecondsFromMidnight)) return "—";
  return formatSecondsFromMidnightClockAmPm(appState.dayClockStartSecondsFromMidnight + runSeconds);
}

function formatPredictedTargetReachTime(runSeconds) {
  if (!Number.isFinite(runSeconds) || runSeconds < 0) return "—";
  const remainingSeconds = Math.max(runSeconds - Math.max(getEffectiveElapsedSeconds(), 0), 0);
  return formatTargetPaceCountdownDisplay(remainingSeconds);
}

function formatPredictedCatchTime(runSeconds) {
  if (!Number.isFinite(runSeconds) || runSeconds < 0) return "—";
  if (appState.predictedCatchClockMode === "run") {
    return `${formatTargetPaceCountdownDisplay(runSeconds)} into run`;
  }
  return formatTargetPaceDayClock(runSeconds);
}

function parseRequiredTotalSheep() {
  const rawValue = elements.targetSheepInput?.value;
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") {
    return null;
  }
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function getRequiredDaySheep() {
  const parsed = parseRequiredTotalSheep();
  return parsed === null ? 0 : parsed;
}

function getScheduleSeconds() {
  return getScheduleForCurrentType().map((seconds) => Math.max(Number(seconds) || 0, 0));
}

function getRequiredRunSheep(requiredDaySheep, scheduleSeconds, currentRunIndex) {
  const safeDaySheep = Math.max(Number(requiredDaySheep) || 0, 0);
  if (!scheduleSeconds.length) return safeDaySheep;

  const totalDaySeconds = scheduleSeconds.reduce((sum, seconds) => sum + Math.max(Number(seconds) || 0, 0), 0);
  const safeIndex = Math.max(Math.min(currentRunIndex, scheduleSeconds.length - 1), 0);
  const thisRunSeconds = scheduleSeconds[safeIndex] ?? scheduleSeconds[0] ?? 0;

  if (totalDaySeconds <= 0) {
    return Math.max(Math.round(safeDaySheep), 0);
  }

  return Math.max(Math.round(safeDaySheep * (thisRunSeconds / totalDaySeconds)), 0);
}

function estimateLastCatchDayClock(projectedRunTotalSheep) {
  const n = Number(projectedRunTotalSheep);
  const runElapsedSeconds = getEffectiveElapsedSeconds();
  const avgCycleSeconds = appState.currentStats.avgCycle;
  const avgShearSeconds = appState.currentStats.avgShear;

  if (!appState.runActive
    || !Number.isFinite(runElapsedSeconds)
    || !Number.isFinite(n)
    || n < 1
    || !Number.isFinite(avgCycleSeconds)
    || avgCycleSeconds <= 0
    || !Number.isFinite(avgShearSeconds)
    || avgShearSeconds <= 0) {
    return "—";
  }

  const remainingSecondsToLastCatchStart = Math.max((((n - 1) * avgCycleSeconds) + avgShearSeconds) - runElapsedSeconds, 0);
  const currentDayClockSeconds = getCurrentDayClockSeconds();
  if (!Number.isFinite(currentDayClockSeconds)) {
    return "—";
  }
  const estimatedLastCatchClock = currentDayClockSeconds + remainingSecondsToLastCatchStart;
  return formatSecondsFromMidnightClock(estimatedLastCatchClock);
}

function normalizeIp(value) {
  return (value || "").trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function sanitizePollInterval(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms)) return DEFAULT_CONNECTION_SETTINGS.pollInterval;
  return Math.min(Math.max(Math.round(ms), 20), 5000);
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

function getShellyBaseUrl() {
  const ip = normalizeIp(appState.connection.ip) || DEFAULT_CONNECTION_SETTINGS.ip;
  return `http://${ip}`;
}

function getShellyUrl() {
  const ip = normalizeIp(appState.connection.ip) || DEFAULT_CONNECTION_SETTINGS.ip;
  const query = new URLSearchParams({ ip });
  return `http://localhost:5000/shelly?${query.toString()}`;
}

function getMixedContentMessage() {
  return "Safari blocks https apps from calling http devices like Shelly on 192.168.x.x. Fix: run the app as an installed PWA that's already cached, OR open the app from a non-https local host. Recommended workflow: open once on internet, install to home screen, then use on Shelly AP.";
}

function isMixedContentShellyBlocked() {
  return location.protocol === "https:" && getShellyBaseUrl().startsWith("http://");
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

function sanitizeSimulationCustomMinutes(value) {
  const minutes = Math.trunc(Number(value));
  if (!Number.isFinite(minutes)) return 10;
  return Math.min(Math.max(minutes, 1), 60);
}

function getSimulationTestRunDurationSeconds() {
  if (!appState.simulationMode) return null;

  switch (appState.simulationRunLengthMode) {
    case "test5":
      return 300;
    case "test10":
      return 600;
    case "test15":
      return 900;
    case "custom":
      return sanitizeSimulationCustomMinutes(appState.simulationCustomMinutes) * 60;
    default:
      return null;
  }
}

function getSimulationRunLengthMinutesLabel() {
  const testDurationSeconds = getSimulationTestRunDurationSeconds();
  if (!Number.isFinite(testDurationSeconds) || testDurationSeconds <= 0) return null;
  return Math.round(testDurationSeconds / 60);
}

function updateSimulationRunLengthControls() {
  const simulationEnabled = Boolean(appState.simulationMode);
  const runActive = Boolean(appState.runActive);
  const mode = simulationEnabled ? appState.simulationRunLengthMode : "real";
  const customMode = simulationEnabled && mode === "custom";

  if (elements.simulationRunLengthMode) {
    elements.simulationRunLengthMode.value = mode;
    elements.simulationRunLengthMode.disabled = !simulationEnabled || runActive;
  }

  if (elements.simulationCustomMinutes) {
    elements.simulationCustomMinutes.value = String(sanitizeSimulationCustomMinutes(appState.simulationCustomMinutes));
    elements.simulationCustomMinutes.hidden = !customMode;
    elements.simulationCustomMinutes.disabled = !customMode || runActive;
  }

  if (elements.simulationCustomMinutesLabel) {
    elements.simulationCustomMinutesLabel.hidden = !customMode;
  }

  const activeMinutes = getSimulationRunLengthMinutesLabel();
  if (elements.simulationRunLengthIndicator) {
    if (simulationEnabled && activeMinutes !== null) {
      elements.simulationRunLengthIndicator.textContent = `TEST RUN LENGTH ACTIVE — ${activeMinutes} min simulation run`;
      elements.simulationRunLengthIndicator.hidden = false;
    } else {
      elements.simulationRunLengthIndicator.textContent = "";
      elements.simulationRunLengthIndicator.hidden = true;
    }
  }
}

function getValidSimulationRunLengthMode(mode) {
  return ["real", "test5", "test10", "test15", "custom"].includes(mode) ? mode : "real";
}

function setSimulationRunLengthMode(mode) {
  if (appState.runActive) {
    updateSimulationRunLengthControls();
    return;
  }

  appState.simulationRunLengthMode = appState.simulationMode ? getValidSimulationRunLengthMode(mode) : "real";
  updateSimulationRunLengthControls();
  updateResetCurrentSheepButtonUI();
  updateUndoLastSheepButtonUI();
  updateLivePanel();
  updateStatsPanel();
}

function setSimulationCustomMinutes(value) {
  if (appState.runActive) {
    updateSimulationRunLengthControls();
    return;
  }

  appState.simulationCustomMinutes = sanitizeSimulationCustomMinutes(value);
  updateSimulationRunLengthControls();
  updateResetCurrentSheepButtonUI();
  updateUndoLastSheepButtonUI();
  updateLivePanel();
  updateStatsPanel();
}

function getCurrentRunDurationSeconds() {
  const simulationTestDurationSeconds = getSimulationTestRunDurationSeconds();
  if (Number.isFinite(simulationTestDurationSeconds) && simulationTestDurationSeconds > 0) {
    return simulationTestDurationSeconds;
  }

  const schedule = getScheduleForCurrentType();
  const index = Math.min(appState.currentRunIndex, schedule.length - 1);
  return schedule[Math.max(index, 0)] || 0;
}

function hasRunTimingStarted() {
  return appState.runStartTime !== null
    || appState.runActive
    || appState.effectiveElapsedBeforePauseMs > 0;
}

function getRunCountdownSeconds() {
  if (!hasRunTimingStarted()) return 0;
  const runDurationSeconds = Number(getCurrentRunDurationSeconds());
  if (!Number.isFinite(runDurationSeconds) || runDurationSeconds <= 0) return 0;
  return Math.max(runDurationSeconds - getEffectiveElapsedSeconds(), 0);
}

function getDefaultDayStartTime() {
  if (!elements.runType) return "07:00";
  if (elements.runType.value === "9") return "05:00";
  if (elements.runType.value === "8") return "07:00";
  return "07:00";
}

function getBreakInfoForCompletedRun(runIndex = appState.currentRunIndex) {
  const safeRunIndex = Math.max(Math.floor(Number(runIndex) || 0), 0);
  const runType = elements.runType ? elements.runType.value : "8";

  if (runType === "9") {
    const breaks = [
      { label: "Breakfast", durationSeconds: 3600 },
      { label: "Morning Smoko", durationSeconds: 1800 },
      { label: "Lunch", durationSeconds: 3600 },
      { label: "Afternoon Smoko", durationSeconds: 1800 },
      { label: "End of Day", durationSeconds: 0 }
    ];
    return breaks[Math.min(safeRunIndex, breaks.length - 1)] || null;
  }

  if (runType === "8") {
    const breaks = [
      { label: "Morning Smoko", durationSeconds: 1800 },
      { label: "Lunch", durationSeconds: 3600 },
      { label: "Afternoon Smoko", durationSeconds: 1800 },
      { label: "End of Day", durationSeconds: 0 }
    ];
    return breaks[Math.min(safeRunIndex, breaks.length - 1)] || null;
  }

  return { label: "Official Break", durationSeconds: null };
}

function getBreakDisplayDetails(now = Date.now()) {
  if (!isPreparedForNextRunBreak()) {
    return {
      status: "—",
      label: null,
      started: "—",
      remaining: "—",
      remainingText: "Break remaining: —",
      nextRun: "—",
      nextRunStarts: "—",
      remainingSeconds: null,
      warningText: ""
    };
  }

  const breakInfo = getBreakInfoForCompletedRun(appState.currentRunIndex) || { label: "Official Break", durationSeconds: null };
  const breakStartedAtMs = Number.isFinite(appState.breakStartedAtMs) ? appState.breakStartedAtMs : null;
  const isEndOfDay = breakInfo.label === "End of Day";
  const hasKnownDuration = Number.isFinite(breakInfo.durationSeconds);
  const breakEndMs = breakStartedAtMs !== null && hasKnownDuration
    ? breakStartedAtMs + (breakInfo.durationSeconds * 1000)
    : null;
  const remainingSeconds = breakEndMs !== null ? Math.max((breakEndMs - now) / 1000, 0) : null;
  const remaining = remainingSeconds !== null && !isEndOfDay ? formatCountdown(remainingSeconds) : "—";
  let warningText = "";
  if (remainingSeconds !== null && !isEndOfDay) {
    if (remainingSeconds <= 10) {
      warningText = "Get ready";
    } else if (remainingSeconds <= 60) {
      warningText = "1 minute left";
    }
  }

  return {
    status: "Official Break",
    label: breakInfo.label || "Official Break",
    started: breakStartedAtMs !== null ? formatClock(breakStartedAtMs) : "—",
    remaining,
    remainingText: isEndOfDay ? "Break remaining: —" : `${remaining} remaining`,
    nextRun: isEndOfDay ? "End of Day" : `Run ${appState.currentRunIndex + 2}`,
    nextRunStarts: breakEndMs !== null && !isEndOfDay ? formatClock(breakEndMs) : "—",
    remainingSeconds,
    warningText
  };
}

function updateBreakTimingDisplay() {
  const preparedForNextRunBreak = isPreparedForNextRunBreak();
  const details = getBreakDisplayDetails();
  if (elements.breakTimingRows) elements.breakTimingRows.hidden = !preparedForNextRunBreak;
  if (elements.breakOverlayShowBtn) {
    elements.breakOverlayShowBtn.hidden = !(preparedForNextRunBreak && appState.breakBannerDismissedForCurrentBreak);
  }
  setText(elements.breakStatus, details.status);
  setText(elements.breakStartedTime, details.started);
  setText(elements.breakRemaining, details.remaining);
  setText(elements.breakNextRun, details.nextRun);
  setText(elements.breakNextRunStarts, details.nextRunStarts);
}

function updateBreakOverlayDisplay() {
  const showOverlay = isPreparedForNextRunBreak() && !appState.breakBannerDismissedForCurrentBreak;
  if (!elements.breakOverlay) return;

  elements.breakOverlay.hidden = !showOverlay;
  if (!showOverlay) return;

  const details = getBreakDisplayDetails();
  setText(elements.breakOverlayStatus, details.status);
  setText(elements.breakOverlayLabel, details.label || "Official Break");
  setText(elements.breakOverlayRemaining, details.remainingText);
  setText(elements.breakOverlayNextRun, details.nextRun);
  setText(elements.breakOverlayNextRunStarts, details.nextRunStarts);
  setText(elements.breakOverlayStarted, details.started);

  if (elements.breakOverlayWarning) {
    elements.breakOverlayWarning.hidden = !details.warningText;
    setText(elements.breakOverlayWarning, details.warningText);
  }
}

function hideBreakBannerForCurrentBreak() {
  appState.breakBannerDismissedForCurrentBreak = true;
  updateBreakOverlayDisplay();
  updateBreakTimingDisplay();
  if (typeof autosaveState === "function") {
    autosaveState();
  }
}

function showBreakBannerForCurrentBreak() {
  appState.breakBannerDismissedForCurrentBreak = false;
  updateBreakOverlayDisplay();
  updateBreakTimingDisplay();
  if (typeof autosaveState === "function") {
    autosaveState();
  }
}

function updateStartRunButtonUI() {
  if (!elements.startRunBtn) return;
  if (appState.dayComplete) {
    elements.startRunBtn.textContent = "Day Complete";
    elements.startRunBtn.disabled = true;
    return;
  }
  elements.startRunBtn.textContent = isPreparedForNextRunBreak() || appState.breakActive
    ? "Start Next Run"
    : "Start Run";
}

function updateRunBadge() {
  if (appState.dayComplete) {
    setText(elements.runBadge, "End of Day");
    return;
  }
  if (appState.breakActive || appState.preparedForNextRunBreak) {
    const breakInfo = getBreakInfoForCompletedRun(appState.currentRunIndex);
    setText(elements.runBadge, breakInfo?.label || "Official Break");
    return;
  }
  const schedule = getScheduleForCurrentType();
  const runNumber = Math.min(appState.currentRunIndex + 1, schedule.length);
  setText(elements.runBadge, `Run ${Math.max(runNumber, 1)}`);
}

function getCurrentDayClockSeconds() {
  if (appState.paused && Number.isFinite(appState.dayClockPausedSecondsFromMidnight)) {
    return appState.dayClockPausedSecondsFromMidnight;
  }
  if (appState.dayClockStartRealMs === null) {
    return null;
  }
  const elapsedSeconds = (Date.now() - appState.dayClockStartRealMs) / 1000;
  return appState.dayClockStartSecondsFromMidnight + elapsedSeconds;
}

function updateDayClockDisplay() {
  if (!elements.dayClock) {
    return;
  }
  const dayClockSeconds = getCurrentDayClockSeconds();
  if (!Number.isFinite(dayClockSeconds)) {
    setText(elements.dayClock, "12:00:00 AM");
    return;
  }
  setText(elements.dayClock, formatSecondsFromMidnightClockAmPm(dayClockSeconds));
}

function resetRunState() {
  appState.runActive = false;
  appState.runStartTime = null;
  appState.sheep = [];
  appState.daySheep = [];
  appState.penFillEvents = [];
  appState.lastMotorState = null;
  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = null;
  appState.currentMotorDisplay = "OFF";
  appState.paused = false;
  appState.pauseStartedAtMs = null;
  appState.retryCatchOnResume = false;
  appState.breakActive = false;
  appState.breakStartedAtMs = null;
  appState.breakSource = null;
  appState.preparedForNextRunBreak = false;
  appState.dayComplete = false;
  appState.breakBannerDismissedForCurrentBreak = false;
  appState.pendingBreakAfterCurrentSheep = false;
  appState.pendingBreakStartedAtMs = null;
  appState.pendingBreakSource = null;
  appState.runEndTimeMs = null;
  appState.officialRunEndTimeMs = null;
  appState.currentRunIndex = 0;
  appState.dayClockStartRealMs = null;
  appState.dayClockStartSecondsFromMidnight = parseTimeToSecondsFromMidnight(getDefaultDayStartTime());
  appState.dayClockPausedSecondsFromMidnight = null;
  appState.effectiveElapsedBeforePauseMs = 0;
  appState.effectiveResumeRealMs = null;
  appState.discardedResetElapsedMs = 0;
  appState.trendBuckets = {};
  appState.reviewBlocks = [];
  appState.nextReviewBlockIndex = 1;
  appState.runReviewText = "Run review will be generated when you stop a run.";
  appState.trendFlags = ["Set a target to enable trend flags."];
  appState.latestCompletedRunSnapshot = null;
  appState.targetPacePredictionSnapshot = null;
  appState.pendingPenFillPromptKey = null;
  appState.dismissedPenFillPromptKey = null;
  resetPenFillForecastCountdownTarget();
  calculateAverages();
}

function buildTargetPacePredictionSnapshot(liveValues) {
  const requiredRunTotalSheep = calculateRequiredRunTotalSheep();
  return {
    predictedQuarterTotal: liveValues.predictedQuarterTotal,
    predictedHourTotal: liveValues.predictedHourTotal,
    projectedTotal: liveValues.projectedTotal,
    estimatedLastCatchTime: liveValues.estimatedLastCatchTime,
    maxCatchTime: liveValues.maxCatchTime,
    catchPrediction: liveValues.catchPrediction,
    requiredRunTotalSheep
  };
}

function updateTargetPacePredictionSnapshot(liveValues) {
  appState.targetPacePredictionSnapshot = buildTargetPacePredictionSnapshot(liveValues);
}

function getTargetRunTotalPredictionLabel(requiredRunTotalSheep) {
  if (requiredRunTotalSheep === null) {
    return "Predicted time to catch target:";
  }
  return `Predicted time to catch target (${requiredRunTotalSheep}):`;
}


function updateFinishRunBreakButtonUI() {
  if (!elements.finishRunBreakBtn) return;

  const hasRunData = appState.sheep.length > 0;
  const canFinishBreak =
    !appState.dayComplete &&
    !appState.breakActive &&
    !appState.preparedForNextRunBreak &&
    (appState.runActive || hasRunData);

  elements.finishRunBreakBtn.disabled = !canFinishBreak;
}

function getOfficialScheduledRunEndTimeMs() {
  if (Number.isFinite(appState.officialRunEndTimeMs)) return appState.officialRunEndTimeMs;
  if (Number.isFinite(appState.runEndTimeMs)) return appState.runEndTimeMs;
  return null;
}

function resolveOfficialBreakStartedAtMs(source = "official", breakStartedAtMs = null) {
  if (source !== "record-day-break") {
    return Number.isFinite(breakStartedAtMs) ? breakStartedAtMs : Date.now();
  }

  if (Number.isFinite(breakStartedAtMs)) return breakStartedAtMs;

  const officialScheduledRunEndTimeMs = getOfficialScheduledRunEndTimeMs();
  if (Number.isFinite(officialScheduledRunEndTimeMs)) return officialScheduledRunEndTimeMs;

  return Date.now();
}

function getScheduledRunEndStatus() {
  const elapsedSeconds = Number(getEffectiveElapsedSeconds());
  const runDurationSeconds = Number(getCurrentRunDurationSeconds());
  const officialScheduledRunEndTimeMs = getOfficialScheduledRunEndTimeMs();
  const scheduledRunEndTimeMs = Number.isFinite(appState.runStartTime)
    && Number.isFinite(runDurationSeconds)
    && runDurationSeconds > 0
    ? appState.runStartTime + (runDurationSeconds * 1000)
    : officialScheduledRunEndTimeMs;
  const ended = Number.isFinite(elapsedSeconds)
    && Number.isFinite(runDurationSeconds)
    && runDurationSeconds > 0
    && elapsedSeconds >= runDurationSeconds;
  const remainingSeconds = Number.isFinite(elapsedSeconds)
    && Number.isFinite(runDurationSeconds)
    && runDurationSeconds > 0
    ? Math.max(runDurationSeconds - elapsedSeconds, 0)
    : null;

  return {
    ended,
    elapsedSeconds,
    runDurationSeconds,
    remainingSeconds,
    scheduledRunEndTimeMs
  };
}

function getEarlyBreakConfirmationDetails() {
  if (!appState.runActive) return null;
  const status = getScheduledRunEndStatus();
  if (status.ended) return null;
  if (!Number.isFinite(status.scheduledRunEndTimeMs) || status.remainingSeconds === null) return null;

  return {
    scheduledEndLabel: formatClock(status.scheduledRunEndTimeMs),
    remainingLabel: formatCountdown(status.remainingSeconds)
  };
}

async function confirmEarlyFinishRunBreak() {
  const details = getEarlyBreakConfirmationDetails();
  if (!details) return true;

  return confirmModal({
    title: "Finish run before scheduled end?",
    message: `This run is not due to finish until ${details.scheduledEndLabel} (${details.remainingLabel} remaining). Starting the official break now will set the next-run start from the current time instead of the scheduled finish time.`,
    confirmText: "Finish early",
    cancelText: "Keep running"
  });
}

async function handleFinishRunBreakClick() {
  if (appState.breakActive || appState.preparedForNextRunBreak) return;
  if (!appState.runActive && appState.sheep.length === 0) return;

  const confirmed = await confirmEarlyFinishRunBreak();
  if (!confirmed) {
    clearPanelInteractionHighlights();
    return;
  }

  const runEndStatus = getScheduledRunEndStatus();
  const appTimelineNowMs = getCurrentAppTimelineMs();
  const breakStartedAtMs = runEndStatus.ended && Number.isFinite(runEndStatus.scheduledRunEndTimeMs)
    ? runEndStatus.scheduledRunEndTimeMs
    : appTimelineNowMs;
  const breakSource = runEndStatus.ended
    ? "record-day-break"
    : "manual-finish-break";

  if (appState.currentCycle.motorOn) {
    appState.pendingBreakAfterCurrentSheep = true;
    appState.pendingBreakStartedAtMs = breakStartedAtMs;
    appState.pendingBreakSource = breakSource;
    console.log("Finish break requested; waiting for current sheep to finish");
    updateFinishRunBreakButtonUI();
    return;
  }

  finishRunAndEnterBreak(breakSource, breakStartedAtMs);
}

function startRun(startedAtMs = Date.now()) {
  if (!elements.farmInput || !elements.targetSheepInput || !elements.startRunBtn || !elements.stopRunBtn || !elements.runStatus) {
    return;
  }

  saveFarmFromInput();

  appState.runActive = true;
  if (appState.runStartTime !== null) {
    const schedule = getScheduleForCurrentType();
    appState.currentRunIndex = Math.min(appState.currentRunIndex + 1, schedule.length - 1);
  }
  appState.runStartTime = Number.isFinite(startedAtMs) ? startedAtMs : Date.now();
  appState.sheep = [];
  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = appState.runStartTime;
  appState.retryCatchOnResume = false;
  appState.lastMotorState = null;
  appState.farm = normalizeFarmName(elements.farmInput.value);
  appState.target.sheep = Math.max(Number(elements.targetSheepInput.value) || 0, 0);
  appState.target.runLengthSeconds = getRunLengthSeconds();
  const runDurationSeconds = getCurrentRunDurationSeconds();
  appState.runEndTimeMs = appState.runStartTime + (runDurationSeconds * 1000);
  appState.officialRunEndTimeMs = appState.runEndTimeMs;

  if (elements.dayStartTimeInput) {
    appState.dayClockStartSecondsFromMidnight = parseTimeToSecondsFromMidnight(elements.dayStartTimeInput.value);
  }
  appState.dayClockStartRealMs = appState.runStartTime;
  appState.dayClockPausedSecondsFromMidnight = null;
  appState.currentMotorDisplay = "OFF";
  appState.pauseStartedAtMs = null;
  appState.breakActive = false;
  appState.breakStartedAtMs = null;
  appState.breakSource = null;
  appState.preparedForNextRunBreak = false;
  appState.dayComplete = false;
  appState.breakBannerDismissedForCurrentBreak = false;
  appState.pendingBreakAfterCurrentSheep = false;
  appState.pendingBreakStartedAtMs = null;
  appState.pendingBreakSource = null;
  appState.effectiveElapsedBeforePauseMs = 0;
  appState.effectiveResumeRealMs = appState.runStartTime;
  appState.discardedResetElapsedMs = 0;
  appState.trendBuckets = {};
  appState.reviewBlocks = [];
  appState.nextReviewBlockIndex = 1;
  appState.runReviewText = "Run review will be generated when you stop a run.";
  appState.trendFlags = ["Set a target to enable trend flags."];
  appState.targetPacePredictionSnapshot = null;
  appState.pendingPenFillPromptKey = null;
  appState.dismissedPenFillPromptKey = null;
  resetPenFillForecastCountdownTarget();

  elements.startRunBtn.disabled = true;
  elements.stopRunBtn.disabled = false;
  updateSimulationRunLengthControls();
  updateFinishRunBreakButtonUI();
  updateResetCurrentSheepButtonUI();
  updateUndoLastSheepButtonUI();

  setPaused(false);
  updatePauseButtonUI();
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
  appState.retryCatchOnResume = false;
  appState.currentMotorDisplay = "OFF";
  appState.pauseStartedAtMs = null;
  appState.breakActive = false;
  appState.breakStartedAtMs = null;
  appState.breakSource = null;
  appState.preparedForNextRunBreak = false;
  appState.breakBannerDismissedForCurrentBreak = false;
  appState.pendingBreakAfterCurrentSheep = false;
  appState.pendingBreakStartedAtMs = null;
  appState.pendingBreakSource = null;
  appState.runEndTimeMs = null;
  appState.officialRunEndTimeMs = null;
  resetPenFillForecastCountdownTarget();

  elements.startRunBtn.disabled = false;
  elements.stopRunBtn.disabled = true;
  updateSimulationRunLengthControls();
  updateFinishRunBreakButtonUI();
  updateResetCurrentSheepButtonUI();
  updateUndoLastSheepButtonUI();

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

function finishRunAndEnterBreak(source = "record-day-break", breakStartedAtMs = null) {
  if (!appState.runActive && appState.sheep.length === 0) {
    return;
  }

  if (appState.effectiveResumeRealMs !== null) {
    appState.effectiveElapsedBeforePauseMs += Math.max(Date.now() - appState.effectiveResumeRealMs, 0);
    appState.effectiveResumeRealMs = null;
  }

  generateRunReview();
  appState.latestCompletedRunSnapshot = buildCompletedRunSnapshot();
  updateReviewRunButtonState();

  appState.runActive = false;
  if (appState.paused) {
    resumeDayClock();
  }
  appState.paused = false;
  appState.pauseStartedAtMs = null;

  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = null;
  appState.retryCatchOnResume = false;
  appState.currentMotorDisplay = "OFF";

  appState.runEndTimeMs = null;
  appState.effectiveElapsedBeforePauseMs = 0;
  appState.effectiveResumeRealMs = null;
  appState.discardedResetElapsedMs = 0;
  resetPenFillForecastCountdownTarget();

  appState.preparedForNextRunBreak = true;
  appState.breakBannerDismissedForCurrentBreak = false;

  enterOfficialBreak(source, breakStartedAtMs);

  appState.pendingBreakAfterCurrentSheep = false;
  appState.pendingBreakStartedAtMs = null;
  appState.pendingBreakSource = null;

  if (elements.startRunBtn) elements.startRunBtn.disabled = false;
  if (elements.stopRunBtn) elements.stopRunBtn.disabled = true;
  if (elements.runStatus) elements.runStatus.textContent = "Official Break";

  updatePauseButtonUI();
  updateSimulationRunLengthControls();
  updateFinishRunBreakButtonUI();
  updateResetCurrentSheepButtonUI();
  updateUndoLastSheepButtonUI();
  updateLivePanel();
  updateStatsPanel();
  renderReviewList();
  drawTrendGraph();
  updateTrendFlags();

  if (typeof autosaveState === "function") {
    autosaveState();
  }

  console.log("Run finished and official break prepared");
}

function resetRun() {
  if (!elements.startRunBtn || !elements.stopRunBtn || !elements.runStatus || !elements.blockMinutes) return;
  clearPanelInteractionHighlights();
  resetRunState();
  elements.startRunBtn.disabled = false;
  elements.stopRunBtn.disabled = true;
  updateSimulationRunLengthControls();
  updateFinishRunBreakButtonUI();
  updateResetCurrentSheepButtonUI();
  updateUndoLastSheepButtonUI();

  setPaused(false);
  elements.runStatus.textContent = "Idle";
  updatePauseButtonUI();
  renderLogTable();
  renderBlock(Number(elements.blockMinutes.value) || 15);
  updateLivePanel();
  if (elements.runReviewText) elements.runReviewText.textContent = appState.runReviewText;
  updateReviewRunButtonState();
  renderReviewList();
  drawTrendGraph();
  updateTrendFlags();
  updateStatsPanel();
}

function isCountingPausedForBreak() {
  return appState.breakActive === true;
}

function isPreparedForNextRunBreak() {
  return appState.breakActive === true && appState.preparedForNextRunBreak === true;
}

function isAutoScheduleType() {
  const runType = elements.runType ? elements.runType.value : "8";
  return runType === "8" || runType === "9";
}

function isEndOfDayBreak(runIndex = appState.currentRunIndex) {
  const breakInfo = getBreakInfoForCompletedRun(runIndex);
  return breakInfo?.label === "End of Day";
}

function isBreakComplete(now = Date.now()) {
  if (!isPreparedForNextRunBreak()) return false;
  const breakInfo = getBreakInfoForCompletedRun(appState.currentRunIndex);
  if (!breakInfo || !Number.isFinite(breakInfo.durationSeconds)) return false;
  if (!Number.isFinite(appState.breakStartedAtMs)) return false;
  const breakEndMs = appState.breakStartedAtMs + (breakInfo.durationSeconds * 1000);
  return now >= breakEndMs;
}

function maybeAutoStartNextRunAfterBreak(now = Date.now()) {
  if (!isAutoScheduleType()) return false;
  if (!isPreparedForNextRunBreak()) return false;
  if (appState.runActive) return false;
  if (appState.pendingBreakAfterCurrentSheep) return false;
  if (appState.dayComplete) return false;

  if (isEndOfDayBreak(appState.currentRunIndex)) {
    appState.dayComplete = true;
    if (elements.runStatus) elements.runStatus.textContent = "End of Day";
    updateStartRunButtonUI();
    updateRunBadge();
    updateBreakTimingDisplay();
    updateBreakOverlayDisplay();
    if (typeof autosaveState === "function") {
      autosaveState();
    }
    console.log("End of day reached");
    return false;
  }

  if (!isBreakComplete(now)) return false;

  const breakInfo = getBreakInfoForCompletedRun(appState.currentRunIndex);
  const nextRunStartTimeMs = Number.isFinite(appState.breakStartedAtMs) && Number.isFinite(breakInfo?.durationSeconds)
    ? appState.breakStartedAtMs + (breakInfo.durationSeconds * 1000)
    : now;

  console.log("Break complete; starting next run automatically");
  startRun(nextRunStartTimeMs);
  return true;
}

function isCountingPaused() {
  return appState.paused || isCountingPausedForBreak();
}

function canRunSimulationMotorOnShortcut() {
  return Boolean(appState.simulationMode && appState.runActive && !isCountingPaused() && !appState.currentCycle.motorOn);
}

function canRunSimulationMotorOffShortcut() {
  return Boolean(appState.simulationMode && appState.runActive && !isCountingPaused());
}

function toggleSimulationModeShortcut() {
  setSimulationMode(!appState.simulationMode);
}

function canResetCurrentSheepTiming() {
  return Boolean(
    appState.simulationMode
    && appState.runActive
    && !appState.breakActive
    && !appState.preparedForNextRunBreak
  );
}

function updateResetCurrentSheepButtonUI() {
  if (!elements.resetCurrentSheepBtn) return;
  elements.resetCurrentSheepBtn.disabled = !canResetCurrentSheepTiming();
}

function canUndoLastSheep() {
  return Boolean(
    appState.simulationMode
    && appState.runActive
    && !appState.breakActive
    && !appState.preparedForNextRunBreak
    && appState.sheep.length > 0
  );
}

function updateUndoLastSheepButtonUI() {
  if (!elements.undoLastSheepBtn) return;
  elements.undoLastSheepBtn.disabled = !canUndoLastSheep();
}

function clearPenFillPromptKeyBeyondSheepCount(keyName, newPhysicalSheepCount) {
  const key = appState[keyName];
  if (typeof key !== "string") return;
  const [runIndexText, sheepText] = key.split(":");
  const keyRunIndex = Number(runIndexText);
  const keySheep = Number(sheepText);
  if (
    Number.isFinite(keyRunIndex)
    && Number.isFinite(keySheep)
    && keyRunIndex === Number(appState.currentRunIndex)
    && keySheep > newPhysicalSheepCount
  ) {
    appState[keyName] = null;
  }
}

function markFuturePenFillEventsUndone(newPhysicalSheepCount, now = Date.now()) {
  if (!Array.isArray(appState.penFillEvents)) return;
  const currentRunIndex = Number(appState.currentRunIndex);
  appState.penFillEvents.forEach((event) => {
    if (
      isActivePenFillEvent(event)
      && Number(event.runIndex) === currentRunIndex
      && Number(event.physicalSheepTakenFromPen) > newPhysicalSheepCount
    ) {
      event.undone = true;
      event.undoneAt = now;
      event.updatedAt = now;
    }
  });
}


function getRunSheepIndexById(sheepId) {
  if (!sheepId) return -1;
  return appState.sheep.findIndex((entry) => entry?.id === sheepId);
}

function getSelectedSheepLogEntriesInRunOrder() {
  return Array.from(selectedSheepLogIds)
    .map((id) => appState.sheep.find((entry) => entry?.id === id))
    .filter(Boolean)
    .sort((a, b) => Number(a.number) - Number(b.number));
}

function getSelectedAdjacentSheepForMerge() {
  const selected = getSelectedSheepLogEntriesInRunOrder();
  if (selected.length !== 2) return null;

  const firstIndex = getRunSheepIndexById(selected[0].id);
  const secondIndex = getRunSheepIndexById(selected[1].id);
  if (firstIndex === -1 || secondIndex === -1 || secondIndex !== firstIndex + 1) return null;
  return { first: appState.sheep[firstIndex], second: appState.sheep[secondIndex], firstIndex, secondIndex };
}

function updateMergeSelectedSheepButtonUI(message = "") {
  if (!elements.mergeSelectedSheepBtn && !elements.mergeSelectedSheepStatus) return;

  const selectedCount = selectedSheepLogIds.size;
  const adjacentSelection = getSelectedAdjacentSheepForMerge();
  const canMerge = Boolean(adjacentSelection);
  if (elements.mergeSelectedSheepBtn) {
    elements.mergeSelectedSheepBtn.disabled = !canMerge;
  }
  if (elements.mergeSelectedSheepStatus) {
    elements.mergeSelectedSheepStatus.textContent = message || (canMerge
      ? `Ready to merge sheep ${adjacentSelection.first.number} and ${adjacentSelection.second.number}.`
      : (selectedCount === 0
        ? "Select two adjacent sheep to merge."
        : `${selectedCount} selected — choose exactly two adjacent sheep.`));
  }
}

function syncSelectedSheepLogIds() {
  const currentIds = new Set(appState.sheep.map((entry) => entry?.id).filter(Boolean));
  selectedSheepLogIds = new Set(Array.from(selectedSheepLogIds).filter((id) => currentIds.has(id)));
}

function toggleSheepLogSelection(sheepId, selected) {
  if (!sheepId) return;
  if (selected) selectedSheepLogIds.add(sheepId);
  else selectedSheepLogIds.delete(sheepId);
  updateMergeSelectedSheepButtonUI();
}

function getMergedSheepStatus(firstEntry, secondEntry) {
  const firstStatus = getSheepStatus(firstEntry);
  const secondStatus = getSheepStatus(secondEntry);
  if (firstStatus === SHEEP_STATUS.REJECTED || secondStatus === SHEEP_STATUS.REJECTED) return SHEEP_STATUS.REJECTED;
  if (firstStatus === SHEEP_STATUS.PENDING || secondStatus === SHEEP_STATUS.PENDING) return SHEEP_STATUS.PENDING;
  return SHEEP_STATUS.ACCEPTED;
}

function applyMergedSheepStatusMetadata(mergedEntry, firstEntry, secondEntry) {
  const rejectedSource = isRejectedSheep(firstEntry) ? firstEntry : (isRejectedSheep(secondEntry) ? secondEntry : null);
  if (rejectedSource) {
    if (rejectedSource.rejectedAt !== undefined) mergedEntry.rejectedAt = rejectedSource.rejectedAt;
    if (rejectedSource.rejectedReason !== undefined) mergedEntry.rejectedReason = rejectedSource.rejectedReason;
  }

  const restoredSource = firstEntry?.restoredAt !== undefined || firstEntry?.restoreReason !== undefined ? firstEntry
    : (secondEntry?.restoredAt !== undefined || secondEntry?.restoreReason !== undefined ? secondEntry : null);
  if (restoredSource) {
    if (restoredSource.restoredAt !== undefined) mergedEntry.restoredAt = restoredSource.restoredAt;
    if (restoredSource.restoreReason !== undefined) mergedEntry.restoreReason = restoredSource.restoreReason;
  }
}

function getSheepInterruptionDuration(firstEntry, secondEntry) {
  const firstEnd = Number(firstEntry?.endTime);
  const secondStart = Number(secondEntry?.startTime);
  if (!Number.isFinite(firstEnd) || !Number.isFinite(secondStart)) return 0;
  return Math.max((secondStart - firstEnd) / 1000, 0);
}

function combineMergedSheepNotes(firstEntry, secondEntry, markerAuditNote = "") {
  const parts = [normalizeSheepNote(firstEntry?.note), normalizeSheepNote(secondEntry?.note), markerAuditNote]
    .filter(Boolean);
  if (!parts.length) return "";
  const separator = " | ";
  let combinedNote = "";
  for (const part of parts) {
    if (!combinedNote) {
      combinedNote = part.slice(0, SHEEP_NOTE_MAX_LENGTH);
      continue;
    }
    const remainingLength = SHEEP_NOTE_MAX_LENGTH - combinedNote.length - separator.length;
    if (remainingLength <= 0) break;
    combinedNote += separator + part.slice(0, remainingLength);
  }
  return normalizeSheepNote(combinedNote);
}

function createMergedSheepEntry(firstEntry, secondEntry, overrides = {}) {
  const interruptionDuration = getSheepInterruptionDuration(firstEntry, secondEntry);
  const catchDuration = Math.max(Number(firstEntry?.catchDuration) || 0, 0);
  const shearDuration = Math.max(Number(firstEntry?.shearDuration) || 0, 0)
    + interruptionDuration
    + Math.max(Number(secondEntry?.shearDuration) || 0, 0);
  const firstMarkers = getConfirmedManualMarkersForEntry(firstEntry);
  const secondMarkers = getConfirmedManualMarkersForEntry(secondEntry);
  const mergedManualMarkers = unionManualMarkers(firstMarkers, secondMarkers);
  const firstMarkerKeys = new Set(firstMarkers.map(getManualMarkerDedupKey).filter(Boolean));
  const additionalSecondMarkerLabels = secondMarkers
    .filter((marker) => {
      const dedupKey = getManualMarkerDedupKey(marker);
      return dedupKey && !firstMarkerKeys.has(dedupKey);
    })
    .map((marker) => marker.type === MANUAL_MARKER_CUSTOM_TYPE
      ? `Custom: ${getManualMarkerDisplayLabel(marker)}`
      : getManualMarkerDisplayLabel(marker))
    .filter(Boolean);
  const markerAuditNote = additionalSecondMarkerLabels.length
    ? `Merged sheep also had marker${additionalSecondMarkerLabels.length > 1 ? "s" : ""}: ${additionalSecondMarkerLabels.join(" + ")}.`
    : "";
  const mergedEntry = {
    ...firstEntry,
    ...overrides,
    id: firstEntry.id,
    startTime: Number.isFinite(Number(firstEntry.startTime)) ? firstEntry.startTime : secondEntry.startTime,
    endTime: Number.isFinite(Number(secondEntry.endTime)) ? secondEntry.endTime : firstEntry.endTime,
    startDayClockSeconds: Number.isFinite(Number(firstEntry.startDayClockSeconds)) ? firstEntry.startDayClockSeconds : secondEntry.startDayClockSeconds,
    endDayClockSeconds: Number.isFinite(Number(secondEntry.endDayClockSeconds)) ? secondEntry.endDayClockSeconds : firstEntry.endDayClockSeconds,
    catchDuration,
    shearDuration,
    fullCycle: catchDuration + shearDuration,
    effectiveElapsedSeconds: Number.isFinite(Number(secondEntry.effectiveElapsedSeconds))
      ? secondEntry.effectiveElapsedSeconds
      : firstEntry.effectiveElapsedSeconds,
    status: getMergedSheepStatus(firstEntry, secondEntry),
    mergedFromIds: [firstEntry.id, secondEntry.id].filter(Boolean),
    mergedFromNumbers: [firstEntry.number, secondEntry.number].filter((number) => Number.isFinite(Number(number))),
    mergedAt: Date.now(),
    interruptionDuration
  };

  const note = combineMergedSheepNotes(firstEntry, secondEntry, markerAuditNote);
  if (note) mergedEntry.note = note;
  else delete mergedEntry.note;

  if (mergedManualMarkers.length) {
    mergedEntry.manualMarkers = mergedManualMarkers;
    syncLegacyManualMarkerToFirstManualMarker(mergedEntry, mergedManualMarkers);
  } else {
    delete mergedEntry.manualMarkers;
    delete mergedEntry.manualMarker;
  }

  applyMergedSheepStatusMetadata(mergedEntry, firstEntry, secondEntry);

  return mergedEntry;
}

function renumberRunSheepFrom(startIndex = 0) {
  appState.sheep.forEach((entry, index) => {
    if (!entry || index < startIndex) return;
    entry.number = index + 1;
  });
}

function renumberDaySheep() {
  appState.daySheep.forEach((entry, index) => {
    if (!entry) return;
    entry.dayNumber = index + 1;
    entry.number = index + 1;
  });
}

function validatePenFillEventsForSheepMerge(secondSheepNumber) {
  const currentRunIndex = Number(appState.currentRunIndex);
  const affectedEvents = Array.isArray(appState.penFillEvents)
    ? appState.penFillEvents.filter((event) => (
      isActivePenFillEvent(event)
      && Number(event.runIndex) === currentRunIndex
      && Number(event.physicalSheepTakenFromPen) > Number(secondSheepNumber)
    ))
    : [];
  const unsafeEvent = affectedEvents.find((event) => event.source !== PEN_FILL_EVENT_SOURCE.ASSUMED_FULL);
  if (unsafeEvent) {
    return {
      safe: false,
      reason: "Merge is not safe after manual, custom, or confirmed pen refill events yet. Undo or review those refill events before merging sheep."
    };
  }
  return { safe: true, affectedEvents };
}

function markAffectedAssumedPenFillEventsUndone(events, now = Date.now()) {
  events.forEach((event) => {
    event.undone = true;
    event.undoneAt = now;
    event.updatedAt = now;
    event.undoReason = "sheep-merge";
  });
}

function rebuildGeneratedCorrectionData() {
  appState.trendBuckets = {};
  appState.reviewBlocks = [];
  appState.nextReviewBlockIndex = 1;
  const effectiveElapsedSeconds = Math.max(...appState.sheep.map((entry) => Number(entry?.effectiveElapsedSeconds) || 0), 0);
  const blockSeconds = 15 * 60;
  const completedBlocks = Math.floor(effectiveElapsedSeconds / blockSeconds);
  const previousElapsedBeforePauseMs = appState.effectiveElapsedBeforePauseMs;
  const previousResumeRealMs = appState.effectiveResumeRealMs;
  const previousPaused = appState.paused;

  appState.paused = true;
  appState.effectiveResumeRealMs = null;
  for (let blockIndex = 1; blockIndex <= completedBlocks; blockIndex += 1) {
    appState.effectiveElapsedBeforePauseMs = blockIndex * blockSeconds * 1000;
    maybeGenerate15MinuteReviews();
  }

  appState.effectiveElapsedBeforePauseMs = previousElapsedBeforePauseMs;
  appState.effectiveResumeRealMs = previousResumeRealMs;
  appState.paused = previousPaused;
}

function refreshAfterManualSheepMerge(message = "") {
  rebuildGeneratedCorrectionData();
  calculateAverages();
  updateTargetPacePredictionSnapshot(getLiveTargetPacePredictions());
  updateStatsPanel();
  updateLivePanel();
  renderLogTable();
  renderReviewList();
  drawTrendGraph();
  updateTrendFlags();
  updatePenFillForecastDisplay();
  updatePenStateDisplay();
  updatePenFillEarlyReminderDisplay();
  updatePenFillConfirmationControls({ statusOverride: message });
  updateMergeSelectedSheepButtonUI(message);
}

function mergeAdjacentSheepEntries(firstEntry, secondEntry) {
  const firstIndex = getRunSheepIndexById(firstEntry?.id);
  const secondIndex = getRunSheepIndexById(secondEntry?.id);
  if (firstIndex === -1 || secondIndex !== firstIndex + 1) {
    return { success: false, error: "Select exactly two adjacent sheep from the current run." };
  }

  const penFillValidation = validatePenFillEventsForSheepMerge(secondEntry.number);
  if (!penFillValidation.safe) return { success: false, error: penFillValidation.reason };

  const firstDayIndex = appState.daySheep.findIndex((entry) => entry?.id === firstEntry.id);
  const secondDayIndex = appState.daySheep.findIndex((entry) => entry?.id === secondEntry.id);
  if (firstDayIndex === -1 || secondDayIndex !== firstDayIndex + 1) {
    return { success: false, error: "Matching adjacent day sheep entries were not found; merge skipped to keep run/day logs aligned." };
  }

  const now = Date.now();
  const mergedRunEntry = createMergedSheepEntry(firstEntry, secondEntry, { number: firstEntry.number, dayNumber: firstEntry.dayNumber });
  const mergedDayEntry = createMergedSheepEntry(appState.daySheep[firstDayIndex], appState.daySheep[secondDayIndex], {
    number: appState.daySheep[firstDayIndex].number,
    dayNumber: appState.daySheep[firstDayIndex].dayNumber
  });

  appState.sheep.splice(firstIndex, 2, mergedRunEntry);
  appState.daySheep.splice(firstDayIndex, 2, mergedDayEntry);
  renumberRunSheepFrom(firstIndex);
  renumberDaySheep();
  markAffectedAssumedPenFillEventsUndone(penFillValidation.affectedEvents || [], now);
  clearPenFillPromptKeyBeyondSheepCount("pendingPenFillPromptKey", appState.sheep.length);
  clearPenFillPromptKeyBeyondSheepCount("dismissedPenFillPromptKey", appState.sheep.length);
  selectedSheepLogIds = new Set([mergedRunEntry.id]);
  sheepLogMarkerNoteEditorSheepId = "";

  return { success: true, mergedSheep: mergedRunEntry, affectedPenFillEvents: penFillValidation.affectedEvents || [] };
}

async function mergeSelectedSheep() {
  const selection = getSelectedAdjacentSheepForMerge();
  if (!selection) {
    updateMergeSelectedSheepButtonUI("Select exactly two adjacent sheep from the current run.");
    return { success: false, error: "Select exactly two adjacent sheep from the current run." };
  }

  const confirmed = await confirmModal({
    title: "Merge selected sheep?",
    message: `Merge sheep ${selection.first.number} and sheep ${selection.second.number} into one sheep? This is for cases where one real sheep was accidentally recorded as two entries. Later sheep will be renumbered.`,
    confirmText: "Merge Sheep",
    cancelText: "Cancel"
  });
  if (!confirmed) return { success: false, error: "Merge cancelled." };

  const result = mergeAdjacentSheepEntries(selection.first, selection.second);
  if (!result.success) {
    updateMergeSelectedSheepButtonUI(result.error);
    return result;
  }

  const assumedMessage = result.affectedPenFillEvents.length
    ? "Merged sheep. Future assumed pen refill events were marked undone so the planner can recreate them."
    : "Merged selected sheep.";
  refreshAfterManualSheepMerge(assumedMessage);
  autosaveState();
  return result;
}

function refreshAfterUndoLastSheep() {
  calculateAverages();
  updateTargetPacePredictionSnapshot(getLiveTargetPacePredictions());
  updateStatsPanel();
  updateLivePanel();
  renderLogTable();
  renderReviewList();
  drawTrendGraph();
  updateTrendFlags();
  updatePenFillForecastDisplay();
  updatePenStateDisplay();
  updatePenFillEarlyReminderDisplay();
  updatePenFillConfirmationControls();
  updateFinishRunBreakButtonUI();
  updateBreakTimingDisplay();
  updateBreakOverlayDisplay();
  updateResetCurrentSheepButtonUI();
  updateUndoLastSheepButtonUI();
}

function getUndoLastSheepRewindSeconds(deletedSheep) {
  const fullCycle = Number(deletedSheep?.fullCycle);
  if (Number.isFinite(fullCycle) && fullCycle > 0) return fullCycle;

  const catchDuration = Number(deletedSheep?.catchDuration);
  const shearDuration = Number(deletedSheep?.shearDuration);
  if (Number.isFinite(catchDuration) && catchDuration >= 0 && Number.isFinite(shearDuration) && shearDuration >= 0) {
    const totalCycle = catchDuration + shearDuration;
    return totalCycle > 0 ? totalCycle : 0;
  }

  return 0;
}

function getUndoLastSheepRestorePoint(previousSheep) {
  if (!previousSheep) {
    return {
      effectiveElapsedSeconds: 0,
      dayClockSecondsFromMidnight: Number.isFinite(appState.dayClockStartSecondsFromMidnight)
        ? appState.dayClockStartSecondsFromMidnight
        : null,
      source: "run-start"
    };
  }

  const effectiveElapsedSeconds = Number(previousSheep.effectiveElapsedSeconds);
  if (!Number.isFinite(effectiveElapsedSeconds) || effectiveElapsedSeconds < 0) return null;

  const endDayClockSeconds = Number(previousSheep.endDayClockSeconds);
  const fallbackDayClockSeconds = getDayClockSecondsFromEffectiveElapsed(effectiveElapsedSeconds);
  return {
    effectiveElapsedSeconds,
    dayClockSecondsFromMidnight: Number.isFinite(endDayClockSeconds)
      ? endDayClockSeconds
      : (Number.isFinite(fallbackDayClockSeconds) ? fallbackDayClockSeconds : null),
    source: "previous-sheep-end"
  };
}

function applyUndoLastSheepRestorePoint(restorePoint) {
  if (!restorePoint) return false;

  const restoredElapsedSeconds = Number(restorePoint.effectiveElapsedSeconds);
  if (!Number.isFinite(restoredElapsedSeconds) || restoredElapsedSeconds < 0) return false;

  const currentElapsedSeconds = Number(getEffectiveElapsedSeconds());
  const rewindSeconds = Number.isFinite(currentElapsedSeconds)
    ? Math.max(currentElapsedSeconds - restoredElapsedSeconds, 0)
    : 0;

  appState.effectiveElapsedBeforePauseMs = Math.max(restoredElapsedSeconds * 1000, 0);
  appState.effectiveResumeRealMs = null;

  if (Number.isFinite(appState.runEndTimeMs)) {
    const runDurationSeconds = getCurrentRunDurationSeconds();
    if (Number.isFinite(runDurationSeconds) && runDurationSeconds > 0) {
      appState.runEndTimeMs = Date.now() + Math.max(runDurationSeconds - restoredElapsedSeconds, 0) * 1000;
    } else if (rewindSeconds > 0) {
      appState.runEndTimeMs += rewindSeconds * 1000;
    }
  }

  const restoredDayClockSeconds = Number(restorePoint.dayClockSecondsFromMidnight);
  if (Number.isFinite(restoredDayClockSeconds)) {
    if (appState.paused) {
      appState.dayClockPausedSecondsFromMidnight = restoredDayClockSeconds;
    } else if (Number.isFinite(appState.dayClockStartSecondsFromMidnight)) {
      appState.dayClockStartRealMs = Date.now() - Math.max((restoredDayClockSeconds - appState.dayClockStartSecondsFromMidnight) * 1000, 0);
    }
  }

  return true;
}

function rewindSimulationTimingForUndoLastSheep(rewindSeconds, previousSheep = null) {
  if (applyUndoLastSheepRestorePoint(getUndoLastSheepRestorePoint(previousSheep))) return;

  const safeRewindSeconds = Number(rewindSeconds);
  if (!Number.isFinite(safeRewindSeconds) || safeRewindSeconds <= 0) return;

  const rewindMs = safeRewindSeconds * 1000;
  appState.effectiveElapsedBeforePauseMs = Math.max((Number(appState.effectiveElapsedBeforePauseMs) || 0) - rewindMs, 0);

  if (Number.isFinite(appState.runEndTimeMs)) {
    appState.runEndTimeMs += rewindMs;
  }

  if (appState.paused && Number.isFinite(appState.dayClockPausedSecondsFromMidnight)) {
    const dayClockFloor = Number.isFinite(appState.dayClockStartSecondsFromMidnight)
      ? appState.dayClockStartSecondsFromMidnight
      : 0;
    appState.dayClockPausedSecondsFromMidnight = Math.max(
      appState.dayClockPausedSecondsFromMidnight - safeRewindSeconds,
      dayClockFloor
    );
  } else if (Number.isFinite(appState.dayClockStartRealMs)) {
    const elapsedDayClockMs = Math.max(Date.now() - appState.dayClockStartRealMs, 0);
    appState.dayClockStartRealMs += Math.min(rewindMs, elapsedDayClockMs);
  }
}

async function undoLastSheep() {
  if (!canUndoLastSheep()) return { success: false, error: "Undo Last Sheep is only available during an active Simulation Mode run." };

  const confirmed = await confirmModal({
    title: "Undo last completed sheep?",
    message: "Undo the last completed sheep? This removes only the latest logged sheep and pauses the run so you can re-time it.",
    confirmText: "Undo Last Sheep",
    cancelText: "Cancel"
  });

  if (!confirmed) return { success: false, error: "Undo cancelled." };
  if (!canUndoLastSheep()) return { success: false, error: "Undo Last Sheep is no longer available." };

  const latestRunSheep = appState.sheep[appState.sheep.length - 1];
  const latestDaySheep = appState.daySheep[appState.daySheep.length - 1];
  const matchingDayIndex = appState.daySheep.findIndex((entry) => entry?.id === latestRunSheep?.id);

  if (!latestRunSheep?.id || matchingDayIndex === -1 || matchingDayIndex !== appState.daySheep.length - 1 || latestDaySheep?.id !== latestRunSheep.id) {
    const error = "Latest day sheep did not match latest run sheep; undo skipped.";
    console.warn(error);
    return { success: false, error };
  }

  appState.sheep.pop();
  appState.daySheep.pop();
  const previousRunSheep = appState.sheep[appState.sheep.length - 1] || null;

  const now = Date.now();
  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = now;
  appState.retryCatchOnResume = true;
  appState.currentMotorDisplay = "OFF";

  const newPhysicalSheepCount = appState.sheep.length;
  markFuturePenFillEventsUndone(newPhysicalSheepCount, now);
  clearPenFillPromptKeyBeyondSheepCount("pendingPenFillPromptKey", newPhysicalSheepCount);
  clearPenFillPromptKeyBeyondSheepCount("dismissedPenFillPromptKey", newPhysicalSheepCount);

  setPaused(true);
  rewindSimulationTimingForUndoLastSheep(getUndoLastSheepRewindSeconds(latestRunSheep), previousRunSheep);
  refreshAfterUndoLastSheep();
  autosaveState();

  return { success: true, sheep: latestRunSheep };
}

function resetCurrentSheepTiming() {
  if (!canResetCurrentSheepTiming()) return;

  const resetTimeMs = appState.paused && Number.isFinite(appState.pauseStartedAtMs)
    ? appState.pauseStartedAtMs
    : Date.now();
  const catchStartMs = Number(appState.currentCycle?.catchStart);
  const abandonedElapsedMs = Number.isFinite(catchStartMs)
    ? Math.max(resetTimeMs - catchStartMs, 0)
    : 0;

  if (abandonedElapsedMs > 0) {
    appState.discardedResetElapsedMs = getDiscardedResetElapsedMs() + abandonedElapsedMs;
    if (Number.isFinite(appState.runEndTimeMs)) {
      appState.runEndTimeMs += abandonedElapsedMs;
    }
    if (appState.paused && Number.isFinite(appState.dayClockPausedSecondsFromMidnight)) {
      const dayClockFloor = Number.isFinite(appState.dayClockStartSecondsFromMidnight)
        ? appState.dayClockStartSecondsFromMidnight
        : 0;
      appState.dayClockPausedSecondsFromMidnight = Math.max(
        appState.dayClockPausedSecondsFromMidnight - (abandonedElapsedMs / 1000),
        dayClockFloor
      );
    } else if (Number.isFinite(appState.dayClockStartRealMs)) {
      appState.dayClockStartRealMs += abandonedElapsedMs;
    }
  }

  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = resetTimeMs;
  appState.retryCatchOnResume = true;
  appState.currentMotorDisplay = "OFF";
  setPaused(true);
  updateResetCurrentSheepButtonUI();
  updateLivePanel();
  updateStatsPanel();
  autosaveState();
}


function maybeHandleRunEndExpired() {
  if (!appState.runActive) return false;
  const runEndStatus = getScheduledRunEndStatus();
  if (!Number.isFinite(runEndStatus.scheduledRunEndTimeMs)) return false;
  if (appState.breakActive || appState.preparedForNextRunBreak) return false;
  if (appState.pendingBreakAfterCurrentSheep) return false;
  if (!runEndStatus.ended) return false;

  if (appState.currentCycle.motorOn) {
    appState.pendingBreakAfterCurrentSheep = true;
    appState.pendingBreakStartedAtMs = runEndStatus.scheduledRunEndTimeMs;
    appState.pendingBreakSource = "record-day-break";
    console.log("Run expired; waiting for current sheep to finish before official break");
    return true;
  }

  finishRunAndEnterBreak("record-day-break", runEndStatus.scheduledRunEndTimeMs);
  return true;
}

function handleMotorOn() {
  if (!appState.runActive || isCountingPaused() || appState.currentCycle.motorOn) return;

  const now = Date.now();
  const officialScheduledRunEndTimeMs = getOfficialScheduledRunEndTimeMs();
  if (Number.isFinite(officialScheduledRunEndTimeMs) && now >= officialScheduledRunEndTimeMs) {
    maybeHandleRunEndExpired(now);
    return;
  }

  appState.currentCycle.motorOn = true;
  appState.currentCycle.shearStart = now;
  appState.currentMotorDisplay = "ON";

  if (!appState.currentCycle.catchStart) {
    appState.currentCycle.catchStart = now;
  }

  updateLivePanel();
}

function refreshAfterSheepEntry() {
  calculateAverages();
  updateTargetPacePredictionSnapshot(getLiveTargetPacePredictions());
  updateStatsPanel();
  updateLivePanel();
  renderLogTable();
  renderReviewList();
  drawTrendGraph();
  updateTrendFlags();
  updateFinishRunBreakButtonUI();
}

function handleMotorOff() {
  if (!appState.runActive || isCountingPaused()) return;

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
  const calculatedEndDayClockSeconds = getDayClockSecondsFromEffectiveElapsed(effectiveElapsedSeconds);
  const calculatedStartDayClockSeconds = Number.isFinite(calculatedEndDayClockSeconds) ? calculatedEndDayClockSeconds - shearDuration : NaN;
  const endDayClockSeconds = Number.isFinite(calculatedEndDayClockSeconds) ? calculatedEndDayClockSeconds : null;
  const startDayClockSeconds = Number.isFinite(calculatedStartDayClockSeconds) ? calculatedStartDayClockSeconds : null;
  const dayNumber = appState.daySheep.length + 1;
  const sheepId = `sheep-${Date.now()}-${dayNumber}`;
  const runEntry = {
    id: sheepId,
    status: SHEEP_STATUS.ACCEPTED,
    number: appState.sheep.length + 1,
    dayNumber,
    startTime: appState.currentCycle.shearStart,
    endTime: now,
    startDayClockSeconds,
    endDayClockSeconds,
    shearDuration,
    catchDuration,
    fullCycle,
    effectiveElapsedSeconds
  };
  appState.sheep.push(runEntry);
  appState.daySheep.push({
    ...runEntry,
    number: dayNumber
  });

  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = now;
  appState.currentMotorDisplay = "OFF";

  if (appState.pendingBreakAfterCurrentSheep) {
    const pendingBreakSource = appState.pendingBreakSource || "record-day-break";
    const pendingBreakStartedAtMs = Number.isFinite(appState.pendingBreakStartedAtMs)
      ? appState.pendingBreakStartedAtMs
      : (pendingBreakSource === "record-day-break" ? (getOfficialScheduledRunEndTimeMs() ?? Date.now()) : getCurrentAppTimelineMs());
    refreshAfterSheepEntry();
    finishRunAndEnterBreak(pendingBreakSource, pendingBreakStartedAtMs);
    return;
  }

  refreshAfterSheepEntry();
}


function enterOfficialBreak(source = "official", breakStartedAtMs = null) {
  appState.breakActive = true;
  appState.breakStartedAtMs = resolveOfficialBreakStartedAtMs(source, breakStartedAtMs);
  appState.breakSource = source;

  // Neutralise any in-progress sheep cycle so a motor test during break
  // cannot later create an inflated or false sheep entry.
  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = null;

  console.log("Official break started");
  if (isDashboardPage() && !appState.liveTimerId) {
    startLiveLoop();
  }
  updateLivePanel();
  updateStatsPanel();
}

function exitOfficialBreak() {
  appState.breakActive = false;
  appState.breakStartedAtMs = null;
  appState.breakSource = null;
  appState.preparedForNextRunBreak = false;
  appState.breakBannerDismissedForCurrentBreak = false;
  appState.pendingBreakAfterCurrentSheep = false;
  appState.pendingBreakStartedAtMs = null;
  appState.pendingBreakSource = null;

  // Reset the current cycle so counting only restarts from a clean
  // post-break motor ON event.
  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = Date.now();

  console.log("Official break ended");
  updateFinishRunBreakButtonUI();
  updateLivePanel();
  updateStatsPanel();
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

function calculateLivePerformanceExtremes() {
  if (!appState.daySheep.length) {
    return { fastest: null, slowest: null, last: null };
  }

  const fastest = appState.daySheep.reduce((best, entry) => (best === null || entry.fullCycle < best.fullCycle ? entry : best), null);
  const slowest = appState.daySheep.reduce((worst, entry) => (worst === null || entry.fullCycle > worst.fullCycle ? entry : worst), null);
  const last = appState.daySheep[appState.daySheep.length - 1] || null;

  return { fastest, slowest, last };
}

function getCurrentFinalCatchPredictionAnchorRunSeconds(elapsedRunSeconds = getEffectiveElapsedSeconds()) {
  const fallbackElapsedSeconds = Number(elapsedRunSeconds);
  const safeElapsedSeconds = Number.isFinite(fallbackElapsedSeconds) ? Math.max(fallbackElapsedSeconds, 0) : 0;
  const activeCycleStartMs = appState.currentCycle?.catchStart ?? appState.currentCycle?.shearStart;
  const hasActiveSheepOnBoard = Boolean(
    appState.runActive
    && appState.currentCycle?.motorOn
    && appState.currentCycle?.shearStart
    && Number.isFinite(activeCycleStartMs)
  );

  if (!hasActiveSheepOnBoard) {
    return safeElapsedSeconds;
  }

  const secondsSinceActiveStart = Math.max((Date.now() - activeCycleStartMs) / 1000, 0);
  return Math.max(safeElapsedSeconds - secondsSinceActiveStart, 0);
}

function getPredictedFinalCatchRunSeconds({
  elapsedRunSeconds,
  runLengthSeconds,
  avgCycleSeconds,
  anchorRunSeconds = elapsedRunSeconds
} = {}) {
  const safeRunLengthSeconds = Number(runLengthSeconds);
  const safeAvgCycleSeconds = Number(avgCycleSeconds);
  const rawAnchorRunSeconds = Number(anchorRunSeconds);

  if (!Number.isFinite(safeRunLengthSeconds) || safeRunLengthSeconds <= 0) return null;
  if (!Number.isFinite(safeAvgCycleSeconds) || safeAvgCycleSeconds <= 0) return null;
  if (!Number.isFinite(rawAnchorRunSeconds)) return null;

  const safeAnchorRunSeconds = Math.max(rawAnchorRunSeconds, 0);
  const secondsFromAnchorToBell = safeRunLengthSeconds - safeAnchorRunSeconds;
  if (secondsFromAnchorToBell <= 0) return null;

  const catchStartsBeforeBell = Math.max(Math.ceil(secondsFromAnchorToBell / safeAvgCycleSeconds), 1);
  let predictedFinalCatchRunSeconds = safeAnchorRunSeconds + ((catchStartsBeforeBell - 1) * safeAvgCycleSeconds);

  while (predictedFinalCatchRunSeconds >= safeRunLengthSeconds && predictedFinalCatchRunSeconds >= safeAvgCycleSeconds) {
    predictedFinalCatchRunSeconds -= safeAvgCycleSeconds;
  }

  return predictedFinalCatchRunSeconds < safeRunLengthSeconds
    ? Math.max(predictedFinalCatchRunSeconds, 0)
    : null;
}

function calculateTargetMetrics() {
  const elapsedSeconds = Math.max(getEffectiveElapsedSeconds(), 0);
  const runLengthSeconds = getCurrentRunDurationSeconds();
  const requiredDaySheep = getRequiredDaySheep();
  const scheduleSeconds = getScheduleSeconds();
  const requiredRunSheep = getRequiredRunSheep(requiredDaySheep, scheduleSeconds, appState.currentRunIndex);

  const requiredRate = runLengthSeconds > 0 ? (requiredRunSheep / runLengthSeconds) * 3600 : 0;
  const requiredCycle = requiredRunSheep > 0 && runLengthSeconds > 0 ? runLengthSeconds / requiredRunSheep : 0;

  const avgCycleSeconds = appState.currentStats.avgCycle;
  const physicalSheepDoneThisRun = getPhysicalRunSheepCount();
  const officialSheepDoneThisRun = getOfficialRunSheepCount();
  const elapsedRunSeconds = elapsedSeconds;
  const runRemainingSeconds = Math.max(runLengthSeconds - elapsedRunSeconds, 0);
  const remainingToTarget = requiredRunSheep - officialSheepDoneThisRun;
  let projectedFuturePhysicalSheep = 0;
  let projectedTotal = officialSheepDoneThisRun;
  let targetCatchRunSeconds = elapsedRunSeconds;
  let timeSpareText = "—";
  let timeSpareIsAhead = null;
  let maxPossibleRunTotal = officialSheepDoneThisRun;
  let maxCatchRunSeconds = elapsedRunSeconds;
  let predictedFinalCatchRunSeconds = null;
  const targetAlreadyReached = remainingToTarget <= 0;
  let targetReachable = targetAlreadyReached;

  if (avgCycleSeconds > 0) {
    projectedFuturePhysicalSheep = Math.max(Math.floor(runRemainingSeconds / avgCycleSeconds), 0);
    projectedTotal = officialSheepDoneThisRun + projectedFuturePhysicalSheep;
    maxPossibleRunTotal = projectedTotal;
    const targetCatchOffsetSeconds = targetAlreadyReached
      ? 0
      : Math.max(remainingToTarget - 1, 0) * avgCycleSeconds;
    targetCatchRunSeconds = elapsedRunSeconds + targetCatchOffsetSeconds;

    // Target reach is based on the catch/start moment: the target sheep only needs
    // to be caught/started before the bell, not fully completed before run end.
    targetReachable = targetAlreadyReached || targetCatchRunSeconds < runLengthSeconds;

    // Dynamic "last possible catch" = predicted hand-on-door start time for the final sheep that can still begin before the run ends.
    // Keep this catch/start-based and in lockstep with projectedFuturePhysicalSheep; do not subtract an artificial end-of-run buffer.
    maxCatchRunSeconds = projectedFuturePhysicalSheep > 0
      ? elapsedRunSeconds + (projectedFuturePhysicalSheep - 1) * avgCycleSeconds
      : elapsedRunSeconds;

    predictedFinalCatchRunSeconds = getPredictedFinalCatchRunSeconds({
      elapsedRunSeconds,
      runLengthSeconds,
      avgCycleSeconds,
      anchorRunSeconds: getCurrentFinalCatchPredictionAnchorRunSeconds(elapsedRunSeconds)
    });

    const timeDifference = runLengthSeconds - targetCatchRunSeconds;
    timeSpareText = timeDifference >= 0
      ? `Target-count sheep catch/start projected ${formatTargetPaceCountdownDisplay(timeDifference)} before end of run`
      : `Target-count sheep catch/start projected ${formatTargetPaceCountdownDisplay(Math.abs(timeDifference))} after end of run`;
    timeSpareIsAhead = timeDifference >= 0;
  }

  targetCatchRunSeconds = Math.min(Math.max(targetCatchRunSeconds, 0), Math.max(runLengthSeconds, 0));
  maxCatchRunSeconds = Math.min(Math.max(maxCatchRunSeconds, 0), Math.max(runLengthSeconds, 0));

  const remainingSeconds = Math.max(runLengthSeconds - elapsedSeconds, 0);
  const remainingSheep = Math.max(requiredRunSheep - officialSheepDoneThisRun, 0);
  const requiredCycleRemaining = remainingSheep > 0 ? remainingSeconds / remainingSheep : 0;

  return {
    requiredRate,
    requiredCycle,
    projectedTotal,
    requiredCycleRemaining,
    remainingSheep,
    physicalSheepDoneThisRun,
    officialSheepDoneThisRun,
    projectedFuturePhysicalSheep,
    requiredDaySheep,
    requiredRunSheep,
    targetAlreadyReached,
    targetReachable,
    targetCatchRunSeconds,
    timeSpareText,
    timeSpareIsAhead,
    maxCatchRunSeconds,
    predictedFinalCatchRunSeconds,
    maxPossibleRunTotal
  };
}

function calculateRequiredRunTotalSheep() {
  const dayTarget = parseRequiredTotalSheep();
  if (dayTarget === null) return null;
  return getRequiredRunSheep(dayTarget, getScheduleSeconds(), appState.currentRunIndex);
}

function predictCatch(targetMetrics = null, requiredRunTotalSheep = null) {
  const target = targetMetrics ?? calculateTargetMetrics();
  const requiredCycle = target.requiredCycle;

  if (!appState.runActive || appState.target.sheep <= 0 || appState.target.runLengthSeconds <= 0) {
    return "Set target and start run.";
  }

  const avgCycle = appState.currentStats.avgCycle;
  if (avgCycle <= 0 || requiredCycle <= 0) return "Waiting for completed sheep.";

  const projectedTotal = Number.isFinite(target.projectedTotal) ? target.projectedTotal : null;
  const requiredRunSheep = Number.isFinite(requiredRunTotalSheep) ? requiredRunTotalSheep : null;
  const hasOutcomeContext = projectedTotal !== null && requiredRunSheep !== null;

  if (avgCycle < requiredCycle) {
    const paceDiff = (requiredCycle - avgCycle).toFixed(2);
    if (hasOutcomeContext) {
      const sheepDiff = projectedTotal - requiredRunSheep;
      if (sheepDiff > 0) {
        return `On pace — ${paceDiff}s spare per sheep. Projected official run total: ${projectedTotal} sheep, ${sheepDiff} ahead.`;
      }
      if (sheepDiff < 0) {
        return `On pace — ${paceDiff}s spare per sheep. Projected official run total: ${projectedTotal} sheep, ${Math.abs(sheepDiff)} behind.`;
      }
      return `On pace — ${paceDiff}s spare per sheep. Projected official run total: ${projectedTotal} sheep, on target.`;
    }
    return `On pace — ${paceDiff}s spare per sheep.`;
  }

  if (avgCycle > requiredCycle) {
    const paceDiff = (avgCycle - requiredCycle).toFixed(2);
    if (hasOutcomeContext) {
      const sheepDiff = projectedTotal - requiredRunSheep;
      if (sheepDiff > 0) {
        return `Behind — ${paceDiff}s slow per sheep. Projected official run total: ${projectedTotal} sheep, ${sheepDiff} ahead.`;
      }
      if (sheepDiff < 0) {
        return `Behind — ${paceDiff}s slow per sheep. Projected official run total: ${projectedTotal} sheep, ${Math.abs(sheepDiff)} behind.`;
      }
      return `Behind — ${paceDiff}s slow per sheep. Projected official run total: ${projectedTotal} sheep, on target.`;
    }
    return `Behind — ${paceDiff}s slow per sheep.`;
  }

  if (hasOutcomeContext) {
    return `On target — projected official finish: ${projectedTotal} sheep.`;
  }

  return "On target.";
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
      <div>Sheep: ${block.count} • Avg Total Time Per Sheep: ${block.avgCycle.toFixed(3)}s</div>
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
  elements.runReviewText.innerHTML = "";
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
  const avg = (arr) => arr.length ? `${(arr.reduce((sum, i) => sum + i.fullCycle, 0) / arr.length).toFixed(3)}s` : "n/a";
  const best = segs.reduce((a, b) => (!a || b.avgCycle < a.avgCycle ? b : a), null);
  const worst = segs.reduce((a, b) => (!a || b.avgCycle > a.avgCycle ? b : a), null);
  const verdict = segs.length > 1 && segs[segs.length - 1].avgCycle < segs[0].avgCycle ? "Strong finish" : "Maintained pace";
  const lostRange = worst ? buildRangeLabel(worst.startElapsed, worst.startElapsed + appState.trendBucketMinutes * 60) : "n/a";
  const bestRange = best ? buildRangeLabel(best.startElapsed, best.startElapsed + appState.trendBucketMinutes * 60) : "n/a";
  const markerStats = buildResolvedMarkerStats(appState.sheep, appState.markerSettings);
  appState.runReviewText = [
    `First 25% of run: ${avg(firstQuarter)} Total Time Per Sheep`,
    `First 50% of run: ${avg(firstHalf)} Total Time Per Sheep`,
    `Best: ${bestRange}`,
    `Worst: ${lostRange}`,
    `Recovery strongest: ${bestRange}`,
    verdict,
    formatMarkerStatsSummary(markerStats)
  ].join("\n");
  renderRunReviewSummary({
    firstQuarterAverage: avg(firstQuarter),
    firstHalfAverage: avg(firstHalf),
    bestRange,
    lostRange,
    verdict,
    markerStats
  });
}

function renderRunReviewSummary(summary) {
  if (!elements.runReviewText) return;
  elements.runReviewText.innerHTML = "";

  const review = document.createElement("div");
  review.className = "run-review-summary";

  const statsGrid = document.createElement("div");
  statsGrid.className = "run-review-stats-grid";
  [
    ["First 25% of run", summary.firstQuarterAverage],
    ["First 50% of run", summary.firstHalfAverage],
    ["Best", summary.bestRange],
    ["Worst", summary.lostRange],
    ["Finish", summary.verdict]
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "run-review-stat-card";
    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    const valueEl = document.createElement("strong");
    valueEl.textContent = value;
    item.append(labelEl, valueEl);
    statsGrid.appendChild(item);
  });
  review.appendChild(statsGrid);

  const markerSection = document.createElement("div");
  markerSection.className = "run-review-marker-breakdown";
  const markerTitle = document.createElement("h4");
  markerTitle.textContent = "Marker Breakdown";
  markerSection.appendChild(markerTitle);

  const markerRows = [
    ["Drink", summary.markerStats?.buckets?.drink?.count || 0],
    ["Cutter", summary.markerStats?.buckets?.cutter?.count || 0],
    ["Comb", summary.markerStats?.buckets?.comb?.count || 0],
    ["Custom", summary.markerStats?.buckets?.[MANUAL_MARKER_CUSTOM_TYPE]?.count || 0]
  ];
  const maxCount = Math.max(...markerRows.map(([, count]) => count), 1);
  markerRows.forEach(([label, count]) => {
    const row = document.createElement("div");
    row.className = "run-review-marker-row";
    const labelEl = document.createElement("span");
    labelEl.className = "run-review-marker-label";
    labelEl.textContent = label;
    const barWrap = document.createElement("span");
    barWrap.className = "run-review-marker-bar-wrap";
    const bar = document.createElement("span");
    bar.className = "run-review-marker-bar";
    bar.style.width = `${count ? Math.max((count / maxCount) * 100, 10) : 0}%`;
    barWrap.appendChild(bar);
    const countEl = document.createElement("strong");
    countEl.className = "run-review-marker-count";
    countEl.textContent = String(count);
    row.append(labelEl, barWrap, countEl);
    markerSection.appendChild(row);
  });
  review.appendChild(markerSection);
  elements.runReviewText.appendChild(review);
}


const COMPLETED_RUN_SNAPSHOT_VERSION = 1;

function cloneSnapshotValue(value, fallback = null) {
  if (value === undefined) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    console.debug("Failed to clone completed run snapshot value", error);
    return fallback;
  }
}

function buildCompletedRunKeyValueRows(pairs) {
  return pairs.map(([label, value]) => [label, value === undefined || value === null || value === "" ? "—" : String(value)]);
}

function getCompletedRunPerformanceRows() {
  return buildCompletedRunKeyValueRows([
    ["Total sheep shorn", getSafeText("totalSheep")],
    ["Official count", getSafeText("officialSheepCount")],
    ["Rejects", getSafeText("rejectedSheepCount")],
    ["Quality", getSafeText("qualityRatingSummary")],
    ["Average catch time", getSafeText("avgCatch")],
    ["Average shear time", getSafeText("avgShear")],
    ["Average Total Time Per Sheep", getSafeText("avgCycle")],
    ["Sheep per hour", getSafeText("sheepPerHour")],
    ["Drink average", getSafeText("markerAvgDrink")],
    ["Cutter change average", getSafeText("markerAvgCutter")],
    ["Comb/handpiece change average", getSafeText("markerAvgComb")],
    [getSafeText("lastCatchTimeLabel", "Last catch time:"), getSafeText("lastCatchTime")],
    [getSafeText("lastShearTimeLabel", "Last shear time:"), getSafeText("lastShearTime")],
    [getSafeText("lastSheepTimeLabel", "Last total sheep time:"), getSafeText("lastSheepTime")],
    ["Fastest sheep today", getSafeText("fastestSheepToday")],
    ["Slowest sheep today", getSafeText("slowestSheepToday")]
  ]);
}

function getCompletedRunTargetPaceRows() {
  return buildCompletedRunKeyValueRows([
    ["Required average total time per sheep", getSafeText("requiredCycle")],
    ["Required 15-minute total", getSafeText("requiredQuarterTotal")],
    ["Required sheep per hour", getSafeText("requiredRate")],
    ["Required run total", getSafeText("requiredRunTotalSheep")],
    ["Required daily total", getSafeText("requiredDayTotalSheep")],
    ["Predicted 15-minute total", getSafeText("predictedQuarterTotal")],
    ["Predicted hour total", getSafeText("predictedHourTotal")],
    ["Predicted official run total", getSafeText("projectedTotal")],
    [getSafeText("estimatedLastCatchTimeLabel", "Predicted time to catch target:"), getSafeText("estimatedLastCatchTime")],
    ["Predicted final catch of run", getSafeText("maxCatchTime")],
    ["Pace difference per sheep", getSafeText("catchPrediction")],
    [getSafeText("timeSpareToBellLabel", "Run target timing"), getSafeText("timeSpareToBell")]
  ]);
}

function getCompletedRunTimingRows() {
  return buildCompletedRunKeyValueRows([
    ["Motor state", getSafeText("motorState")],
    ["Current catch time", getSafeText("currentCatch")],
    ["Current shear time", getSafeText("currentShear")],
    ["Total time per sheep", getSafeText("currentTotalSheepTime")],
    ["Run clock", getSafeText("runClock")],
    ["Run countdown", getSafeText("runCountdown")],
    ["Day clock", getSafeText("dayClock")],
    ["Quarter", getSafeText("currentQuarter")],
    ["Quarter clock", getSafeText("quarterClock")],
    ["Sheep this quarter", getSafeText("quarterSheepCount")],
    ["Quarter target completion time", getSafeText("quarterTargetCompletionTime")],
    ["Timing alert", getSafeText("timingAlert")],
    ["Next drink", getSafeText("nextDrinkCountdown")],
    ["Pen refill", getSafeText("penRefillAlert")]
  ]);
}

function getCompletedRunReviewRows() {
  return Array.isArray(appState.reviewBlocks)
    ? appState.reviewBlocks.map((block) => [
      block.range || "—",
      block.count ?? "—",
      Number.isFinite(Number(block.avgCycle)) ? `${Number(block.avgCycle).toFixed(3)}s` : "—",
      block.deltaText || "—",
      block.status || "—"
    ])
    : [];
}

function getCompletedRunTrendBucketRows(bucketSummaries = getSortedBucketSummaries()) {
  return Array.isArray(bucketSummaries)
    ? bucketSummaries.map((bucket) => [
      bucket.key ?? "—",
      Number.isFinite(Number(bucket.startElapsed)) ? formatCountdown(bucket.startElapsed) : "—",
      bucket.count ?? "—",
      Number.isFinite(Number(bucket.avgCycle)) ? `${Number(bucket.avgCycle).toFixed(3)}s` : "—",
      Number.isFinite(Number(bucket.avgCatch)) ? `${Number(bucket.avgCatch).toFixed(3)}s` : "—"
    ])
    : [];
}

function getCompletedRunSheepLogRows() {
  return Array.isArray(appState.sheep)
    ? appState.sheep.map((entry) => {
      const manualMarkers = getConfirmedManualMarkersForEntry(entry);
      const markerLabel = getManualMarkersDisplayLabel(manualMarkers);
      const noteText = normalizeSheepNote(entry?.note);
      return [
        entry?.number ?? "—",
        formatSheepLogClock(entry, "start"),
        formatSheepLogClock(entry, "end"),
        formatSeconds(entry?.catchDuration),
        formatSeconds(entry?.shearDuration),
        formatSeconds(entry?.fullCycle),
        markerLabel || "—",
        noteText || "—"
      ];
    })
    : [];
}

function getCompletedRunQualityRows() {
  return sanitizeQualityRatings(appState.qualityRatings).map((rating) => [
    rating.periodNumber || "—",
    rating.qualityRating || "—",
    rating.officialCountForPeriod ?? "—",
    rating.physicalCountForPeriod ?? "—",
    rating.officialWarning ? [rating.warningReason, rating.warningNotes].filter(Boolean).join(" — ") || "Yes" : "No",
    rating.notes || "—"
  ]);
}

function buildCompletedRunSnapshot() {
  const sheep = Array.isArray(appState.sheep) ? appState.sheep : [];
  const lastSheep = sheep[sheep.length - 1] || null;
  const trendBucketSummaries = getSortedBucketSummaries();
  const currentRunPenFillEvents = getCurrentRunPenFillEvents();
  const runStartTime = appState.runStartTime;
  const officialScheduledRunEndTime = getOfficialScheduledRunEndTimeMs();
  const actualLastSheepEndTime = Number.isFinite(Number(lastSheep?.endTime)) ? Number(lastSheep.endTime) : null;
  const runStartDayClockSeconds = getFiniteClockNumber(appState.dayClockStartSecondsFromMidnight);
  const officialScheduledRunEndDayClockSeconds = getReviewRunDayClockSecondsFromTimestamp(officialScheduledRunEndTime, runStartTime, runStartDayClockSeconds);
  const actualLastSheepEndDayClockSeconds = Number.isFinite(getFiniteClockNumber(lastSheep?.endDayClockSeconds))
    ? getFiniteClockNumber(lastSheep.endDayClockSeconds)
    : getReviewRunDayClockSecondsFromTimestamp(actualLastSheepEndTime, runStartTime, runStartDayClockSeconds);
  return {
    schema: "sheariq.latestCompletedRunSnapshot",
    version: COMPLETED_RUN_SNAPSHOT_VERSION,
    capturedAt: new Date().toISOString(),
    farm: elements.farmInput?.value || appState.farm || "",
    sessionDate: elements.sessionDate?.value || "",
    recordType: appState.recordType || "none",
    recordTypeLabel: getRecordTypeLabel(appState.recordType),
    runType: elements.runType?.value || "8",
    runTypeLabel: getTimeSystemLabel(elements.runType?.value || "8"),
    runIndex: Number(appState.currentRunIndex) || 0,
    runNumber: (Number(appState.currentRunIndex) || 0) + 1,
    runStartTime,
    officialScheduledRunEndTime,
    actualLastSheepEndTime,
    runStartDayClockSeconds: Number.isFinite(runStartDayClockSeconds) ? runStartDayClockSeconds : null,
    officialScheduledRunEndDayClockSeconds: Number.isFinite(officialScheduledRunEndDayClockSeconds) ? officialScheduledRunEndDayClockSeconds : null,
    actualLastSheepEndDayClockSeconds: Number.isFinite(actualLastSheepEndDayClockSeconds) ? actualLastSheepEndDayClockSeconds : null,
    runStartDayClockDisplay: formatReviewRunDayClockSeconds(runStartDayClockSeconds),
    officialScheduledRunEndDayClockDisplay: formatReviewRunDayClockSeconds(officialScheduledRunEndDayClockSeconds),
    actualLastSheepEndDayClockDisplay: formatReviewRunDayClockSeconds(actualLastSheepEndDayClockSeconds),
    effectiveElapsedSeconds: getEffectiveElapsedSeconds(),
    targetSheep: Number(elements.targetSheepInput?.value ?? appState.target?.sheep ?? 0) || 0,
    runLengthSeconds: getCurrentRunDurationSeconds(),
    trendBucketMinutes: Number(appState.trendBucketMinutes) || 15,
    currentStats: cloneSnapshotValue(appState.currentStats, {}),
    target: cloneSnapshotValue(appState.target, {}),
    targetPacePredictionSnapshot: cloneSnapshotValue(appState.targetPacePredictionSnapshot, null),
    sheep: cloneSnapshotValue(sheep, []),
    penFillEvents: cloneSnapshotValue(currentRunPenFillEvents, []),
    qualityRatings: cloneSnapshotValue(sanitizeQualityRatings(appState.qualityRatings), []),
    officialRejectedAdjustment: getOfficialRejectedAdjustmentCount(),
    reviewBlocks: cloneSnapshotValue(appState.reviewBlocks, []),
    trendBuckets: cloneSnapshotValue(trendBucketSummaries, []),
    trendFlags: Array.isArray(appState.trendFlags) ? [...appState.trendFlags] : [],
    runReviewText: appState.runReviewText || "",
    display: {
      performanceRows: getCompletedRunPerformanceRows(),
      targetPaceRows: getCompletedRunTargetPaceRows(),
      timingRows: getCompletedRunTimingRows(),
      penRefillPlannerRows: getPdfPenRefillPlannerRows(),
      reviewRows: getCompletedRunReviewRows(),
      trendFlagRows: Array.isArray(appState.trendFlags) ? appState.trendFlags.map((flag) => [flag]) : [],
      trendBucketRows: getCompletedRunTrendBucketRows(trendBucketSummaries),
      sheepLogRows: getCompletedRunSheepLogRows(),
      qualityRows: getCompletedRunQualityRows()
    }
  };
}

function hasCompletedRunSnapshot() {
  return Boolean(appState.latestCompletedRunSnapshot && typeof appState.latestCompletedRunSnapshot === "object");
}

function updateReviewRunButtonState() {
  if (!elements.reviewRunBtn) return;
  const hasSnapshot = hasCompletedRunSnapshot();
  elements.reviewRunBtn.disabled = !hasSnapshot;
  elements.reviewRunBtn.title = hasSnapshot ? "Open the latest completed run snapshot" : "No completed run snapshot yet";
}

function formatReviewRunDateTime(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) return "—";
  return new Date(timestamp).toLocaleString();
}

function formatReviewRunSessionDate(sessionDate) {
  if (typeof sessionDate !== "string") return "—";
  const match = sessionDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return sessionDate.trim() || "—";

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const day = Number(dayText);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  const parsedDate = new Date(Date.UTC(year, monthIndex, day));
  const isValidDate = Number.isInteger(year)
    && Number.isInteger(monthIndex)
    && Number.isInteger(day)
    && parsedDate.getUTCFullYear() === year
    && parsedDate.getUTCMonth() === monthIndex
    && parsedDate.getUTCDate() === day;
  if (!isValidDate) return sessionDate.trim() || "—";

  return `${day} ${monthNames[monthIndex]} ${year}`;
}

function getReviewRunDayClockSecondsFromTimestamp(timestamp, runStartTime, runStartDayClockSeconds) {
  const safeTimestamp = getFiniteClockNumber(timestamp);
  const safeRunStartTime = getFiniteClockNumber(runStartTime);
  const safeRunStartDayClockSeconds = getFiniteClockNumber(runStartDayClockSeconds);
  if (!Number.isFinite(safeTimestamp) || !Number.isFinite(safeRunStartTime) || !Number.isFinite(safeRunStartDayClockSeconds)) return NaN;
  return safeRunStartDayClockSeconds + ((safeTimestamp - safeRunStartTime) / 1000);
}

function formatReviewRunDayClockSeconds(secondsFromMidnight) {
  const safeSeconds = getFiniteClockNumber(secondsFromMidnight);
  return Number.isFinite(safeSeconds) ? formatSecondsFromMidnightClockAmPm(safeSeconds) : "—";
}

function formatReviewRunSnapshotDayClock(snapshot, displayKey, secondsKey, timestampKey) {
  const storedDisplay = snapshot?.[displayKey];
  if (typeof storedDisplay === "string" && storedDisplay.trim() !== "") return storedDisplay;

  const storedSeconds = getFiniteClockNumber(snapshot?.[secondsKey]);
  if (Number.isFinite(storedSeconds)) return formatReviewRunDayClockSeconds(storedSeconds);

  const fallbackSeconds = getReviewRunDayClockSecondsFromTimestamp(
    snapshot?.[timestampKey],
    snapshot?.runStartTime,
    snapshot?.runStartDayClockSeconds
  );
  if (Number.isFinite(fallbackSeconds)) return formatReviewRunDayClockSeconds(fallbackSeconds);

  return formatReviewRunDateTime(snapshot?.[timestampKey]);
}

function getReviewRunNumberLabel(snapshot) {
  const runNumber = getFiniteClockNumber(snapshot?.runNumber);
  if (Number.isFinite(runNumber) && runNumber > 0) return `Run ${Math.floor(runNumber)}`;

  const runIndex = getFiniteClockNumber(snapshot?.runIndex);
  if (Number.isFinite(runIndex) && runIndex >= 0) return `Run ${Math.floor(runIndex) + 1}`;

  return "Run —";
}

function getReviewRunSectionBodyId(index) {
  return `reviewRunSectionBody-${index}`;
}

function updateReviewRunSectionMoveButtons(container) {
  const sections = Array.from(container.querySelectorAll(":scope > .review-run-section"));
  sections.forEach((section, index) => {
    const up = section.querySelector(".review-run-section-move-up");
    const down = section.querySelector(".review-run-section-move-down");
    if (up) up.disabled = index === 0;
    if (down) down.disabled = index === sections.length - 1;
  });
}

function appendReviewRunSection(parent, title, options = {}) {
  const section = document.createElement("section");
  section.className = "review-run-section";
  const sectionIndex = parent.querySelectorAll(":scope > .review-run-section").length;
  const bodyId = getReviewRunSectionBodyId(sectionIndex);

  const header = document.createElement("div");
  header.className = "review-run-section-header";

  const heading = document.createElement("h4");
  heading.textContent = title;

  const actions = document.createElement("div");
  actions.className = "review-run-section-actions";

  const moveUp = document.createElement("button");
  moveUp.className = "review-run-section-control review-run-section-move-up";
  moveUp.type = "button";
  moveUp.textContent = "Move Up";
  moveUp.setAttribute("aria-label", `Move ${title} section up`);

  const moveDown = document.createElement("button");
  moveDown.className = "review-run-section-control review-run-section-move-down";
  moveDown.type = "button";
  moveDown.textContent = "Move Down";
  moveDown.setAttribute("aria-label", `Move ${title} section down`);

  const collapse = document.createElement("button");
  collapse.className = "review-run-section-control review-run-section-collapse";
  collapse.type = "button";
  collapse.textContent = "Collapse";
  collapse.setAttribute("aria-expanded", "true");
  collapse.setAttribute("aria-controls", bodyId);
  collapse.setAttribute("aria-label", `Collapse ${title} section`);

  actions.append(moveUp, moveDown, collapse);
  header.append(heading, actions);

  const body = document.createElement("div");
  body.className = "review-run-section-body";
  body.id = bodyId;

  collapse.addEventListener("click", () => {
    const isCollapsed = section.classList.toggle("is-collapsed");
    collapse.textContent = isCollapsed ? "Expand" : "Collapse";
    collapse.setAttribute("aria-expanded", String(!isCollapsed));
    collapse.setAttribute("aria-label", `${isCollapsed ? "Expand" : "Collapse"} ${title} section`);
  });

  moveUp.addEventListener("click", () => {
    const previous = section.previousElementSibling;
    if (previous && previous.classList.contains("review-run-section")) {
      parent.insertBefore(section, previous);
      updateReviewRunSectionMoveButtons(parent);
    }
  });

  moveDown.addEventListener("click", () => {
    const next = section.nextElementSibling;
    if (next && next.classList.contains("review-run-section")) {
      parent.insertBefore(next, section);
      updateReviewRunSectionMoveButtons(parent);
    }
  });

  section.append(header, body);
  parent.appendChild(section);

  if (options.collapsedByDefault) {
    section.classList.add("is-collapsed");
    collapse.textContent = "Expand";
    collapse.setAttribute("aria-expanded", "false");
    collapse.setAttribute("aria-label", `Expand ${title} section`);
  }

  updateReviewRunSectionMoveButtons(parent);
  return body;
}

function normalizeReviewRunCell(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      text: value.text === undefined || value.text === null || value.text === "" ? "—" : String(value.text),
      className: value.className || "",
      title: value.title || "",
      node: value.node || null
    };
  }
  return {
    text: value === undefined || value === null || value === "" ? "—" : String(value),
    className: "",
    title: "",
    node: null
  };
}

function appendReviewRunCellContent(cellElement, cell) {
  if (cell?.node && typeof Node !== "undefined" && cell.node instanceof Node) {
    cellElement.appendChild(cell.node);
    return;
  }
  cellElement.textContent = cell?.text || "—";
}

function appendReviewRunKeyValueTable(parent, rows) {
  const table = document.createElement("table");
  table.className = "review-run-table review-run-key-value-table";
  const tbody = document.createElement("tbody");
  (Array.isArray(rows) ? rows : []).forEach(([label, value]) => {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.scope = "row";
    const labelCell = normalizeReviewRunCell(label);
    th.textContent = labelCell.text.replace(/:\s*$/, "");
    if (labelCell.className) th.className = labelCell.className;
    const td = document.createElement("td");
    const valueCell = normalizeReviewRunCell(value);
    appendReviewRunCellContent(td, valueCell);
    if (valueCell.className) td.className = valueCell.className;
    if (valueCell.title) td.title = valueCell.title;
    tr.append(th, td);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  parent.appendChild(table);
}

function appendReviewRunDataTable(parent, headers, rows, emptyText = "No data captured.") {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length) {
    const empty = document.createElement("div");
    empty.className = "status-box minimal-status";
    empty.textContent = emptyText;
    parent.appendChild(empty);
    return;
  }
  const wrap = document.createElement("div");
  wrap.className = "review-run-table-wrap";
  const table = document.createElement("table");
  table.className = "review-run-table";
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  const tbody = document.createElement("tbody");
  safeRows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((value) => {
      const td = document.createElement("td");
      const cell = normalizeReviewRunCell(value);
      appendReviewRunCellContent(td, cell);
      if (cell.className) td.className = cell.className;
      if (cell.title) td.title = cell.title;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.append(thead, tbody);
  wrap.appendChild(table);
  parent.appendChild(wrap);
}

function getReviewRunRequiredCycle(snapshot) {
  const targetRequired = Number(snapshot?.target?.requiredCycle);
  if (Number.isFinite(targetRequired) && targetRequired > 0) return targetRequired;

  const targetRows = Array.isArray(snapshot?.display?.targetPaceRows) ? snapshot.display.targetPaceRows : [];
  const requiredAverageRow = targetRows.find(([label]) => String(label).toLowerCase().includes("required average total time per sheep"));
  const requiredAverageFromDisplay = parseReviewRunSecondsText(requiredAverageRow?.[1]);
  if (Number.isFinite(requiredAverageFromDisplay) && requiredAverageFromDisplay > 0) return requiredAverageFromDisplay;

  const targetSheep = Number(snapshot?.targetSheep || snapshot?.target?.sheep);
  const runLengthSeconds = Number(snapshot?.runLengthSeconds || snapshot?.target?.runLengthSeconds);
  return Number.isFinite(targetSheep) && targetSheep > 0 && Number.isFinite(runLengthSeconds) && runLengthSeconds > 0
    ? runLengthSeconds / targetSheep
    : NaN;
}

function getReviewRunPaceClass(value, comparison) {
  const numericValue = Number(value);
  const numericComparison = Number(comparison);
  if (!Number.isFinite(numericValue) || !Number.isFinite(numericComparison) || numericComparison <= 0) return "";
  return numericValue <= numericComparison ? "review-run-good" : "review-run-bad";
}

function formatReviewRunRequiredDelta(value, requiredCycle) {
  const numericValue = Number(value);
  const numericRequired = Number(requiredCycle);
  if (!Number.isFinite(numericValue) || !Number.isFinite(numericRequired) || numericRequired <= 0) return "required average unavailable";
  const delta = numericRequired - numericValue;
  if (Math.abs(delta) < 0.05) return "equal to required";
  return `${Math.abs(delta).toFixed(1)}s ${delta > 0 ? "quicker" : "slower"} than required`;
}

function getReviewRunRequiredDeltaClass(value, requiredCycle) {
  const numericValue = Number(value);
  const numericRequired = Number(requiredCycle);
  if (!Number.isFinite(numericValue) || !Number.isFinite(numericRequired) || numericRequired <= 0) return "";
  return numericValue <= numericRequired ? "review-run-good" : "review-run-bad";
}

function buildReviewRunPaceCell(text, value, comparison) {
  return { text, className: getReviewRunPaceClass(value, comparison) };
}

function parseReviewRunSecondsText(value) {
  const match = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

function getReviewRunTrendBucketMinutes(snapshot) {
  const explicitMinutes = Number(snapshot?.trendBucketMinutes);
  if (Number.isFinite(explicitMinutes) && explicitMinutes > 0) return explicitMinutes;
  const buckets = Array.isArray(snapshot?.trendBuckets) ? snapshot.trendBuckets : [];
  const starts = buckets.map((bucket) => Number(bucket?.startElapsed)).filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  for (let index = 1; index < starts.length; index += 1) {
    const diffSeconds = starts[index] - starts[index - 1];
    if (diffSeconds > 0) return diffSeconds / 60;
  }
  return 15;
}

function getReviewRunTrendBucketLabel(snapshot) {
  const minutes = getReviewRunTrendBucketMinutes(snapshot);
  return Number.isInteger(minutes) ? `${minutes}-minute` : `${minutes.toFixed(1)}-minute`;
}

function getReviewRunBucketRange(snapshot, bucket) {
  const bucketMinutes = getReviewRunTrendBucketMinutes(snapshot);
  const startElapsed = Number(bucket?.startElapsed);
  const endElapsed = startElapsed + (bucketMinutes * 60);
  const runStartDayClockSeconds = Number(snapshot?.runStartDayClockSeconds);
  if (Number.isFinite(startElapsed) && Number.isFinite(runStartDayClockSeconds)) {
    return `${formatReviewRunDayClockSecondsShort(runStartDayClockSeconds + startElapsed)} – ${formatReviewRunDayClockSecondsShort(runStartDayClockSeconds + endElapsed)}`;
  }
  return Number.isFinite(startElapsed) ? `${formatCountdown(startElapsed)} – ${formatCountdown(endElapsed)}` : "—";
}

function formatReviewRunDayClockSecondsShort(secondsFromMidnight) {
  const value = formatReviewRunDayClockSeconds(secondsFromMidnight);
  return value.replace(/:(\d{2})\s([AP]M)$/i, " $2");
}

function getReviewRunEntriesInBucket(snapshot, bucket) {
  const sheep = Array.isArray(snapshot?.sheep) ? snapshot.sheep : [];
  const bucketMinutes = getReviewRunTrendBucketMinutes(snapshot);
  const startElapsed = Number(bucket?.startElapsed);
  const endElapsed = startElapsed + (bucketMinutes * 60);
  if (!Number.isFinite(startElapsed) || !Number.isFinite(endElapsed)) return [];
  return sheep.filter((entry) => {
    const elapsed = Number(entry?.effectiveElapsedSeconds);
    return Number.isFinite(elapsed) && elapsed >= startElapsed && elapsed < endElapsed;
  });
}

function getReviewRunMarkerNoteContext(entries) {
  const markerLabels = [];
  const notes = [];
  entries.forEach((entry) => {
    getConfirmedManualMarkersForEntry(entry).forEach((marker) => {
      const label = getTrendFlagMarkerLabel(marker) || getManualMarkersDisplayLabel([marker]);
      if (label && !markerLabels.includes(label)) markerLabels.push(label);
    });
    const note = normalizeSheepNote(entry?.note);
    if (note && !notes.includes(note)) notes.push(note);
  });
  const parts = [];
  if (markerLabels.length) parts.push(`Confirmed markers: ${markerLabels.join(", ")}.`);
  if (notes.length) parts.push(`Notes: ${notes.join("; ")}.`);
  return parts.join(" ");
}

function getReviewRunSheepNumber(entry) {
  const number = Number(entry?.number);
  return Number.isFinite(number) ? number : Number.POSITIVE_INFINITY;
}

function getReviewRunEntryMarkerNoteContext(entry) {
  const markerLabel = getManualMarkersDisplayLabel(getConfirmedManualMarkersForEntry(entry));
  const noteText = normalizeSheepNote(entry?.note);
  return [markerLabel, noteText].filter(Boolean).join(" — ");
}

function buildReviewRunDetailPanel(title, entries, requiredCycle, direction) {
  const panel = document.createElement("div");
  panel.className = "review-run-sheep-detail-panel";
  panel.hidden = true;

  const heading = document.createElement("strong");
  heading.textContent = title;
  panel.appendChild(heading);

  const list = document.createElement("ul");
  entries
    .slice()
    .sort((a, b) => getReviewRunSheepNumber(a) - getReviewRunSheepNumber(b))
    .forEach((entry) => {
      const item = document.createElement("li");
      const fullCycle = Number(entry?.fullCycle);
      const delta = direction === "quicker" ? requiredCycle - fullCycle : fullCycle - requiredCycle;
      const context = direction === "slower" ? getReviewRunEntryMarkerNoteContext(entry) : "";
      const sheepLabel = Number.isFinite(getReviewRunSheepNumber(entry)) ? getReviewRunSheepNumber(entry) : "—";
      item.textContent = `Sheep ${sheepLabel} — ${formatSeconds(fullCycle)} total, ${Math.max(0, delta).toFixed(1)}s ${direction} than required${context ? ` — ${context}` : ""}`;
      list.appendChild(item);
    });
  panel.appendChild(list);
  return panel;
}

function createReviewRunCountButton(entries, direction) {
  const count = entries.length;
  const button = document.createElement("button");
  button.type = "button";
  button.className = `review-run-count-link ${direction === "quicker" ? "review-run-count-link-good" : "review-run-count-link-bad"}`;
  button.textContent = `${count} ${count === 1 ? "sheep" : "sheep"}`;
  return button;
}

function appendReviewRunInsightCount(parent, entries, requiredCycle, direction, labelText, countOnly = false) {
  const count = entries.length;
  const button = createReviewRunCountButton(entries, direction);
  if (countOnly) button.textContent = String(count);

  const sentence = document.createElement("p");
  sentence.appendChild(button);
  sentence.append(` ${labelText}`);

  const panel = buildReviewRunDetailPanel(
    `${count} ${count === 1 ? "sheep" : "sheep"} ${labelText}`,
    entries,
    requiredCycle,
    direction
  );
  button.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
  });

  parent.append(sentence, panel);
}

function appendReviewRunGainLossBreakdownItem(parent, entries, requiredCycle, direction, labelText, detailTitle) {
  const item = document.createElement("li");
  item.append(`${labelText}: `);

  const button = createReviewRunCountButton(entries, direction);
  item.appendChild(button);

  const panel = buildReviewRunDetailPanel(detailTitle, entries, requiredCycle, direction);
  button.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
  });

  item.appendChild(panel);
  parent.appendChild(item);
}

function buildReviewRunGainLossBreakdown(entries, requiredCycle, direction) {
  const differenceForEntry = (entry) => {
    const fullCycle = Number(entry?.fullCycle);
    if (!Number.isFinite(fullCycle)) return NaN;
    return direction === "quicker" ? requiredCycle - fullCycle : fullCycle - requiredCycle;
  };
  const matchingEntries = entries.filter((entry) => {
    const difference = differenceForEntry(entry);
    return Number.isFinite(difference) && difference > 0;
  });

  return {
    lessThanFive: matchingEntries.filter((entry) => {
      const difference = differenceForEntry(entry);
      return difference > 0 && difference < 5;
    }),
    fiveOrMore: matchingEntries.filter((entry) => differenceForEntry(entry) >= 5)
  };
}

function getReviewRunBucketTimingGroups(entries, requiredCycle) {
  const safeEntries = entries.filter((entry) => Number.isFinite(Number(entry?.fullCycle)));
  const quicker = safeEntries.filter((entry) => Number(entry.fullCycle) < requiredCycle);
  const slower = safeEntries.filter((entry) => Number(entry.fullCycle) > requiredCycle);
  return {
    total: safeEntries.length,
    quicker,
    slower,
    quickerBreakdown: buildReviewRunGainLossBreakdown(quicker, requiredCycle, "quicker"),
    slowerBreakdown: buildReviewRunGainLossBreakdown(slower, requiredCycle, "slower")
  };
}

function appendReviewRunGainLossBreakdown(wrapper, groups, requiredCycle, direction) {
  const subsetIntro = document.createElement("p");
  subsetIntro.className = "review-run-subset-intro";
  subsetIntro.textContent = `${direction === "quicker" ? "Quicker" : "Slower"} sheep breakdown:`;
  wrapper.appendChild(subsetIntro);

  const list = document.createElement("ul");
  list.className = "review-run-subset-list";
  const breakdown = direction === "quicker" ? groups.quickerBreakdown : groups.slowerBreakdown;
  const directionLabel = direction === "quicker" ? "quicker" : "slower";
  appendReviewRunGainLossBreakdownItem(
    list,
    breakdown.lessThanFive || [],
    requiredCycle,
    direction,
    `Less than 5s ${directionLabel}`,
    `Sheep less than 5s ${directionLabel} than required`
  );
  appendReviewRunGainLossBreakdownItem(
    list,
    breakdown.fiveOrMore || [],
    requiredCycle,
    direction,
    `5s or more ${directionLabel}`,
    `Sheep 5s or more ${directionLabel} than required`
  );
  wrapper.appendChild(list);
}

function appendReviewRunFocusedTimingInsight(wrapper, groups, requiredCycle, direction) {
  const mainEntries = groups[direction];
  const mainCount = mainEntries.length;
  const totalCount = groups.total;
  appendReviewRunInsightCount(
    wrapper,
    mainEntries,
    requiredCycle,
    direction,
    `of ${totalCount} ${totalCount === 1 ? "sheep" : "sheep"} ${mainCount === 1 ? "was" : "were"} ${direction} than required.`,
    true
  );

  appendReviewRunGainLossBreakdown(wrapper, groups, requiredCycle, direction);
}

function getReviewRunCatchShearReasonInsight(snapshot, entries, direction) {
  const avgCatch = Number(snapshot?.currentStats?.avgCatch);
  const avgShear = Number(snapshot?.currentStats?.avgShear);
  if (!Number.isFinite(avgCatch) || !Number.isFinite(avgShear) || avgCatch <= 0 || avgShear <= 0) return "";

  const totals = entries.reduce((acc, entry) => {
    const catchDuration = Number(entry?.catchDuration);
    const shearDuration = Number(entry?.shearDuration);
    if (Number.isFinite(catchDuration)) {
      const delta = direction === "quicker" ? avgCatch - catchDuration : catchDuration - avgCatch;
      if (delta > 0) acc.catch += delta;
    }
    if (Number.isFinite(shearDuration)) {
      const delta = direction === "quicker" ? avgShear - shearDuration : shearDuration - avgShear;
      if (delta > 0) acc.shear += delta;
    }
    return acc;
  }, { catch: 0, shear: 0 });

  const totalContribution = totals.catch + totals.shear;
  if (totalContribution <= 0) {
    return direction === "quicker"
      ? "The block was quicker overall, but catch/shear split was mixed."
      : "The block was slower overall, but catch/shear split was mixed.";
  }

  const catchShare = totals.catch / totalContribution;
  const shearShare = totals.shear / totalContribution;
  const clearlyMoreThreshold = 0.65;
  const bothContributeThreshold = 0.30;

  if (catchShare >= clearlyMoreThreshold) {
    return direction === "quicker"
      ? "Most of the time gained came from quicker catch times."
      : "Most of the lost time came from slower catch times.";
  }
  if (shearShare >= clearlyMoreThreshold) {
    return direction === "quicker"
      ? "Most of the time gained came from quicker shear times."
      : "Most of the lost time came from slower shear times.";
  }
  if (catchShare >= bothContributeThreshold && shearShare >= bothContributeThreshold) {
    return direction === "quicker"
      ? "The quicker block came from both quicker catches and quicker shearing."
      : "The slower block came from both slower catches and slower shearing.";
  }
  return direction === "quicker"
    ? "The block was quicker overall, but catch/shear split was mixed."
    : "The block was slower overall, but catch/shear split was mixed.";
}

function appendReviewRunCatchShearReasonInsight(wrapper, snapshot, entries, direction) {
  const insight = getReviewRunCatchShearReasonInsight(snapshot, entries, direction);
  if (!insight) return;
  const node = document.createElement("p");
  node.textContent = insight;
  wrapper.appendChild(node);
}

function buildReviewRunBestWorstValue(snapshot, bucket, blockType = "block") {
  if (!bucket) return "n/a";
  const entries = getReviewRunEntriesInBucket(snapshot, bucket);
  const requiredCycle = getReviewRunRequiredCycle(snapshot);
  const avgCycle = Number(bucket.avgCycle);
  const count = Number(bucket.count || entries.length || 0);
  const range = getReviewRunBucketRange(snapshot, bucket);

  const wrapper = document.createElement("div");
  wrapper.className = "review-run-best-worst-insight";

  const summary = document.createElement("p");
  summary.textContent = Number.isFinite(avgCycle)
    ? `${range} — ${count} sheep, ${avgCycle.toFixed(1)}s average Total Time Per Sheep, ${formatReviewRunRequiredDelta(avgCycle, requiredCycle)}.`
    : `${range} — ${count} sheep.`;
  wrapper.appendChild(summary);

  if (Number.isFinite(requiredCycle) && requiredCycle > 0) {
    const groups = getReviewRunBucketTimingGroups(entries, requiredCycle);
    if (blockType === "best") {
      appendReviewRunFocusedTimingInsight(wrapper, groups, requiredCycle, "quicker");
      appendReviewRunCatchShearReasonInsight(wrapper, snapshot, entries, "quicker");
      const explanation = document.createElement("p");
      explanation.textContent = groups.quicker.length
        ? "This block was strongest because its quicker sheep lowered the average Total Time Per Sheep."
        : "This block was strongest because it had the lowest average Total Time Per Sheep.";
      wrapper.appendChild(explanation);
    } else if (blockType === "worst") {
      appendReviewRunFocusedTimingInsight(wrapper, groups, requiredCycle, "slower");
      appendReviewRunCatchShearReasonInsight(wrapper, snapshot, entries, "slower");
      const explanation = document.createElement("p");
      explanation.textContent = groups.slower.length
        ? "This block lost the most time because its slower sheep lifted the average Total Time Per Sheep."
        : "This block was slowest because it had the highest average Total Time Per Sheep.";
      wrapper.appendChild(explanation);
    }
  }

  const markerContext = getReviewRunMarkerNoteContext(entries);
  if (markerContext) {
    const markerContextNode = document.createElement("p");
    markerContextNode.textContent = markerContext;
    wrapper.appendChild(markerContextNode);
  }

  return { node: wrapper, className: getReviewRunRequiredDeltaClass(avgCycle, requiredCycle) };
}

function getReviewRunCompletedDurationSeconds(snapshot) {
  const explicitValues = [snapshot?.effectiveElapsedSeconds, snapshot?.runLengthSeconds, snapshot?.target?.runLengthSeconds]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (explicitValues.length) return explicitValues[0];

  const sheep = Array.isArray(snapshot?.sheep) ? snapshot.sheep : [];
  const elapsedValues = sheep
    .map((entry) => Number(entry?.effectiveElapsedSeconds))
    .filter((value) => Number.isFinite(value) && value > 0);
  return elapsedValues.length ? Math.max(...elapsedValues) : 0;
}

function getReviewRunBlockEntries(snapshot, block) {
  const sheep = Array.isArray(snapshot?.sheep) ? snapshot.sheep : [];
  const start = Number(block?.startSeconds);
  const end = Number(block?.endSeconds);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
  return sheep.filter((entry) => {
    const elapsed = Number(entry?.effectiveElapsedSeconds);
    return Number.isFinite(elapsed) && elapsed >= start && elapsed < end;
  });
}

function getReviewRunTimingBlockOptions(snapshot) {
  const durationSeconds = getReviewRunCompletedDurationSeconds(snapshot);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return [];

  const options = [];
  const addOption = (label, startSeconds, endSeconds) => {
    if (endSeconds <= startSeconds || startSeconds >= durationSeconds) return;
    const safeEndSeconds = Math.min(endSeconds, durationSeconds);
    options.push({ label, startSeconds, endSeconds: safeEndSeconds });
  };

  const quarterCount = Math.min(8, Math.ceil(durationSeconds / (15 * 60)));
  for (let index = 0; index < quarterCount; index += 1) {
    addOption(`Quarter ${index + 1}`, index * 15 * 60, (index + 1) * 15 * 60);
  }

  addOption("First hour", 0, 60 * 60);
  if (durationSeconds > 60 * 60) addOption("Second hour", 60 * 60, 2 * 60 * 60);

  return options;
}

function getReviewRunAverageFullCycle(entries) {
  const values = entries.map((entry) => Number(entry?.fullCycle)).filter((value) => Number.isFinite(value));
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : NaN;
}

function buildReviewRunTimingBlockSummaryNode(entries, requiredCycle) {
  const avgCycle = getReviewRunAverageFullCycle(entries);
  const summary = document.createElement("div");
  summary.className = `review-run-portion-summary ${getReviewRunRequiredDeltaClass(avgCycle, requiredCycle)}`.trim();
  const avg = Number.isFinite(avgCycle) ? `${avgCycle.toFixed(3)}s average Total Time Per Sheep` : "n/a average Total Time Per Sheep";
  summary.textContent = `${entries.length} sheep — ${avg} — ${formatReviewRunRequiredDelta(avgCycle, requiredCycle)}`;
  return summary;
}

function appendReviewRunPortionSelectors(parent, snapshot) {
  const requiredCycle = getReviewRunRequiredCycle(snapshot);
  const controls = document.createElement("div");
  controls.className = "review-run-portion-controls";

  const summary = document.createElement("div");
  const timingBlocks = getReviewRunTimingBlockOptions(snapshot);

  const label = document.createElement("label");
  label.className = "review-run-portion-control";
  const span = document.createElement("span");
  span.textContent = "Run Timing Block";
  const select = document.createElement("select");
  timingBlocks.forEach((block, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = block.label;
    select.appendChild(option);
  });
  label.append(span, select);

  const renderTimingBlock = (index) => {
    summary.innerHTML = "";
    const block = timingBlocks[index];
    if (!block) {
      summary.appendChild(buildReviewRunTimingBlockSummaryNode([], requiredCycle));
      return;
    }
    summary.appendChild(buildReviewRunTimingBlockSummaryNode(getReviewRunBlockEntries(snapshot, block), requiredCycle));
  };

  select.addEventListener("change", () => renderTimingBlock(Number(select.value)));
  controls.append(label, summary);
  parent.appendChild(controls);
  renderTimingBlock(0);
}

function buildReviewRunPeriodRows(snapshot) {
  const sheep = Array.isArray(snapshot?.sheep) ? snapshot.sheep : [];
  if (!sheep.length) return [];
  const requiredCycle = getReviewRunRequiredCycle(snapshot);
  const buckets = Array.isArray(snapshot?.trendBuckets) ? snapshot.trendBuckets : [];
  const best = buckets.reduce((winner, bucket) => (!winner || Number(bucket.avgCycle) < Number(winner.avgCycle) ? bucket : winner), null);
  const worst = buckets.reduce((loser, bucket) => (!loser || Number(bucket.avgCycle) > Number(loser.avgCycle) ? bucket : loser), null);
  const bucketLabel = getReviewRunTrendBucketLabel(snapshot);
  return [
    [`Best ${bucketLabel} block`, buildReviewRunBestWorstValue(snapshot, best, "best")],
    [`Worst ${bucketLabel} block`, buildReviewRunBestWorstValue(snapshot, worst, "worst")]
  ];
}

function buildReviewRunPerformanceRows(snapshot) {
  const requiredCycle = getReviewRunRequiredCycle(snapshot);
  return (Array.isArray(snapshot?.display?.performanceRows) ? snapshot.display.performanceRows : []).map(([label, value]) => {
    if (String(label).toLowerCase().includes("average total time per sheep")) {
      return [label, buildReviewRunPaceCell(value, parseReviewRunSecondsText(value), requiredCycle)];
    }
    return [label, value];
  });
}

function buildReviewRunReviewRows(snapshot) {
  const requiredCycle = getReviewRunRequiredCycle(snapshot);
  return (Array.isArray(snapshot?.display?.reviewRows) ? snapshot.display.reviewRows : []).map((row) => row.map((value, index) => (
    index === 2 ? buildReviewRunPaceCell(value, parseReviewRunSecondsText(value), requiredCycle) : value
  )));
}

function buildReviewRunTrendBucketRows(snapshot) {
  const requiredCycle = getReviewRunRequiredCycle(snapshot);
  return (Array.isArray(snapshot?.display?.trendBucketRows) ? snapshot.display.trendBucketRows : []).map((row) => row.map((value, index) => (
    index === 3 ? buildReviewRunPaceCell(value, parseReviewRunSecondsText(value), requiredCycle) : value
  )));
}


function formatReviewRunSnapshotEntryClock(snapshot, entry, field) {
  const secondsKey = field === "start" ? "startDayClockSeconds" : "endDayClockSeconds";
  const timestampKey = field === "start" ? "startTime" : "endTime";
  const storedSeconds = Number(entry?.[secondsKey]);
  if (Number.isFinite(storedSeconds)) return formatReviewRunDayClockSecondsShort(storedSeconds);
  const fallbackSeconds = getReviewRunDayClockSecondsFromTimestamp(entry?.[timestampKey], snapshot?.runStartTime, snapshot?.runStartDayClockSeconds);
  if (Number.isFinite(fallbackSeconds)) return formatReviewRunDayClockSecondsShort(fallbackSeconds);
  return formatReviewRunDateTime(entry?.[timestampKey]);
}

function findReviewRunRefillEventSheep(snapshot, event) {
  const sheep = Array.isArray(snapshot?.sheep) ? snapshot.sheep : [];
  if (!sheep.length || !event || typeof event !== "object") return null;

  const eventSheepId = event.sheepId;
  if (eventSheepId) {
    const sheepById = sheep.find((entry) => entry?.id === eventSheepId);
    if (sheepById) return sheepById;
  }

  const eventSheepNumber = getFiniteClockNumber(event.sheepNumber);
  if (Number.isFinite(eventSheepNumber)) {
    const sheepByEventNumber = sheep.find((entry) => Number(entry?.number) === eventSheepNumber);
    if (sheepByEventNumber) return sheepByEventNumber;
  }

  const physicalSheepTakenFromPen = getFiniteClockNumber(event.physicalSheepTakenFromPen);
  if (Number.isFinite(physicalSheepTakenFromPen)) {
    const sheepByPhysicalNumber = sheep.find((entry) => Number(entry?.number) === physicalSheepTakenFromPen);
    if (sheepByPhysicalNumber) return sheepByPhysicalNumber;
  }

  return null;
}

function formatReviewRunSnapshotEventClock(snapshot, event) {
  const storedDayClockKeys = [
    "dayClockSecondsFromMidnight",
    "dayClockSeconds",
    "eventDayClockSeconds",
    "timestampDayClockSeconds",
    "createdAtDayClockSeconds"
  ];
  for (const key of storedDayClockKeys) {
    const storedSeconds = getFiniteClockNumber(event?.[key]);
    if (Number.isFinite(storedSeconds)) return formatReviewRunDayClockSecondsShort(storedSeconds);
  }

  const matchingSheep = findReviewRunRefillEventSheep(snapshot, event);
  const sheepEndDayClockSeconds = getFiniteClockNumber(matchingSheep?.endDayClockSeconds);
  if (Number.isFinite(sheepEndDayClockSeconds)) return formatReviewRunDayClockSecondsShort(sheepEndDayClockSeconds);

  const runStartDayClockSeconds = getFiniteClockNumber(snapshot?.runStartDayClockSeconds);
  const eventEffectiveElapsedSeconds = getFiniteClockNumber(event?.effectiveElapsedSeconds);
  if (Number.isFinite(runStartDayClockSeconds) && Number.isFinite(eventEffectiveElapsedSeconds)) {
    return formatReviewRunDayClockSecondsShort(runStartDayClockSeconds + eventEffectiveElapsedSeconds);
  }

  const sheepEffectiveElapsedSeconds = getFiniteClockNumber(matchingSheep?.effectiveElapsedSeconds);
  if (Number.isFinite(runStartDayClockSeconds) && Number.isFinite(sheepEffectiveElapsedSeconds)) {
    return formatReviewRunDayClockSecondsShort(runStartDayClockSeconds + sheepEffectiveElapsedSeconds);
  }

  const eventTimestamp = event?.timestamp || event?.createdAt;
  const fallbackSeconds = getReviewRunDayClockSecondsFromTimestamp(
    eventTimestamp,
    snapshot?.runStartTime,
    snapshot?.runStartDayClockSeconds
  );
  if (Number.isFinite(fallbackSeconds)) return formatReviewRunDayClockSecondsShort(fallbackSeconds);

  return formatReviewRunDateTime(eventTimestamp);
}

function buildReviewRunSheepLogRows(snapshot) {
  const sheep = Array.isArray(snapshot?.sheep) ? snapshot.sheep : [];
  const requiredCycle = getReviewRunRequiredCycle(snapshot);
  const avgCatch = Number(snapshot?.currentStats?.avgCatch);
  const avgShear = Number(snapshot?.currentStats?.avgShear);
  return sheep.map((entry) => {
    const catchDuration = Number(entry?.catchDuration);
    const shearDuration = Number(entry?.shearDuration);
    const fullCycle = Number(entry?.fullCycle);
    const manualMarkers = getConfirmedManualMarkersForEntry(entry);
    const markerLabel = getManualMarkersDisplayLabel(manualMarkers);
    const noteText = normalizeSheepNote(entry?.note);
    return [
      entry?.number ?? "—",
      formatReviewRunSnapshotEntryClock(snapshot, entry, "start"),
      formatReviewRunSnapshotEntryClock(snapshot, entry, "end"),
      buildReviewRunPaceCell(formatSeconds(catchDuration), catchDuration, avgCatch),
      buildReviewRunPaceCell(formatSeconds(shearDuration), shearDuration, avgShear),
      buildReviewRunPaceCell(formatSeconds(fullCycle), fullCycle, requiredCycle),
      markerLabel || "—",
      noteText || "—"
    ];
  });
}

function formatReviewRunTextForModal(text, snapshot) {
  if (!text) return "";
  const bucketLabel = getReviewRunTrendBucketLabel(snapshot);
  return String(text)
    .replace(/^First 25% of run:/gm, "First quarter of run:")
    .replace(/^First 50% of run:/gm, "First half of run:")
    .replace(/^Best:/gm, `Best ${bucketLabel} period:`)
    .replace(/^Worst:/gm, `Worst ${bucketLabel} period:`);
}

function renderReviewRunModal(snapshot) {
  if (!elements.reviewRunModalContent) return;
  elements.reviewRunModalContent.innerHTML = "";
  if (!snapshot) {
    const empty = document.createElement("div");
    empty.className = "status-box minimal-status";
    empty.textContent = "No completed run snapshot yet.";
    elements.reviewRunModalContent.appendChild(empty);
    return;
  }

  const runLabel = getReviewRunNumberLabel(snapshot);
  if (elements.reviewRunModalTitle) elements.reviewRunModalTitle.textContent = `Review Run — ${runLabel}`;

  const heading = document.createElement("div");
  heading.className = "review-run-heading status-box minimal-status";
  const formattedSessionDate = formatReviewRunSessionDate(snapshot.sessionDate);
  const headingParts = [
    runLabel,
    snapshot.farm || "",
    formattedSessionDate !== "—" ? formattedSessionDate : ""
  ].filter(Boolean);
  heading.textContent = headingParts.join(" — ");
  elements.reviewRunModalContent.appendChild(heading);

  const intro = document.createElement("div");
  intro.className = "review-run-intro status-box minimal-status";
  intro.textContent = `Frozen snapshot captured ${snapshot.capturedAt ? new Date(snapshot.capturedAt).toLocaleString() : "at run finish"}. Live panels continue to update separately.`;
  elements.reviewRunModalContent.appendChild(intro);

  const runInfo = appendReviewRunSection(elements.reviewRunModalContent, "Run Info");
  appendReviewRunKeyValueTable(runInfo, buildCompletedRunKeyValueRows([
    ["Farm", snapshot.farm || "—"],
    ["Session date", formattedSessionDate],
    ["Record type", snapshot.recordTypeLabel || snapshot.recordType || "—"],
    ["Time system", snapshot.runTypeLabel || snapshot.runType || "—"],
    ["Run", runLabel],
    ["Run start", formatReviewRunSnapshotDayClock(snapshot, "runStartDayClockDisplay", "runStartDayClockSeconds", "runStartTime")],
    ["Official scheduled run end", formatReviewRunSnapshotDayClock(snapshot, "officialScheduledRunEndDayClockDisplay", "officialScheduledRunEndDayClockSeconds", "officialScheduledRunEndTime")],
    ["Actual last sheep end", formatReviewRunSnapshotDayClock(snapshot, "actualLastSheepEndDayClockDisplay", "actualLastSheepEndDayClockSeconds", "actualLastSheepEndTime")],
    ["Elapsed at capture", Number.isFinite(Number(snapshot.effectiveElapsedSeconds)) ? formatCountdown(snapshot.effectiveElapsedSeconds) : "—"],
    ["Target sheep", snapshot.targetSheep ?? "—"],
    ["Run length", Number.isFinite(Number(snapshot.runLengthSeconds)) ? formatCountdown(snapshot.runLengthSeconds) : "—"],
    ["Official reject adjustment", snapshot.officialRejectedAdjustment ?? "0"]
  ]));

  const performance = appendReviewRunSection(elements.reviewRunModalContent, "Performance / Run Summary");
  appendReviewRunKeyValueTable(performance, buildReviewRunPerformanceRows(snapshot));
  appendReviewRunPortionSelectors(performance, snapshot);
  appendReviewRunKeyValueTable(performance, buildReviewRunPeriodRows(snapshot));
  if (snapshot.runReviewText) {
    const fullTextSummary = appendReviewRunSection(elements.reviewRunModalContent, "Full text summary", { collapsedByDefault: true });
    const reviewText = document.createElement("pre");
    reviewText.className = "review-run-text";
    reviewText.textContent = formatReviewRunTextForModal(snapshot.runReviewText, snapshot);
    fullTextSummary.appendChild(reviewText);
  }

  const targetPace = appendReviewRunSection(elements.reviewRunModalContent, "Target / Pace");
  appendReviewRunKeyValueTable(targetPace, snapshot.display?.targetPaceRows || []);

  const timing = appendReviewRunSection(elements.reviewRunModalContent, "Timing / Alerts");
  appendReviewRunKeyValueTable(timing, snapshot.display?.timingRows || []);

  const penPlanner = appendReviewRunSection(elements.reviewRunModalContent, "Pen Refill Planner");
  appendReviewRunKeyValueTable(penPlanner, snapshot.display?.penRefillPlannerRows || []);
  appendReviewRunDataTable(
    penPlanner,
    ["Sheep", "Amount", "Source", "Time", "Note"],
    (Array.isArray(snapshot.penFillEvents) ? snapshot.penFillEvents : []).map((event) => [
      event.sheepNumber ?? event.physicalSheepTakenFromPen ?? "—",
      event.actualFillAmount ?? event.fillAmount ?? event.refillAmount ?? "—",
      event.source || "—",
      formatReviewRunSnapshotEventClock(snapshot, event),
      event.note || event.reason || "—"
    ]),
    "No pen refill events captured for this run."
  );

  const flags = appendReviewRunSection(elements.reviewRunModalContent, "Trend Flags");
  appendReviewRunDataTable(flags, ["Flag"], snapshot.display?.trendFlagRows || [], "No trend flags captured.");

  const reviews = appendReviewRunSection(elements.reviewRunModalContent, "15-Minute Reviews");
  appendReviewRunDataTable(reviews, ["Range", "Sheep", "Avg cycle", "Delta", "Status"], buildReviewRunReviewRows(snapshot), "No 15-minute reviews captured.");

  const buckets = appendReviewRunSection(elements.reviewRunModalContent, "Trend Graph Bucket Data");
  appendReviewRunDataTable(buckets, ["Bucket", "Start", "Sheep", "Avg cycle", "Avg catch"], buildReviewRunTrendBucketRows(snapshot), "No trend bucket data captured.");

  const sheepLog = appendReviewRunSection(elements.reviewRunModalContent, "Sheep Log");
  appendReviewRunDataTable(sheepLog, ["Sheep", "Start", "End", "Catch", "Shear", "Total", "Markers", "Notes"], buildReviewRunSheepLogRows(snapshot), "No sheep captured for this run.");

  const qualityRows = snapshot.display?.qualityRows || [];
  if (qualityRows.length) {
    const quality = appendReviewRunSection(elements.reviewRunModalContent, "Quality Ratings");
    appendReviewRunDataTable(quality, ["Period", "Rating", "Official", "Physical", "Warning", "Notes"], qualityRows);
  }

  updateReviewRunSectionMoveButtons(elements.reviewRunModalContent);
}

function openReviewRunModal() {
  if (!hasCompletedRunSnapshot() || !elements.reviewRunModalOverlay) return;
  renderReviewRunModal(appState.latestCompletedRunSnapshot);
  elements.reviewRunModalOverlay.hidden = false;
}

function closeReviewRunModal() {
  if (elements.reviewRunModalOverlay) elements.reviewRunModalOverlay.hidden = true;
  if (elements.reviewRunModalTitle) elements.reviewRunModalTitle.textContent = "Review Run";
}

function formatDeltaPlain(delta) {
  if (!Number.isFinite(delta)) return "0.000s";
  const sign = delta > 0 ? "+" : (delta < 0 ? "−" : "");
  return `${sign}${Math.abs(delta).toFixed(3)}s`;
}

function formatTrendDelta(delta) {
  const absDelta = Math.abs(Number.isFinite(delta) ? delta : 0).toFixed(3);
  if (delta > 0) return `${absDelta}s slower per sheep`;
  if (delta < 0) return `${absDelta}s faster per sheep`;
  return `${absDelta}s on pace per sheep`;
}

function formatTrendBlockNet(delta, blockCount) {
  const netSeconds = Math.abs((Number.isFinite(delta) ? delta : 0) * blockCount);
  if (delta > 0) return `lost about ${netSeconds.toFixed(3)} seconds across this block`;
  if (delta < 0) return `gained about ${netSeconds.toFixed(3)} seconds across this block`;
  return `held even across this block`;
}

function formatClockHHMM(timestamp) {
  if (!Number.isFinite(timestamp)) return "--:--";
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatTrendWindowClock(entry, field) {
  const dayClockSeconds = getSheepLogDayClockSeconds(entry, field);
  if (Number.isFinite(dayClockSeconds)) return formatSecondsFromMidnightClock(dayClockSeconds);
  return formatClock(field === "start" ? entry?.startTime : entry?.endTime);
}

function getTrendWindowMeta(windowRows, windowSize) {
  if (!windowRows.length) {
    return { sheepStart: 0, sheepEnd: 0, timeStart: "--:--", timeEnd: "--:--", windowSize };
  }
  const first = windowRows[0];
  const last = windowRows[windowRows.length - 1];
  const sheepStart = Number.isFinite(first.number) ? first.number : (appState.sheep.length - windowRows.length + 1);
  const sheepEnd = Number.isFinite(last.number) ? last.number : appState.sheep.length;
  return {
    sheepStart,
    sheepEnd,
    timeStart: formatTrendWindowClock(first, "start"),
    timeEnd: formatTrendWindowClock(last, "end"),
    windowSize
  };
}

function getDeltaTone(delta) {
  if (delta < 0) return "good";
  if (delta > 0) return "bad";
  return "neutral";
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
    elements.trendLatestSummary.textContent = `Last ${bucketMinutes} min: 0 sheep • Avg Total Time Per Sheep 0.000s • Target ${formatSeconds(requiredCycle)} • No buckets yet.`;
    return;
  }
  const delta = latest.avgCycle - requiredCycle;
  const meaning = describeAheadBehind(delta);
  elements.trendLatestSummary.textContent = `Last ${bucketMinutes} min: ${latest.count} sheep • Avg Total Time Per Sheep ${formatSeconds(latest.avgCycle)} • Target ${formatSeconds(requiredCycle)} • ${formatDeltaPlain(delta)} ${meaning}`;
}

function updateTrendGraphTooltip(point) {
  if (!elements.trendGraphTooltip) return;
  if (!point) {
    elements.trendGraphTooltip.textContent = "Tap graph points to see bucket details.";
    elements.trendGraphTooltip.hidden = !appState.trendDetailsExpanded;
    return;
  }
  const bucketEnd = point.startElapsed + appState.trendBucketMinutes * 60;
  const delta = point.avgCycle - point.requiredCycle;
  elements.trendGraphTooltip.innerHTML = [
    `Bucket: ${buildRangeLabel(point.startElapsed, bucketEnd)}`,
    `Count: ${point.count} sheep`,
    `Avg Total Time Per Sheep: ${formatSeconds(point.avgCycle)}`,
    `Avg catch: ${formatSeconds(point.avgCatch)}`,
    `Target Total Time Per Sheep: ${formatSeconds(point.requiredCycle)}`,
    `Delta: ${formatDeltaPlain(delta)} (${describeAheadBehind(delta)})`
  ].map((line) => `<div>${line}</div>`).join("");
  elements.trendGraphTooltip.hidden = !appState.trendDetailsExpanded;
}

function updateTrendDetailsVisibility() {
  if (elements.trendDetailsToggle) {
    elements.trendDetailsToggle.textContent = appState.trendDetailsExpanded ? "Details ▴" : "Details ▾";
    elements.trendDetailsToggle.setAttribute("aria-expanded", String(appState.trendDetailsExpanded));
  }
  if (elements.trendGraphTooltip) {
    elements.trendGraphTooltip.hidden = !appState.trendDetailsExpanded;
  }
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

function escapeTrendFlagHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTrendFlagList(items) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function getTrendFlagMarkerLabels(windowRows) {
  const markers = dedupeManualMarkers(windowRows.flatMap((entry) => getConfirmedManualMarkersForEntry(entry)));
  return markers
    .map((marker) => marker.type === MANUAL_MARKER_CUSTOM_TYPE
      ? `Custom: ${getManualMarkerDisplayLabel(marker)}`
      : getManualMarkerDisplayLabel(marker))
    .filter(Boolean);
}

function getTrendFlagMarkerLabel(marker) {
  if (!marker) return "";
  return marker.type === MANUAL_MARKER_CUSTOM_TYPE
    ? `Custom: ${getManualMarkerDisplayLabel(marker)}`
    : getManualMarkerDisplayLabel(marker);
}

function buildTrendFlagSameMarkerTimingAverages(comparisonRows, metricKeys) {
  const buckets = comparisonRows.reduce((markerBuckets, entry) => {
    const manualMarkers = getConfirmedManualMarkersForEntry(entry);
    manualMarkers.forEach((marker) => {
      const markerKey = getManualMarkerDedupKey(marker);
      if (!markerKey) return;
      if (!markerBuckets[markerKey]) {
        markerBuckets[markerKey] = {
          sampleCount: 0,
          totals: {},
          counts: {},
          averages: {}
        };
      }
      const bucket = markerBuckets[markerKey];
      bucket.sampleCount += 1;
      metricKeys.forEach((metricKey) => {
        const value = Number(entry?.[metricKey]);
        if (!Number.isFinite(value)) return;
        bucket.totals[metricKey] = (bucket.totals[metricKey] || 0) + value;
        bucket.counts[metricKey] = (bucket.counts[metricKey] || 0) + 1;
      });
    });
    return markerBuckets;
  }, {});

  Object.values(buckets).forEach((bucket) => {
    metricKeys.forEach((metricKey) => {
      const count = bucket.counts[metricKey] || 0;
      bucket.averages[metricKey] = count ? bucket.totals[metricKey] / count : NaN;
    });
    delete bucket.totals;
  });

  return buckets;
}

function buildTrendFlagMarkerTimingClues(windowRows, comparisonAverages, sameMarkerAverages = {}) {
  return windowRows.flatMap((entry, index) => {
    const manualMarkers = getConfirmedManualMarkersForEntry(entry);
    if (!manualMarkers.length) return [];
    const sheepNumber = Number.isFinite(entry?.number) ? entry.number : index + 1;
    const timings = {
      catchDuration: Number(entry?.catchDuration),
      shearDuration: Number(entry?.shearDuration),
      fullCycle: Number(entry?.fullCycle)
    };
    const deltas = {
      catchDuration: Number.isFinite(timings.catchDuration) && Number.isFinite(comparisonAverages.catchDuration)
        ? timings.catchDuration - comparisonAverages.catchDuration
        : NaN,
      shearDuration: Number.isFinite(timings.shearDuration) && Number.isFinite(comparisonAverages.shearDuration)
        ? timings.shearDuration - comparisonAverages.shearDuration
        : NaN,
      fullCycle: Number.isFinite(timings.fullCycle) && Number.isFinite(comparisonAverages.fullCycle)
        ? timings.fullCycle - comparisonAverages.fullCycle
        : NaN
    };
    return manualMarkers.map((marker) => {
      const markerKey = getManualMarkerDedupKey(marker);
      const sameMarkerTiming = markerKey ? sameMarkerAverages[markerKey] : null;
      return {
        sheepNumber,
        markerLabel: getTrendFlagMarkerLabel(marker),
        markerKey,
        catchDuration: timings.catchDuration,
        shearDuration: timings.shearDuration,
        fullCycle: timings.fullCycle,
        deltas,
        sameMarkerTiming: sameMarkerTiming ? {
          sampleCount: sameMarkerTiming.sampleCount || 0,
          counts: { ...sameMarkerTiming.counts },
          averages: { ...sameMarkerTiming.averages }
        } : {
          sampleCount: 0,
          counts: {},
          averages: {}
        }
      };
    }).filter((clue) => clue.markerLabel);
  });
}

function getTrendFlagSameMarkerMetricDelta(clue, metricKey) {
  const value = Number(clue?.[metricKey]);
  const sameMarkerAverage = Number(clue?.sameMarkerTiming?.averages?.[metricKey]);
  return Number.isFinite(value) && Number.isFinite(sameMarkerAverage) ? value - sameMarkerAverage : NaN;
}

function getTrendFlagMarkerClueScore(clue, metricKey, trendTone, meaningfulThresholdSeconds) {
  const runDelta = Number(clue?.delta);
  const sameMarkerDelta = getTrendFlagSameMarkerMetricDelta(clue, metricKey);
  const sameMarkerCount = clue?.sameMarkerTiming?.counts?.[metricKey] || 0;
  const alignsWithTrend = (delta) => trendTone === "bad" ? delta > 0 : trendTone === "good" ? delta < 0 : Math.abs(delta) > meaningfulThresholdSeconds;
  const runScore = Number.isFinite(runDelta) ? Math.abs(runDelta) : 0;
  if (sameMarkerCount >= 2 && Number.isFinite(sameMarkerDelta)) {
    const sameScore = Math.abs(sameMarkerDelta);
    return (alignsWithTrend(sameMarkerDelta) ? sameScore + runScore : sameScore * 0.25) + (alignsWithTrend(runDelta) ? runScore : 0);
  }
  return runScore;
}

function pickTrendFlagMarkerTimingClue(markerTimingClues, metricKey, trendTone, meaningfulThresholdSeconds) {
  const metricClues = markerTimingClues
    .map((clue) => ({ ...clue, delta: clue.deltas?.[metricKey] }))
    .filter((clue) => Number.isFinite(clue.delta));
  if (!metricClues.length) return null;

  const sortByScore = (a, b) => getTrendFlagMarkerClueScore(b, metricKey, trendTone, meaningfulThresholdSeconds)
    - getTrendFlagMarkerClueScore(a, metricKey, trendTone, meaningfulThresholdSeconds);
  if (trendTone === "bad") {
    const aligned = metricClues.filter((clue) => clue.delta > 0).sort(sortByScore);
    return aligned[0] || metricClues.sort(sortByScore)[0];
  }
  if (trendTone === "good") {
    const aligned = metricClues.filter((clue) => clue.delta < 0).sort(sortByScore);
    return aligned[0] || metricClues.sort(sortByScore)[0];
  }
  const standout = metricClues.filter((clue) => Math.abs(clue.delta) > meaningfulThresholdSeconds).sort(sortByScore);
  return standout[0] || metricClues.sort(sortByScore)[0];
}


function getTrendFlagCountWord(count) {
  const words = ["Zero", "One", "Two", "Three", "Four", "Five"];
  return words[count] || String(count);
}

function getTrendFlagMetricSubject(metricLabel, count) {
  const subjects = {
    catch: count === 1 ? "catch" : "catches",
    shear: count === 1 ? "shear" : "shears",
    "total time": count === 1 ? "total time" : "total times"
  };
  return subjects[metricLabel] || (count === 1 ? metricLabel : `${metricLabel}s`);
}

function buildTrendNoMarkerInsight({ windowRows, metricKey, metricName, comparisonAverage, trendTone, meaningfulThresholdSeconds }) {
  const prefix = "No confirmed marker reason found.";
  if (!Number.isFinite(comparisonAverage) || comparisonAverage <= 0) {
    return `${prefix} Not enough run ${metricName} average data before this block to compare the latest 5.`;
  }

  const metricRows = windowRows
    .map((entry, index) => {
      const value = Number(entry?.[metricKey]);
      if (!Number.isFinite(value)) return null;
      const sheepNumber = Number.isFinite(entry?.number) ? entry.number : index + 1;
      return {
        index,
        sheepNumber,
        value,
        delta: value - comparisonAverage
      };
    })
    .filter(Boolean);

  if (!metricRows.length) {
    return `${prefix} Not enough ${metricName} timing data was recorded in the latest 5 to compare with the run average.`;
  }

  const noticeablyDifferent = Math.max(meaningfulThresholdSeconds, comparisonAverage * 0.08);
  const aboveRows = metricRows.filter((row) => row.delta > noticeablyDifferent);
  const belowRows = metricRows.filter((row) => row.delta < -noticeablyDifferent);
  const slowestRows = [...metricRows].sort((a, b) => b.value - a.value);
  const fastestRows = [...metricRows].sort((a, b) => a.value - b.value);
  const slowest = slowestRows[0];
  const secondSlowestDelta = slowestRows[1] ? Math.max(0, slowestRows[1].delta) : 0;
  const fastest = fastestRows[0];
  const secondFastestDelta = fastestRows[1] ? Math.max(0, -fastestRows[1].delta) : 0;
  const slowestDelta = Math.max(0, slowest?.delta || 0);
  const fastestDelta = Math.max(0, -(fastest?.delta || 0));
  const slowestIsMainOutlier = slowestDelta > noticeablyDifferent
    && (slowestDelta >= secondSlowestDelta + noticeablyDifferent || slowestDelta >= secondSlowestDelta * 1.5);
  const fastestIsMainOutlier = fastestDelta > noticeablyDifferent
    && (fastestDelta >= secondFastestDelta + noticeablyDifferent || fastestDelta >= secondFastestDelta * 1.5);
  const lastTwoRows = metricRows.filter((row) => row.index >= windowRows.length - 2);
  const lastOne = metricRows.find((row) => row.index === windowRows.length - 1);
  const metricSubject = getTrendFlagMetricSubject(metricName, metricRows.length);

  if (trendTone === "bad") {
    if (slowestIsMainOutlier) {
      return `${prefix} Sheep ${slowest.sheepNumber} had the slowest ${metricName} at ${slowest.value.toFixed(1)}s, about ${slowestDelta.toFixed(1)}s above the run average before this block.`;
    }

    if (lastTwoRows.length === 2 && lastTwoRows.every((row) => row.delta > noticeablyDifferent)) {
      return `${prefix} The last two ${getTrendFlagMetricSubject(metricName, 2)} were both above the run average, so the slowdown appears to have built near the end of the block.`;
    }

    if (lastOne && lastOne.delta > noticeablyDifferent && aboveRows.length < 3) {
      return `${prefix} The last ${getTrendFlagMetricSubject(metricName, 1)} was above the run average, so the late-block slowdown is worth checking.`;
    }

    if (aboveRows.length >= 3) {
      return `${prefix} ${getTrendFlagCountWord(aboveRows.length)} of the latest 5 ${metricSubject} were above the run average, so this looks like a general ${metricName} slowdown.`;
    }
  }

  if (trendTone === "good") {
    if (fastestIsMainOutlier) {
      return `${prefix} Sheep ${fastest.sheepNumber} had the fastest ${metricName} at ${fastest.value.toFixed(1)}s, about ${fastestDelta.toFixed(1)}s below the run average before this block.`;
    }

    if (belowRows.length >= 3) {
      return `${prefix} ${getTrendFlagCountWord(belowRows.length)} of the latest 5 ${metricSubject} were below the run average, so this looks like a general ${metricName} lift.`;
    }
  }

  if (slowestIsMainOutlier) {
    return `${prefix} Sheep ${slowest.sheepNumber} had the slowest ${metricName} at ${slowest.value.toFixed(1)}s, about ${slowestDelta.toFixed(1)}s above the run average before this block. Worth checking.`;
  }

  if (fastestIsMainOutlier) {
    return `${prefix} Sheep ${fastest.sheepNumber} had the fastest ${metricName} at ${fastest.value.toFixed(1)}s, about ${fastestDelta.toFixed(1)}s below the run average before this block. Worth checking.`;
  }

  return `${prefix} The latest 5 ${metricSubject} stayed close to the run average before this block.`;
}

function getTrendFlagMarkerMetricPhrase(metricKey, metricName) {
  if (metricKey === "catchDuration") return "Its catch time";
  if (metricKey === "shearDuration") return "The time spent shearing that sheep";
  if (metricKey === "fullCycle") return "Its total time";
  return `Its ${metricName}`;
}

function formatTrendFlagMarkerTimingLine({ markerTimingClues, metricKey, metricName, trendTone, meaningfulThresholdSeconds, windowRows, comparisonAverage }) {
  if (!markerTimingClues.length) {
    return buildTrendNoMarkerInsight({
      windowRows,
      metricKey,
      metricName,
      comparisonAverage,
      trendTone,
      meaningfulThresholdSeconds
    });
  }

  const clue = pickTrendFlagMarkerTimingClue(markerTimingClues, metricKey, trendTone, meaningfulThresholdSeconds);
  if (!clue) {
    return `Confirmed markers were recorded in this block, but there was not enough ${metricName} timing data to compare them with the run average before this block.`;
  }

  const absDeltaText = `${Math.abs(clue.delta).toFixed(1)}s`;
  const directionText = clue.delta > 0 ? "slower" : "faster";
  const sheepMarkerText = `Sheep ${clue.sheepNumber} had ${clue.markerLabel}.`;
  const sameMarkerCount = clue.sameMarkerTiming?.counts?.[metricKey] || 0;
  const sameMarkerDelta = getTrendFlagSameMarkerMetricDelta(clue, metricKey);
  const sameMarkerAverageText = `earlier ${clue.markerLabel} markers`;
  const sameMarkerSupportsTrend = Number.isFinite(sameMarkerDelta)
    && Math.abs(sameMarkerDelta) > meaningfulThresholdSeconds
    && ((trendTone === "bad" && sameMarkerDelta > 0) || (trendTone === "good" && sameMarkerDelta < 0) || trendTone === "neutral");
  const metricPhrase = getTrendFlagMarkerMetricPhrase(metricKey, metricName);
  const metricPhraseInline = metricPhrase.replace(/^Its /, "its ").replace(/^The /, "the ");
  const runAverageText = "run average before this block";
  const closeResultText = trendTone === "good" ? "the faster block" : trendTone === "bad" ? "the slower block" : "the stayed-close result";
  const closeText = sameMarkerCount >= 2 && Number.isFinite(sameMarkerDelta)
    ? `${sheepMarkerText} ${metricPhrase} stayed close to ${sameMarkerAverageText}, so the marker is worth checking but does not clearly explain ${closeResultText}.`
    : `${sheepMarkerText} ${metricPhrase} stayed close to the ${runAverageText}. Worth checking, but it does not clearly explain ${closeResultText}.`;

  if (sameMarkerCount >= 2) {
    if (sameMarkerSupportsTrend) {
      const sameMarkerDeltaText = `${Math.abs(sameMarkerDelta).toFixed(1)}s`;
      const sameMarkerDirectionText = sameMarkerDelta > 0 ? "slower" : "faster";
      if (trendTone === "bad" && clue.delta > meaningfulThresholdSeconds) {
        const suffix = metricKey === "catchDuration"
          ? "a strong indicator it was the likely driver of most of the catch time loss"
          : metricKey === "shearDuration"
            ? "a strong indicator it was the likely driver of the shear time loss"
            : "a strong indicator it was the likely driver of most of the lost time";
        return `${sheepMarkerText} ${metricPhrase} was ${sameMarkerDeltaText} ${sameMarkerDirectionText} than ${sameMarkerAverageText} and ${absDeltaText} ${directionText} than the ${runAverageText}, ${suffix}.`;
      }
      if (trendTone === "good" && clue.delta < -meaningfulThresholdSeconds) {
        return `${sheepMarkerText} ${metricPhrase} was ${sameMarkerDeltaText} ${sameMarkerDirectionText} than ${sameMarkerAverageText} and ${absDeltaText} ${directionText} than the ${runAverageText}, a strong indicator it was the likely driver of the gained time.`;
      }
      return `${sheepMarkerText} ${metricPhrase} was ${sameMarkerDeltaText} ${sameMarkerDirectionText} than ${sameMarkerAverageText} and ${absDeltaText} ${directionText} than the ${runAverageText}, making it the clearest marker timing clue while the block stayed close overall.`;
    }
    return `${sheepMarkerText} ${metricPhrase} stayed close to ${sameMarkerAverageText}, so the marker is worth checking but does not clearly explain ${closeResultText}.`;
  }

  if (Math.abs(clue.delta) <= meaningfulThresholdSeconds) {
    return closeText;
  }

  const runDeltaSupportsTrend = (trendTone === "bad" && clue.delta > meaningfulThresholdSeconds)
    || (trendTone === "good" && clue.delta < -meaningfulThresholdSeconds)
    || trendTone === "neutral";

  if (sameMarkerCount === 1) {
    if (runDeltaSupportsTrend) {
      return `${sheepMarkerText} There was only one earlier ${clue.markerLabel} to compare with, so the stronger clue is that ${metricPhraseInline} was ${absDeltaText} ${directionText} than the ${runAverageText}.`;
    }
    return `${sheepMarkerText} There was only one earlier ${clue.markerLabel} to compare with. ${metricPhrase} was ${absDeltaText} ${directionText} than the ${runAverageText}, so the marker is worth checking but does not clearly explain ${closeResultText}.`;
  }

  if (sameMarkerCount === 0) {
    if (runDeltaSupportsTrend) {
      return `${sheepMarkerText} No earlier ${clue.markerLabel} marker average was available, but ${metricPhraseInline} was about ${absDeltaText} ${directionText} than the ${runAverageText}, making it the likely reason this block ${trendTone === "good" ? "gained time" : trendTone === "bad" ? "lost time" : "stood out"}.`;
    }
    return `${sheepMarkerText} No earlier ${clue.markerLabel} marker average was available. ${metricPhrase} was ${absDeltaText} ${directionText} than the ${runAverageText}, so the marker is worth checking but does not clearly explain ${closeResultText}.`;
  }

  if (trendTone === "bad" && clue.delta > 0) {
    const suffix = metricKey === "catchDuration"
      ? "a strong indicator it was the likely driver of most of the catch time loss"
      : metricKey === "shearDuration"
        ? "a strong indicator it was the likely driver of the shear time loss"
        : "a strong indicator it was the likely driver of most of the lost time";
    return `${sheepMarkerText} ${metricPhrase} was ${absDeltaText} ${directionText} than the ${runAverageText}, ${suffix}.`;
  }

  if (trendTone === "good" && clue.delta < 0) {
    return `${sheepMarkerText} ${metricPhrase} was ${absDeltaText} ${directionText} than the ${runAverageText}, making it the clearest timing clue for the gained time.`;
  }

  if (trendTone === "neutral") {
    return `${sheepMarkerText} ${metricPhrase} was ${absDeltaText} ${directionText} than the ${runAverageText}, the clearest timing clue, but the block stayed close overall.`;
  }

  return `${sheepMarkerText} ${metricPhrase} was ${absDeltaText} ${directionText} than the ${runAverageText}. Worth checking, but it does not clearly explain ${trendTone === "good" ? "the faster block" : "the slower block"}.`;
}
function formatTrendTargetSeconds(seconds) {
  return Number.isFinite(seconds) ? `${Math.abs(seconds).toFixed(1)}s` : "0.0s";
}

function formatTrendTargetNetLine(targetNetSeconds) {
  if (!Number.isFinite(targetNetSeconds) || Math.abs(targetNetSeconds) < 0.05) {
    return "Overall: about on target pace.";
  }
  if (targetNetSeconds > 0) {
    return `Overall: about ${formatTrendTargetSeconds(targetNetSeconds)} ahead of target pace.`;
  }
  return `Overall: still about ${formatTrendTargetSeconds(targetNetSeconds)} behind target pace.`;
}


function formatTrendDriverSeconds(seconds) {
  return Number.isFinite(seconds) ? Math.abs(seconds).toFixed(1) : "0.0";
}

function buildTrendTotalDriverExplanation({ catchDelta, shearDelta, totalDelta, blockCount, meaningfulThresholdSeconds }) {
  const normalizeDelta = (delta) => Number.isFinite(delta) ? delta : 0;
  const normalizedCatchDelta = normalizeDelta(catchDelta);
  const normalizedShearDelta = normalizeDelta(shearDelta);
  const normalizedTotalDelta = normalizeDelta(totalDelta);
  const catchNet = normalizedCatchDelta * blockCount;
  const shearNet = normalizedShearDelta * blockCount;
  const totalStayedClose = Math.abs(normalizedTotalDelta) <= meaningfulThresholdSeconds;
  const catchStayedClose = Math.abs(normalizedCatchDelta) <= meaningfulThresholdSeconds;
  const shearStayedClose = Math.abs(normalizedShearDelta) <= meaningfulThresholdSeconds;
  const catchLost = normalizedCatchDelta > meaningfulThresholdSeconds;
  const shearLost = normalizedShearDelta > meaningfulThresholdSeconds;
  const catchGained = normalizedCatchDelta < -meaningfulThresholdSeconds;
  const shearGained = normalizedShearDelta < -meaningfulThresholdSeconds;
  const catchSeconds = formatTrendDriverSeconds(catchNet);
  const shearSeconds = formatTrendDriverSeconds(shearNet);

  if (totalStayedClose) {
    return "Total time stayed close to the run average before this block. Catch and shear changes were small.";
  }

  if (normalizedTotalDelta > 0) {
    if (catchLost && shearGained) {
      return `Catch lost about ${catchSeconds}s across this block, but faster shear gained about ${shearSeconds}s back.`;
    }
    if (shearLost && catchGained) {
      return `Shear lost about ${shearSeconds}s across this block, but faster catch gained about ${catchSeconds}s back.`;
    }
    if (catchLost && shearLost) {
      return `Total time increased because both catch and shear were slower. Catch lost about ${catchSeconds}s and shear lost about ${shearSeconds}s across this block.`;
    }
    if (catchLost && shearStayedClose) {
      return `Total time increased mainly because catch time was slower. Catch lost about ${catchSeconds}s across this block, while shear stayed close.`;
    }
    if (shearLost && catchStayedClose) {
      return `Total time increased mainly because shear time was slower. Shear lost about ${shearSeconds}s across this block, while catch stayed close.`;
    }
    if (catchLost) {
      return `Total time increased mainly because catch time was slower. Catch lost about ${catchSeconds}s across this block.`;
    }
    if (shearLost) {
      return `Total time increased mainly because shear time was slower. Shear lost about ${shearSeconds}s across this block.`;
    }
  }

  if (catchGained && shearLost) {
    return `Faster catch gained about ${catchSeconds}s across this block, while slower shear lost about ${shearSeconds}s.`;
  }
  if (shearGained && catchLost) {
    return `Faster shear gained about ${shearSeconds}s across this block, while slower catch lost about ${catchSeconds}s.`;
  }
  if (catchGained && shearGained) {
    return `Total time improved because both catch and shear were faster. Catch gained about ${catchSeconds}s and shear gained about ${shearSeconds}s across this block.`;
  }
  if (catchGained && shearStayedClose) {
    return `Total time improved mainly because catch time was faster. Catch gained about ${catchSeconds}s across this block.`;
  }
  if (shearGained && catchStayedClose) {
    return `Total time improved mainly because shear time was faster. Shear gained about ${shearSeconds}s across this block.`;
  }
  if (catchGained) {
    return `Total time improved mainly because catch time was faster. Catch gained about ${catchSeconds}s across this block.`;
  }
  if (shearGained) {
    return `Total time improved mainly because shear time was faster. Shear gained about ${shearSeconds}s across this block.`;
  }

  return "Total time stayed close to the run average before this block. Catch and shear changes were small.";
}

function updateTrendFlags() {
  if (!elements.trendFlags) return;
  const { requiredCycle } = calculateTargetMetrics();
  if (requiredCycle <= 0) {
    appState.trendFlags = ["Set a target to enable trend flags."];
    elements.trendFlags.textContent = appState.trendFlags[0];
    return;
  }

  const rows = appState.sheep;
  const windowSize = 5;
  const cards = [];
  const meaningfulThresholdSeconds = 0.2;

  const averageMetric = (windowRows, metricKey) => {
    const values = windowRows
      .map((entry) => Number(entry?.[metricKey]))
      .filter((value) => Number.isFinite(value));
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  };

  const describeMetricTrend = (delta, blockCount) => {
    const normalizedDelta = Number.isFinite(delta) ? delta : 0;
    const absoluteDelta = Math.abs(normalizedDelta);
    const blockNetSeconds = absoluteDelta * blockCount;
    if (absoluteDelta <= meaningfulThresholdSeconds) {
      return {
        tone: "neutral",
        summary: "stayed close to the run average before this block",
        deltaText: `${absoluteDelta.toFixed(3)}s difference per sheep`,
        blockText: `stayed close across this block (${blockNetSeconds.toFixed(3)} seconds net)`
      };
    }
    if (normalizedDelta > 0) {
      return {
        tone: "bad",
        summary: "lost time",
        deltaText: `${absoluteDelta.toFixed(3)}s slower per sheep`,
        blockText: `lost about ${blockNetSeconds.toFixed(3)} seconds across this block`
      };
    }
    return {
      tone: "good",
      summary: "gained time",
      deltaText: `${absoluteDelta.toFixed(3)}s faster per sheep`,
      blockText: `gained about ${blockNetSeconds.toFixed(3)} seconds across this block`
    };
  };

  const renderMetricCard = ({ title, label, metricKey, metricName, windowRows, comparisonAverage, latestAverage, markerTimingClues, driverExplanation }) => {
    const meta = getTrendWindowMeta(windowRows, windowSize);
    const delta = latestAverage - comparisonAverage;
    const trend = describeMetricTrend(delta, windowRows.length);
    const markerLineText = formatTrendFlagMarkerTimingLine({
      markerTimingClues,
      metricKey,
      metricName,
      trendTone: trend.tone,
      meaningfulThresholdSeconds,
      windowRows,
      comparisonAverage
    });
    const markerLine = `<div class="trend-flag-context">${escapeTrendFlagHtml(markerLineText)}</div>`;
    const driverLine = driverExplanation
      ? `<div class="trend-flag-context">${escapeTrendFlagHtml(driverExplanation)}</div>`
      : "";
    return `
      <div class="trend-flag">
        <div class="trend-flag-title">${title}</div>
        <div class="trend-flag-meta">Sheep ${meta.sheepStart}–${meta.sheepEnd} • ${meta.timeStart}–${meta.timeEnd} • Window: last ${meta.windowSize}</div>
        <div class="trend-flag-lines">
          <div><span class="k">Latest block average</span>: <span class="v">${formatSeconds(latestAverage)}</span></div>
          <div><span class="k">Run avg before block</span>: <span class="v">${formatSeconds(comparisonAverage)}</span></div>
          <div><span class="k">Trend</span>: <span class="d ${trend.tone}">${trend.summary}</span></div>
          <div><span class="k">${label}</span>: <span class="d ${trend.tone}">${trend.deltaText}</span></div>
          <div><span class="k">Block net</span>: <span class="d ${trend.tone}">${trend.blockText}</span></div>
          ${driverLine}
          ${markerLine}
        </div>
      </div>
    `;
  };

  const renderTargetWarningCard = (latestRows) => {
    const latestAverage = averageMetric(latestRows, "fullCycle");
    const totalFullCycle = rows.reduce((sum, entry) => {
      const fullCycle = Number(entry?.fullCycle);
      return sum + (Number.isFinite(fullCycle) ? fullCycle : 0);
    }, 0);
    const targetNetSeconds = (requiredCycle * rows.length) - totalFullCycle;
    return `
      <div class="trend-flag">
        <div class="trend-flag-title">Target warning</div>
        <div class="trend-flag-lines">
          <div>Latest 5 sheep were all slower than required target time.</div>
          <div><span class="k">Target</span>: <span class="v">${formatTrendTargetSeconds(requiredCycle)}</span></div>
          <div><span class="k">Latest block avg</span>: <span class="v">${formatTrendTargetSeconds(latestAverage)}</span></div>
          <div>${formatTrendTargetNetLine(targetNetSeconds)}</div>
        </div>
      </div>
    `;
  };

  const recentRows = rows.slice(-windowSize);

  if (rows.length >= windowSize * 2) {
    const comparisonRows = rows.slice(0, -windowSize);
    const metricDefinitions = [
      { title: "Catch time", label: "Catch", metricKey: "catchDuration", metricName: "catch" },
      { title: "Shear time", label: "Shear", metricKey: "shearDuration", metricName: "shear" },
      { title: "Total time per sheep", label: "Total Time Per Sheep", metricKey: "fullCycle", metricName: "total time" }
    ];
    const comparisonAverages = metricDefinitions.reduce((averages, metric) => {
      averages[metric.metricKey] = averageMetric(comparisonRows, metric.metricKey);
      return averages;
    }, {});
    const metricKeys = metricDefinitions.map((metric) => metric.metricKey);
    const latestAverages = metricDefinitions.reduce((averages, metric) => {
      averages[metric.metricKey] = averageMetric(recentRows, metric.metricKey);
      return averages;
    }, {});
    const totalDriverExplanation = buildTrendTotalDriverExplanation({
      catchDelta: latestAverages.catchDuration - comparisonAverages.catchDuration,
      shearDelta: latestAverages.shearDuration - comparisonAverages.shearDuration,
      totalDelta: latestAverages.fullCycle - comparisonAverages.fullCycle,
      blockCount: recentRows.length,
      meaningfulThresholdSeconds
    });
    const sameMarkerAverages = buildTrendFlagSameMarkerTimingAverages(comparisonRows, metricKeys);
    const markerTimingClues = buildTrendFlagMarkerTimingClues(recentRows, comparisonAverages, sameMarkerAverages);

    metricDefinitions.forEach((metric) => {
      const comparisonAverage = comparisonAverages[metric.metricKey];
      const latestAverage = latestAverages[metric.metricKey];
      cards.push(renderMetricCard({
        title: metric.title,
        label: metric.label,
        metricKey: metric.metricKey,
        metricName: metric.metricName,
        metricAverageName: metric.metricAverageName,
        windowRows: recentRows,
        comparisonAverage,
        latestAverage,
        markerTimingClues,
        driverExplanation: metric.metricKey === "fullCycle" ? totalDriverExplanation : ""
      }));
    });

  }

  if (rows.length >= windowSize * 2 && recentRows.length === windowSize && recentRows.every((entry) => {
    const fullCycle = Number(entry?.fullCycle);
    return Number.isFinite(fullCycle) && fullCycle > requiredCycle;
  })) {
    cards.push(renderTargetWarningCard(recentRows));
  }


  if (!cards.length) {
    appState.trendFlags = [`No trend warnings yet. Need at least 10 sheep to compare the latest 5-sheep block with the run average before it.`];
    elements.trendFlags.textContent = appState.trendFlags[0];
    return;
  }

  appState.trendFlags = cards.map((card) => card.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  elements.trendFlags.innerHTML = cards.join("");
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
  canvas.height = 240;
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

  const margins = { left: 46, right: 12, top: 12, bottom: 28 };
  const width = canvas.width - margins.left - margins.right;
  const height = canvas.height - margins.top - margins.bottom;
  const maxX = Math.max(points.length ? points[points.length - 1].startElapsed / 60 : appState.trendBucketMinutes, appState.trendBucketMinutes);
  const maxY = Math.max(requiredCycle, ...points.map((p) => p.avgCycle), ...points.map((p) => p.avgCatch), 1) * 1.2;
  const x = (minute) => margins.left + (minute / maxX) * width;
  const y = (sec) => margins.top + height - (sec / maxY) * height;

  const yTickStep = maxY <= 30 ? 5 : 10;
  const yMaxTick = Math.ceil(maxY / yTickStep) * yTickStep;
  ctx.strokeStyle = "#eef2f7";
  ctx.fillStyle = "#64748b";
  ctx.font = "11px Arial";
  for (let tick = 0; tick <= yMaxTick; tick += yTickStep) {
    const py = y(tick);
    ctx.beginPath();
    ctx.moveTo(margins.left, py);
    ctx.lineTo(margins.left + width, py);
    ctx.stroke();
    ctx.fillText(String(tick), 8, py + 3);
  }

  const xTickEvery = points.length > 8 ? 2 : 1;
  const tickMinutes = points.length
    ? points.filter((_, index) => index % xTickEvery === 0).map((p) => p.startElapsed / 60)
    : [0, maxX];
  tickMinutes.forEach((minute) => {
    const px = x(minute);
    ctx.beginPath();
    ctx.moveTo(px, margins.top);
    ctx.lineTo(px, margins.top + height);
    ctx.strokeStyle = "#f5f7fb";
    ctx.stroke();
    ctx.fillStyle = "#64748b";
    ctx.fillText(String(Math.round(minute)), px - 8, canvas.height - 10);
  });

  ctx.strokeStyle = "#94a3b8";
  ctx.beginPath();
  ctx.moveTo(margins.left, margins.top);
  ctx.lineTo(margins.left, margins.top + height);
  ctx.lineTo(margins.left + width, margins.top + height);
  ctx.stroke();
  ctx.fillStyle = "#475569";
  ctx.font = "12px Arial";
  ctx.fillText("sec", 14, margins.top + 10);
  ctx.fillText("min", canvas.width - 34, canvas.height - 6);

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

function getSheepLogAnomalyClass(value, average, minSampleSize = 2) {
  if (!Number.isFinite(value) || !Number.isFinite(average) || average <= 0) return "";
  if (!Array.isArray(appState.sheep) || appState.sheep.length < minSampleSize) return "";

  const normalCutoff = Math.max(average + 2, average * 1.3);
  if (value <= normalCutoff) return "";
  if (value <= average * 2) return "sheep-log-anomaly-mild";
  if (value <= average * 3) return "sheep-log-anomaly-strong";
  return "sheep-log-anomaly-severe";
}

function calculateSheepLogAnomalyAverages() {
  if (!Array.isArray(appState.sheep) || appState.sheep.length === 0) {
    return { avgShearDuration: NaN, avgCatchDuration: NaN, avgFullCycle: NaN };
  }

  const totals = appState.sheep.reduce((acc, sheep) => {
    if (Number.isFinite(sheep?.shearDuration)) {
      acc.shearTotal += sheep.shearDuration;
      acc.shearCount += 1;
    }
    if (Number.isFinite(sheep?.catchDuration)) {
      acc.catchTotal += sheep.catchDuration;
      acc.catchCount += 1;
    }
    if (Number.isFinite(sheep?.fullCycle)) {
      acc.cycleTotal += sheep.fullCycle;
      acc.cycleCount += 1;
    }
    return acc;
  }, {
    shearTotal: 0,
    shearCount: 0,
    catchTotal: 0,
    catchCount: 0,
    cycleTotal: 0,
    cycleCount: 0
  });

  return {
    avgShearDuration: totals.shearCount > 0 ? totals.shearTotal / totals.shearCount : NaN,
    avgCatchDuration: totals.catchCount > 0 ? totals.catchTotal / totals.catchCount : NaN,
    avgFullCycle: totals.cycleCount > 0 ? totals.cycleTotal / totals.cycleCount : NaN
  };
}

function getSheepLogDayClockSeconds(entry, field) {
  const stableField = field === "start" ? "startDayClockSeconds" : "endDayClockSeconds";
  const stableSeconds = getFiniteClockNumber(entry?.[stableField]);
  if (Number.isFinite(stableSeconds)) return stableSeconds;

  const fallbackEndSeconds = getDayClockSecondsFromEffectiveElapsed(entry?.effectiveElapsedSeconds);
  if (!Number.isFinite(fallbackEndSeconds)) return NaN;
  if (field === "end") return fallbackEndSeconds;

  const shearDuration = getFiniteClockNumber(entry?.shearDuration);
  return Number.isFinite(shearDuration) ? fallbackEndSeconds - shearDuration : NaN;
}

function formatSheepLogClock(entry, field) {
  const dayClockSeconds = getSheepLogDayClockSeconds(entry, field);
  if (Number.isFinite(dayClockSeconds)) return formatSecondsFromMidnightClock(dayClockSeconds);
  return formatClock(field === "start" ? entry?.startTime : entry?.endTime);
}

function renderLogTable() {
  if (!elements.sheepLogBody) return;
  syncSelectedSheepLogIds();
  elements.sheepLogBody.innerHTML = "";

  const { requiredCycle } = calculateTargetMetrics();
  const anomalyAverages = calculateSheepLogAnomalyAverages();
  const plannedDelayMarkers = getPlannedDelayMarkersBySheepNumber();
  const sortedSheep = getSortedSheepLogEntries();
  sortedSheep.forEach((entry) => {
    const row = document.createElement("tr");
    const fullCycleClass = requiredCycle > 0
      ? (entry.fullCycle < requiredCycle - 0.05 ? "pace-good" : (entry.fullCycle > requiredCycle + 0.05 ? "pace-bad" : "pace-neutral"))
      : "pace-neutral";
    const shearAnomalyClass = getSheepLogAnomalyClass(entry.shearDuration, anomalyAverages.avgShearDuration);
    const catchAnomalyClass = getSheepLogAnomalyClass(entry.catchDuration, anomalyAverages.avgCatchDuration);
    const fullCycleAnomalyClass = getSheepLogAnomalyClass(entry.fullCycle, anomalyAverages.avgFullCycle);
    row.innerHTML = `
      <td class="sheep-log-select-col"><input class="sheep-log-select-checkbox" type="checkbox" data-sheep-id="${entry.id || ""}" aria-label="Select sheep #${entry.number} for merge" ${selectedSheepLogIds.has(entry.id) ? "checked" : ""}></td>
      <td>${entry.number}</td>
      <td class="sheep-log-time-col">${formatSheepLogClock(entry, "start")}</td>
      <td class="sheep-log-time-col">${formatSheepLogClock(entry, "end")}</td>
      <td class="sheep-log-time-col ${catchAnomalyClass}">${formatSeconds(entry.catchDuration)}</td>
      <td class="sheep-log-time-col ${shearAnomalyClass}">${formatSeconds(entry.shearDuration)}</td>
      <td class="sheep-log-time-col ${fullCycleClass} ${fullCycleAnomalyClass}">${formatSeconds(entry.fullCycle)}</td>
    `;
    row.appendChild(createSheepLogMarkerNoteCell(entry, plannedDelayMarkers));
    elements.sheepLogBody.appendChild(row);
  });

  updateMergeSelectedSheepButtonUI();

  const scroller = cacheSheepLogScroller();

  if (!appState.followLatestSheep || appState.userScrolledUp || !scroller) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scroller.scrollTop = scroller.scrollHeight;
    });
  });
}

function createSheepLogMarkerNoteCell(entry, plannedDelayMarkers) {
  const markerNoteCell = document.createElement("td");
  markerNoteCell.className = "sheep-log-marker-note-col";
  markerNoteCell.dataset.sheepId = entry.id || "";

  const manualMarkers = getConfirmedManualMarkersForEntry(entry);
  const noteText = normalizeSheepNote(entry.note);
  const allAutoMarkers = plannedDelayMarkers.get(entry.number) || [];
  const autoMarkers = !manualMarkers.length && appState.showPlannedDelayMarkers ? allAutoMarkers : [];

  if (sheepLogMarkerNoteEditorSheepId && entry.id === sheepLogMarkerNoteEditorSheepId) {
    markerNoteCell.classList.add("is-editing");
    markerNoteCell.appendChild(createSheepLogMarkerNoteEditor(entry, manualMarkers, noteText));
    return markerNoteCell;
  }

  const content = document.createElement("div");
  content.className = "sheep-log-marker-note-content";

  if (autoMarkers.length) {
    const tags = document.createElement("div");
    tags.className = "sheep-log-marker-tags sheep-log-auto-marker-tags";
    autoMarkers.forEach((marker) => {
      const tag = document.createElement("span");
      tag.className = "sheep-log-marker-tag";
      tag.textContent = `${marker.shortLabel} suggestion`;
      tag.title = `${marker.label}. Click + or Edit to confirm or change.`;
      tags.appendChild(tag);
    });
    content.appendChild(tags);
  }

  if (manualMarkers.length || noteText) {
    markerNoteCell.classList.add("has-marker-note");
    const summary = document.createElement("div");
    summary.className = "sheep-log-marker-note-summary";

    if (manualMarkers.length) {
      const markerSummary = document.createElement("div");
      markerSummary.className = "sheep-log-manual-marker-summary";
      const markerSummaryLabel = getManualMarkersDisplayLabel(manualMarkers);
      markerSummary.textContent = markerSummaryLabel;
      markerSummary.title = markerSummaryLabel;
      summary.appendChild(markerSummary);
    }

    if (noteText) {
      const noteSummary = document.createElement("div");
      noteSummary.className = "sheep-log-note-summary";
      noteSummary.textContent = noteText;
      noteSummary.title = noteText;
      summary.appendChild(noteSummary);
    }

    content.appendChild(summary);
    content.appendChild(createSheepLogMarkerNoteActionButton(entry, "edit"));
  } else {
    markerNoteCell.classList.add("is-empty");
    content.appendChild(createSheepLogMarkerNoteActionButton(entry, "add"));
  }

  markerNoteCell.appendChild(content);
  return markerNoteCell;
}

function createSheepLogStatusControls(entry) {
  const controls = document.createElement("div");
  controls.className = "sheep-log-status-controls";

  if (isRejectedSheep(entry)) {
    const badge = document.createElement("span");
    badge.className = "sheep-log-rejected-badge";
    badge.textContent = "Rejected";
    const reason = normalizeSheepStatusReason(entry.rejectedReason);
    if (reason) badge.title = `Reason: ${reason}`;
    controls.appendChild(badge);
    if (reason) {
      const reasonText = document.createElement("span");
      reasonText.className = "sheep-log-rejected-reason";
      reasonText.textContent = reason;
      reasonText.title = reason;
      controls.appendChild(reasonText);
    }
    controls.appendChild(createSheepLogStatusActionButton(entry, "restore"));
  } else {
    controls.appendChild(createSheepLogStatusActionButton(entry, "reject"));
  }

  return controls;
}

function createSheepLogStatusActionButton(entry, mode) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `sheep-log-status-action sheep-log-status-action-${mode}`;
  button.dataset.action = mode === "restore" ? "restore-sheep" : "reject-sheep";
  button.dataset.sheepId = entry.id || "";
  button.textContent = mode === "restore" ? "Restore" : "Reject";
  button.setAttribute("aria-label", mode === "restore" ? `Restore sheep #${entry.number} to the official count` : `Reject sheep #${entry.number} from the official count`);
  button.title = mode === "restore" ? `Restore sheep #${entry.number} to official count` : `Reject sheep #${entry.number} from official count`;
  return button;
}

function createSheepLogMarkerNoteActionButton(entry, mode) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sheep-log-marker-note-btn";
  button.dataset.action = "edit-marker-note";
  button.dataset.sheepId = entry.id || "";
  button.textContent = mode === "edit" ? "Edit" : "+";
  button.setAttribute("aria-label", mode === "edit" ? `Edit marker or note for sheep #${entry.number}` : `Add marker or note for sheep #${entry.number}`);
  button.title = mode === "edit" ? `Edit marker or note for sheep #${entry.number}` : `Add marker or note for sheep #${entry.number}`;
  return button;
}

function createSheepLogMarkerNoteEditor(entry, manualMarkers, noteText) {
  const editor = document.createElement("div");
  editor.className = "sheep-log-marker-note-editor";
  editor.dataset.sheepId = entry.id || "";

  const selectedMarkers = sanitizeManualMarkerArray(manualMarkers);
  const selectedBuiltInTypes = new Set(selectedMarkers
    .filter((marker) => isValidManualMarkerType(marker.type))
    .map((marker) => marker.type));
  const customMarker = selectedMarkers.find((marker) => marker.type === MANUAL_MARKER_CUSTOM_TYPE);

  const markerGroup = document.createElement("fieldset");
  markerGroup.className = "sheep-log-marker-checkboxes";

  const markerLegend = document.createElement("legend");
  markerLegend.textContent = "Confirmed markers";
  markerGroup.appendChild(markerLegend);

  Object.entries(MANUAL_MARKER_TYPES).forEach(([type, label]) => {
    const checkboxId = `sheep-marker-${entry.id || entry.number}-${type}`;
    const checkboxLabel = document.createElement("label");
    checkboxLabel.className = "sheep-log-marker-checkbox-label";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = checkboxId;
    checkbox.value = type;
    checkbox.dataset.role = "marker-checkbox";
    checkbox.checked = selectedBuiltInTypes.has(type);

    const labelText = document.createElement("span");
    labelText.textContent = type === "comb" ? "Comb/handpiece" : label;

    checkboxLabel.append(checkbox, labelText);
    markerGroup.appendChild(checkboxLabel);
  });

  editor.appendChild(markerGroup);

  const customInput = document.createElement("input");
  customInput.type = "text";
  customInput.className = "sheep-log-marker-custom-input";
  customInput.dataset.role = "custom-label";
  customInput.maxLength = 60;
  customInput.placeholder = "Custom marker label (optional)";
  customInput.value = customMarker?.customLabel || "";
  editor.appendChild(customInput);

  const noteInput = document.createElement("textarea");
  noteInput.className = "sheep-log-marker-note-input";
  noteInput.dataset.role = "note";
  noteInput.maxLength = SHEEP_NOTE_MAX_LENGTH;
  noteInput.rows = 2;
  noteInput.placeholder = `Note/details (optional, max ${SHEEP_NOTE_MAX_LENGTH} chars)`;
  noteInput.value = noteText;
  editor.appendChild(noteInput);

  const validation = document.createElement("div");
  validation.className = "sheep-log-marker-note-validation";
  validation.dataset.role = "validation";
  editor.appendChild(validation);

  const actions = document.createElement("div");
  actions.className = "sheep-log-marker-note-actions";

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "sheep-log-marker-note-save";
  saveButton.dataset.action = "save-marker-note";
  saveButton.dataset.sheepId = entry.id || "";
  saveButton.textContent = "Save";
  actions.appendChild(saveButton);

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "sheep-log-marker-note-cancel";
  cancelButton.dataset.action = "cancel-marker-note";
  cancelButton.dataset.sheepId = entry.id || "";
  cancelButton.textContent = "Cancel";
  actions.appendChild(cancelButton);

  editor.appendChild(actions);
  return editor;
}

function buildPlannedDelayMarkerMap(entries, markerSettings) {
  const markersBySheep = new Map();
  if (!Array.isArray(entries) || entries.length < 4) return markersBySheep;
  const catchEntries = entries.filter((entry) => Number.isFinite(entry?.catchDuration) && entry.catchDuration > 0);
  if (catchEntries.length < 4) return markersBySheep;
  const catchAverage = catchEntries.reduce((sum, entry) => sum + entry.catchDuration, 0) / catchEntries.length;
  if (!Number.isFinite(catchAverage) || catchAverage <= 0) return markersBySheep;

  const isNearCadence = (elapsedSeconds, cadenceSeconds, toleranceSeconds) => {
    if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return false;
    const nearestMultiple = Math.round(elapsedSeconds / cadenceSeconds) * cadenceSeconds;
    return nearestMultiple > 0 && Math.abs(elapsedSeconds - nearestMultiple) <= toleranceSeconds;
  };

  entries.forEach((entry) => {
    const catchDuration = Number(entry?.catchDuration);
    const elapsedSeconds = Number(entry?.effectiveElapsedSeconds);
    const markers = [];
    const { drink, cutter, comb } = markerSettings || {};
    const extraSeconds = catchDuration - catchAverage;
    const matchesMarkerRange = (rule) => {
      const min = Number(rule?.minExtraSeconds);
      const max = rule?.maxExtraSeconds;
      return Number.isFinite(min)
        && extraSeconds >= min
        && (max === null || extraSeconds < max);
    };
    const isComb = matchesMarkerRange(comb)
      && isNearCadence(elapsedSeconds, comb.plannedTimingMinutes * 60, comb.timeWindowSeconds);
    const isCutter = matchesMarkerRange(cutter)
      && isNearCadence(elapsedSeconds, cutter.plannedTimingMinutes * 60, cutter.timeWindowSeconds);
    const isDrink = matchesMarkerRange(drink)
      && isNearCadence(elapsedSeconds, drink.plannedTimingMinutes * 60, drink.timeWindowSeconds);

    if (isComb) {
      markers.push({ type: "comb", shortLabel: "Comb", label: "Likely comb/handpiece change" });
    } else if (isCutter) {
      markers.push({ type: "cutter", shortLabel: "Cutter", label: "Likely cutter change" });
    }
    if (isDrink && markers.length === 0) {
      markers.push({ type: "drink", shortLabel: "Drink?", label: "Possible drink break" });
    }
    if (markers.length > 0 && Number.isFinite(entry?.number)) {
      markersBySheep.set(entry.number, markers);
    }
  });
  return markersBySheep;
}

function createMarkerStatBucket() {
  return { count: 0, catchTotal: 0, catchCount: 0 };
}

function addMarkerStatCatchDuration(bucket, catchDuration) {
  if (!bucket) return;
  bucket.count += 1;
  const numericCatchDuration = Number(catchDuration);
  if (Number.isFinite(numericCatchDuration)) {
    bucket.catchTotal += numericCatchDuration;
    bucket.catchCount += 1;
  }
}

function getConfirmedMarkersForStats(entry) {
  return getConfirmedManualMarkersForEntry(entry).map((marker) => ({
    type: marker.type,
    label: marker.label,
    source: "manual"
  }));
}

function buildResolvedMarkerStats(entries, markerSettings) {
  const markerTypes = Object.keys(MANUAL_MARKER_TYPES);
  const stats = {
    buckets: Object.fromEntries([
      ...markerTypes.map((type) => [type, createMarkerStatBucket()]),
      [MANUAL_MARKER_CUSTOM_TYPE, createMarkerStatBucket()]
    ]),
    baselineCatchAverage: calculateAverageCatchDuration(entries)
  };
  if (!Array.isArray(entries)) return stats;

  entries.forEach((entry) => {
    getConfirmedMarkersForStats(entry).forEach((marker) => {
      const bucket = stats.buckets[marker.type];
      if (bucket) addMarkerStatCatchDuration(bucket, entry?.catchDuration);
    });
  });

  return stats;
}

function buildMarkerStats(entries, markerSettings) {
  return buildResolvedMarkerStats(entries, markerSettings);
}

function calculateAverageCatchDuration(entries) {
  if (!Array.isArray(entries)) return null;
  const catchDurations = entries
    .map((entry) => Number(entry?.catchDuration))
    .filter((duration) => Number.isFinite(duration));
  if (!catchDurations.length) return null;
  return catchDurations.reduce((sum, duration) => sum + duration, 0) / catchDurations.length;
}

function getMarkerAverageCatchSeconds(bucket) {
  if (!bucket || bucket.catchCount <= 0) return null;
  const averageCatchSeconds = bucket.catchTotal / bucket.catchCount;
  return Number.isFinite(averageCatchSeconds) ? averageCatchSeconds : null;
}

function formatMarkerAverageCatch(bucket) {
  const averageCatchSeconds = getMarkerAverageCatchSeconds(bucket);
  if (!Number.isFinite(averageCatchSeconds)) return "—";
  return `${averageCatchSeconds.toFixed(1)}s avg`;
}

function formatMarkerStatLine(label, bucket) {
  if (!bucket?.count) return `${label}: 0`;
  const averageCatch = bucket.catchCount > 0 ? bucket.catchTotal / bucket.catchCount : null;
  const averageText = Number.isFinite(averageCatch) ? `, avg catch ${averageCatch.toFixed(1)}s` : "";
  return `${label}: ${bucket.count}${averageText}`;
}

function formatMarkerStatsSummary(stats) {
  const buckets = stats?.buckets || {};
  const hasStats = ["drink", "cutter", "comb", MANUAL_MARKER_CUSTOM_TYPE].some((type) => buckets[type]?.count > 0);
  if (!hasStats) return "Marker Summary: No marker data recorded for this run.";

  return [
    "Marker Summary",
    formatMarkerStatLine("Drink", buckets.drink),
    formatMarkerStatLine("Cutter", buckets.cutter),
    formatMarkerStatLine("Comb", buckets.comb),
    formatMarkerStatLine("Custom", buckets[MANUAL_MARKER_CUSTOM_TYPE])
  ].join("\n");
}

function getPlannedDelayMarkersBySheepNumber() {
  return buildPlannedDelayMarkerMap(appState.sheep, appState.markerSettings);
}

function getDefaultMarkerSettings() {
  return {
    drink: { plannedTimingMinutes: 7.5, timeWindowSeconds: 25, minExtraSeconds: 2, maxExtraSeconds: 4 },
    cutter: { plannedTimingMinutes: 15, timeWindowSeconds: 25, minExtraSeconds: 4, maxExtraSeconds: 7 },
    comb: { plannedTimingMinutes: 60, timeWindowSeconds: 30, minExtraSeconds: 7, maxExtraSeconds: null }
  };
}

function getFixedMarkerExtraSeconds(rawRule) {
  const extraSecondsOverAverage = Number(rawRule?.extraSecondsOverAverage);
  if (Number.isFinite(extraSecondsOverAverage) && extraSecondsOverAverage >= 0) return extraSecondsOverAverage;
  const catchLongerThanAverage = Number(rawRule?.catchLongerThanAverage);
  const migratedExtraSecondsOverAverage = (catchLongerThanAverage - 1) * 10;
  return Number.isFinite(migratedExtraSecondsOverAverage) && migratedExtraSecondsOverAverage >= 0
    ? migratedExtraSecondsOverAverage
    : null;
}

function getMigratedMarkerRangesFromFixedSettings(rawSettings, defaults) {
  const fixedSettings = {
    drink: getFixedMarkerExtraSeconds(rawSettings?.drink),
    cutter: getFixedMarkerExtraSeconds(rawSettings?.cutter),
    comb: getFixedMarkerExtraSeconds(rawSettings?.comb)
  };
  if (!Object.values(fixedSettings).every((value) => Number.isFinite(value))) return null;
  const matchesOldDefaults = fixedSettings.drink === 3 && fixedSettings.cutter === 5 && fixedSettings.comb === 8;
  if (matchesOldDefaults) {
    return {
      drink: { minExtraSeconds: defaults.drink.minExtraSeconds, maxExtraSeconds: defaults.drink.maxExtraSeconds },
      cutter: { minExtraSeconds: defaults.cutter.minExtraSeconds, maxExtraSeconds: defaults.cutter.maxExtraSeconds },
      comb: { minExtraSeconds: defaults.comb.minExtraSeconds, maxExtraSeconds: defaults.comb.maxExtraSeconds }
    };
  }
  if (!(fixedSettings.drink < fixedSettings.cutter && fixedSettings.cutter < fixedSettings.comb)) return null;
  return {
    drink: { minExtraSeconds: fixedSettings.drink, maxExtraSeconds: fixedSettings.cutter },
    cutter: { minExtraSeconds: fixedSettings.cutter, maxExtraSeconds: fixedSettings.comb },
    comb: { minExtraSeconds: fixedSettings.comb, maxExtraSeconds: null }
  };
}

function sanitizeMarkerSettings(rawSettings) {
  const defaults = getDefaultMarkerSettings();
  const migratedRanges = getMigratedMarkerRangesFromFixedSettings(rawSettings, defaults);
  const sanitizeMaxExtraSeconds = (rawMaxExtraSeconds, minExtraSeconds) => {
    if (rawMaxExtraSeconds === null || (typeof rawMaxExtraSeconds === "string" && rawMaxExtraSeconds.trim() === "")) return null;
    const maxExtraSeconds = Number(rawMaxExtraSeconds);
    return Number.isFinite(maxExtraSeconds) && maxExtraSeconds > minExtraSeconds ? maxExtraSeconds : null;
  };
  const sanitizeRange = (rawRule, fallbackRule, migratedRange) => {
    const rawMinExtraSeconds = Number(rawRule?.minExtraSeconds);
    const hasValidRawMin = Number.isFinite(rawMinExtraSeconds) && rawMinExtraSeconds >= 0;
    if (hasValidRawMin) {
      const rawMax = sanitizeMaxExtraSeconds(rawRule?.maxExtraSeconds, rawMinExtraSeconds);
      const hasValidRawMax = rawRule?.maxExtraSeconds === null
        || (typeof rawRule?.maxExtraSeconds === "string" && rawRule.maxExtraSeconds.trim() === "")
        || rawMax !== null;
      if (hasValidRawMax) {
        return { minExtraSeconds: rawMinExtraSeconds, maxExtraSeconds: rawMax };
      }
    }
    if (migratedRange) return migratedRange;
    return { minExtraSeconds: fallbackRule.minExtraSeconds, maxExtraSeconds: fallbackRule.maxExtraSeconds };
  };
  const sanitizeRule = (rawRule, fallbackRule, migratedRange) => {
    const plannedTimingMinutes = Number(rawRule?.plannedTimingMinutes);
    const timeWindowSeconds = Number(rawRule?.timeWindowSeconds);
    const range = sanitizeRange(rawRule, fallbackRule, migratedRange);
    return {
      plannedTimingMinutes: Number.isFinite(plannedTimingMinutes) && plannedTimingMinutes > 0 ? plannedTimingMinutes : fallbackRule.plannedTimingMinutes,
      timeWindowSeconds: Number.isFinite(timeWindowSeconds) && timeWindowSeconds > 0 ? timeWindowSeconds : fallbackRule.timeWindowSeconds,
      minExtraSeconds: range.minExtraSeconds,
      maxExtraSeconds: range.maxExtraSeconds
    };
  };
  return {
    drink: sanitizeRule(rawSettings?.drink, defaults.drink, migratedRanges?.drink),
    cutter: sanitizeRule(rawSettings?.cutter, defaults.cutter, migratedRanges?.cutter),
    comb: sanitizeRule(rawSettings?.comb, defaults.comb, migratedRanges?.comb)
  };
}

function syncMarkerSettingsInputs() {
  const { drink, cutter, comb } = appState.markerSettings;
  if (elements.drinkTimingMinutes) elements.drinkTimingMinutes.value = String(drink.plannedTimingMinutes);
  if (elements.drinkWindowSeconds) elements.drinkWindowSeconds.value = String(drink.timeWindowSeconds);
  if (elements.drinkMinExtraSeconds) elements.drinkMinExtraSeconds.value = String(drink.minExtraSeconds);
  if (elements.drinkMaxExtraSeconds) elements.drinkMaxExtraSeconds.value = drink.maxExtraSeconds === null ? "" : String(drink.maxExtraSeconds);
  if (elements.cutterTimingMinutes) elements.cutterTimingMinutes.value = String(cutter.plannedTimingMinutes);
  if (elements.cutterWindowSeconds) elements.cutterWindowSeconds.value = String(cutter.timeWindowSeconds);
  if (elements.cutterMinExtraSeconds) elements.cutterMinExtraSeconds.value = String(cutter.minExtraSeconds);
  if (elements.cutterMaxExtraSeconds) elements.cutterMaxExtraSeconds.value = cutter.maxExtraSeconds === null ? "" : String(cutter.maxExtraSeconds);
  if (elements.combTimingMinutes) elements.combTimingMinutes.value = String(comb.plannedTimingMinutes);
  if (elements.combWindowSeconds) elements.combWindowSeconds.value = String(comb.timeWindowSeconds);
  if (elements.combMinExtraSeconds) elements.combMinExtraSeconds.value = String(comb.minExtraSeconds);
  if (elements.combMaxExtraSeconds) elements.combMaxExtraSeconds.value = comb.maxExtraSeconds === null ? "" : String(comb.maxExtraSeconds);
}

function saveMarkerSettings() {
  localStorage.setItem(SHEEP_LOG_MARKER_SETTINGS_STORAGE_KEY, JSON.stringify(appState.markerSettings));
}

function loadMarkerSettings() {
  let parsed = getDefaultMarkerSettings();
  try {
    const raw = localStorage.getItem(SHEEP_LOG_MARKER_SETTINGS_STORAGE_KEY);
    if (raw) parsed = sanitizeMarkerSettings(JSON.parse(raw));
  } catch (error) {
    parsed = getDefaultMarkerSettings();
  }
  appState.markerSettings = parsed;
  syncMarkerSettingsInputs();
}

function setMarkerSettingsOpen(isOpen) {
  appState.markerSettingsOpen = Boolean(isOpen);
  if (elements.markerSettingsPanel) elements.markerSettingsPanel.hidden = !appState.markerSettingsOpen;
  if (elements.markerSettingsToggle) elements.markerSettingsToggle.setAttribute("aria-expanded", String(appState.markerSettingsOpen));
}

function getMarkerSettingsMaxInputValue(input) {
  const value = input?.value;
  return typeof value === "string" && value.trim() === "" ? null : value;
}

function applyMarkerSettingsFromInputs() {
  appState.markerSettings = sanitizeMarkerSettings({
    drink: {
      plannedTimingMinutes: elements.drinkTimingMinutes?.value,
      timeWindowSeconds: elements.drinkWindowSeconds?.value,
      minExtraSeconds: elements.drinkMinExtraSeconds?.value,
      maxExtraSeconds: getMarkerSettingsMaxInputValue(elements.drinkMaxExtraSeconds)
    },
    cutter: {
      plannedTimingMinutes: elements.cutterTimingMinutes?.value,
      timeWindowSeconds: elements.cutterWindowSeconds?.value,
      minExtraSeconds: elements.cutterMinExtraSeconds?.value,
      maxExtraSeconds: getMarkerSettingsMaxInputValue(elements.cutterMaxExtraSeconds)
    },
    comb: {
      plannedTimingMinutes: elements.combTimingMinutes?.value,
      timeWindowSeconds: elements.combWindowSeconds?.value,
      minExtraSeconds: elements.combMinExtraSeconds?.value,
      maxExtraSeconds: getMarkerSettingsMaxInputValue(elements.combMaxExtraSeconds)
    }
  });
  syncMarkerSettingsInputs();
  saveMarkerSettings();
  renderLogTable();
  updateNextDrinkCountdownDisplay();
}

function resetMarkerSettings() {
  appState.markerSettings = getDefaultMarkerSettings();
  syncMarkerSettingsInputs();
  saveMarkerSettings();
  renderLogTable();
  updateNextDrinkCountdownDisplay();
}

function loadPlannedDelayMarkerVisibility() {
  let visible = true;
  try {
    const raw = localStorage.getItem(SHEEP_LOG_MARKERS_VISIBLE_STORAGE_KEY);
    if (raw === "false") visible = false;
  } catch (error) {
    visible = true;
  }
  appState.showPlannedDelayMarkers = visible;
  if (elements.showPlannedDelayMarkers) elements.showPlannedDelayMarkers.checked = visible;
}

function setPlannedDelayMarkerVisibility(nextVisible) {
  appState.showPlannedDelayMarkers = Boolean(nextVisible);
  if (elements.showPlannedDelayMarkers) elements.showPlannedDelayMarkers.checked = appState.showPlannedDelayMarkers;
  localStorage.setItem(SHEEP_LOG_MARKERS_VISIBLE_STORAGE_KEY, appState.showPlannedDelayMarkers ? "true" : "false");
  renderLogTable();
}

function normalizeSheepNote(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, SHEEP_NOTE_MAX_LENGTH);
}

function updateSheepEntryMarkerNoteById(sheepId, manualMarkers, noteText) {
  if (!sheepId) return false;
  let updated = false;
  const sanitizedManualMarkers = sanitizeManualMarkerArray(manualMarkers);

  [appState.sheep, appState.daySheep].forEach((entries) => {
    if (!Array.isArray(entries)) return;
    entries.forEach((entry) => {
      if (entry?.id !== sheepId) return;
      if (sanitizedManualMarkers.length) {
        entry.manualMarkers = sanitizedManualMarkers.map((marker) => ({ ...marker }));
        syncLegacyManualMarkerToFirstManualMarker(entry, entry.manualMarkers);
      } else {
        delete entry.manualMarkers;
        delete entry.manualMarker;
      }
      if (noteText) {
        entry.note = noteText;
      } else {
        delete entry.note;
      }
      updated = true;
    });
  });

  return updated;
}

function sanitizeManualMarkersOnSheepEntries(entries) {
  if (!Array.isArray(entries)) return;
  entries.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const manualMarkers = getConfirmedManualMarkersForEntry(entry);
    if (manualMarkers.length) {
      entry.manualMarkers = manualMarkers;
      syncLegacyManualMarkerToFirstManualMarker(entry, manualMarkers);
    } else {
      delete entry.manualMarkers;
      delete entry.manualMarker;
    }
    const noteText = normalizeSheepNote(entry.note);
    if (noteText) {
      entry.note = noteText;
    } else {
      delete entry.note;
    }
  });
}

function openSheepLogMarkerNoteEditor(sheepId) {
  if (!sheepId) return;
  sheepLogMarkerNoteEditorSheepId = sheepId;
  renderLogTable();
}

function closeSheepLogMarkerNoteEditor() {
  sheepLogMarkerNoteEditorSheepId = "";
  renderLogTable();
}

function getSheepLogEntryById(sheepId) {
  if (!sheepId || !Array.isArray(appState.sheep)) return null;
  return appState.sheep.find((entry) => entry?.id === sheepId) || null;
}

function refreshAfterSheepStatusChange(message = "") {
  calculateAverages();
  updateTargetPacePredictionSnapshot(getLiveTargetPacePredictions());
  updateStatsPanel();
  updateLivePanel();
  renderLogTable();
  renderReviewList();
  drawTrendGraph();
  updateTrendFlags();
  updatePenFillForecastDisplay();
  updatePenStateDisplay();
  updatePenFillEarlyReminderDisplay();
  updatePenFillConfirmationControls({ statusOverride: message });
  autosaveState();
}

function promptRejectSheepById(sheepId) {
  const entry = getSheepLogEntryById(sheepId);
  if (!entry) {
    window.alert("Could not find this sheep row. Refresh and try again.");
    return { success: false, error: "Sheep entry not found." };
  }

  const reason = window.prompt(
    `Reject sheep ${entry.number} from the official count? It will stay in the physical log and timing history, but will not count toward the official total.\n\nOptional reason:`,
    ""
  );
  if (reason === null) return { success: false, error: "Reject cancelled." };

  const result = rejectSheepById(sheepId, { reason });
  if (!result.success) {
    window.alert(result.error || "Could not reject this sheep.");
    return result;
  }

  refreshAfterSheepStatusChange(`Rejected sheep ${entry.number}.`);
  return result;
}

function promptRestoreSheepById(sheepId) {
  const entry = getSheepLogEntryById(sheepId);
  if (!entry) {
    window.alert("Could not find this sheep row. Refresh and try again.");
    return { success: false, error: "Sheep entry not found." };
  }

  const reason = window.prompt(`Restore sheep ${entry.number} to the official count?\n\nOptional restore reason:`, "");
  if (reason === null) return { success: false, error: "Restore cancelled." };

  const result = restoreSheepById(sheepId, { reason });
  if (!result.success) {
    window.alert(result.error || "Could not restore this sheep.");
    return result;
  }

  refreshAfterSheepStatusChange(`Restored sheep ${entry.number}.`);
  return result;
}

function saveSheepLogMarkerNoteFromEditor(editor) {
  const sheepId = editor.dataset.sheepId || "";
  const markerCheckboxes = [...editor.querySelectorAll('[data-role="marker-checkbox"]')];
  const customInput = editor.querySelector('[data-role="custom-label"]');
  const noteInput = editor.querySelector('[data-role="note"]');
  const validation = editor.querySelector('[data-role="validation"]');
  if (!(noteInput instanceof HTMLTextAreaElement)) return;

  const noteText = normalizeSheepNote(noteInput.value);
  const manualMarkers = markerCheckboxes
    .filter((checkbox) => checkbox instanceof HTMLInputElement && checkbox.checked)
    .map((checkbox) => buildManualMarker(checkbox.value))
    .filter(Boolean);
  const customLabel = customInput instanceof HTMLInputElement ? normalizeManualMarkerCustomLabel(customInput.value) : "";
  if (customLabel) {
    const customMarker = buildManualMarker(MANUAL_MARKER_CUSTOM_TYPE, customLabel);
    if (!customMarker) {
      if (validation) validation.textContent = "Enter a valid custom marker label before saving.";
      if (customInput instanceof HTMLInputElement) customInput.focus();
      return;
    }
    manualMarkers.push(customMarker);
  }

  const updated = updateSheepEntryMarkerNoteById(sheepId, manualMarkers, noteText);
  if (!updated) {
    if (validation) validation.textContent = "Could not find this sheep row. Refresh and try again.";
    return;
  }

  sheepLogMarkerNoteEditorSheepId = "";
  autosaveState();
  renderLogTable();
  updateStatsPanel();
}

function getSortedSheepLogEntries() {
  const entries = [...appState.sheep];
  const { by, order } = appState.sheepLogSort;
  if (by !== "number") {
    const multiplier = order === "desc" ? -1 : 1;
    entries.sort((a, b) => {
      const aValue = Number(a?.[by]) || 0;
      const bValue = Number(b?.[by]) || 0;
      if (aValue !== bValue) return (aValue - bValue) * multiplier;
      return (a.number - b.number);
    });
  }
  if (appState.sheepLogFillDirection === "latestFirst") entries.reverse();
  return entries;
}

function loadSheepLogSortSettings() {
  if (!elements.sheepLogSortBy || !elements.sheepLogSortOrder) return;
  let nextBy = "number";
  let nextOrder = "asc";
  try {
    const raw = JSON.parse(localStorage.getItem(SHEEP_LOG_SORT_STORAGE_KEY) || "null");
    if (raw?.by === "shearDuration" || raw?.by === "catchDuration" || raw?.by === "fullCycle" || raw?.by === "number") {
      nextBy = raw.by;
    }
    if (raw?.order === "asc" || raw?.order === "desc") {
      nextOrder = raw.order;
    }
  } catch (error) {
    nextBy = "number";
    nextOrder = "asc";
  }
  appState.sheepLogSort.by = nextBy;
  appState.sheepLogSort.order = nextBy === "number" ? "asc" : nextOrder;
  elements.sheepLogSortBy.value = appState.sheepLogSort.by;
  elements.sheepLogSortOrder.value = appState.sheepLogSort.order;
  elements.sheepLogSortOrder.disabled = appState.sheepLogSort.by === "number";
}

function setSheepLogSortSettings() {
  if (!elements.sheepLogSortBy || !elements.sheepLogSortOrder) return;
  const by = elements.sheepLogSortBy.value;
  const order = by === "number" ? "asc" : (elements.sheepLogSortOrder.value === "desc" ? "desc" : "asc");
  appState.sheepLogSort.by = by;
  appState.sheepLogSort.order = order;
  elements.sheepLogSortOrder.value = appState.sheepLogSort.order;
  elements.sheepLogSortOrder.disabled = appState.sheepLogSort.by === "number";
  localStorage.setItem(SHEEP_LOG_SORT_STORAGE_KEY, JSON.stringify(appState.sheepLogSort));
  renderLogTable();
}


function loadSheepLogFillDirectionSettings() {
  if (!elements.sheepLogFillDirection) return;
  let nextDirection = "latestFirst";
  try {
    const raw = localStorage.getItem(SHEEP_LOG_FILL_DIRECTION_STORAGE_KEY);
    if (raw === "latestFirst" || raw === "oldestFirst") nextDirection = raw;
  } catch (error) {
    nextDirection = "latestFirst";
  }
  appState.sheepLogFillDirection = nextDirection;
  elements.sheepLogFillDirection.value = nextDirection;
}

function setSheepLogFillDirectionSettings() {
  if (!elements.sheepLogFillDirection) return;
  const nextDirection = elements.sheepLogFillDirection.value === "oldestFirst" ? "oldestFirst" : "latestFirst";
  appState.sheepLogFillDirection = nextDirection;
  elements.sheepLogFillDirection.value = nextDirection;
  localStorage.setItem(SHEEP_LOG_FILL_DIRECTION_STORAGE_KEY, nextDirection);
  renderLogTable();
}

function cacheSheepLogScroller() {
  if (!elements.sheepLogBody) return null;
  const logPanel = elements.sheepLogBody.closest("#panel-log") || elements.sheepLogBody.closest(".panel");
  const logPanelBody = logPanel?.querySelector(".panel-body") || elements.sheepLogBody.closest(".panel-body");

  let scroller = appState.sheepLogScroller;
  if (!scroller || !logPanelBody?.contains(scroller)) {
    const dedicatedScroller = logPanelBody?.querySelector(".sheep-log-scroll");
    const tableWrap = elements.sheepLogBody.closest(".table-wrap, .table-scroll");
    scroller = dedicatedScroller || tableWrap || findScrollableParent(elements.sheepLogBody, logPanelBody);
    appState.sheepLogScroller = scroller || null;
    appState.sheepLogScrollListenerAttached = false;
  }

  if (scroller && !appState.sheepLogScrollListenerAttached) {
    scroller.addEventListener("scroll", handleSheepLogScroll, { passive: true });
    appState.sheepLogScrollListenerAttached = true;
    handleSheepLogScroll();
  }

  return scroller;
}

function handleSheepLogScroll() {
  const scroller = appState.sheepLogScroller;
  if (!scroller) return;
  const distanceFromBottom = scroller.scrollHeight - (scroller.scrollTop + scroller.clientHeight);
  if (distanceFromBottom > 40) {
    appState.userScrolledUp = true;
  } else if (distanceFromBottom <= 10) {
    appState.userScrolledUp = false;
  }
}

function findScrollableParent(startElement, boundaryElement = null) {
  let current = startElement?.parentElement || null;
  while (current) {
    const style = window.getComputedStyle(current);
    const canScrollY = style.overflowY === "auto" || style.overflowY === "scroll";
    if (canScrollY && current.scrollHeight > current.clientHeight) {
      return current;
    }
    if (boundaryElement && current === boundaryElement) {
      break;
    }
    current = current.parentElement;
  }
  return null;
}


function calculateQuarterTotals(targetMetrics) {
  const quarterSeconds = 900;
  const hasRunStarted = appState.runStartTime !== null || appState.runActive || appState.effectiveElapsedBeforePauseMs > 0;
  if (!hasRunStarted) return { required: null, predicted: null };

  const runDurationSeconds = Math.max(getCurrentRunDurationSeconds(), 0);
  const elapsedSeconds = Math.max(getEffectiveElapsedSeconds(), 0);
  const currentQuarterIndex = Math.floor(elapsedSeconds / quarterSeconds);
  const quarterStartSeconds = currentQuarterIndex * quarterSeconds;
  const quarterEndSeconds = Math.min(quarterStartSeconds + quarterSeconds, runDurationSeconds);
  const quarterLengthSeconds = Math.max(quarterEndSeconds - quarterStartSeconds, 0);

  const required = runDurationSeconds > 0 && targetMetrics.requiredRunSheep > 0
    ? Math.max(Math.round((targetMetrics.requiredRunSheep * quarterLengthSeconds) / runDurationSeconds), 0)
    : null;

  if (quarterLengthSeconds <= 0 || appState.currentStats.avgCycle <= 0) return { required, predicted: null };

  const sheepDoneByQuarterStart = appState.sheep.filter((entry) => (Number(entry?.effectiveElapsedSeconds) || 0) <= quarterStartSeconds).length;
  const completedInQuarter = Math.max(appState.sheep.length - sheepDoneByQuarterStart, 0);
  const remainingQuarterSeconds = Math.max(quarterEndSeconds - elapsedSeconds, 0);
  const projectedAdditional = Math.floor(remainingQuarterSeconds / appState.currentStats.avgCycle);
  const predicted = Math.max(completedInQuarter + projectedAdditional, 0);

  return { required, predicted };
}

function getCurrentQuarterWindow() {
  const quarterSeconds = 900;
  const elapsedSeconds = Math.max(Number(getEffectiveElapsedSeconds()) || 0, 0);
  const runDurationSeconds = Math.max(Number(getCurrentRunDurationSeconds()) || 0, 0);
  const totalQuarters = Math.max(Math.ceil(runDurationSeconds / quarterSeconds), 1);
  const currentQuarterIndex = Math.min(Math.floor(elapsedSeconds / quarterSeconds), totalQuarters - 1);
  const startSeconds = currentQuarterIndex * quarterSeconds;
  const endSeconds = Math.min(startSeconds + quarterSeconds, runDurationSeconds);

  return { startSeconds, endSeconds };
}

function getCurrentQuarterSheepCount() {
  const { startSeconds, endSeconds } = getCurrentQuarterWindow();
  if (!Array.isArray(appState.sheep)) return 0;

  return appState.sheep.filter((entry) => {
    const effectiveElapsedSeconds = Number(entry?.effectiveElapsedSeconds);
    return Number.isFinite(effectiveElapsedSeconds)
      && effectiveElapsedSeconds > startSeconds
      && effectiveElapsedSeconds <= endSeconds;
  }).length;
}

const QUARTER_SHEEP_STATUS_CLASSES = [
  "quarter-sheep-neutral",
  "quarter-sheep-on",
  "quarter-sheep-ahead",
  "quarter-sheep-behind"
];

function getQuarterElapsedSeconds(quarterElapsedSeconds = null) {
  return Number.isFinite(quarterElapsedSeconds)
    ? Math.max(quarterElapsedSeconds, 0)
    : Math.max(getEffectiveElapsedSeconds() - getCurrentQuarterWindow().startSeconds, 0);
}

function getCurrentQuarterTargetSheepCount() {
  const requiredSecondsPerSheep = calculateTargetMetrics().requiredCycle;
  if (!Number.isFinite(requiredSecondsPerSheep) || requiredSecondsPerSheep <= 0) return null;

  const quarterTargetSheep = Math.ceil(900 / requiredSecondsPerSheep);
  return Number.isFinite(quarterTargetSheep) && quarterTargetSheep > 0 ? quarterTargetSheep : null;
}

function getQuarterSheepPaceClass(quarterElapsedSeconds = null, actualQuarterSheep = getCurrentQuarterSheepCount()) {
  const requiredSecondsPerSheep = calculateTargetMetrics().requiredCycle;
  if (!Number.isFinite(requiredSecondsPerSheep) || requiredSecondsPerSheep <= 0) {
    return "quarter-sheep-neutral";
  }

  const elapsedSeconds = getQuarterElapsedSeconds(quarterElapsedSeconds);
  const expectedQuarterSheep = elapsedSeconds / requiredSecondsPerSheep;
  if (!Number.isFinite(expectedQuarterSheep)) return "quarter-sheep-neutral";

  const difference = actualQuarterSheep - expectedQuarterSheep;
  if (difference > 0.5) return "quarter-sheep-ahead";
  return difference < -0.5 ? "quarter-sheep-behind" : "quarter-sheep-on";
}

function getQuarterTargetCompletionTime(quarterElapsedSeconds = null, actualQuarterSheep = getCurrentQuarterSheepCount()) {
  const quarterTargetSheep = getCurrentQuarterTargetSheepCount();
  if (!Number.isFinite(quarterTargetSheep) || quarterTargetSheep <= 0 || actualQuarterSheep <= 0) return "—";

  const elapsedSeconds = getQuarterElapsedSeconds(quarterElapsedSeconds);
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return "—";

  const currentQuarterSecondsPerSheep = elapsedSeconds / actualQuarterSheep;
  if (!Number.isFinite(currentQuarterSecondsPerSheep) || currentQuarterSecondsPerSheep <= 0) return "—";

  const { startSeconds } = getCurrentQuarterWindow();
  const estimatedSecondsToReachTargetFromQuarterStart = quarterTargetSheep * currentQuarterSecondsPerSheep;
  const estimatedElapsedDaySeconds = startSeconds + estimatedSecondsToReachTargetFromQuarterStart;
  const estimatedClockSeconds = appState.dayClockStartSecondsFromMidnight + estimatedElapsedDaySeconds;

  return Number.isFinite(estimatedClockSeconds)
    ? formatSecondsFromMidnightClockAmPm(estimatedClockSeconds)
    : "—";
}

function updateQuarterSheepPaceClass(className) {
  if (!elements.quarterSheepCount) return;
  elements.quarterSheepCount.classList.remove(...QUARTER_SHEEP_STATUS_CLASSES);
  elements.quarterSheepCount.classList.add(className);
}

function updateQuarterTargetSheepCountLabel(quarterTargetSheep = getCurrentQuarterTargetSheepCount()) {
  setText(elements.quarterTargetSheepCount, Number.isFinite(quarterTargetSheep) ? String(quarterTargetSheep) : "—");
}

function updateQuarterDisplay() {
  const quarterSeconds = 900;
  const hasRunStarted = appState.runStartTime !== null || appState.runActive || appState.effectiveElapsedBeforePauseMs > 0;
  const quarterTargetSheep = getCurrentQuarterTargetSheepCount();
  updateQuarterTargetSheepCountLabel(quarterTargetSheep);

  if (!hasRunStarted) {
    setText(elements.currentQuarter, "—");
    setText(elements.quarterClock, "00:00");
    setText(elements.quarterSheepCount, "0");
    updateQuarterSheepPaceClass("quarter-sheep-neutral");
    setText(elements.quarterTargetCompletionTime, "—");
    return;
  }

  const elapsedSeconds = Math.max(getEffectiveElapsedSeconds(), 0);
  const runDurationSeconds = Math.max(getCurrentRunDurationSeconds(), 0);
  const totalQuarters = Math.max(Math.ceil(runDurationSeconds / quarterSeconds), 1);
  const currentQuarterNumber = Math.min(Math.floor(elapsedSeconds / quarterSeconds) + 1, totalQuarters);
  const { startSeconds, endSeconds } = getCurrentQuarterWindow();
  const quarterElapsedSeconds = Math.min(Math.max(elapsedSeconds - startSeconds, 0), Math.max(endSeconds - startSeconds, 0));
  const actualQuarterSheep = getCurrentQuarterSheepCount();

  setText(elements.currentQuarter, `Quarter ${currentQuarterNumber} of ${totalQuarters}`);
  setText(elements.quarterClock, formatElapsedMMSS(quarterElapsedSeconds));
  setText(elements.quarterSheepCount, String(actualQuarterSheep));
  updateQuarterSheepPaceClass(getQuarterSheepPaceClass(quarterElapsedSeconds, actualQuarterSheep));
  setText(elements.quarterTargetCompletionTime, getQuarterTargetCompletionTime(quarterElapsedSeconds, actualQuarterSheep));
}

const TIMING_ALERT_GRACE_SECONDS = 10;

function getNextPlannedDrinkCountdownState() {
  const plannedTimingMinutes = Number(appState.markerSettings?.drink?.plannedTimingMinutes);
  const drinkIntervalSeconds = plannedTimingMinutes * 60;
  if (!Number.isFinite(drinkIntervalSeconds) || drinkIntervalSeconds <= 0) {
    return { mode: "unavailable" };
  }

  const hasRunStarted = appState.runStartTime !== null || appState.runActive || appState.effectiveElapsedBeforePauseMs > 0;
  if (!hasRunStarted) {
    return { mode: "not-started" };
  }

  const effectiveElapsedSeconds = Math.max(Number(getEffectiveElapsedSeconds()) || 0, 0);
  const runDurationSeconds = Math.max(Number(getCurrentRunDurationSeconds()) || 0, 0);
  const previousDrinkTime = Math.floor(effectiveElapsedSeconds / drinkIntervalSeconds) * drinkIntervalSeconds;
  const secondsSincePreviousDrink = effectiveElapsedSeconds - previousDrinkTime;
  const drinkDueNow = previousDrinkTime > 0
    && secondsSincePreviousDrink >= 0
    && secondsSincePreviousDrink <= TIMING_ALERT_GRACE_SECONDS;

  if (drinkDueNow) {
    return { mode: "due-now" };
  }

  const nextDrinkTime = (Math.floor(effectiveElapsedSeconds / drinkIntervalSeconds) + 1) * drinkIntervalSeconds;
  if (runDurationSeconds > 0 && nextDrinkTime > runDurationSeconds) {
    return { mode: "complete" };
  }

  return {
    mode: "countdown",
    secondsUntilNextDrink: Math.max(Math.ceil(nextDrinkTime - effectiveElapsedSeconds), 0)
  };
}

function updateNextDrinkCountdownDisplay() {
  const countdownState = getNextPlannedDrinkCountdownState();
  const countdownText = countdownState.mode === "not-started"
    ? "Start run"
    : countdownState.mode === "countdown"
      ? `in ${formatCountdown(countdownState.secondsUntilNextDrink)}`
      : countdownState.mode === "due-now"
        ? "Drink due now"
        : countdownState.mode === "complete"
          ? "No more scheduled drinks"
          : "—";

  setText(elements.nextDrinkCountdown, countdownText);
}

function updateTimingAlertDisplay() {
  const hasRunStarted = appState.runStartTime !== null || appState.runActive || appState.effectiveElapsedBeforePauseMs > 0;
  const timingAlertRow = elements.timingAlert ? elements.timingAlert.closest(".timing-alert-row") : null;
  const alertClassNames = [
    "timing-alert-active",
    "timing-alert-drink",
    "timing-alert-cutter",
    "timing-alert-comb",
    "timing-alert-last-quarter"
  ];

  const setTimingAlertDisplay = (alertType, alertText) => {
    if (timingAlertRow) {
      timingAlertRow.classList.remove(...alertClassNames);
      if (alertType !== "none") {
        timingAlertRow.classList.add("timing-alert-active", `timing-alert-${alertType}`);
      }
    }
    setText(elements.timingAlert, alertText);
  };

  if (!hasRunStarted) {
    setTimingAlertDisplay("none", "—");
    return;
  }

  const effectiveElapsedSeconds = Math.max(getEffectiveElapsedSeconds(), 0);
  const elapsedSeconds = effectiveElapsedSeconds;
  const runDurationSeconds = Math.max(getCurrentRunDurationSeconds(), 0);
  const runComplete = runDurationSeconds > 0 && elapsedSeconds >= runDurationSeconds;
  if (runComplete) {
    setTimingAlertDisplay("none", "—");
    return;
  }

  const getPlannedTimingSeconds = (markerType, fallbackSeconds) => {
    const plannedTimingMinutes = Number(appState.markerSettings?.[markerType]?.plannedTimingMinutes);
    if (!Number.isFinite(plannedTimingMinutes) || plannedTimingMinutes <= 0) return fallbackSeconds;
    return plannedTimingMinutes * 60;
  };

  const DRINK_INTERVAL_SECONDS = getPlannedTimingSeconds("drink", 450);
  const CUTTER_INTERVAL_SECONDS = getPlannedTimingSeconds("cutter", 900);
  const COMB_INTERVAL_SECONDS = getPlannedTimingSeconds("comb", 3600);
  const ALERT_LEAD_SECONDS = 60;
  const ALERT_GRACE_SECONDS = TIMING_ALERT_GRACE_SECONDS;
  const LAST_QUARTER_SECONDS = 900;

  const getCadenceAlertState = (intervalSeconds) => {
    if (!Number.isFinite(intervalSeconds) || intervalSeconds <= 0) return null;
    const previousEventMultiple = Math.floor(elapsedSeconds / intervalSeconds);
    const previousEventTime = previousEventMultiple * intervalSeconds;
    const nextEventTime = (previousEventMultiple + 1) * intervalSeconds;
    const secondsUntilNextEvent = nextEventTime - elapsedSeconds;
    const secondsSincePreviousEvent = elapsedSeconds - previousEventTime;
    const canShowPreEventWarning = nextEventTime > 0
      && secondsUntilNextEvent >= 0
      && secondsUntilNextEvent <= ALERT_LEAD_SECONDS;
    const canShowPostEventGrace = previousEventTime > 0
      && secondsSincePreviousEvent >= 0
      && secondsSincePreviousEvent <= ALERT_GRACE_SECONDS;

    if (canShowPreEventWarning) {
      return { mode: "countdown", seconds: Math.ceil(secondsUntilNextEvent) };
    }
    if (canShowPostEventGrace) {
      return { mode: "now" };
    }
    return null;
  };

  const remainingSeconds = Math.max(runDurationSeconds - elapsedSeconds, 0);
  const inLastQuarter = runDurationSeconds > 0 && remainingSeconds <= LAST_QUARTER_SECONDS;

  const combAlert = getCadenceAlertState(COMB_INTERVAL_SECONDS);
  const cutterAlert = getCadenceAlertState(CUTTER_INTERVAL_SECONDS);
  const drinkAlert = getCadenceAlertState(DRINK_INTERVAL_SECONDS);
  const drinkRefillClashAdvisory = getNextDrinkRefillClashAdvisory({ effectiveElapsedSeconds });

  if (combAlert) {
    const alertText = combAlert.mode === "now"
      ? "Comb/handpiece change now"
      : `Comb/handpiece change in ${combAlert.seconds}s`;
    setTimingAlertDisplay("comb", alertText);
  } else if (cutterAlert) {
    const alertText = cutterAlert.mode === "now"
      ? "Cutter change now"
      : `Cutter change in ${cutterAlert.seconds}s`;
    setTimingAlertDisplay("cutter", alertText);
  } else if (drinkRefillClashAdvisory) {
    setTimingAlertDisplay("drink", drinkRefillClashAdvisory.message);
  } else if (drinkAlert) {
    const alertText = drinkAlert.mode === "now"
      ? "Drink now"
      : `Drink in ${drinkAlert.seconds}s`;
    setTimingAlertDisplay("drink", alertText);
  } else if (inLastQuarter) {
    setTimingAlertDisplay("last-quarter", "Last quarter");
  } else {
    setTimingAlertDisplay("none", "—");
  }
}

function updatePenRefillAlertDisplay() {
  const penRefillAlertRow = elements.penRefillAlert ? elements.penRefillAlert.closest(".pen-refill-alert-row") : null;
  const alertClassNames = [
    "pen-refill-alert-active",
    "pen-refill-alert-soon",
    "pen-refill-alert-now"
  ];

  const setPenRefillAlertDisplay = (alertType, alertText) => {
    if (penRefillAlertRow) {
      penRefillAlertRow.classList.remove(...alertClassNames);
      if (alertType !== "none") {
        penRefillAlertRow.classList.add("pen-refill-alert-active", `pen-refill-alert-${alertType}`);
      }
    }
    setText(elements.penRefillAlert, alertText);
  };

  const rule = getPenRule(appState.recordType);
  if (!rule) {
    setPenRefillAlertDisplay("none", "—");
    return;
  }

  const sheepTakenFromPen = getPhysicalSheepTakenFromPen();
  if (!Number.isFinite(sheepTakenFromPen) || sheepTakenFromPen <= 0) {
    setPenRefillAlertDisplay("none", "—");
    return;
  }

  const penState = getCurrentPenStateFromEvents({
    recordType: appState.recordType,
    rule,
    physicalSheepTakenFromPen: sheepTakenFromPen
  });
  if (!penState) {
    setPenRefillAlertDisplay("none", "—");
    return;
  }

  if (penState.refillAllowedNow) {
    setPenRefillAlertDisplay("now", "Pen refill allowed");
    return;
  }

  const sheepUntilRefill = Number(penState.nextRefillAllowedInSheep);
  if (sheepUntilRefill === 2 || sheepUntilRefill === 1) {
    setPenRefillAlertDisplay("soon", `${sheepUntilRefill} sheep until pen refill`);
    return;
  }

  setPenRefillAlertDisplay("none", "—");
}

function formatPenFillForecastPoint(point) {
  const label = point?.label || "Next refill";
  if (point?.isCurrentFill) return `${label} — refill due now`;

  const effectiveElapsedSeconds = Number(point?.effectiveElapsedSeconds);
  const currentEffectiveElapsedSeconds = Number(getEffectiveElapsedSeconds());
  if (Number.isFinite(effectiveElapsedSeconds) && Number.isFinite(currentEffectiveElapsedSeconds)) {
    const overdueSeconds = currentEffectiveElapsedSeconds - effectiveElapsedSeconds;
    if (overdueSeconds >= 1) {
      return `${label} — overdue by ${formatPenFillCountdownDisplay(overdueSeconds)}`;
    }
  }

  const secondsFromNow = Number(point?.secondsFromNow);
  const clockText = formatPenFillDueClock(point);
  return `${label} — next refill in ${formatPenFillCountdownDisplay(secondsFromNow)}${clockText ? ` — due about ${clockText}` : ""}`;
}

function formatPenFillCountdownDisplay(totalSeconds) {
  const safeSeconds = Math.max(Math.floor(Number(totalSeconds) || 0), 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}

function formatPenFillDueClock(point) {
  const effectiveElapsedSeconds = Number(point?.effectiveElapsedSeconds);
  if (Number.isFinite(appState.dayClockStartSecondsFromMidnight) && Number.isFinite(effectiveElapsedSeconds)) {
    return formatPenFillClockAmPm(appState.dayClockStartSecondsFromMidnight + effectiveElapsedSeconds);
  }

  const secondsFromNow = Number(point?.secondsFromNow);
  if (!Number.isFinite(secondsFromNow) || secondsFromNow < 0) return "";
  const currentDayClockSeconds = getCurrentDayClockSeconds();
  if (!Number.isFinite(currentDayClockSeconds)) return "";
  return formatPenFillClockAmPm(currentDayClockSeconds + secondsFromNow);
}

function formatPenFillClockAmPm(secondsFromMidnight) {
  return formatSecondsFromMidnightClockAmPm(secondsFromMidnight);
}

function formatFinalPenFillForecastPoint(point) {
  const secondsBeforeRunEnd = Number(point?.secondsBeforeRunEnd);
  if (!Number.isFinite(secondsBeforeRunEnd)) return "No final refill projected before end";
  const effectiveElapsedSeconds = Number(point?.effectiveElapsedSeconds);
  const clockText = Number.isFinite(appState.dayClockStartSecondsFromMidnight) && Number.isFinite(effectiveElapsedSeconds)
    ? formatPenFillClockAmPm(appState.dayClockStartSecondsFromMidnight + effectiveElapsedSeconds)
    : "";
  if (secondsBeforeRunEnd <= 0) return `${point.label} — at end${clockText ? ` — about ${clockText}` : ""}`;
  return `${point.label} — ${formatPenFillCountdownDisplay(secondsBeforeRunEnd)} before end${clockText ? ` — about ${clockText}` : ""}`;
}

function analyzeFinalFillWindow(forecastPoints, options = {}) {
  const minBeforeEndSeconds = Number.isFinite(options.minBeforeEndSeconds)
    ? options.minBeforeEndSeconds
    : FINAL_FILL_MIN_BEFORE_END_SECONDS;
  const maxBeforeEndSeconds = Number.isFinite(options.maxBeforeEndSeconds)
    ? options.maxBeforeEndSeconds
    : FINAL_FILL_MAX_BEFORE_END_SECONDS;
  const analysisStartSeconds = Number.isFinite(options.analysisStartSeconds)
    ? options.analysisStartSeconds
    : FINAL_FILL_ANALYSIS_START_SECONDS;
  const remainingRunSeconds = Number(options.remainingRunSeconds);

  if (Number.isFinite(remainingRunSeconds) && remainingRunSeconds > analysisStartSeconds) {
    return {
      status: "waiting",
      message: `Monitoring — planning starts at ${formatCountdown(analysisStartSeconds)} remaining`,
      secondsBeforeRunEnd: null,
      finalFill: null
    };
  }

  if (!Array.isArray(forecastPoints) || forecastPoints.length === 0) {
    return {
      status: "none",
      message: "No final refill projected before end",
      secondsBeforeRunEnd: null,
      finalFill: null
    };
  }

  const finalFill = forecastPoints[forecastPoints.length - 1];
  const secondsBeforeRunEnd = Number(finalFill?.secondsBeforeRunEnd);
  if (!Number.isFinite(secondsBeforeRunEnd)) {
    return {
      status: "waiting",
      message: "—",
      secondsBeforeRunEnd: null,
      finalFill: null
    };
  }

  if (secondsBeforeRunEnd > maxBeforeEndSeconds) {
    return {
      status: "tooEarly",
      message: "Final refill too early",
      secondsBeforeRunEnd,
      finalFill
    };
  }

  if (secondsBeforeRunEnd < minBeforeEndSeconds) {
    return {
      status: "tooLate",
      message: "Final refill too late",
      secondsBeforeRunEnd,
      finalFill
    };
  }

  return {
    status: "onTarget",
    message: "Final refill on target",
    secondsBeforeRunEnd,
    finalFill
  };
}

function formatPenStateCurrentCount(penState) {
  const rawCurrentPenCount = Number(penState?.currentPenCount);
  if (!Number.isFinite(rawCurrentPenCount)) return "—";
  const currentPenCount = Math.max(Math.floor(rawCurrentPenCount), 0);
  const refillTriggerLeft = Number(penState?.rule?.refillTriggerLeft);
  return Number.isFinite(refillTriggerLeft) && currentPenCount <= refillTriggerLeft
    ? `${currentPenCount} left`
    : `${currentPenCount} in pen`;
}

function formatPenStateRefillStatus(penState) {
  if (penState?.refillAllowedNow) return "Refill now";
  const nextRefillAllowedInSheep = Number(penState?.nextRefillAllowedInSheep);
  if (nextRefillAllowedInSheep === 1) return "1 sheep until refill";
  if (nextRefillAllowedInSheep === 2) return "2 sheep until refill";
  return "Not due yet";
}

function formatPenStateLastConfirmedFill(penState) {
  const lastFillEvent = penState?.lastFillEvent;
  if (!lastFillEvent) return "—";
  const sheepNumber = Number(lastFillEvent.physicalSheepTakenFromPen);
  if (!Number.isFinite(sheepNumber)) return "—";
  if (isManualCurrentPenCountCorrectionEvent(lastFillEvent)) {
    const correctedCount = Number(lastFillEvent.correctedCurrentPenCount);
    return Number.isFinite(correctedCount)
      ? `Sheep ${sheepNumber} — current pen count corrected to ${correctedCount}`
      : "—";
  }
  const fillAmount = Number(lastFillEvent.actualFillAmount);
  const adjustedText = lastFillEvent.manuallyAdjusted ? " · adjusted" : "";
  if (!Number.isFinite(fillAmount)) return "—";
  return `Sheep ${sheepNumber} — added ${fillAmount}${adjustedText}`;
}

function formatPenStateModel(penState) {
  const refillAmount = Number(penState?.rule?.defaultRefillAmount);
  return Number.isInteger(refillAmount) && refillAmount > 0
    ? `Assumed maximum refill (${refillAmount})`
    : "Assumed maximum refill";
}

function updatePenFillIntervalDisplay(refillEvents = getCurrentRunPenFillEvents()) {
  const averageInterval = calculateAverageFillInterval(refillEvents);
  const recentIntervals = getRecentFillIntervals(refillEvents);

  setText(
    elements.penFillAverageInterval,
    averageInterval ? formatPenFillCountdownDisplay(averageInterval.averageSeconds) : "—"
  );
  setText(
    elements.penFillRecentIntervals,
    recentIntervals.length
      ? recentIntervals.map((interval) => formatPenFillCountdownDisplay(interval.seconds)).join(", ")
      : "—"
  );
}

let penFillForecastCountdownTarget = null;

function resetPenFillForecastCountdownTarget() {
  penFillForecastCountdownTarget = null;
}

function buildPenFillCountdownEventSignature(events = getCurrentRunPenFillEvents()) {
  if (!Array.isArray(events) || events.length === 0) return "none";
  return events
    .map((event) => [
      event.id || "",
      Number(event.runIndex),
      Number(event.physicalSheepTakenFromPen),
      event.source || "",
      Number(event.actualFillAmount),
      Number(event.correctedCurrentPenCount),
      Number(event.resultingPenCount),
      Number(event.effectiveElapsedSeconds),
      Number(event.wallClockTime),
      Number(event.createdAt)
    ].join(":"))
    .join("|");
}

function getPenFillForecastCountdownTarget(point, context = {}) {
  const sheepNumber = Number(point?.sheepNumber);
  const targetEffectiveElapsedSeconds = Number(point?.effectiveElapsedSeconds);
  if (!Number.isFinite(sheepNumber) || !Number.isFinite(targetEffectiveElapsedSeconds)) return null;

  const targetKey = {
    runIndex: Number(appState.currentRunIndex),
    recordType: appState.recordType || "none",
    sheepNumber,
    label: point?.label || `Sheep ${sheepNumber}`,
    recordSource: context.hasConfirmedEvents ? "confirmed" : "assumed",
    assumption: context.assumption || "",
    eventSignature: context.eventSignature || "none",
    dayClockStartSecondsFromMidnight: Number.isFinite(appState.dayClockStartSecondsFromMidnight)
      ? Math.floor(appState.dayClockStartSecondsFromMidnight)
      : null
  };
  const key = JSON.stringify(targetKey);

  if (!penFillForecastCountdownTarget || penFillForecastCountdownTarget.key !== key) {
    const dueClockSeconds = Number.isFinite(appState.dayClockStartSecondsFromMidnight)
      ? appState.dayClockStartSecondsFromMidnight + targetEffectiveElapsedSeconds
      : null;
    penFillForecastCountdownTarget = {
      key,
      sheepNumber,
      label: targetKey.label,
      targetEffectiveElapsedSeconds,
      dueClockSeconds,
      recordType: targetKey.recordType,
      runIndex: targetKey.runIndex,
      recordSource: targetKey.recordSource,
      assumption: targetKey.assumption,
      eventSignature: targetKey.eventSignature
    };
  }

  return penFillForecastCountdownTarget;
}

function formatPenFillForecastCountdownTarget(target, point = null) {
  const label = target?.label || "Next refill";
  const targetEffectiveElapsedSeconds = Number(target?.targetEffectiveElapsedSeconds);
  const currentEffectiveElapsedSeconds = Number(getEffectiveElapsedSeconds());
  if (!Number.isFinite(targetEffectiveElapsedSeconds) || !Number.isFinite(currentEffectiveElapsedSeconds)) return `${label} — Waiting for pace data`;

  const remainingSeconds = targetEffectiveElapsedSeconds - currentEffectiveElapsedSeconds;
  if (remainingSeconds <= 0) {
    const overdueSeconds = Math.abs(remainingSeconds);
    if (overdueSeconds < 1) return `${label} — refill due now`;
    return `${label} — overdue by ${formatPenFillCountdownDisplay(overdueSeconds)}`;
  }
  if (point?.isCurrentFill) return `${label} — refill due now`;

  const dueClockSeconds = Number(target?.dueClockSeconds);
  const clockText = Number.isFinite(dueClockSeconds) ? formatPenFillClockAmPm(dueClockSeconds) : "";
  return `${label} — next refill in ${formatPenFillCountdownDisplay(remainingSeconds)}${clockText ? ` — due about ${clockText}` : ""}`;
}

function updatePenStateDisplay() {
  const refillStatusClassNames = ["pen-state-refill-now", "pen-state-refill-neutral"];
  const modelClassNames = ["pen-state-model-confirmed", "pen-state-model-assumed", "pen-state-model-neutral"];

  const setRefillStatus = (text, className = "pen-state-refill-neutral") => {
    if (elements.penStateRefillStatus) {
      elements.penStateRefillStatus.classList.remove(...refillStatusClassNames);
      elements.penStateRefillStatus.classList.add(className);
    }
    setText(elements.penStateRefillStatus, text);
  };

  const setModel = (text, className = "pen-state-model-neutral") => {
    if (elements.penStateModel) {
      elements.penStateModel.classList.remove(...modelClassNames);
      elements.penStateModel.classList.add(className);
    }
    setText(elements.penStateModel, text);
  };

  const setUnavailableDisplay = (modelText) => {
    setText(elements.penStateCurrentCount, "—");
    setRefillStatus("—");
    setText(elements.penStateLastConfirmedFill, "—");
    updatePenFillAdjustButton(null);
    updatePenFillIntervalDisplay([]);
    setModel(modelText);
  };

  const rule = getPenRule(appState.recordType);
  if (!appState.recordType || appState.recordType === "none" || !rule) {
    setUnavailableDisplay("Select record type");
    return;
  }

  if (!appState.runActive) {
    setUnavailableDisplay("Start run");
    return;
  }

  const penState = getCurrentPenStateFromEvents({
    recordType: appState.recordType,
    rule,
    physicalSheepTakenFromPen: getPhysicalSheepTakenFromPen()
  });

  if (!penState) {
    setUnavailableDisplay("—");
    return;
  }

  const assumedFillEvent = maybeRecordAssumedPenFillEvent({
    recordType: appState.recordType,
    rule,
    physicalSheepTakenFromPen: penState.physicalSheepTakenFromPen
  });
  const displayPenState = assumedFillEvent
    ? getCurrentPenStateFromEvents({
      recordType: appState.recordType,
      rule,
      physicalSheepTakenFromPen: getPhysicalSheepTakenFromPen()
    }) || penState
    : penState;

  setText(elements.penStateCurrentCount, formatPenStateCurrentCount(displayPenState));
  setRefillStatus(
    formatPenStateRefillStatus(displayPenState),
    displayPenState.refillAllowedNow ? "pen-state-refill-now" : "pen-state-refill-neutral"
  );
  setText(elements.penStateLastConfirmedFill, formatPenStateLastConfirmedFill(displayPenState));
  updatePenFillAdjustButton(displayPenState.lastFillEvent);
  updatePenFillIntervalDisplay();
  setModel(
    formatPenStateModel(displayPenState),
    displayPenState.source === "confirmed"
      ? "pen-state-model-confirmed"
      : (displayPenState.source === "assumedFull" ? "pen-state-model-assumed" : "pen-state-model-neutral")
  );
}

function updatePenFillForecastDisplay() {
  const statusClassNames = [
    "pen-fill-status-on-target",
    "pen-fill-status-too-early",
    "pen-fill-status-too-late",
    "pen-fill-status-neutral"
  ];
  const strategyClassNames = [
    "pen-fill-strategy-ok",
    "pen-fill-strategy-recommend",
    "pen-fill-strategy-warning",
    "pen-fill-strategy-neutral"
  ];

  updatePenFillIntervalDisplay();

  const setForecastStatus = (analysis) => {
    if (elements.penFillForecastStatus) {
      elements.penFillForecastStatus.classList.remove(...statusClassNames);
      const statusClassByType = {
        onTarget: "pen-fill-status-on-target",
        tooEarly: "pen-fill-status-too-early",
        tooLate: "pen-fill-status-too-late",
        none: "pen-fill-status-neutral",
        waiting: "pen-fill-status-neutral"
      };
      const statusClass = statusClassByType[analysis?.status];
      if (statusClass) elements.penFillForecastStatus.classList.add(statusClass);
    }
    setText(elements.penFillForecastStatus, analysis?.message || "—");
  };

  const setFillStrategy = (planner = { status: "waiting", message: "—" }) => {
    if (elements.penFillStrategyRecommendation) {
      elements.penFillStrategyRecommendation.classList.remove(...strategyClassNames);
      const strategyClassByStatus = {
        onTarget: "pen-fill-strategy-ok",
        recommendReduction: "pen-fill-strategy-recommend",
        tooLate: "pen-fill-strategy-warning",
        tooEarly: "pen-fill-strategy-warning",
        noGoodPlan: "pen-fill-strategy-warning",
        waiting: "pen-fill-strategy-neutral",
        notPlanningYet: "pen-fill-strategy-neutral",
        noFutureFill: "pen-fill-strategy-neutral"
      };
      const strategyClass = strategyClassByStatus[planner?.status] || "pen-fill-strategy-neutral";
      elements.penFillStrategyRecommendation.classList.add(strategyClass);
    }
    setText(elements.penFillStrategyRecommendation, planner?.message || "—");
  };

  const buildPlanner = (forecastPoints = [], remainingRunSeconds = null) => planFinalFillStrategy({
    recordType: appState.recordType,
    rule: getPenRule(appState.recordType),
    physicalSheepTakenFromPen: getPhysicalSheepTakenFromPen(),
    cycleSnapshot: getPenCycleSnapshot(appState.recordType),
    avgCycleSeconds: appState.currentStats.avgCycle,
    effectiveElapsedSeconds: getEffectiveElapsedSeconds(),
    runDurationSeconds: getCurrentRunDurationSeconds(),
    remainingRunSeconds,
    forecastPoints
  });

  const setForecastDisplay = (nextText, finalText, assumptionText, analysis = { status: "waiting", message: "—" }, planner = buildPlanner(), options = {}) => {
    if (options.resetCountdownTarget !== false) resetPenFillForecastCountdownTarget();
    setText(elements.penFillForecastNext, nextText);
    setText(elements.penFillForecastFinal, finalText);
    setText(elements.penFillForecastAssumption, assumptionText);
    setForecastStatus(analysis);
    setFillStrategy(planner);
    updatePenFillPlannerStrategyDetails({ planner });
  };

  if (!appState.recordType || appState.recordType === "none" || !getPenRule(appState.recordType)) {
    setForecastDisplay("—", "—", "Select record type");
    return;
  }

  if (!appState.runActive) {
    setForecastDisplay("—", "—", "Start run");
    return;
  }

  const avgCycleSeconds = appState.currentStats.avgCycle;
  if (!Number.isFinite(avgCycleSeconds) || avgCycleSeconds <= 0) {
    setForecastDisplay("Waiting for pace data", "—", "Waiting for pace data");
    return;
  }

  const rawElapsedSeconds = Number(getEffectiveElapsedSeconds());
  const rawRunDurationSeconds = Number(getCurrentRunDurationSeconds());
  if (!Number.isFinite(rawElapsedSeconds) || rawElapsedSeconds < 0 || !Number.isFinite(rawRunDurationSeconds) || rawRunDurationSeconds <= 0) {
    setForecastDisplay("—", "—", "Waiting for valid run timing");
    return;
  }

  const elapsedSeconds = Math.max(rawElapsedSeconds, 0);
  const runDurationSeconds = Math.max(rawRunDurationSeconds, 0);
  const remainingRunSeconds = Math.max(runDurationSeconds - elapsedSeconds, 0);
  const routedForecast = getPenFillForecastPoints({
    recordType: appState.recordType,
    rule: getPenRule(appState.recordType),
    physicalSheepTakenFromPen: getPhysicalSheepTakenFromPen(),
    avgCycleSeconds,
    effectiveElapsedSeconds: elapsedSeconds,
    runDurationSeconds
  });
  const displayForecastPoints = routedForecast.points;
  const finalRoutedForecast = getPenFillForecastPointsToRunEnd({
    recordType: appState.recordType,
    rule: getPenRule(appState.recordType),
    physicalSheepTakenFromPen: getPhysicalSheepTakenFromPen(),
    avgCycleSeconds,
    effectiveElapsedSeconds: elapsedSeconds,
    runDurationSeconds
  });
  const finalForecastPoints = finalRoutedForecast.points;
  const assumptionText = routedForecast.assumption;
  const eventSignature = buildPenFillCountdownEventSignature(getCurrentRunPenFillEvents());
  const finalRefillAnalysis = analyzeFinalFillWindow(finalForecastPoints, { remainingRunSeconds });
  const planner = buildPlanner(finalForecastPoints, remainingRunSeconds);

  if (displayForecastPoints.length === 0) {
    setForecastDisplay("No more projected refills", "No final refill projected before end", assumptionText, finalRefillAnalysis, planner);
    return;
  }

  const nextRefill = displayForecastPoints[0];
  const finalRefill = finalForecastPoints[finalForecastPoints.length - 1] || null;
  const countdownTarget = getPenFillForecastCountdownTarget(nextRefill, {
    assumption: assumptionText,
    hasConfirmedEvents: routedForecast.hasConfirmedEvents,
    eventSignature
  });
  setForecastDisplay(
    countdownTarget ? formatPenFillForecastCountdownTarget(countdownTarget, nextRefill) : formatPenFillForecastPoint(nextRefill),
    formatFinalPenFillForecastPoint(finalRefill),
    assumptionText,
    finalRefillAnalysis,
    planner,
    { resetCountdownTarget: false }
  );
}

function getLiveDisplayNowMs() {
  if (appState.paused && Number.isFinite(appState.pauseStartedAtMs)) return appState.pauseStartedAtMs;
  return Date.now();
}

function getCurrentSheepRuntimeSeconds(displayNowMs = getLiveDisplayNowMs()) {
  if (!appState.runActive || !appState.currentCycle.catchStart) return null;

  const now = displayNowMs;
  const catchStart = appState.currentCycle.catchStart;
  if (appState.currentCycle.motorOn && appState.currentCycle.shearStart) {
    const catchDuration = Math.max((appState.currentCycle.shearStart - catchStart) / 1000, 0);
    const shearDuration = Math.max((now - appState.currentCycle.shearStart) / 1000, 0);
    return catchDuration + shearDuration;
  }

  return Math.max((now - catchStart) / 1000, 0);
}

function updateCurrentSheepTimeLeft(requiredCycle, displayNowMs = getLiveDisplayNowMs()) {
  if (!elements.currentSheepTimeLeft) return;

  elements.currentSheepTimeLeft.classList.remove(
    "on-pace-good",
    "on-pace-bad",
    "on-pace-neutral",
    "sheep-time-over-slow",
    "sheep-time-over-medium",
    "sheep-time-over-fast"
  );

  if (elements.currentSheepTimeLeftLabel) {
    setText(elements.currentSheepTimeLeftLabel, "Current sheep time left");
  }

  const currentSheepRuntime = getCurrentSheepRuntimeSeconds(displayNowMs);
  if (!Number.isFinite(requiredCycle) || requiredCycle <= 0 || !Number.isFinite(currentSheepRuntime)) {
    setText(elements.currentSheepTimeLeft, "—");
    elements.currentSheepTimeLeft.classList.add("on-pace-neutral");
    return;
  }

  const timeLeft = requiredCycle - currentSheepRuntime;
  if (timeLeft >= 0) {
    setText(elements.currentSheepTimeLeft, `${formatSeconds(timeLeft)} remaining`);
    elements.currentSheepTimeLeft.classList.add("on-pace-good");
    return;
  }

  const overtime = Math.abs(timeLeft);
  setText(elements.currentSheepTimeLeft, `Over time by ${formatSeconds(overtime)}`);
  elements.currentSheepTimeLeft.classList.add("on-pace-bad");
  if (overtime < 5) {
    elements.currentSheepTimeLeft.classList.add("sheep-time-over-slow");
  } else if (overtime < 10) {
    elements.currentSheepTimeLeft.classList.add("sheep-time-over-medium");
  } else {
    elements.currentSheepTimeLeft.classList.add("sheep-time-over-fast");
  }
}

function updateTotalSheepTimeDisplay(requiredCycle, displayNowMs = getLiveDisplayNowMs()) {
  if (!elements.currentTotalSheepTime) return;

  elements.currentTotalSheepTime.classList.remove("on-pace-good", "on-pace-bad", "on-pace-neutral");

  if (isPreparedForNextRunBreak()) {
    setText(elements.currentTotalSheepTime, formatSeconds(0));
    elements.currentTotalSheepTime.classList.add("on-pace-neutral");
    return;
  }

  const liveSheepRuntime = appState.currentCycle.motorOn && appState.currentCycle.shearStart
    ? getCurrentSheepRuntimeSeconds(displayNowMs)
    : null;
  const lastSheep = appState.sheep.length ? appState.sheep[appState.sheep.length - 1] : null;
  const totalSheepTime = Number.isFinite(liveSheepRuntime) ? liveSheepRuntime : Number(lastSheep?.fullCycle);
  if (!Number.isFinite(totalSheepTime)) {
    setText(elements.currentTotalSheepTime, "—");
    elements.currentTotalSheepTime.classList.add("on-pace-neutral");
    return;
  }

  setText(elements.currentTotalSheepTime, formatSeconds(totalSheepTime));
  if (Number.isFinite(requiredCycle) && requiredCycle > 0) {
    elements.currentTotalSheepTime.classList.add(totalSheepTime <= requiredCycle ? "on-pace-good" : "on-pace-bad");
  } else {
    elements.currentTotalSheepTime.classList.add("on-pace-neutral");
  }
}

function updateLivePanel() {
  const liveDisplayNowMs = getLiveDisplayNowMs();
  maybeHandleRunEndExpired(liveDisplayNowMs);
  const autoStartedNextRun = maybeAutoStartNextRunAfterBreak(liveDisplayNowMs);
  if (autoStartedNextRun) return;
  const preparedForNextRunBreak = isPreparedForNextRunBreak();
  const shearCurrent = !preparedForNextRunBreak && appState.currentCycle.motorOn && appState.currentCycle.shearStart
    ? (liveDisplayNowMs - appState.currentCycle.shearStart) / 1000
    : 0;

  const catchCurrent = !preparedForNextRunBreak && appState.runActive && !appState.currentCycle.motorOn && appState.currentCycle.catchStart
    ? (liveDisplayNowMs - appState.currentCycle.catchStart) / 1000
    : 0;
  let countdownSeconds = getRunCountdownSeconds();
  if (preparedForNextRunBreak) {
    const schedule = getScheduleForCurrentType();
    const nextRunIndex = Math.min(appState.currentRunIndex + 1, schedule.length - 1);
    countdownSeconds = schedule[nextRunIndex] || getCurrentRunDurationSeconds();
  }

  setText(elements.motorState, appState.currentMotorDisplay);
  setText(elements.currentShear, formatSeconds(shearCurrent));
  setText(elements.currentCatch, formatSeconds(catchCurrent));
  updateTotalSheepTimeDisplay(calculateTargetMetrics().requiredCycle, liveDisplayNowMs);
  setText(elements.runClock, formatCountdown(preparedForNextRunBreak ? 0 : getEffectiveElapsedSeconds()));
  setText(elements.runCountdown, formatCountdown(countdownSeconds));
  updateQuarterDisplay();
  if (preparedForNextRunBreak) setText(elements.quarterClock, "00:00");
  updateTimingAlertDisplay();
  updateNextDrinkCountdownDisplay();
  updatePenRefillAlertDisplay();
  updateBreakTimingDisplay();
  updateBreakOverlayDisplay();
  updateRunBadge();
  updateStartRunButtonUI();
  updateResetCurrentSheepButtonUI();
  updateUndoLastSheepButtonUI();
  updateDayClockDisplay();
  setText(elements.totalSheep, String(appState.daySheep.length));
  const currentSheepNumber = !appState.runActive ? 0 : (appState.currentCycle.motorOn && appState.currentCycle.shearStart ? appState.sheep.length + 1 : appState.sheep.length);
  setText(elements.currentSheepNumber, String(currentSheepNumber));
  updateCurrentSheepTimeLeft(calculateTargetMetrics().requiredCycle, liveDisplayNowMs);
}

function updateMarkerAverageDisplays() {
  const stats = buildResolvedMarkerStats(appState.sheep, appState.markerSettings);
  setText(elements.markerAvgDrink, formatMarkerAverageCatch(stats.buckets.drink));
  setText(elements.markerAvgCutter, formatMarkerAverageCatch(stats.buckets.cutter));
  setText(elements.markerAvgComb, formatMarkerAverageCatch(stats.buckets.comb));
}

function updateStatsPanel() {
  calculateAverages();
  const target = calculateTargetMetrics();
  const requiredDayTotalSheep = parseRequiredTotalSheep();
  const requiredRunTotalSheep = calculateRequiredRunTotalSheep();
  const { fastest, slowest, last } = calculateLivePerformanceExtremes();

  setText(elements.totalSheep, String(appState.daySheep.length));
  setText(elements.officialSheepCount, String(getOfficialDaySheepCount()));
  setText(elements.rejectedSheepCount, String(getRejectedDaySheepCount()));
  setText(elements.qualityRatingSummary, formatQualityRatingSummary());
  setText(elements.avgShear, formatSeconds(appState.currentStats.avgShear));
  setText(elements.avgCatch, formatSeconds(appState.currentStats.avgCatch));
  setText(elements.avgCycle, formatSeconds(appState.currentStats.avgCycle));
  setText(elements.sheepPerHour, appState.currentStats.sheepPerHour.toFixed(2));
  updateMarkerAverageDisplays();
  setText(elements.fastestSheepToday, fastest ? `#${fastest.number} — ${fastest.fullCycle.toFixed(3)}s` : "—");
  setText(elements.slowestSheepToday, slowest ? `#${slowest.number} — ${slowest.fullCycle.toFixed(3)}s` : "—");
  const lastSheepNumberText = last ? ` (Sheep ${last.number})` : "";
  if (elements.lastCatchTimeLabel) {
    setText(elements.lastCatchTimeLabel, `Last catch time${lastSheepNumberText}:`);
  }
  if (elements.lastShearTimeLabel) {
    setText(elements.lastShearTimeLabel, `Last shear time${lastSheepNumberText}:`);
  }
  if (elements.lastSheepTimeLabel) {
    setText(elements.lastSheepTimeLabel, `Last total sheep time${lastSheepNumberText}:`);
  }
  setText(elements.lastCatchTime, formatDurationValue(last?.catchDuration));
  setText(elements.lastShearTime, formatDurationValue(last?.shearDuration));
  setText(elements.lastSheepTime, formatDurationValue(last?.fullCycle));
  setText(elements.requiredCycle, formatSeconds(target.requiredCycle));
  setText(elements.requiredRate, target.requiredRate.toFixed(2));
  setText(elements.requiredDayTotalSheep, requiredDayTotalSheep === null ? "—" : String(requiredDayTotalSheep));
  setText(elements.requiredRunTotalSheep, requiredRunTotalSheep === null ? "—" : String(requiredRunTotalSheep));
  const quarterTotals = calculateQuarterTotals(target);
  setText(elements.requiredQuarterTotal, quarterTotals.required === null ? "—" : String(quarterTotals.required));
  const livePredictions = getLiveTargetPacePredictions(target, quarterTotals);
  const displayPredictions = appState.currentCycle.motorOn && appState.targetPacePredictionSnapshot
    ? appState.targetPacePredictionSnapshot
    : buildTargetPacePredictionSnapshot(livePredictions);
  setText(elements.predictedQuarterTotal, displayPredictions.predictedQuarterTotal === null ? "—" : String(displayPredictions.predictedQuarterTotal));
  setText(elements.predictedHourTotal, displayPredictions.predictedHourTotal === null ? "—" : String(displayPredictions.predictedHourTotal));
  setText(elements.projectedTotal, displayPredictions.projectedTotal === null ? "—" : String(displayPredictions.projectedTotal));
  setText(elements.estimatedLastCatchTime, displayPredictions.estimatedLastCatchTime);
  setText(elements.timeSpareToBell, target.timeSpareText);
  setText(elements.maxCatchTime, livePredictions.maxCatchTime);
  setText(elements.catchPrediction, displayPredictions.catchPrediction);
  if (elements.estimatedLastCatchTimeLabel) {
    setText(elements.estimatedLastCatchTimeLabel, getTargetRunTotalPredictionLabel(requiredRunTotalSheep));
  }
  if (elements.timeSpareToBell && elements.timeSpareToBellLabel) {
    elements.timeSpareToBell.classList.remove("target-status-ahead", "target-status-behind");
    elements.timeSpareToBellLabel.classList.remove("target-status-ahead", "target-status-behind");
    if (target.timeSpareIsAhead === true) {
      setText(elements.timeSpareToBellLabel, "Run target timing");
      elements.timeSpareToBell.classList.add("target-status-ahead");
      elements.timeSpareToBellLabel.classList.add("target-status-ahead");
    } else if (target.timeSpareIsAhead === false) {
      setText(elements.timeSpareToBellLabel, "Run target timing");
      elements.timeSpareToBell.classList.add("target-status-behind");
      elements.timeSpareToBellLabel.classList.add("target-status-behind");
    } else {
      setText(elements.timeSpareToBellLabel, "Run target timing");
    }
  }
  updateTrendFlags();
  updatePenFillForecastDisplay();
  updatePenStateDisplay();
  updatePenFillEarlyReminderDisplay();
  updatePenFillConfirmationControls();
  maybeShowPenFillConfirmationPrompt();

  if (elements.lastSheepTime) {
    elements.lastSheepTime.classList.remove("on-pace-good", "on-pace-bad", "on-pace-neutral");
    if (last && target.requiredCycle > 0 && Number.isFinite(last.fullCycle)) {
      elements.lastSheepTime.classList.add(last.fullCycle <= target.requiredCycle ? "on-pace-good" : "on-pace-bad");
    } else {
      elements.lastSheepTime.classList.add("on-pace-neutral");
    }
  }

  if (elements.avgCycle) {
    const onPaceClass = target.requiredCycle > 0
      ? (appState.currentStats.avgCycle < target.requiredCycle - 0.05 ? "on-pace-good" : (appState.currentStats.avgCycle > target.requiredCycle + 0.05 ? "on-pace-bad" : "on-pace-neutral"))
      : "on-pace-neutral";
    elements.avgCycle.classList.remove("on-pace-good", "on-pace-bad", "on-pace-neutral");
    elements.avgCycle.classList.add(onPaceClass);
  }
}

function getLiveTargetPacePredictions(targetMetrics = null, quarterTotals = null) {
  const target = targetMetrics ?? calculateTargetMetrics();
  const quarter = quarterTotals ?? calculateQuarterTotals(target);
  const predictedHourTotal = appState.runActive && appState.currentStats.avgCycle > 0
    ? Math.round(appState.currentStats.sheepPerHour)
    : null;
  const targetCatchTime = target.targetReachable
    ? formatTargetPaceDayClock(target.targetCatchRunSeconds)
    : "Not reachable before run end";

  return {
    predictedQuarterTotal: quarter.predicted,
    predictedHourTotal,
    projectedTotal: target.projectedTotal,
    estimatedLastCatchTime: targetCatchTime,
    maxCatchTime: formatPredictedCatchTime(target.predictedFinalCatchRunSeconds),
    catchPrediction: predictCatch(target, calculateRequiredRunTotalSheep())
  };
}

function updateConnectionStatus({ ok, parsedState, responseTimeMs, debugText, blockingMessage, rawResponseOk }) {
  const stateLabel = parsedState === null ? "Unknown" : parsedState ? "ON" : "OFF";
  const outcome = ok ? "ok" : "fail";
  const responsePart = Number.isFinite(responseTimeMs) ? `${Math.round(responseTimeMs)}ms` : "n/a";

  if (elements.connectionStatus) {
    if (blockingMessage) {
      elements.connectionStatus.innerHTML = `<strong>Load failed:</strong> ${blockingMessage}`;
    } else {
      const rawLine = rawResponseOk ? "<br><small>raw response ok</small>" : "";
      const autoNote = appState.autoAdjustedPollInterval
        ? "<br><small>auto adjusted to 50ms due to latency</small>"
        : "";
      elements.connectionStatus.innerHTML = `Connection: <strong>${outcome}</strong>, Motor: <strong>${stateLabel}</strong>, Response: <strong>${responsePart}</strong>${rawLine}${autoNote}`;
    }
  }

  if (elements.connectionSummary) {
    elements.connectionSummary.textContent = blockingMessage
      ? "Shelly: mixed-content blocked"
      : `Shelly: ${outcome} • Response: ${responsePart}`;
  }

  if (elements.connectionDebug) {
    elements.connectionDebug.textContent = blockingMessage || debugText || "No debug details.";
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
  if (isMixedContentShellyBlocked()) {
    return {
      ok: false,
      parsedState: null,
      responseTimeMs: null,
      debugText: "mixed-content blocked",
      blockingMessage: getMixedContentMessage()
    };
  }

  const url = getShellyUrl();
  const started = performance.now();
  const response = await fetch(url, { cache: "no-store" });
  const responseTimeMs = performance.now() - started;

  if (!response.ok) {
    return { ok: false, parsedState: null, responseTimeMs, debugText: `HTTP ${response.status}` };
  }

  const rawText = await response.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (error) {
    return { ok: false, parsedState: null, responseTimeMs, debugText: "invalid JSON response" };
  }

  const parsedState = getMotorStateFromResponse(data, appState.connection.mode);
  const debugText = parsedState === null
    ? `raw response ok; unable to parse for mode=${appState.connection.mode}; keys=[${getTopLevelKeys(data)}]`
    : `mode=${appState.connection.mode}; raw response ok`;

  return { ok: true, parsedState, responseTimeMs, debugText, rawResponseOk: true };
}

function updatePollLatency(responseTimeMs) {
  if (!Number.isFinite(responseTimeMs)) return;
  appState.pollLatencySamples.push(responseTimeMs);
  if (appState.pollLatencySamples.length > 10) {
    appState.pollLatencySamples.shift();
  }

  if (appState.pollLatencySamples.length < 10) return;
  const averageLatency = appState.pollLatencySamples.reduce((sum, value) => sum + value, 0) / appState.pollLatencySamples.length;
  if (averageLatency > appState.connection.pollInterval && appState.connection.pollInterval < 50) {
    appState.connection.pollInterval = 50;
    appState.autoAdjustedPollInterval = true;
    updateConnectionInputs();
    saveConnectionSettings();
    startPollingLoop();
  }
}

async function pollShelly() {
  if (!appState.runActive || appState.simulationMode || appState.paused || appState.pollInFlight) return;

  appState.pollInFlight = true;
  try {
    const result = await fetchShellyState();
    if (appState.paused) return;

    appState.lastResponseTimeMs = result.responseTimeMs;
    appState.connectionDebug = result.debugText;
    updatePollLatency(result.responseTimeMs);

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
  } finally {
    appState.pollInFlight = false;
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

function pauseDayClock() {
  const currentDayClockSeconds = getCurrentDayClockSeconds();
  appState.dayClockPausedSecondsFromMidnight = Number.isFinite(currentDayClockSeconds)
    ? currentDayClockSeconds
    : null;
  updateDayClockDisplay();
}

function resumeDayClock() {
  if (Number.isFinite(appState.dayClockPausedSecondsFromMidnight)) {
    const elapsedDayClockMs = Math.max(
      (appState.dayClockPausedSecondsFromMidnight - appState.dayClockStartSecondsFromMidnight) * 1000,
      0
    );
    appState.dayClockStartRealMs = Date.now() - elapsedDayClockMs;
  } else if (appState.dayClockStartRealMs === null && Number.isFinite(appState.dayClockStartSecondsFromMidnight)) {
    appState.dayClockStartRealMs = Date.now();
  }
  appState.dayClockPausedSecondsFromMidnight = null;
  updateDayClockDisplay();
}

function setPaused(paused) {
  const nextPaused = Boolean(paused);
  if (appState.paused === nextPaused) return;

  appState.paused = nextPaused;

  if (appState.paused) {
    pauseDayClock();
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
    updatePenFillConfirmationControls();
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
    if (appState.officialRunEndTimeMs) {
      appState.officialRunEndTimeMs += pauseDurationMs;
    }
    appState.pauseStartedAtMs = null;
  }

  resumeDayClock();

  const shouldRetryCatchOnResume = Boolean(
    appState.retryCatchOnResume
    && appState.runActive
    && appState.currentCycle
    && appState.currentCycle.motorOn === false
    && !appState.breakActive
    && !appState.preparedForNextRunBreak
  );

  if (shouldRetryCatchOnResume) {
    appState.currentCycle.catchStart = Date.now();
    appState.retryCatchOnResume = false;
    updateLivePanel();
    if (typeof autosaveState === "function") {
      autosaveState();
    }
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
  updatePenFillConfirmationControls();
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
      const penFillPlannerPanel = byId.get("panel-pen-fill-planner");
      const timingPanel = byId.get("panel-cycle");
      if (penFillPlannerPanel && timingPanel && !storedOrder.includes("panel-pen-fill-planner")) {
        timingPanel.insertAdjacentElement("afterend", penFillPlannerPanel);
      }
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

function loadLayoutEditorSettings() {
  appState.snapToGridEnabled = parseStoredBoolean(localStorage.getItem(SNAP_TO_GRID_ENABLED_STORAGE_KEY), false);
  const storedGridSize = Number(localStorage.getItem(SNAP_GRID_SIZE_STORAGE_KEY));
  appState.snapGridSize = [5, 10, 20].includes(storedGridSize) ? storedGridSize : 10;

  try {
    const storedLocks = JSON.parse(localStorage.getItem(PANEL_LOCKS_STORAGE_KEY) || "{}");
    appState.panelLocks = storedLocks && typeof storedLocks === "object" ? storedLocks : {};
  } catch (error) {
    appState.panelLocks = {};
    console.debug("Failed to load panel locks", error);
  }
}

function persistPanelLocks() {
  localStorage.setItem(PANEL_LOCKS_STORAGE_KEY, JSON.stringify(appState.panelLocks));
}

function isPanelLocked(panelId) {
  return Boolean(appState.panelLocks[panelId]);
}

function setPanelLocked(panelId, locked) {
  appState.panelLocks[panelId] = Boolean(locked);
  persistPanelLocks();
  applyPanelLayout();
}

function snapValue(value) {
  if (!appState.snapToGridEnabled) return value;
  const grid = Math.max(Number(appState.snapGridSize) || 10, 1);
  return Math.round(value / grid) * grid;
}

function snapLayoutItem(layoutItem) {
  if (!appState.snapToGridEnabled || !layoutItem) return layoutItem;
  if (Number.isFinite(layoutItem.x)) layoutItem.x = snapValue(layoutItem.x);
  if (Number.isFinite(layoutItem.y)) layoutItem.y = snapValue(layoutItem.y);
  if (Number.isFinite(layoutItem.width)) layoutItem.width = Math.max(snapValue(layoutItem.width), 260);
  if (Number.isFinite(layoutItem.height)) layoutItem.height = Math.max(snapValue(layoutItem.height), 130);
  return layoutItem;
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

// Scale panel text in layout edit mode based on current absolute panel size.
function updatePanelScale(panel, layoutItem) {
  if (!panel || !layoutItem) return;
  const baseW = 420;
  const baseH = 240;
  const rawScale = Math.min(layoutItem.width / baseW, layoutItem.height / baseH);
  const clampedScale = Math.min(Math.max(rawScale, 0.9), 1.6);
  panel.style.setProperty("--panelScale", clampedScale.toFixed(3));
}

function applyPanelLayout() {
  document.body.classList.toggle("layout-edit-on", appState.layoutEditMode);
  if (elements.snapToGridToggle) elements.snapToGridToggle.checked = appState.snapToGridEnabled;
  if (elements.gridSizeSelect) elements.gridSizeSelect.value = String(appState.snapGridSize);

  getPanelElements().forEach((panel) => {
    updatePanelLockUI(panel);
    const item = appState.panelLayout.panels[panel.id];
    if (appState.layoutEditMode && item) {
      const layout = normalizePanelLayoutItem(item);
      appState.panelLayout.panels[panel.id] = layout;
      panel.style.left = `${layout.x}px`;
      panel.style.top = `${layout.y}px`;
      panel.style.width = `${layout.width}px`;
      panel.style.height = `${layout.height}px`;
      panel.style.zIndex = String(layout.z || 1);
      updatePanelScale(panel, layout);
    } else {
      if (!(panel.id === "panel-sim" && appState.controlsDockEnabled)) {
        panel.style.left = "";
        panel.style.top = "";
      }
      panel.style.zIndex = "";
      panel.style.removeProperty("--panelScale");
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
  const nextMode = Boolean(enabled);
  if (appState.layoutEditMode && !nextMode) {
    clearPanelInteractionHighlights();
  }
  appState.layoutEditMode = nextMode;
  if (appState.layoutEditMode) ensureInitialPanelLayout();
  applyPanelLayout();
  if (elements.layoutEditModeToggle) elements.layoutEditModeToggle.checked = appState.layoutEditMode;
  persistPanelLayout();
}

function startAbsolutePanelDrag(panel, header, startEvent) {
  if (!appState.layoutEditMode || !elements.dashboardPanels) return;
  if (isPanelLocked(panel.id)) return;
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
  const snappedPosition = snapLayoutItem({ x: panelLayout.x, y: panelLayout.y });
  panelLayout.x = snappedPosition.x;
  panelLayout.y = snappedPosition.y;
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
  if (isPanelLocked(panel.id)) return;
  if (startEvent.pointerType === "mouse" && startEvent.button !== 0) return;
  const panelLayout = appState.panelLayout.panels[panel.id];
  if (!panelLayout) return;

  startEvent.preventDefault();
  handle.setPointerCapture(startEvent.pointerId);
  setLayoutScrollLock(true);
  bringPanelToFront(panel);

  panel.classList.add("panel-resizing");
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

  if (appState.snapToGridEnabled) {
    const snappedSize = snapLayoutItem({ width, height });
    width = snappedSize.width;
    height = snappedSize.height;
    if (resize.dir.includes("w")) {
      x = snapLayoutItem({ x: resize.startLeft + (resize.startWidth - width) }).x;
      width = resize.startWidth + (resize.startLeft - x);
    }
    if (resize.dir.includes("n")) {
      y = snapLayoutItem({ y: resize.startTop + (resize.startHeight - height) }).y;
      height = resize.startHeight + (resize.startTop - y);
    }
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
  updatePanelScale(resize.panel, item);
  updateDashboardCanvasSize();
}

// Explicitly mark known panel metric fields so values visually stand out from labels.
function initializeMetricValueStyling() {
  METRIC_VALUE_IDS.forEach((id) => {
    const node = document.getElementById(id);
    if (!node) return;
    if (!(node instanceof HTMLElement)) return;
    if (!node.closest(".panel")) return;
    if (node.matches("input, button, select, textarea")) return;
    node.classList.add("metric-value");
  });
}

function endPanelResize(endEvent) {
  const resize = appState.panelResize;
  if (!resize || endEvent.pointerId !== resize.pointerId) return;
  if (resize.handle.hasPointerCapture?.(resize.pointerId)) {
    resize.handle.releasePointerCapture(resize.pointerId);
  }
  resize.panel.classList.remove("panel-resizing");
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
      daySheep: appState.daySheep,
      penFillEvents: appState.penFillEvents,
      qualityRatings: sanitizeQualityRatings(appState.qualityRatings),
      officialRejectedAdjustment: getOfficialRejectedAdjustmentCount(),
      currentCycle: appState.currentCycle,
      currentMotorDisplay: appState.currentMotorDisplay,
      lastMotorState: appState.lastMotorState,
      target: appState.target,
      targetPacePredictionSnapshot: appState.targetPacePredictionSnapshot,
      farm: appState.farm,
      recordType: appState.recordType,
      paused: appState.paused,
      pauseStartedAtMs: appState.pauseStartedAtMs,
      retryCatchOnResume: appState.retryCatchOnResume,
      breakActive: appState.breakActive,
      breakStartedAtMs: appState.breakStartedAtMs,
      breakSource: appState.breakSource,
      preparedForNextRunBreak: appState.preparedForNextRunBreak,
      dayComplete: appState.dayComplete,
      breakBannerDismissedForCurrentBreak: appState.breakBannerDismissedForCurrentBreak,
      pendingBreakAfterCurrentSheep: appState.pendingBreakAfterCurrentSheep,
      pendingBreakStartedAtMs: appState.pendingBreakStartedAtMs,
      pendingBreakSource: appState.pendingBreakSource,
      pendingPenFillPromptKey: appState.pendingPenFillPromptKey,
      dismissedPenFillPromptKey: appState.dismissedPenFillPromptKey,
      runEndTimeMs: appState.runEndTimeMs,
      officialRunEndTimeMs: appState.officialRunEndTimeMs,
      currentRunIndex: appState.currentRunIndex,
      dayClockStartRealMs: appState.dayClockStartRealMs,
      dayClockStartSecondsFromMidnight: appState.dayClockStartSecondsFromMidnight,
      dayClockPausedSecondsFromMidnight: appState.dayClockPausedSecondsFromMidnight,
      trendBucketMinutes: appState.trendBucketMinutes,
      trendBuckets: appState.trendBuckets,
      reviewBlocks: appState.reviewBlocks,
      nextReviewBlockIndex: appState.nextReviewBlockIndex,
      runReviewText: appState.runReviewText,
      trendFlags: appState.trendFlags,
      latestCompletedRunSnapshot: appState.latestCompletedRunSnapshot,
      panelCollapsed: appState.panelCollapsed,
      effectiveElapsedBeforePauseMs: appState.effectiveElapsedBeforePauseMs,
      effectiveResumeRealMs: appState.effectiveResumeRealMs,
      discardedResetElapsedMs: getDiscardedResetElapsedMs(),
      simulationMode: appState.simulationMode,
      simulationRunLengthMode: appState.simulationMode ? appState.simulationRunLengthMode : "real",
      simulationCustomMinutes: sanitizeSimulationCustomMinutes(appState.simulationCustomMinutes),
      dayClockSnapshotSeconds: getCurrentDayClockSeconds()
    },
    runType: elements.runType ? elements.runType.value : "8",
    customHours: elements.customHours ? elements.customHours.value : "8",
    sessionDate: elements.sessionDate ? elements.sessionDate.value : "",
    dayStartTime: elements.dayStartTimeInput ? elements.dayStartTimeInput.value : "",
    targetSheep: elements.targetSheepInput ? elements.targetSheepInput.value : "0",
    panelOrder: getPanelElements().map((panel) => panel.id),
    panelSizes: appState.panelSizes,
    panelLayout: appState.panelLayout,
    layoutEditMode: appState.layoutEditMode,
    savedAt: Date.now()
  };
}

function autosaveState(options = {}) {
  const force = Boolean(options.force);
  if (!appState.autosaveEnabled && !force) return;
  localStorage.setItem(getAutosaveStorageKey(), JSON.stringify(getAutosavePayload()));
}

function updateAutosaveUI() {
  if (elements.autosaveEnabledInput) elements.autosaveEnabledInput.checked = appState.autosaveEnabled;
  if (elements.autosaveIntervalSelect) elements.autosaveIntervalSelect.value = String(appState.autosaveIntervalSeconds);
  if (elements.autosaveStatus) {
    elements.autosaveStatus.textContent = appState.autosaveEnabled
      ? `Autosave: ON (every ${appState.autosaveIntervalSeconds}s)`
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
  appState.autosaveTimerId = setInterval(autosaveState, appState.autosaveIntervalSeconds * 1000);
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

function normalizeAutosaveIntervalSeconds(value) {
  const intervalSeconds = Number(value);
  return AUTOSAVE_INTERVAL_OPTIONS_SECONDS.includes(intervalSeconds)
    ? intervalSeconds
    : DEFAULT_AUTOSAVE_INTERVAL_SECONDS;
}

function setAutosaveIntervalSeconds(value) {
  appState.autosaveIntervalSeconds = normalizeAutosaveIntervalSeconds(value);
  localStorage.setItem(AUTOSAVE_INTERVAL_STORAGE_KEY, String(appState.autosaveIntervalSeconds));
  updateAutosaveUI();
  if (appState.autosaveEnabled) startAutosaveLoop();
}

function loadAutosaveSettings() {
  appState.autosaveEnabled = parseStoredBoolean(localStorage.getItem(AUTOSAVE_ENABLED_STORAGE_KEY), true);
  appState.autosaveIntervalSeconds = normalizeAutosaveIntervalSeconds(localStorage.getItem(AUTOSAVE_INTERVAL_STORAGE_KEY));
}

function getManualSaveStorageKey(id) {
  return `${MANUAL_SAVE_STORAGE_PREFIX}${id}`;
}

function loadManualSaveIndex() {
  try {
    const raw = JSON.parse(localStorage.getItem(MANUAL_SAVE_INDEX_STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((entry) => entry && typeof entry.id === "string") : [];
  } catch (error) {
    console.debug("Failed to load manual save index", error);
    return [];
  }
}

function saveManualSaveIndex(index) {
  localStorage.setItem(MANUAL_SAVE_INDEX_STORAGE_KEY, JSON.stringify(Array.isArray(index) ? index : []));
}

function getRecordTypeLabel(recordType) {
  if (!recordType || recordType === "none") return "Normal day";
  return getPenRule(recordType)?.label || recordType;
}

function getTimeSystemLabel(runType) {
  if (runType === "9") return "9 Hour";
  if (runType === "8") return "8 Hour";
  if (runType === "custom") return "Custom";
  return "";
}

function getSessionIdentity(payload = getAutosavePayload()) {
  const state = payload.state || {};
  return [
    payload.sessionDate || "",
    (state.farm || "").trim().toLowerCase(),
    state.recordType || "none",
    payload.runType || "",
    String(Number(state.currentRunIndex) || 0)
  ].join("|");
}

function createManualSaveSummary(payload, name) {
  const state = payload?.state || {};
  const savedAt = Number(payload?.savedAt) || Date.now();
  const runNumber = Math.max((Number(state.currentRunIndex) || 0) + 1, 1);
  const dayClockSeconds = Number.isFinite(state.dayClockSnapshotSeconds)
    ? state.dayClockSnapshotSeconds
    : getCurrentDayClockSeconds();
  let status = "Stopped";
  if (state.dayComplete) status = "End of Day";
  else if (state.breakActive || state.preparedForNextRunBreak) status = "Break";
  else if (state.runActive) status = state.paused ? "Paused" : "Running";
  return {
    name: (name || "").trim() || generateSuggestedManualSaveName(payload),
    savedAt,
    farm: state.farm || "Session",
    recordType: getRecordTypeLabel(state.recordType),
    runNumber,
    sheepTotal: Array.isArray(state.daySheep) ? state.daySheep.length : (Array.isArray(state.sheep) ? state.sheep.length : 0),
    status,
    sessionIdentity: getSessionIdentity(payload),
    runType: getTimeSystemLabel(payload?.runType),
    dayClock: Number.isFinite(dayClockSeconds) ? formatSecondsFromMidnightClock(dayClockSeconds) : "00:00:00"
  };
}

function generateSuggestedManualSaveName(payload = getAutosavePayload()) {
  const summary = createManualSaveSummary(payload, "Session");
  const parts = [];
  if (summary.farm && summary.farm !== "Session") parts.push(summary.farm);
  if (summary.recordType && summary.recordType !== "Normal day") parts.push(summary.recordType);
  if (summary.runType) parts.push(summary.runType);
  parts.push(`Run ${summary.runNumber || 1}`);
  parts.push(`Day ${summary.dayClock || "00:00:00"}`);
  return parts.join(" — ") || "Session — Run 1 — Day 00:00:00";
}

function updateManualSessionStatus(message) {
  updateAutosaveUI();
  if (!elements.autosaveStatus || !message) return;
  elements.autosaveStatus.textContent = `${elements.autosaveStatus.textContent} — ${message}`;
}

function getSessionExportFilename(exportedAt = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  const year = exportedAt.getFullYear();
  const month = pad(exportedAt.getMonth() + 1);
  const day = pad(exportedAt.getDate());
  const hour = pad(exportedAt.getHours());
  const minute = pad(exportedAt.getMinutes());
  return `SHEARiQ_ShearTracker_${year}-${month}-${day}_${hour}-${minute}.json`;
}

function exportSession() {
  const payload = getAutosavePayload();
  const exportedAt = new Date();
  const envelope = {
    app: SESSION_TRANSFER_APP,
    kind: SESSION_TRANSFER_KIND,
    version: SESSION_TRANSFER_VERSION,
    exportedAt: exportedAt.toISOString(),
    summary: createManualSaveSummary(payload, "Session export"),
    payload
  };
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = getSessionExportFilename(exportedAt);
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  URL.revokeObjectURL(url);
  updateManualSessionStatus("Exported session JSON");
}


const PDF_EXPORT_MARGIN = 10;
let pdfExportCursorY = PDF_EXPORT_MARGIN;
let pdfExportGeneratedAtLabel = "";

function getSafeText(elementOrId, fallback = "—") {
  const element = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
  if (!element) return fallback;
  const text = String(element.textContent || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function getPdfRunStatusLabel() {
  const parts = [getSafeText("runStatus", "Idle"), getSafeText("runBadge", "")].filter((part) => part && part !== "—");
  return parts.length ? parts.join(" • ") : "Idle";
}

function isElementVisibleForPdf(elementOrId) {
  const element = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
  if (!element) return false;
  if (element.hidden || element.closest("[hidden]")) return false;
  return true;
}

function getVisibleSafeText(elementOrId, fallback = "—") {
  if (!isElementVisibleForPdf(elementOrId)) return fallback;
  return getSafeText(elementOrId, fallback);
}

function getPdfPenRefillPlannerRows() {
  const rows = [
    ["Pen count", getSafeText("penStateCurrentCount")],
    ["Last refill amount", getSafeText("penStateLastConfirmedFill")],
    ["Average refill interval", getSafeText("penFillAverageInterval")],
    ["Last 3 refill intervals", getSafeText("penFillRecentIntervals")],
    ["Assumed refill amount", getSafeText("penStateModel")],
    ["Refill status", getSafeText("penStateRefillStatus")],
    ["Next refill", getSafeText("penFillForecastNext")],
    ["Refill reminder", getSafeText("penFillEarlyReminder")],
    ["Final projected refill", getSafeText("penFillForecastFinal")],
    ["Final refill status", getSafeText("penFillForecastStatus")],
    ["Refill strategy", getSafeText("penFillStrategyRecommendation")],
    ["Reason", getSafeText("penFillPlannerReason")]
  ];
  if (isElementVisibleForPdf("penFillConfirmSection")) {
    rows.push(["Confirmation instruction", getVisibleSafeText("penFillConfirmInstruction")]);
    rows.push(["Confirmation status", getVisibleSafeText("penFillConfirmStatus")]);
  }
  return rows;
}

function showPdfExportLibraryError(message) {
  const safeMessage = message || "PDF export libraries are not available. Please refresh while online so the app can cache the local PDF libraries.";
  console.error(safeMessage);
  if (typeof alert === "function") {
    alert(safeMessage);
  }
}

function sanitizePdfFilenamePart(value) {
  const cleaned = String(value || "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return cleaned || "Unknown";
}

function getPdfExportFilename(snapshot = getPdfExportSnapshot()) {
  const exportedAt = snapshot.exportedAtDate || new Date();
  const pad = (value) => String(value).padStart(2, "0");
  const timestamp = `${exportedAt.getFullYear()}-${pad(exportedAt.getMonth() + 1)}-${pad(exportedAt.getDate())}_${pad(exportedAt.getHours())}-${pad(exportedAt.getMinutes())}`;
  const sessionDate = sanitizePdfFilenamePart(snapshot.sessionDate || "No-Date");
  const farm = sanitizePdfFilenamePart(snapshot.farm || "Unknown-Farm");
  const runNumber = sanitizePdfFilenamePart(snapshot.runNumber || "1");
  return `SHEARiQ_ShearTracker_${sessionDate}_${farm}_Run-${runNumber}_${timestamp}.pdf`;
}

function clonePdfArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => item && typeof item === "object" ? { ...item } : item);
}

function formatPdfNumber(value, digits = 3) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue.toFixed(digits) : "—";
}

function formatPdfDateTime(ms) {
  const numberValue = Number(ms);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return "—";
  return new Date(numberValue).toLocaleString();
}

function getPdfExportSnapshot() {
  const exportedAtDate = new Date();
  const trendBuckets = typeof getSortedBucketSummaries === "function" ? getSortedBucketSummaries() : [];
  const targetPaceVisible = [
    ["Required cycle", "requiredCycle"],
    ["Required rate", "requiredRate"],
    ["Projected total", "projectedTotal"],
    ["Predicted quarter total", "predictedQuarterTotal"],
    ["Predicted hour total", "predictedHourTotal"],
    ["Required day total", "requiredDayTotalSheep"],
    ["Required run total", "requiredRunTotalSheep"],
    ["Required quarter total", "requiredQuarterTotal"],
    ["Estimated last catch", "estimatedLastCatchTime"],
    ["Time spare to bell", "timeSpareToBell"],
    ["Current sheep time left", "currentSheepTimeLeft"],
    ["Max catch time", "maxCatchTime"],
    ["Catch prediction", "catchPrediction"],
    ["Block minutes", "blockMinutes"],
    ["Block results", "blockResults"]
  ].map(([label, id]) => [label, getSafeText(id)]);

  return {
    exportedAtDate,
    exportedAt: exportedAtDate.toLocaleString(),
    sessionDate: elements.sessionDate?.value || appState.sessionDate || "",
    farm: elements.farmInput?.value || appState.farm || "",
    runNumber: Number(appState.currentRunIndex) + 1,
    runType: elements.runType?.value || "—",
    recordType: getRecordTypeLabel(appState.recordType),
    runStatus: getPdfRunStatusLabel(),
    live: {
      motorState: getSafeText("motorState"),
      currentCatch: getSafeText("currentCatch"),
      currentShear: getSafeText("currentShear"),
      currentTotalSheepTime: getSafeText("currentTotalSheepTime"),
      runClock: getSafeText("runClock"),
      runCountdown: getSafeText("runCountdown"),
      dayClock: getSafeText("dayClock"),
      currentQuarter: getSafeText("currentQuarter"),
      quarterClock: getSafeText("quarterClock"),
      quarterSheepCount: getSafeText("quarterSheepCount"),
      quarterTargetCompletionTime: getSafeText("quarterTargetCompletionTime"),
      timingAlert: getSafeText("timingAlert"),
      nextDrinkCountdown: getSafeText("nextDrinkCountdown"),
      penRefillAlert: getSafeText("penRefillAlert")
    },
    penRefillPlannerRows: getPdfPenRefillPlannerRows(),
    targetPaceVisible,
    sheep: clonePdfArray(appState.sheep),
    daySheep: clonePdfArray(appState.daySheep),
    penFillEvents: clonePdfArray(appState.penFillEvents),
    qualityRatings: clonePdfArray(appState.qualityRatings),
    reviewBlocks: clonePdfArray(appState.reviewBlocks),
    trendBuckets: clonePdfArray(trendBuckets),
    trendFlags: Array.isArray(appState.trendFlags) ? [...appState.trendFlags] : [],
    currentStats: { ...(appState.currentStats || {}) },
    officialRejectedAdjustment: Number(appState.officialRejectedAdjustment) || 0,
    target: { ...(appState.target || {}) }
  };
}

function ensurePdfSpace(doc, needed = 16) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (pdfExportCursorY + needed > pageHeight - PDF_EXPORT_MARGIN - 8) {
    doc.addPage();
    pdfExportCursorY = PDF_EXPORT_MARGIN;
  }
}

function addPdfSectionTitle(doc, title) {
  ensurePdfSpace(doc, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.text(title, PDF_EXPORT_MARGIN, pdfExportCursorY);
  doc.setDrawColor(31, 41, 55);
  doc.line(PDF_EXPORT_MARGIN, pdfExportCursorY + 2, doc.internal.pageSize.getWidth() - PDF_EXPORT_MARGIN, pdfExportCursorY + 2);
  pdfExportCursorY += 6;
}

function addPdfKeyValueTable(doc, rows) {
  const body = rows.map((row) => [row[0] || "—", row[1] === undefined || row[1] === null || row[1] === "" ? "—" : String(row[1])]);
  addPdfDataTable(doc, ["Item", "Value"], body, { styles: { fontSize: 8 } });
}

function addPdfDataTable(doc, columns, rows, options = {}) {
  if (!rows.length) {
    addPdfNoData(doc, options.noDataMessage || "No data yet.");
    return;
  }
  doc.autoTable({
    startY: pdfExportCursorY,
    head: [columns],
    body: rows,
    margin: { left: PDF_EXPORT_MARGIN, right: PDF_EXPORT_MARGIN, top: PDF_EXPORT_MARGIN, bottom: 16 },
    styles: { fontSize: 7, cellPadding: 1.5, overflow: "linebreak" },
    headStyles: { fillColor: [229, 231, 235], textColor: [31, 41, 55] },
    ...options
  });
  pdfExportCursorY = (doc.lastAutoTable?.finalY || pdfExportCursorY) + 5;
}

function addPdfNoData(doc, message) {
  ensurePdfSpace(doc, 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(message || "No data yet.", PDF_EXPORT_MARGIN, pdfExportCursorY);
  pdfExportCursorY += 7;
}

function addPdfPageFooters(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated ${pdfExportGeneratedAtLabel}`, PDF_EXPORT_MARGIN, height - 7);
    doc.text(`Page ${page} of ${pageCount}`, width - PDF_EXPORT_MARGIN, height - 7, { align: "right" });
  }
}

function exportPdf() {
  if (!window.jspdf?.jsPDF || typeof window.jspdf.jsPDF !== "function") {
    showPdfExportLibraryError("PDF export is unavailable because jsPDF did not load. Please refresh while online so the app can cache the local PDF library files.");
    return;
  }

  const doc = new window.jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const hasAutoTable = typeof doc.autoTable === "function";
  if (!hasAutoTable) {
    showPdfExportLibraryError("PDF export is unavailable because jsPDF AutoTable did not load. Please refresh while online so the app can cache the local PDF library files.");
    return;
  }

  const snapshot = getPdfExportSnapshot();
  pdfExportCursorY = PDF_EXPORT_MARGIN;
  pdfExportGeneratedAtLabel = snapshot.exportedAt;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text("SHEAR iQ Shear Tracker Report", PDF_EXPORT_MARGIN, pdfExportCursorY);
  pdfExportCursorY += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Generated ${snapshot.exportedAt}`, PDF_EXPORT_MARGIN, pdfExportCursorY);
  pdfExportCursorY += 8;

  addPdfSectionTitle(doc, "1. Header / Report Info");
  addPdfKeyValueTable(doc, [
    ["Session date", snapshot.sessionDate || "—"],
    ["Farm", snapshot.farm || "—"],
    ["Run number", snapshot.runNumber],
    ["Time system", snapshot.runType],
    ["Record type", snapshot.recordType],
    ["Run status", snapshot.runStatus]
  ]);

  addPdfSectionTitle(doc, "2. Run Summary");
  addPdfKeyValueTable(doc, [
    ["Run sheep", snapshot.sheep.length],
    ["Day sheep", snapshot.daySheep.length],
    ["Official rejected adjustment", snapshot.officialRejectedAdjustment],
    ["Motor", snapshot.live.motorState],
    ["Run clock", snapshot.live.runClock],
    ["Run countdown", snapshot.live.runCountdown],
    ["Day clock", snapshot.live.dayClock]
  ]);

  addPdfSectionTitle(doc, "3. Performance Averages");
  addPdfKeyValueTable(doc, [
    ["Average shear", `${formatPdfNumber(snapshot.currentStats.avgShear)}s`],
    ["Average catch", `${formatPdfNumber(snapshot.currentStats.avgCatch)}s`],
    ["Average cycle", `${formatPdfNumber(snapshot.currentStats.avgCycle)}s`],
    ["Sheep per hour", formatPdfNumber(snapshot.currentStats.sheepPerHour, 1)],
    ["Current catch", snapshot.live.currentCatch],
    ["Current shear", snapshot.live.currentShear],
    ["Current total sheep time", snapshot.live.currentTotalSheepTime]
  ]);

  addPdfSectionTitle(doc, "4. Target / Pace");
  addPdfKeyValueTable(doc, snapshot.targetPaceVisible);

  addPdfSectionTitle(doc, "5. Timing / Alerts");
  addPdfKeyValueTable(doc, [
    ["Current quarter", snapshot.live.currentQuarter],
    ["Quarter clock", snapshot.live.quarterClock],
    ["Quarter sheep count", snapshot.live.quarterSheepCount],
    ["Quarter target completion time", snapshot.live.quarterTargetCompletionTime],
    ["Timing alert", snapshot.live.timingAlert],
    ["Next drink countdown", snapshot.live.nextDrinkCountdown],
    ["Pen refill alert", snapshot.live.penRefillAlert]
  ]);

  addPdfSectionTitle(doc, "6. Pen Refill Planner");
  addPdfKeyValueTable(doc, [
    ...snapshot.penRefillPlannerRows,
    ["Pen refill alert", snapshot.live.penRefillAlert],
    ["Refill events", snapshot.penFillEvents.length]
  ]);
  addPdfDataTable(doc, ["Sheep", "Amount", "Source", "Time", "Note"], snapshot.penFillEvents.map((event) => [
    event.sheepNumber ?? event.physicalSheepTakenFromPen ?? "—",
    event.actualFillAmount ?? event.fillAmount ?? event.refillAmount ?? "—",
    event.source || "—",
    formatPdfDateTime(event.timestamp || event.createdAt),
    event.note || event.reason || "—"
  ]));

  addPdfSectionTitle(doc, "7. Trend Flags");
  if (snapshot.trendFlags.length) {
    addPdfDataTable(doc, ["Flag"], snapshot.trendFlags.map((flag) => [flag]));
  } else {
    addPdfNoData(doc, "No trend flags yet.");
  }

  addPdfSectionTitle(doc, "8. 15-Minute Reviews");
  addPdfDataTable(doc, ["Range", "Sheep", "Avg cycle", "Delta", "Status"], snapshot.reviewBlocks.map((block) => [
    block.range || "—",
    block.count ?? "—",
    Number.isFinite(Number(block.avgCycle)) ? `${Number(block.avgCycle).toFixed(3)}s` : "—",
    block.deltaText || "—",
    block.status || "—"
  ]));

  addPdfSectionTitle(doc, "9. Trend Graph Data");
  addPdfDataTable(doc, ["Bucket", "Start", "Sheep", "Avg cycle", "Avg catch"], snapshot.trendBuckets.map((bucket) => [
    bucket.key ?? "—",
    Number.isFinite(Number(bucket.startElapsed)) ? formatCountdown(bucket.startElapsed) : "—",
    bucket.count ?? "—",
    `${formatPdfNumber(bucket.avgCycle)}s`,
    `${formatPdfNumber(bucket.avgCatch)}s`
  ]));

  if (snapshot.qualityRatings.length) {
    addPdfSectionTitle(doc, "10. Quality Ratings");
    addPdfDataTable(doc, ["Period", "Rating", "Official", "Physical", "Warning", "Notes"], snapshot.qualityRatings.map((rating) => [
      rating.periodNumber || "—",
      rating.qualityRating || "—",
      rating.officialCountForPeriod ?? "—",
      rating.physicalCountForPeriod ?? "—",
      rating.officialWarning ? [rating.warningReason, rating.warningNotes].filter(Boolean).join(" — ") || "Yes" : "No",
      rating.notes || "—"
    ]));
  }

  addPdfSectionTitle(doc, "11. Sheep Log");
  addPdfDataTable(doc, ["#", "Day #", "Status", "Start", "End", "Catch", "Shear", "Total", "Markers", "Notes"], snapshot.sheep.map((entry) => [
    entry.number ?? "—",
    entry.dayNumber ?? "—",
    entry.status || "—",
    Number.isFinite(Number(entry.startDayClockSeconds)) ? formatSecondsFromMidnightClock(entry.startDayClockSeconds) : formatPdfDateTime(entry.startTime),
    Number.isFinite(Number(entry.endDayClockSeconds)) ? formatSecondsFromMidnightClock(entry.endDayClockSeconds) : formatPdfDateTime(entry.endTime),
    `${formatPdfNumber(entry.catchDuration)}s`,
    `${formatPdfNumber(entry.shearDuration)}s`,
    `${formatPdfNumber(entry.fullCycle)}s`,
    getManualMarkersDisplayLabel(entry.manualMarkers || (entry.manualMarker ? [entry.manualMarker] : [])) || "—",
    entry.note || entry.rejectedReason || "—"
  ]), { styles: { fontSize: 6 } });

  addPdfPageFooters(doc);
  doc.save(getPdfExportFilename(snapshot));
}

function openImportSessionPicker() {
  if (!elements.importSessionFileInput) return;
  elements.importSessionFileInput.click();
}

function validateImportedSessionJson(parsed) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "Import failed: JSON must contain a session object." };
  }

  const hasEnvelopeMetadata = Object.prototype.hasOwnProperty.call(parsed, "app")
    || Object.prototype.hasOwnProperty.call(parsed, "kind")
    || Object.prototype.hasOwnProperty.call(parsed, "version")
    || Object.prototype.hasOwnProperty.call(parsed, "payload");
  if (!hasEnvelopeMetadata) {
    if (!parsed.state || typeof parsed.state !== "object" || Array.isArray(parsed.state)) {
      return { ok: false, error: "Import failed: missing state object." };
    }
    return { ok: true, payload: parsed };
  }

  if (parsed.app !== SESSION_TRANSFER_APP || parsed.kind !== SESSION_TRANSFER_KIND) {
    return { ok: false, error: "Import failed: this is not a SHEΔR iQ Shear Tracker session export." };
  }
  if (Number(parsed.version) > SESSION_TRANSFER_VERSION) {
    return { ok: false, error: "Import failed: this export version is newer than this app supports." };
  }
  if (parsed.version !== SESSION_TRANSFER_VERSION) {
    return { ok: false, error: "Import failed: unsupported session export version." };
  }
  if (!parsed.payload || typeof parsed.payload !== "object" || Array.isArray(parsed.payload)) {
    return { ok: false, error: "Import failed: missing session payload." };
  }
  if (!parsed.payload.state || typeof parsed.payload.state !== "object" || Array.isArray(parsed.payload.state)) {
    return { ok: false, error: "Import failed: missing state object." };
  }

  return { ok: true, payload: parsed.payload };
}

async function importSessionFromFile(file) {
  if (!file) return;
  if (file.size <= 0) {
    updateManualSessionStatus("Import failed: empty file");
    return;
  }
  if (file.size > SESSION_IMPORT_MAX_BYTES) {
    updateManualSessionStatus("Import failed: file is larger than 5 MB");
    return;
  }

  let text = "";
  try {
    text = await file.text();
  } catch (error) {
    console.debug("Failed to read session import file", error);
    updateManualSessionStatus("Import failed: could not read file");
    return;
  }

  if (!text.trim()) {
    updateManualSessionStatus("Import failed: empty file");
    return;
  }

  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    console.debug("Failed to parse session import JSON", error);
    updateManualSessionStatus("Import failed: malformed JSON");
    return;
  }

  const validation = validateImportedSessionJson(parsed);
  if (!validation.ok) {
    updateManualSessionStatus(validation.error);
    return;
  }

  const confirmed = await confirmModal({
    title: "Import session JSON?",
    message: "Importing will replace the current session in this browser. Imported active sessions will be restored paused. This is not live sync. The imported session will become the local session on this device.",
    confirmText: "Import Session",
    cancelText: "Cancel"
  });
  if (!confirmed) {
    updateManualSessionStatus("Import cancelled");
    return;
  }

  if (!restoreSessionPayload(validation.payload, { source: "manual", forcePaused: true })) {
    updateManualSessionStatus("Import failed: missing state object");
    return;
  }
  autosaveState({ force: true });
  updateManualSessionStatus("Imported session JSON");
}

async function handleImportSessionFileChange(event) {
  const input = event.target;
  const file = input?.files?.[0] || null;
  try {
    await importSessionFromFile(file);
  } finally {
    if (input) input.value = "";
  }
}

function manualSaveChoiceModal() {
  return new Promise((resolve) => {
    const oldOverlay = document.getElementById("manualSaveChoiceModalOverlay");
    if (oldOverlay) oldOverlay.remove();

    const overlay = document.createElement("div");
    overlay.id = "manualSaveChoiceModalOverlay";
    overlay.className = "modal-overlay";

    const dialog = document.createElement("div");
    dialog.className = "modal-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "manualSaveChoiceModalTitle");
    dialog.tabIndex = -1;

    const title = document.createElement("h3");
    title.id = "manualSaveChoiceModalTitle";
    title.textContent = "Save Session";

    const message = document.createElement("p");
    message.textContent = "Choose how to save the current in-memory session.";

    const actions = document.createElement("div");
    actions.className = "modal-actions manual-save-choice-actions";

    const newBtn = document.createElement("button");
    newBtn.type = "button";
    newBtn.textContent = "Save as new session";

    const overwriteBtn = document.createElement("button");
    overwriteBtn.type = "button";
    overwriteBtn.textContent = "Overwrite existing save";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";

    actions.append(newBtn, overwriteBtn, cancelBtn);
    dialog.append(title, message, actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    setLayoutScrollLock(true);

    const close = (choice) => {
      overlay.remove();
      setLayoutScrollLock(false);
      resolve(choice);
    };
    newBtn.addEventListener("click", () => close("new"));
    overwriteBtn.addEventListener("click", () => close("overwrite"));
    cancelBtn.addEventListener("click", () => close("cancel"));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close("cancel");
    });
    overlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close("cancel");
      }
    });
    dialog.focus();
  });
}

function createManualSaveId() {
  return `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function writeManualSave(id, payload, name, index = loadManualSaveIndex()) {
  const summary = createManualSaveSummary(payload, name);
  const entry = { id, ...summary };
  localStorage.setItem(getManualSaveStorageKey(id), JSON.stringify({ ...payload, manualSave: entry }));
  saveManualSaveIndex([entry, ...index.filter((item) => item.id !== id)]);
  return entry;
}

async function saveManualSessionAsNew() {
  const payload = getAutosavePayload();
  payload.type = "manual";
  payload.savedAt = Date.now();
  const suggestedName = generateSuggestedManualSaveName(payload);
  const enteredName = window.prompt("Save testing session as:", suggestedName);
  const name = (enteredName || "").trim();
  if (!name) {
    updateManualSessionStatus("Manual save cancelled");
    return;
  }

  const entry = writeManualSave(createManualSaveId(), payload, name);
  updateManualSessionStatus(`Saved manual session: ${entry.name}`);
}

function getManualSaveDetailLines(entry) {
  const savedDate = entry?.savedAt ? new Date(entry.savedAt).toLocaleString() : "Unknown date";
  return [
    `Saved: ${savedDate}`,
    `Run: ${entry?.runNumber || 1}`,
    `Sheep: ${entry?.sheepTotal || 0}`,
    `Status: ${entry?.status || "Unknown"}`,
    `Farm: ${entry?.farm || "Session"}`,
    `Session: ${[entry?.recordType, entry?.runType].filter(Boolean).join(" • ") || "Record type/session info n/a"}`
  ];
}

async function overwriteManualSession() {
  const index = loadManualSaveIndex();
  if (!index.length) {
    await confirmModal({
      title: "No manual saves found",
      message: "There are no existing manual saves to overwrite. Save this session as new first.",
      confirmText: "OK",
      cancelText: "OK"
    });
    updateManualSessionStatus("No manual saves to overwrite");
    return;
  }

  const selected = await openManualSessionPickerModal({
    title: "Overwrite Existing Save",
    emptyMessage: "No manual sessions saved yet.",
    actionText: "Overwrite",
    modalId: "manualSessionOverwriteModalOverlay"
  });
  if (!selected) {
    updateManualSessionStatus("Manual save cancelled");
    return;
  }

  const confirmed = await confirmModal({
    title: "Overwrite manual save?",
    message: [`Replace this saved session with the current in-memory session?`, ``, selected.name || "Manual session", ...getManualSaveDetailLines(selected)].join("\n"),
    confirmText: "Overwrite Save",
    cancelText: "Cancel"
  });
  if (!confirmed) {
    updateManualSessionStatus("Manual save cancelled");
    return;
  }

  const payload = getAutosavePayload();
  payload.type = "manual";
  payload.savedAt = Date.now();
  const entry = writeManualSave(selected.id, payload, selected.name || generateSuggestedManualSaveName(payload), index);
  updateManualSessionStatus(`Overwrote manual session: ${entry.name}`);
}

async function saveManualSession() {
  const choice = await manualSaveChoiceModal();
  if (choice === "new") {
    await saveManualSessionAsNew();
    return;
  }
  if (choice === "overwrite") {
    await overwriteManualSession();
    return;
  }
  updateManualSessionStatus("Manual save cancelled");
}

function readManualSave(id) {
  try {
    return JSON.parse(localStorage.getItem(getManualSaveStorageKey(id)) || "null");
  } catch (error) {
    console.debug("Failed to read manual save", error);
    return null;
  }
}

async function loadManualSession(id) {
  const payload = readManualSave(id);
  if (!payload || !payload.state) {
    updateManualSessionStatus("Manual save not found");
    return;
  }
  const name = payload.manualSave?.name || createManualSaveSummary(payload).name;
  const confirmed = await confirmModal({
    title: "Load manual session?",
    message: `Load "${name}"? This replaces the current in-memory session and restores it paused.`,
    confirmText: "Load Session",
    cancelText: "Cancel"
  });
  if (!confirmed) return;
  restoreSessionPayload(payload, { source: "manual", forcePaused: true });
  updateManualSessionStatus(`Loaded manual session: ${name}`);
}

async function deleteManualSession(id) {
  const index = loadManualSaveIndex();
  const entry = index.find((item) => item.id === id);
  const confirmed = await confirmModal({
    title: "Delete manual session?",
    message: `Delete "${entry?.name || "this manual save"}"? This cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel"
  });
  if (!confirmed) return;
  localStorage.removeItem(getManualSaveStorageKey(id));
  saveManualSaveIndex(index.filter((item) => item.id !== id));
  updateManualSessionStatus("Deleted manual session");
  openManualSessionLoadModal();
}

function renderManualSessionDetails(entry) {
  const details = document.createElement("div");
  details.className = "manual-session-details";
  const name = document.createElement("strong");
  name.textContent = entry.name || "Manual session";
  details.appendChild(name);
  getManualSaveDetailLines(entry).forEach((line) => {
    const item = document.createElement("span");
    item.textContent = line;
    details.appendChild(item);
  });
  return details;
}

function openManualSessionPickerModal({ title, emptyMessage, actionText, modalId }) {
  return new Promise((resolve) => {
    const oldOverlay = document.getElementById(modalId);
    if (oldOverlay) oldOverlay.remove();
    const overlay = document.createElement("div");
    overlay.id = modalId;
    overlay.className = "modal-overlay";

    const dialog = document.createElement("div");
    dialog.className = "modal-dialog manual-session-modal";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", `${modalId}Title`);
    dialog.tabIndex = -1;

    const heading = document.createElement("h3");
    heading.id = `${modalId}Title`;
    heading.textContent = title;

    const list = document.createElement("div");
    list.className = "manual-session-list";

    const index = loadManualSaveIndex();
    if (!index.length) {
      const empty = document.createElement("p");
      empty.textContent = emptyMessage;
      list.appendChild(empty);
    } else {
      index.forEach((entry) => {
        const row = document.createElement("div");
        row.className = "manual-session-row";
        const actions = document.createElement("div");
        actions.className = "manual-session-row-actions";
        const selectBtn = document.createElement("button");
        selectBtn.type = "button";
        selectBtn.textContent = actionText;
        selectBtn.addEventListener("click", () => close(entry));
        actions.appendChild(selectBtn);
        row.append(renderManualSessionDetails(entry), actions);
        list.appendChild(row);
      });
    }

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Cancel";
    const footerActions = document.createElement("div");
    footerActions.className = "modal-actions";
    footerActions.appendChild(closeBtn);
    dialog.append(heading, list, footerActions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    setLayoutScrollLock(true);

    function close(selection = null) {
      overlay.remove();
      setLayoutScrollLock(false);
      resolve(selection);
    }

    closeBtn.addEventListener("click", () => close(null));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close(null);
    });
    overlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(null);
      }
    });
    dialog.focus();
  });
}

function openManualSessionLoadModal() {
  const oldOverlay = document.getElementById("manualSessionLoadModalOverlay");
  if (oldOverlay) oldOverlay.remove();
  const overlay = document.createElement("div");
  overlay.id = "manualSessionLoadModalOverlay";
  overlay.className = "modal-overlay";

  const dialog = document.createElement("div");
  dialog.className = "modal-dialog manual-session-modal";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "manualSessionLoadModalTitle");
  dialog.tabIndex = -1;

  const title = document.createElement("h3");
  title.id = "manualSessionLoadModalTitle";
  title.textContent = "Load Manual Session";
  const list = document.createElement("div");
  list.className = "manual-session-list";

  const index = loadManualSaveIndex();
  if (!index.length) {
    const empty = document.createElement("p");
    empty.textContent = "No manual sessions saved yet.";
    list.appendChild(empty);
  } else {
    index.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "manual-session-row";
      const actions = document.createElement("div");
      actions.className = "manual-session-row-actions";
      const loadBtn = document.createElement("button");
      loadBtn.type = "button";
      loadBtn.textContent = "Load";
      loadBtn.addEventListener("click", () => {
        overlay.remove();
        setLayoutScrollLock(false);
        loadManualSession(entry.id);
      });
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        overlay.remove();
        setLayoutScrollLock(false);
        deleteManualSession(entry.id);
      });
      actions.append(loadBtn, deleteBtn);
      row.append(renderManualSessionDetails(entry), actions);
      list.appendChild(row);
    });
  }

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "Close";
  const actions = document.createElement("div");
  actions.className = "modal-actions";
  actions.appendChild(closeBtn);
  dialog.append(title, list, actions);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  setLayoutScrollLock(true);
  const close = () => {
    overlay.remove();
    setLayoutScrollLock(false);
  };
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  dialog.focus();
}

function updateFollowLatestUI() {
  if (elements.followLatestToggle) elements.followLatestToggle.checked = appState.followLatestSheep;
}

function setFollowLatestEnabled(enabled) {
  appState.followLatestSheep = Boolean(enabled);
  localStorage.setItem(FOLLOW_LATEST_STORAGE_KEY, String(appState.followLatestSheep));
  if (appState.followLatestSheep) {
    appState.userScrolledUp = false;
  }
  updateFollowLatestUI();
  renderLogTable();
}

function loadFollowLatestSettings() {
  appState.followLatestSheep = parseStoredBoolean(localStorage.getItem(FOLLOW_LATEST_STORAGE_KEY), true);
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

function shiftTimestampByGap(value, gapMs) {
  return Number.isFinite(value) ? value + gapMs : value;
}

function restoreSessionPayload(raw, options = {}) {
  if (!raw || !raw.state) return false;
  const forcePaused = Boolean(options.forcePaused);
  const restoreTimeMs = Date.now();
  const savedAtMs = Number(raw.savedAt) || restoreTimeMs;
  const restoreGapMs = forcePaused ? Math.max(restoreTimeMs - savedAtMs, 0) : 0;
  const currentKeyboardShortcuts = appState.keyboardShortcuts;
  Object.assign(appState, raw.state);
  appState.keyboardShortcuts = currentKeyboardShortcuts;
  if (raw.runType && elements.runType) elements.runType.value = raw.runType;
  if (raw.customHours !== undefined && elements.customHours) elements.customHours.value = raw.customHours;
  if (raw.sessionDate && elements.sessionDate) elements.sessionDate.value = raw.sessionDate;
  if (raw.dayStartTime && elements.dayStartTimeInput) elements.dayStartTimeInput.value = raw.dayStartTime;
  if (raw.targetSheep !== undefined && elements.targetSheepInput) elements.targetSheepInput.value = raw.targetSheep;
  if (elements.farmInput) elements.farmInput.value = appState.farm || "";
  if (elements.customHours && elements.runType) {
    elements.customHours.disabled = elements.runType.value !== "custom";
  }
  appState.retryCatchOnResume = Boolean(appState.retryCatchOnResume);
  appState.discardedResetElapsedMs = Object.prototype.hasOwnProperty.call(raw.state, "discardedResetElapsedMs")
    ? getDiscardedResetElapsedMs()
    : 0;
  appState.simulationMode = Boolean(appState.simulationMode);
  appState.simulationCustomMinutes = sanitizeSimulationCustomMinutes(appState.simulationCustomMinutes);
  if (!appState.simulationMode) {
    appState.simulationRunLengthMode = "real";
  } else {
    appState.simulationRunLengthMode = getValidSimulationRunLengthMode(appState.simulationRunLengthMode);
  }
  const savedDayClockSnapshotSeconds = Number.isFinite(appState.dayClockSnapshotSeconds)
    ? appState.dayClockSnapshotSeconds
    : null;
  appState.dayClockPausedSecondsFromMidnight = Number.isFinite(appState.dayClockPausedSecondsFromMidnight)
    ? appState.dayClockPausedSecondsFromMidnight
    : (appState.paused && savedDayClockSnapshotSeconds !== null ? savedDayClockSnapshotSeconds : null);
  appState.breakActive = Boolean(appState.breakActive);
  appState.breakStartedAtMs = Number.isFinite(appState.breakStartedAtMs) ? appState.breakStartedAtMs : null;
  appState.breakSource = typeof appState.breakSource === "string" ? appState.breakSource : null;
  appState.preparedForNextRunBreak = appState.breakActive && Boolean(appState.preparedForNextRunBreak);
  appState.dayComplete = Boolean(appState.dayComplete);
  appState.breakBannerDismissedForCurrentBreak = Boolean(appState.breakBannerDismissedForCurrentBreak);
  appState.pendingBreakAfterCurrentSheep = Boolean(appState.pendingBreakAfterCurrentSheep);
  appState.pendingBreakStartedAtMs = Number.isFinite(appState.pendingBreakStartedAtMs) ? appState.pendingBreakStartedAtMs : null;
  appState.pendingBreakSource = typeof appState.pendingBreakSource === "string" ? appState.pendingBreakSource : null;
  appState.officialRunEndTimeMs = Number.isFinite(appState.officialRunEndTimeMs) ? appState.officialRunEndTimeMs : null;
  appState.daySheep = Array.isArray(appState.daySheep) ? appState.daySheep : [...appState.sheep];
  sanitizeManualMarkersOnSheepEntries(appState.sheep);
  sanitizeManualMarkersOnSheepEntries(appState.daySheep);
  appState.penFillEvents = Array.isArray(appState.penFillEvents) ? appState.penFillEvents : [];
  appState.qualityRatings = sanitizeQualityRatings(appState.qualityRatings);
  appState.latestCompletedRunSnapshot = Object.prototype.hasOwnProperty.call(raw.state, "latestCompletedRunSnapshot")
    && appState.latestCompletedRunSnapshot
    && typeof appState.latestCompletedRunSnapshot === "object"
    ? appState.latestCompletedRunSnapshot
    : null;
  migrateLegacyRejectedSheepStatusesToAdjustment();
  appState.recordType = appState.recordType === "strongWoolLambs" || appState.recordType === "strongWoolEwes" ? appState.recordType : "none";
  if (forcePaused && appState.runActive) {
    appState.runStartTime = shiftTimestampByGap(appState.runStartTime, restoreGapMs);
    if (appState.currentCycle && typeof appState.currentCycle === "object") {
      appState.currentCycle.shearStart = shiftTimestampByGap(appState.currentCycle.shearStart, restoreGapMs);
      appState.currentCycle.catchStart = shiftTimestampByGap(appState.currentCycle.catchStart, restoreGapMs);
    }
    appState.runEndTimeMs = shiftTimestampByGap(appState.runEndTimeMs, restoreGapMs);
    appState.officialRunEndTimeMs = shiftTimestampByGap(appState.officialRunEndTimeMs, restoreGapMs);

    appState.paused = true;
    appState.pauseStartedAtMs = restoreTimeMs;
    if (Number.isFinite(appState.effectiveResumeRealMs)) {
      appState.effectiveElapsedBeforePauseMs += Math.max(savedAtMs - appState.effectiveResumeRealMs, 0);
      appState.effectiveResumeRealMs = null;
    }
    if (savedDayClockSnapshotSeconds !== null) {
      appState.dayClockPausedSecondsFromMidnight = savedDayClockSnapshotSeconds;
    }
  }
  if (elements.recordType) elements.recordType.value = appState.recordType;
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
  if (elements.runStatus) {
    elements.runStatus.textContent = appState.dayComplete
      ? "End of Day"
      : (isPreparedForNextRunBreak() ? "Official Break" : (appState.runActive ? (appState.paused ? "Paused" : "Running") : "Stopped"));
  }
  if (elements.startRunBtn) elements.startRunBtn.disabled = appState.runActive;
  if (elements.stopRunBtn) elements.stopRunBtn.disabled = !appState.runActive;
  updateFinishRunBreakButtonUI();
  updateStartRunButtonUI();
  updateBreakTimingDisplay();
  updateBreakOverlayDisplay();
  if (elements.simulationModeToggle) elements.simulationModeToggle.checked = appState.simulationMode;
  if (elements.simulationBanner) elements.simulationBanner.hidden = !appState.simulationMode;
  if (elements.simulationControls) elements.simulationControls.hidden = !appState.simulationMode;
  updateSimulationRunLengthControls();
  updateResetCurrentSheepButtonUI();
  updateUndoLastSheepButtonUI();
  renderLogTable();
  renderReviewList();
  drawTrendGraph();
  if (elements.runReviewText) elements.runReviewText.textContent = appState.runReviewText;
  updateReviewRunButtonState();
  updateTrendFlags();
  updateTrendDetailsVisibility();
  if (options.source === "manual") {
    setText(elements.motorState, appState.currentMotorDisplay);
    setText(elements.runClock, formatCountdown(getEffectiveElapsedSeconds()));
    setText(elements.runCountdown, formatCountdown(getRunCountdownSeconds()));
    setText(elements.totalSheep, String(appState.daySheep.length));
    updateRunBadge();
    updateDayClockDisplay();
  } else {
    updateLivePanel();
  }
  updateStatsPanel();
  updatePauseButtonUI();
  renderShortcutSettings();

  if (options.source === "manual") {
    stopPollingLoop();
    stopLiveAndStatsLoops();
  } else if (appState.runActive) {
    if (appState.paused) {
      stopPollingLoop();
      stopLiveAndStatsLoops();
    } else {
      startRealtimeLoops();
    }
  } else if (isPreparedForNextRunBreak()) {
    startRealtimeLoops();
  }
  return true;
}

function loadLastSave() {
  try {
    const autosaveKey = getAutosaveStorageKey();
    const raw = JSON.parse(localStorage.getItem(autosaveKey) || localStorage.getItem(AUTOSAVE_STORAGE_KEY) || "null");
    if (!restoreSessionPayload(raw, { source: "autosave" })) return;
    updateManualSessionStatus("Loaded last autosave");
  } catch (error) {
    console.debug("Failed to load autosave", error);
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

function ensurePanelLockButtons() {
  getPanelElements().forEach((panel) => {
    const actions = panel.querySelector(".panel-header-actions");
    const collapseBtn = panel.querySelector(".panel-collapse");
    if (!actions || !collapseBtn || actions.querySelector(".panel-lock-toggle")) return;
    const lockBtn = document.createElement("button");
    lockBtn.className = "panel-lock-toggle";
    lockBtn.type = "button";
    lockBtn.setAttribute("aria-label", "Toggle panel lock");
    actions.insertBefore(lockBtn, collapseBtn);
  });
}

function updatePanelLockUI(panel) {
  const locked = isPanelLocked(panel.id);
  panel.classList.toggle("panel-locked", locked);
  const lockBtn = panel.querySelector(".panel-lock-toggle");
  if (lockBtn) {
    lockBtn.textContent = locked ? "🔒" : "🔓";
    lockBtn.setAttribute("aria-pressed", String(locked));
    lockBtn.setAttribute("aria-label", locked ? "Unlock panel" : "Lock panel");
    lockBtn.title = locked ? "Unlock panel" : "Lock panel";
  }
}

function movePanel(panelId, direction) {
  if (isPanelLocked(panelId)) return;
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
  if (isPanelLocked(panel.id)) return;
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
  if (isPanelLocked("panel-sim")) return;
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
  setLayoutScrollLock(true);
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
  setLayoutScrollLock(false);
}

function ensureConfirmModal() {
  if (appState.confirmModal.overlay instanceof HTMLElement) return appState.confirmModal;

  const overlay = document.createElement("div");
  overlay.id = "globalConfirmModalOverlay";
  overlay.className = "modal-overlay";
  overlay.hidden = true;

  const dialog = document.createElement("div");
  dialog.className = "modal-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "globalConfirmModalTitle");
  dialog.setAttribute("aria-describedby", "globalConfirmModalMessage");
  dialog.tabIndex = -1;

  const title = document.createElement("h3");
  title.id = "globalConfirmModalTitle";

  const message = document.createElement("p");
  message.id = "globalConfirmModalMessage";

  const actions = document.createElement("div");
  actions.className = "modal-actions";

  const confirmBtn = document.createElement("button");
  confirmBtn.id = "globalConfirmModalConfirm";
  confirmBtn.type = "button";

  const cancelBtn = document.createElement("button");
  cancelBtn.id = "globalConfirmModalCancel";
  cancelBtn.type = "button";

  actions.append(confirmBtn, cancelBtn);
  dialog.append(title, message, actions);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  appState.confirmModal.overlay = overlay;
  appState.confirmModal.dialog = dialog;
  appState.confirmModal.title = title;
  appState.confirmModal.message = message;
  appState.confirmModal.confirmBtn = confirmBtn;
  appState.confirmModal.cancelBtn = cancelBtn;

  const resolveConfirmModal = (answer) => {
    if (!appState.confirmModal.open) return;
    const resolver = appState.confirmModal.resolver;
    appState.confirmModal.open = false;
    appState.confirmModal.resolver = null;
    overlay.hidden = true;
    setLayoutScrollLock(false);
    if (appState.confirmModal.returnFocusEl instanceof HTMLElement) {
      appState.confirmModal.returnFocusEl.focus();
    }
    appState.confirmModal.returnFocusEl = null;
    if (typeof resolver === "function") resolver(Boolean(answer));
  };

  confirmBtn.addEventListener("click", () => resolveConfirmModal(true));
  cancelBtn.addEventListener("click", () => resolveConfirmModal(false));
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) resolveConfirmModal(false);
  });
  overlay.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      resolveConfirmModal(false);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      resolveConfirmModal(true);
    }
  });

  return appState.confirmModal;
}

function ensurePenFillPromptModal() {
  if (appState.penFillPromptModal.overlay instanceof HTMLElement) return appState.penFillPromptModal;

  const overlay = document.createElement("div");
  overlay.id = "penFillPromptModalOverlay";
  overlay.className = "modal-overlay";
  overlay.hidden = true;

  const dialog = document.createElement("div");
  dialog.className = "modal-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "penFillPromptModalTitle");
  dialog.setAttribute("aria-describedby", "penFillPromptModalMessage");
  dialog.tabIndex = -1;

  const title = document.createElement("h3");
  title.id = "penFillPromptModalTitle";

  const message = document.createElement("p");
  message.id = "penFillPromptModalMessage";

  const actions = document.createElement("div");
  actions.className = "modal-actions";

  const yesBtn = document.createElement("button");
  yesBtn.id = "penFillPromptModalYes";
  yesBtn.type = "button";

  const noBtn = document.createElement("button");
  noBtn.id = "penFillPromptModalNo";
  noBtn.type = "button";

  const cancelBtn = document.createElement("button");
  cancelBtn.id = "penFillPromptModalCancel";
  cancelBtn.type = "button";
  cancelBtn.textContent = "Cancel";

  actions.append(yesBtn, noBtn, cancelBtn);
  dialog.append(title, message, actions);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  Object.assign(appState.penFillPromptModal, {
    overlay,
    dialog,
    title,
    message,
    yesBtn,
    noBtn,
    cancelBtn
  });

  const resolvePenFillPromptModal = (answer) => {
    if (!appState.penFillPromptModal.open) return;
    const resolver = appState.penFillPromptModal.resolver;
    appState.penFillPromptModal.open = false;
    appState.penFillPromptModal.resolver = null;
    overlay.hidden = true;
    setLayoutScrollLock(false);
    if (appState.penFillPromptModal.returnFocusEl instanceof HTMLElement) {
      appState.penFillPromptModal.returnFocusEl.focus();
    }
    appState.penFillPromptModal.returnFocusEl = null;
    if (typeof resolver === "function") resolver(answer);
  };

  yesBtn.addEventListener("click", () => resolvePenFillPromptModal("yes"));
  noBtn.addEventListener("click", () => resolvePenFillPromptModal("different"));
  cancelBtn.addEventListener("click", () => resolvePenFillPromptModal("cancel"));
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) resolvePenFillPromptModal("cancel");
  });
  overlay.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      resolvePenFillPromptModal("cancel");
    }
    if (event.key === "Enter") {
      event.preventDefault();
      resolvePenFillPromptModal("yes");
    }
  });

  return appState.penFillPromptModal;
}

function penFillConfirmationModal({ recommendedFillAmount }) {
  const modal = ensurePenFillPromptModal();
  if (!modal.overlay || !modal.dialog || !modal.title || !modal.message || !modal.yesBtn || !modal.noBtn || !modal.cancelBtn) {
    return Promise.resolve("cancel");
  }

  if (modal.open && typeof modal.resolver === "function") {
    const previousResolver = modal.resolver;
    modal.open = false;
    modal.resolver = null;
    modal.overlay.hidden = true;
    setLayoutScrollLock(false);
    previousResolver("cancel");
  }

  modal.title.textContent = "Confirm pen refill";
  modal.message.textContent = `Recommended: Add ${recommendedFillAmount}.\nWas this refill amount added?`;
  modal.yesBtn.textContent = `Yes, added ${recommendedFillAmount}`;
  modal.noBtn.textContent = "Different amount";
  modal.cancelBtn.textContent = "Cancel";
  modal.returnFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  modal.open = true;
  modal.overlay.hidden = false;
  setLayoutScrollLock(true);
  modal.dialog.focus();

  return new Promise((resolve) => {
    modal.resolver = resolve;
  });
}


function confirmModal({ title, message, confirmText = "Confirm", cancelText = "Cancel" }) {
  const modal = ensureConfirmModal();
  if (!modal.overlay || !modal.dialog || !modal.title || !modal.message || !modal.confirmBtn || !modal.cancelBtn) {
    return Promise.resolve(false);
  }

  if (modal.open && typeof modal.resolver === "function") {
    const previousResolver = modal.resolver;
    modal.open = false;
    modal.resolver = null;
    modal.overlay.hidden = true;
    setLayoutScrollLock(false);
    previousResolver(false);
  }

  modal.title.textContent = title || "Please confirm";
  modal.message.textContent = message || "Are you sure?";
  modal.confirmBtn.textContent = confirmText;
  modal.cancelBtn.textContent = cancelText;
  modal.returnFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  modal.open = true;
  modal.overlay.hidden = false;
  setLayoutScrollLock(true);
  modal.dialog.focus();

  return new Promise((resolve) => {
    modal.resolver = resolve;
  });
}

function clearPanelInteractionHighlights() {
  getPanelElements().forEach((panel) => {
    panel.classList.remove("panel-dragging", "drag-over", "panel-resizing", "panel-active", "panel-selected", "panel-highlighted");
  });
  if (elements.panelSim) {
    elements.panelSim.classList.remove("panel-docked-dragging");
  }
  document.querySelectorAll(".panel-drop-placeholder").forEach((node) => node.remove());
  appState.pointerPanelDrag = null;
  appState.absolutePanelDrag = null;
  appState.controlsDockDrag = null;
  appState.panelResize = null;
  setLayoutScrollLock(false);
}

function applyConnectionSettingsFromUI() {
  if (!elements.shellyIpInput || !elements.endpointMode || !elements.pollIntervalInput) return;
  appState.connection.ip = normalizeIp(elements.shellyIpInput.value) || DEFAULT_CONNECTION_SETTINGS.ip;
  appState.connection.mode = ENDPOINT_PATHS[elements.endpointMode.value] ? elements.endpointMode.value : DEFAULT_CONNECTION_SETTINGS.mode;
  appState.connection.pollInterval = sanitizePollInterval(elements.pollIntervalInput.value);
  appState.pollLatencySamples = [];
  appState.autoAdjustedPollInterval = false;

  updateConnectionInputs();
  saveConnectionSettings();
  if (!appState.paused) {
    startPollingLoop();
  }
}

function setSimulationMode(enabled) {
  appState.simulationMode = Boolean(enabled);
  if (!appState.simulationMode) {
    appState.simulationRunLengthMode = "real";
  } else {
    appState.simulationRunLengthMode = getValidSimulationRunLengthMode(appState.simulationRunLengthMode);
  }
  appState.simulationCustomMinutes = sanitizeSimulationCustomMinutes(appState.simulationCustomMinutes);
  if (elements.simulationModeToggle) elements.simulationModeToggle.checked = appState.simulationMode;
  if (elements.simulationBanner) elements.simulationBanner.hidden = !appState.simulationMode;
  if (elements.simulationControls) elements.simulationControls.hidden = !appState.simulationMode;
  updateSimulationRunLengthControls();
  updateResetCurrentSheepButtonUI();
  updateUndoLastSheepButtonUI();
  updateLivePanel();
  updateStatsPanel();

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
    <p><strong>Average Total Time Per Sheep:</strong> ${formatSeconds(block.avgCycle)}</p>
    <p><strong>Rate:</strong> ${block.rate.toFixed(2)} sheep/hour</p>
  `;
}


function setActiveTopTab(tabName) {
  const showSettings = tabName === "settings";
  if (elements.dashboardPanels) elements.dashboardPanels.hidden = showSettings;
  if (elements.settingsPanel) elements.settingsPanel.hidden = !showSettings;
  if (elements.dashboardTab) {
    elements.dashboardTab.classList.toggle("is-active", !showSettings);
    elements.dashboardTab.setAttribute("aria-selected", String(!showSettings));
  }
  if (elements.settingsTab) {
    elements.settingsTab.classList.toggle("is-active", showSettings);
    elements.settingsTab.setAttribute("aria-selected", String(showSettings));
  }
}

function initializeTopTabs() {
  setActiveTopTab("dashboard");
  if (elements.dashboardTab) {
    elements.dashboardTab.addEventListener("click", () => setActiveTopTab("dashboard"));
  }
  if (elements.settingsTab) {
    elements.settingsTab.addEventListener("click", () => setActiveTopTab("settings"));
  }
}

function initializeConnectionHelp() {
  const template = document.getElementById("connectionHelpTemplate");
  if (!(template instanceof HTMLTemplateElement)) return;
  if (!elements.connectionHelpModalContent) return;
  elements.connectionHelpModalContent.innerHTML = "";
  elements.connectionHelpModalContent.appendChild(template.content.cloneNode(true));
}

function openConnectionHelpModal() {
  if (!elements.connectionHelpModalOverlay) return;
  elements.connectionHelpModalOverlay.hidden = false;
  document.body.classList.add("layout-scroll-lock");
}

function closeConnectionHelpModal() {
  if (!elements.connectionHelpModalOverlay) return;
  elements.connectionHelpModalOverlay.hidden = true;
  if (
    elements.dayConfigHelpModalOverlay?.hidden !== false
    && elements.sheepLogHelpModalOverlay?.hidden !== false
    && elements.timingPanelHelpModalOverlay?.hidden !== false
    && elements.penFillPlannerHelpModalOverlay?.hidden !== false
    && elements.performancePanelHelpModalOverlay?.hidden !== false
    && elements.simulationControlsHelpModalOverlay?.hidden !== false
    && elements.shortcutSettingsModalOverlay?.hidden !== false
  ) {
    document.body.classList.remove("layout-scroll-lock");
  }
}


function openDayConfigHelpModal() {
  if (!elements.dayConfigHelpModalOverlay) return;
  elements.dayConfigHelpModalOverlay.hidden = false;
  document.body.classList.add("layout-scroll-lock");
}

function closeDayConfigHelpModal() {
  if (!elements.dayConfigHelpModalOverlay) return;
  elements.dayConfigHelpModalOverlay.hidden = true;
  if (
    elements.connectionHelpModalOverlay?.hidden !== false
    && elements.dayConfigHelpModalOverlay?.hidden !== false
    && elements.sheepLogHelpModalOverlay?.hidden !== false
    && elements.timingPanelHelpModalOverlay?.hidden !== false
    && elements.penFillPlannerHelpModalOverlay?.hidden !== false
    && elements.performancePanelHelpModalOverlay?.hidden !== false
    && elements.simulationControlsHelpModalOverlay?.hidden !== false
    && elements.shortcutSettingsModalOverlay?.hidden !== false
  ) {
    document.body.classList.remove("layout-scroll-lock");
  }
}

function openSheepLogHelpModal() {
  if (!elements.sheepLogHelpModalOverlay) return;
  elements.sheepLogHelpModalOverlay.hidden = false;
  document.body.classList.add("layout-scroll-lock");
}

function openSheepLogSettingsModal() {
  if (!elements.sheepLogSettingsModalOverlay) return;
  elements.sheepLogSettingsModalOverlay.hidden = false;
  document.body.classList.add("layout-scroll-lock");
}

function closeSheepLogSettingsModal() {
  if (!elements.sheepLogSettingsModalOverlay) return;
  elements.sheepLogSettingsModalOverlay.hidden = true;
  if (
    elements.connectionHelpModalOverlay?.hidden !== false
    && elements.dayConfigHelpModalOverlay?.hidden !== false
    && elements.sheepLogHelpModalOverlay?.hidden !== false
    && elements.sheepLogSettingsModalOverlay?.hidden !== false
    && elements.targetPaceHelpModalOverlay?.hidden !== false
    && elements.timingPanelHelpModalOverlay?.hidden !== false
    && elements.penFillPlannerHelpModalOverlay?.hidden !== false
    && elements.performancePanelHelpModalOverlay?.hidden !== false
    && elements.simulationControlsHelpModalOverlay?.hidden !== false
    && elements.shortcutSettingsModalOverlay?.hidden !== false
  ) {
    document.body.classList.remove("layout-scroll-lock");
  }
}

function closeSheepLogHelpModal() {
  if (!elements.sheepLogHelpModalOverlay) return;
  elements.sheepLogHelpModalOverlay.hidden = true;
  if (
    elements.connectionHelpModalOverlay?.hidden !== false
    && elements.dayConfigHelpModalOverlay?.hidden !== false
    && elements.sheepLogSettingsModalOverlay?.hidden !== false
    && elements.timingPanelHelpModalOverlay?.hidden !== false
    && elements.penFillPlannerHelpModalOverlay?.hidden !== false
    && elements.performancePanelHelpModalOverlay?.hidden !== false
    && elements.simulationControlsHelpModalOverlay?.hidden !== false
    && elements.shortcutSettingsModalOverlay?.hidden !== false
  ) {
    document.body.classList.remove("layout-scroll-lock");
  }
}

function openTimingPanelHelpModal() {
  if (!elements.timingPanelHelpModalOverlay) return;
  elements.timingPanelHelpModalOverlay.hidden = false;
  document.body.classList.add("layout-scroll-lock");
}

function openTargetPaceHelpModal() {
  if (!elements.targetPaceHelpModalOverlay) return;
  elements.targetPaceHelpModalOverlay.hidden = false;
  document.body.classList.add("layout-scroll-lock");
}

function closeTargetPaceHelpModal() {
  if (!elements.targetPaceHelpModalOverlay) return;
  elements.targetPaceHelpModalOverlay.hidden = true;
  if (
    elements.connectionHelpModalOverlay?.hidden !== false
    && elements.dayConfigHelpModalOverlay?.hidden !== false
    && elements.sheepLogHelpModalOverlay?.hidden !== false
    && elements.timingPanelHelpModalOverlay?.hidden !== false
    && elements.penFillPlannerHelpModalOverlay?.hidden !== false
    && elements.performancePanelHelpModalOverlay?.hidden !== false
    && elements.simulationControlsHelpModalOverlay?.hidden !== false
    && elements.shortcutSettingsModalOverlay?.hidden !== false
    && elements.sheepLogSettingsModalOverlay?.hidden !== false
  ) {
    document.body.classList.remove("layout-scroll-lock");
  }
}

function closeTimingPanelHelpModal() {
  if (!elements.timingPanelHelpModalOverlay) return;
  elements.timingPanelHelpModalOverlay.hidden = true;
  if (
    elements.connectionHelpModalOverlay?.hidden !== false
    && elements.dayConfigHelpModalOverlay?.hidden !== false
    && elements.sheepLogHelpModalOverlay?.hidden !== false
    && elements.penFillPlannerHelpModalOverlay?.hidden !== false
    && elements.performancePanelHelpModalOverlay?.hidden !== false
    && elements.simulationControlsHelpModalOverlay?.hidden !== false
    && elements.shortcutSettingsModalOverlay?.hidden !== false
    && elements.sheepLogSettingsModalOverlay?.hidden !== false
  ) {
    document.body.classList.remove("layout-scroll-lock");
  }
}



function openPenFillPlannerHelpModal() {
  if (!elements.penFillPlannerHelpModalOverlay) return;
  elements.penFillPlannerHelpModalOverlay.hidden = false;
  document.body.classList.add("layout-scroll-lock");
}

function closePenFillPlannerHelpModal() {
  if (!elements.penFillPlannerHelpModalOverlay) return;
  elements.penFillPlannerHelpModalOverlay.hidden = true;
  if (
    elements.connectionHelpModalOverlay?.hidden !== false
    && elements.dayConfigHelpModalOverlay?.hidden !== false
    && elements.sheepLogHelpModalOverlay?.hidden !== false
    && elements.targetPaceHelpModalOverlay?.hidden !== false
    && elements.timingPanelHelpModalOverlay?.hidden !== false
    && elements.performancePanelHelpModalOverlay?.hidden !== false
    && elements.simulationControlsHelpModalOverlay?.hidden !== false
    && elements.shortcutSettingsModalOverlay?.hidden !== false
    && elements.sheepLogSettingsModalOverlay?.hidden !== false
  ) {
    document.body.classList.remove("layout-scroll-lock");
  }
}

function openPerformancePanelHelpModal() {
  if (!elements.performancePanelHelpModalOverlay) return;
  elements.performancePanelHelpModalOverlay.hidden = false;
  document.body.classList.add("layout-scroll-lock");
}

function closePerformancePanelHelpModal() {
  if (!elements.performancePanelHelpModalOverlay) return;
  elements.performancePanelHelpModalOverlay.hidden = true;
  if (
    elements.connectionHelpModalOverlay?.hidden !== false
    && elements.dayConfigHelpModalOverlay?.hidden !== false
    && elements.sheepLogHelpModalOverlay?.hidden !== false
    && elements.timingPanelHelpModalOverlay?.hidden !== false
    && elements.penFillPlannerHelpModalOverlay?.hidden !== false
    && elements.simulationControlsHelpModalOverlay?.hidden !== false
    && elements.shortcutSettingsModalOverlay?.hidden !== false
    && elements.sheepLogSettingsModalOverlay?.hidden !== false
  ) {
    document.body.classList.remove("layout-scroll-lock");
  }
}

function openAutosaveSettingsModal() {
  if (!elements.autosaveSettingsModalOverlay) return;
  updateAutosaveUI();
  elements.autosaveSettingsModalOverlay.hidden = false;
  document.body.classList.add("layout-scroll-lock");
}

function closeAutosaveSettingsModal() {
  if (!elements.autosaveSettingsModalOverlay) return;
  elements.autosaveSettingsModalOverlay.hidden = true;
  if (
    elements.connectionHelpModalOverlay?.hidden !== false
    && elements.dayConfigHelpModalOverlay?.hidden !== false
    && elements.sheepLogHelpModalOverlay?.hidden !== false
    && elements.timingPanelHelpModalOverlay?.hidden !== false
    && elements.penFillPlannerHelpModalOverlay?.hidden !== false
    && elements.performancePanelHelpModalOverlay?.hidden !== false
    && elements.simulationControlsHelpModalOverlay?.hidden !== false
    && elements.shortcutSettingsModalOverlay?.hidden !== false
    && elements.sheepLogSettingsModalOverlay?.hidden !== false
  ) {
    document.body.classList.remove("layout-scroll-lock");
  }
}

function openSimulationControlsHelpModal() {
  if (!elements.simulationControlsHelpModalOverlay) return;
  elements.simulationControlsHelpModalOverlay.hidden = false;
  document.body.classList.add("layout-scroll-lock");
}

function closeSimulationControlsHelpModal() {
  if (!elements.simulationControlsHelpModalOverlay) return;
  elements.simulationControlsHelpModalOverlay.hidden = true;
  if (
    elements.connectionHelpModalOverlay?.hidden !== false
    && elements.dayConfigHelpModalOverlay?.hidden !== false
    && elements.sheepLogHelpModalOverlay?.hidden !== false
    && elements.timingPanelHelpModalOverlay?.hidden !== false
    && elements.penFillPlannerHelpModalOverlay?.hidden !== false
    && elements.performancePanelHelpModalOverlay?.hidden !== false
    && elements.autosaveSettingsModalOverlay?.hidden !== false
    && elements.shortcutSettingsModalOverlay?.hidden !== false
    && elements.sheepLogSettingsModalOverlay?.hidden !== false
  ) {
    document.body.classList.remove("layout-scroll-lock");
  }
}

function bindEvents() {
  ensureConfirmModal();
  if (elements.startRunBtn) elements.startRunBtn.addEventListener("click", startRun);
  if (elements.stopRunBtn) elements.stopRunBtn.addEventListener("click", stopRun);
  if (elements.finishRunBreakBtn) elements.finishRunBreakBtn.addEventListener("click", handleFinishRunBreakClick);
  if (elements.reviewRunBtn) elements.reviewRunBtn.addEventListener("click", openReviewRunModal);
  if (elements.reviewRunModalCloseBtn) elements.reviewRunModalCloseBtn.addEventListener("click", closeReviewRunModal);
  if (elements.reviewRunModalOverlay) {
    elements.reviewRunModalOverlay.addEventListener("click", (event) => {
      if (event.target === elements.reviewRunModalOverlay) closeReviewRunModal();
    });
  }
  if (elements.breakOverlayDismissBtn) elements.breakOverlayDismissBtn.addEventListener("click", hideBreakBannerForCurrentBreak);
  if (elements.breakOverlayShowBtn) elements.breakOverlayShowBtn.addEventListener("click", showBreakBannerForCurrentBreak);
  if (elements.pauseRunBtn) elements.pauseRunBtn.addEventListener("click", togglePauseRun);
  if (elements.loadLastSaveBtn) elements.loadLastSaveBtn.addEventListener("click", loadLastSave);
  if (elements.saveSessionBtn) elements.saveSessionBtn.addEventListener("click", saveManualSession);
  if (elements.loadSessionBtn) elements.loadSessionBtn.addEventListener("click", openManualSessionLoadModal);
  if (elements.exportSessionBtn) elements.exportSessionBtn.addEventListener("click", exportSession);
  if (elements.importSessionBtn) elements.importSessionBtn.addEventListener("click", openImportSessionPicker);
  if (elements.exportPdfBtn) elements.exportPdfBtn.addEventListener("click", exportPdf);
  if (elements.importSessionFileInput) elements.importSessionFileInput.addEventListener("change", handleImportSessionFileChange);
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
  if (elements.trendDetailsToggle) {
    elements.trendDetailsToggle.addEventListener("click", () => {
      appState.trendDetailsExpanded = !appState.trendDetailsExpanded;
      updateTrendDetailsVisibility();
    });
  }
  if (elements.resetRunBtn) {
    elements.resetRunBtn.addEventListener("click", async () => {
      const confirmed = await confirmModal({
        title: "Reset run data?",
        message: "This will clear sheep log and timers.",
        confirmText: "Yes, reset",
        cancelText: "Cancel"
      });
      if (!confirmed) {
        clearPanelInteractionHighlights();
        return;
      }
      resetRun();
    });
  }

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

  if (elements.recordType) {
    elements.recordType.addEventListener("change", () => {
      const nextRecordType = elements.recordType.value;
      appState.recordType = nextRecordType === "strongWoolLambs" || nextRecordType === "strongWoolEwes" ? nextRecordType : "none";
      updateStatsPanel();
      autosaveState();
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

  if (elements.simulationRunLengthMode) {
    elements.simulationRunLengthMode.addEventListener("change", () => {
      setSimulationRunLengthMode(elements.simulationRunLengthMode.value);
    });
  }
  if (elements.simulationCustomMinutes) {
    elements.simulationCustomMinutes.addEventListener("change", () => {
      setSimulationCustomMinutes(elements.simulationCustomMinutes.value);
    });
    elements.simulationCustomMinutes.addEventListener("input", () => {
      if (appState.simulationRunLengthMode === "custom" && !appState.runActive) {
        setSimulationCustomMinutes(elements.simulationCustomMinutes.value);
      }
    });
  }

  if (elements.simMotorOnBtn) elements.simMotorOnBtn.addEventListener("click", handleMotorOn);
  if (elements.resetCurrentSheepBtn) elements.resetCurrentSheepBtn.addEventListener("click", resetCurrentSheepTiming);
  if (elements.undoLastSheepBtn) elements.undoLastSheepBtn.addEventListener("click", undoLastSheep);
  if (elements.mergeSelectedSheepBtn) elements.mergeSelectedSheepBtn.addEventListener("click", mergeSelectedSheep);
  if (elements.shortcutSettingsBtn) elements.shortcutSettingsBtn.addEventListener("click", openShortcutSettingsModal);
  if (elements.shortcutSettingsModalCloseBtn) elements.shortcutSettingsModalCloseBtn.addEventListener("click", closeShortcutSettingsModal);
  if (elements.shortcutSettingsModalOverlay) {
    elements.shortcutSettingsModalOverlay.addEventListener("click", (event) => {
      if (event.target === elements.shortcutSettingsModalOverlay) closeShortcutSettingsModal();
    });
  }
  if (elements.simMotorOffBtn) elements.simMotorOffBtn.addEventListener("click", handleMotorOff);
  SHORTCUT_ACTIONS.forEach((action) => {
    const input = elements[action.elementKey];
    if (!input) return;
    input.addEventListener("keydown", (event) => {
      if (event.key === "Tab") return;
      event.preventDefault();
      event.stopPropagation();
      applyShortcutAssignment(action.key, event.key);
    });
    input.addEventListener("input", () => {
      renderShortcutSettings();
    });
  });
  if (elements.resetShortcutsBtn) {
    elements.resetShortcutsBtn.addEventListener("click", () => {
      appState.keyboardShortcuts = getFallbackShortcuts();
      saveKeyboardShortcuts();
      setShortcutMessage("");
      renderShortcutSettings();
    });
  }
  if (elements.dayConfigHelpBtn) elements.dayConfigHelpBtn.addEventListener("click", openDayConfigHelpModal);
  if (elements.dayConfigHelpModalCloseBtn) elements.dayConfigHelpModalCloseBtn.addEventListener("click", closeDayConfigHelpModal);
  if (elements.dayConfigHelpModalOverlay) {
    elements.dayConfigHelpModalOverlay.addEventListener("click", (event) => {
      if (event.target === elements.dayConfigHelpModalOverlay) closeDayConfigHelpModal();
    });
  }
  if (elements.dashboardConnectionHelpBtn) elements.dashboardConnectionHelpBtn.addEventListener("click", openConnectionHelpModal);
  if (elements.settingsConnectionHelpBtn) elements.settingsConnectionHelpBtn.addEventListener("click", openConnectionHelpModal);
  if (elements.connectionHelpModalCloseBtn) elements.connectionHelpModalCloseBtn.addEventListener("click", closeConnectionHelpModal);
  if (elements.connectionHelpModalOverlay) {
    elements.connectionHelpModalOverlay.addEventListener("click", (event) => {
      if (event.target === elements.connectionHelpModalOverlay) closeConnectionHelpModal();
    });
  }
  if (elements.sheepLogHelpBtn) elements.sheepLogHelpBtn.addEventListener("click", openSheepLogHelpModal);
  if (elements.sheepLogSettingsToggle) elements.sheepLogSettingsToggle.addEventListener("click", openSheepLogSettingsModal);
  if (elements.sheepLogSettingsModalCloseBtn) elements.sheepLogSettingsModalCloseBtn.addEventListener("click", closeSheepLogSettingsModal);
  if (elements.sheepLogSettingsModalOverlay) {
    elements.sheepLogSettingsModalOverlay.addEventListener("click", (event) => {
      if (event.target === elements.sheepLogSettingsModalOverlay) closeSheepLogSettingsModal();
    });
  }
  if (elements.sheepLogHelpModalCloseBtn) elements.sheepLogHelpModalCloseBtn.addEventListener("click", closeSheepLogHelpModal);
  if (elements.sheepLogHelpModalOverlay) {
    elements.sheepLogHelpModalOverlay.addEventListener("click", (event) => {
      if (event.target === elements.sheepLogHelpModalOverlay) closeSheepLogHelpModal();
    });
  }
  if (elements.targetPaceHelpBtn) elements.targetPaceHelpBtn.addEventListener("click", openTargetPaceHelpModal);
  if (elements.targetPaceHelpModalCloseBtn) elements.targetPaceHelpModalCloseBtn.addEventListener("click", closeTargetPaceHelpModal);
  if (elements.targetPaceHelpModalOverlay) {
    elements.targetPaceHelpModalOverlay.addEventListener("click", (event) => {
      if (event.target === elements.targetPaceHelpModalOverlay) closeTargetPaceHelpModal();
    });
  }
  if (elements.timingPanelHelpBtn) elements.timingPanelHelpBtn.addEventListener("click", openTimingPanelHelpModal);
  if (elements.timingPanelHelpModalCloseBtn) elements.timingPanelHelpModalCloseBtn.addEventListener("click", closeTimingPanelHelpModal);
  if (elements.timingPanelHelpModalOverlay) {
    elements.timingPanelHelpModalOverlay.addEventListener("click", (event) => {
      if (event.target === elements.timingPanelHelpModalOverlay) closeTimingPanelHelpModal();
    });
  }
  if (elements.penFillAdjustBtn) elements.penFillAdjustBtn.addEventListener("click", openPenFillAdjustModal);
  if (elements.penFillAdjustForm) elements.penFillAdjustForm.addEventListener("submit", savePenFillAdjustModal);
  if (elements.penFillAdjustCancelBtn) elements.penFillAdjustCancelBtn.addEventListener("click", closePenFillAdjustModal);
  if (elements.penFillAdjustAmountInput) elements.penFillAdjustAmountInput.addEventListener("input", () => validatePenFillAdjustModal());
  if (elements.penFillAdjustCurrentCountInput) elements.penFillAdjustCurrentCountInput.addEventListener("input", () => validatePenFillAdjustModal());
  if (elements.penFillAdjustMinusOneBtn) elements.penFillAdjustMinusOneBtn.addEventListener("click", () => adjustPenFillModalAmountBy(-1));
  if (elements.penFillAdjustPlusOneBtn) elements.penFillAdjustPlusOneBtn.addEventListener("click", () => adjustPenFillModalAmountBy(1));
  if (elements.penFillAdjustResetBtn) elements.penFillAdjustResetBtn.addEventListener("click", resetPenFillAdjustModalAmountToAssumed);
  if (elements.penFillAdjustModalOverlay) {
    elements.penFillAdjustModalOverlay.addEventListener("click", (event) => {
      if (event.target === elements.penFillAdjustModalOverlay) closePenFillAdjustModal();
    });
    elements.penFillAdjustModalOverlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePenFillAdjustModal();
      }
    });
  }
  if (elements.penFillPlannerHelpBtn) elements.penFillPlannerHelpBtn.addEventListener("click", openPenFillPlannerHelpModal);
  if (elements.penFillPlannerHelpModalCloseBtn) elements.penFillPlannerHelpModalCloseBtn.addEventListener("click", closePenFillPlannerHelpModal);
  if (elements.penFillPlannerHelpModalOverlay) {
    elements.penFillPlannerHelpModalOverlay.addEventListener("click", (event) => {
      if (event.target === elements.penFillPlannerHelpModalOverlay) closePenFillPlannerHelpModal();
    });
  }
  if (elements.performancePanelHelpBtn) elements.performancePanelHelpBtn.addEventListener("click", openPerformancePanelHelpModal);
  if (elements.rejectedSheepCount) elements.rejectedSheepCount.addEventListener("click", openOfficialRejectModal);
  if (elements.officialRejectForm) elements.officialRejectForm.addEventListener("submit", saveOfficialRejectAdjustmentFromInput);
  if (elements.officialRejectCloseBtn) elements.officialRejectCloseBtn.addEventListener("click", closeOfficialRejectModal);
  if (elements.officialRejectModalCloseBtn) elements.officialRejectModalCloseBtn.addEventListener("click", closeOfficialRejectModal);
  if (elements.officialRejectIncrementBtn) elements.officialRejectIncrementBtn.addEventListener("click", () => adjustOfficialRejectCount(1));
  if (elements.officialRejectDecrementBtn) elements.officialRejectDecrementBtn.addEventListener("click", () => adjustOfficialRejectCount(-1));
  if (elements.officialRejectModalOverlay) {
    elements.officialRejectModalOverlay.addEventListener("click", (event) => {
      if (event.target === elements.officialRejectModalOverlay) closeOfficialRejectModal();
    });
  }
  if (elements.qualityRatingSummary) elements.qualityRatingSummary.addEventListener("click", openQualityRatingModal);
  if (elements.qualityRatingForm) elements.qualityRatingForm.addEventListener("submit", saveQualityRatingFromForm);
  if (elements.qualityRatingClearBtn) elements.qualityRatingClearBtn.addEventListener("click", resetQualityRatingForm);
  if (elements.qualityRatingCloseBtn) elements.qualityRatingCloseBtn.addEventListener("click", closeQualityRatingModal);
  if (elements.qualityRatingModalCloseBtn) elements.qualityRatingModalCloseBtn.addEventListener("click", closeQualityRatingModal);
  if (elements.qualityRatingPeriodInput) {
    elements.qualityRatingPeriodInput.addEventListener("change", () => {
      if (!appState.qualityRatingEditId) setQualityRatingCountDefaults(elements.qualityRatingPeriodInput.value);
    });
  }
  if (elements.qualityRatingOfficialWarningInput) elements.qualityRatingOfficialWarningInput.addEventListener("change", updateQualityWarningFieldState);
  updateQualityWarningFieldState();
  if (elements.qualityRatingHistory) {
    elements.qualityRatingHistory.addEventListener("click", (event) => {
      const actionTarget = event.target instanceof HTMLElement ? event.target.closest("[data-action]") : null;
      if (!(actionTarget instanceof HTMLElement)) return;
      if (actionTarget.dataset.action === "editQualityRating") editQualityRating(actionTarget.dataset.ratingId || "");
      if (actionTarget.dataset.action === "deleteQualityRating") deleteQualityRating(actionTarget.dataset.ratingId || "");
    });
  }
  if (elements.qualityRatingModalOverlay) {
    elements.qualityRatingModalOverlay.addEventListener("click", (event) => {
      if (event.target === elements.qualityRatingModalOverlay) closeQualityRatingModal();
    });
  }
  if (elements.performancePanelHelpModalCloseBtn) elements.performancePanelHelpModalCloseBtn.addEventListener("click", closePerformancePanelHelpModal);
  if (elements.performancePanelHelpModalOverlay) {
    elements.performancePanelHelpModalOverlay.addEventListener("click", (event) => {
      if (event.target === elements.performancePanelHelpModalOverlay) closePerformancePanelHelpModal();
    });
  }
  if (elements.simulationControlsHelpBtn) elements.simulationControlsHelpBtn.addEventListener("click", openSimulationControlsHelpModal);
  if (elements.simulationControlsHelpModalCloseBtn) elements.simulationControlsHelpModalCloseBtn.addEventListener("click", closeSimulationControlsHelpModal);
  if (elements.simulationControlsHelpModalOverlay) {
    elements.simulationControlsHelpModalOverlay.addEventListener("click", (event) => {
      if (event.target === elements.simulationControlsHelpModalOverlay) closeSimulationControlsHelpModal();
    });
  }
  document.addEventListener("keydown", (event) => {
    handleShortcutKeydown(event);
    if (event.key === "Escape") {
      closeDayConfigHelpModal();
      closeConnectionHelpModal();
      closeSheepLogHelpModal();
      closeSheepLogSettingsModal();
      closeTargetPaceHelpModal();
      closeTimingPanelHelpModal();
      closePenFillPlannerHelpModal();
      closePerformancePanelHelpModal();
      closeQualityRatingModal();
      closeOfficialRejectModal();
      closeSimulationControlsHelpModal();
      closeAutosaveSettingsModal();
      closeShortcutSettingsModal();
      closeReviewRunModal();
    }
  }, { capture: true });
  if (elements.autosaveSettingsBtn) elements.autosaveSettingsBtn.addEventListener("click", openAutosaveSettingsModal);
  if (elements.autosaveSettingsModalCloseBtn) elements.autosaveSettingsModalCloseBtn.addEventListener("click", closeAutosaveSettingsModal);
  if (elements.autosaveSettingsModalOverlay) {
    elements.autosaveSettingsModalOverlay.addEventListener("click", (event) => {
      if (event.target === elements.autosaveSettingsModalOverlay) closeAutosaveSettingsModal();
    });
  }
  if (elements.autosaveEnabledInput) {
    elements.autosaveEnabledInput.addEventListener("change", () => {
      setAutosaveEnabled(elements.autosaveEnabledInput.checked);
    });
  }
  if (elements.autosaveIntervalSelect) {
    elements.autosaveIntervalSelect.addEventListener("change", () => {
      setAutosaveIntervalSeconds(elements.autosaveIntervalSelect.value);
    });
  }
  if (elements.followLatestToggle) {
    elements.followLatestToggle.addEventListener("change", () => {
      setFollowLatestEnabled(elements.followLatestToggle.checked);
    });
  }
  if (elements.sheepLogSortBy) {
    elements.sheepLogSortBy.addEventListener("change", setSheepLogSortSettings);
  }
  if (elements.sheepLogSortOrder) {
    elements.sheepLogSortOrder.addEventListener("change", setSheepLogSortSettings);
  }
  if (elements.sheepLogFillDirection) {
    elements.sheepLogFillDirection.addEventListener("change", setSheepLogFillDirectionSettings);
  }
  if (elements.showPlannedDelayMarkers) {
    elements.showPlannedDelayMarkers.addEventListener("change", () => {
      setPlannedDelayMarkerVisibility(elements.showPlannedDelayMarkers.checked);
    });
  }
  if (elements.markerSettingsToggle) {
    elements.markerSettingsToggle.addEventListener("click", () => {
      setMarkerSettingsOpen(!appState.markerSettingsOpen);
    });
  }
  [
    elements.drinkTimingMinutes,
    elements.drinkWindowSeconds,
    elements.drinkMinExtraSeconds,
    elements.drinkMaxExtraSeconds,
    elements.cutterTimingMinutes,
    elements.cutterWindowSeconds,
    elements.cutterMinExtraSeconds,
    elements.cutterMaxExtraSeconds,
    elements.combTimingMinutes,
    elements.combWindowSeconds,
    elements.combMinExtraSeconds,
    elements.combMaxExtraSeconds
  ].filter(Boolean).forEach((input) => {
    input.addEventListener("change", applyMarkerSettingsFromInputs);
  });
  if (elements.resetMarkerSettingsBtn) {
    elements.resetMarkerSettingsBtn.addEventListener("click", resetMarkerSettings);
  }
  if (elements.sheepLogBody) {
    elements.sheepLogBody.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const actionTarget = target.closest("[data-action]");
      if (!(actionTarget instanceof HTMLElement)) return;
      const action = actionTarget.dataset.action;
      if (action === "edit-marker-note") {
        openSheepLogMarkerNoteEditor(actionTarget.dataset.sheepId || "");
      } else if (action === "cancel-marker-note") {
        closeSheepLogMarkerNoteEditor();
      } else if (action === "save-marker-note") {
        const editor = actionTarget.closest(".sheep-log-marker-note-editor");
        if (editor instanceof HTMLElement) saveSheepLogMarkerNoteFromEditor(editor);
      }
    });
    elements.sheepLogBody.addEventListener("change", (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.classList.contains("sheep-log-select-checkbox")) {
        toggleSheepLogSelection(target.dataset.sheepId || "", target.checked);
        return;
      }
    });
  }
  if (elements.predictedCatchClockMode) {
    elements.predictedCatchClockMode.value = appState.predictedCatchClockMode;
    elements.predictedCatchClockMode.addEventListener("change", () => {
      appState.predictedCatchClockMode = elements.predictedCatchClockMode.value === "run" ? "run" : "day";
      updateStatsPanel();
    });
  }
  if (elements.targetPaceSettingsToggle && elements.targetPaceSettings) {
    elements.targetPaceSettingsToggle.addEventListener("click", () => {
      const isOpen = !elements.targetPaceSettings.hidden;
      elements.targetPaceSettings.hidden = isOpen;
      elements.targetPaceSettingsToggle.setAttribute("aria-expanded", String(!isOpen));
    });
  }
  initializeSimulationSections();
  initializePerformanceSections();
  initializeDayConfigSections();
  initTargetPaceSections();
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
  if (elements.snapToGridToggle) {
    elements.snapToGridToggle.addEventListener("change", () => {
      appState.snapToGridEnabled = elements.snapToGridToggle.checked;
      localStorage.setItem(SNAP_TO_GRID_ENABLED_STORAGE_KEY, String(appState.snapToGridEnabled));
      applyPanelLayout();
      persistPanelLayout();
    });
  }
  if (elements.gridSizeSelect) {
    elements.gridSizeSelect.addEventListener("change", () => {
      const nextGridSize = Number(elements.gridSizeSelect.value);
      appState.snapGridSize = [5, 10, 20].includes(nextGridSize) ? nextGridSize : 10;
      localStorage.setItem(SNAP_GRID_SIZE_STORAGE_KEY, String(appState.snapGridSize));
      applyPanelLayout();
      persistPanelLayout();
    });
  }

  getPanelElements().forEach((panel) => {
    attachResizeHandles(panel);
    const header = panel.querySelector(".panel-header");
    const collapseBtn = panel.querySelector(".panel-collapse");
    const moveUpBtn = panel.querySelector(".panel-move-up");
    const moveDownBtn = panel.querySelector(".panel-move-down");
    const lockBtn = panel.querySelector(".panel-lock-toggle");

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
    if (lockBtn) {
      lockBtn.addEventListener("click", () => {
        setPanelLocked(panel.id, !isPanelLocked(panel.id));
      });
    }

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

async function updateOfflineStatusPanel() {
  if (!elements.swInstalledStatus && !elements.offlineCachedStatus && !elements.networkStatus) return;

  if (elements.networkStatus) {
    elements.networkStatus.textContent = navigator.onLine ? "internet available" : "offline / local network only";
  }

  if (elements.swInstalledStatus) {
    const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null;
    const installed = Boolean(registration?.active || navigator.serviceWorker?.controller);
    elements.swInstalledStatus.textContent = installed ? "yes" : "no";
  }

  if (elements.offlineCachedStatus) {
    try {
      const cache = await caches.open(SW_CACHE_NAME);
      const keys = await cache.keys();
      elements.offlineCachedStatus.textContent = keys.length >= 5 ? "yes" : "no";
    } catch (error) {
      elements.offlineCachedStatus.textContent = "no";
    }
  }
}

function initializeOfflineStatusPanel() {
  updateOfflineStatusPanel();
  window.addEventListener("online", updateOfflineStatusPanel);
  window.addEventListener("offline", updateOfflineStatusPanel);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateOfflineStatusPanel();
  });
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", updateOfflineStatusPanel);
  }
}

function initialize() {
  loadConnectionSettings();
  loadSavedFarms();
  loadPanelState();
  loadPanelSizes();
  loadPanelLayout();
  loadLayoutEditorSettings();
  loadAutosaveSettings();
  loadFollowLatestSettings();
  loadSheepLogSortSettings();
  loadSheepLogFillDirectionSettings();
  loadPlannedDelayMarkerVisibility();
  loadMarkerSettings();
  loadKeyboardShortcuts();
  initializeSessionDate();
  loadControlsDockSettings();
  updateConnectionInputs();
  initializeOfflineStatusPanel();
  ensurePanelLockButtons();
  initializeMetricValueStyling();
  initializeConnectionHelp();
  bindEvents();
  initializeTopTabs();
  applyPanelState();
  applyPanelSizes();
  ensureInitialPanelLayout();
  applyPanelLayout();
  renderFarmDropdown();
  renderShortcutSettings();

  if (elements.customHours && elements.runType) {
    elements.customHours.disabled = elements.runType.value !== "custom";
  }

  if (elements.dayStartTimeInput) {
    elements.dayStartTimeInput.value = getDefaultDayStartTime();
    appState.dayClockStartSecondsFromMidnight = parseTimeToSecondsFromMidnight(elements.dayStartTimeInput.value);
  }

  if (elements.recordType) {
    elements.recordType.value = appState.recordType;
  }

  setSimulationMode(false);
  updateSimulationRunLengthControls();
  if (elements.trendBucketSize) elements.trendBucketSize.value = String(appState.trendBucketMinutes);

  if (elements.blockMinutes) {
    renderBlock(Number(elements.blockMinutes.value) || 15);
  }

  renderLogTable();
  renderReviewList();
  if (elements.runReviewText) elements.runReviewText.textContent = appState.runReviewText;
  updateReviewRunButtonState();
  updatePauseButtonUI();
  updateFinishRunBreakButtonUI();
  updateStartRunButtonUI();
  updateBreakTimingDisplay();
  updateBreakOverlayDisplay();
  updateLivePanel();
  updateStatsPanel();
  updateRunBadge();
  updateDayClockDisplay();
  updateConnectionStatus({ ok: true, parsedState: null, responseTimeMs: null, debugText: "Waiting for connection test." });
  updateTrendDetailsVisibility();
  drawTrendGraph();
  updateTrendFlags();
  updateAutosaveUI();
  updateFollowLatestUI();
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
