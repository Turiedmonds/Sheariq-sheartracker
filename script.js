const CONNECTION_STORAGE_KEY = "sheariq.connectionSettings";
const SAVED_FARMS_STORAGE_KEY = "sheariq.savedFarms";
const PANEL_ORDER_STORAGE_KEY = "sheariq.panelOrder";
const PANEL_COLLAPSED_STORAGE_KEY = "sheariq.panelCollapsed";
const PANEL_SIZES_STORAGE_KEY = "sheariq.panelSizes";
const AUTOSAVE_STORAGE_KEY = "sheariq.autosave";
const SESSION_DATE_STORAGE_KEY = "sheariq.sessionDate";
const AUTOSAVE_ENABLED_STORAGE_KEY = "sheariq.autosaveEnabled";
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
const DEFAULT_SIM_SECTION_ORDER = ["simulationMode", "runControls", "autosave", "status"];
const SHEEP_LOG_SORT_STORAGE_KEY = "sheariq.sheepLogSort";
const SHEEP_LOG_FILL_DIRECTION_STORAGE_KEY = "sheariq.sheepLogFillDirection";
const SHEEP_LOG_MARKERS_VISIBLE_STORAGE_KEY = "sheariq.sheepLogMarkersVisible";
const SHEEP_LOG_MARKER_SETTINGS_STORAGE_KEY = "sheariq.sheepLogMarkerSettings";
const KEYBOARD_SHORTCUTS_STORAGE_KEY = "sheariq.keyboardShortcuts";
const SW_CACHE_NAME = "sheariq-shear-tracker-v2";
const SHEEP_NOTE_MAX_LENGTH = 200;

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
  ASSUMED_FULL: "assumedFull"
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

function getSheepStatus(entry) {
  return entry && entry.status ? entry.status : SHEEP_STATUS.ACCEPTED;
}

function isOfficialCounted(entry) {
  return getSheepStatus(entry) !== SHEEP_STATUS.REJECTED;
}

// Physical counts are used for timing, pen movement, and refill planning.
function getPhysicalRunSheepCount() {
  return appState.sheep.length;
}

function getPhysicalDaySheepCount() {
  return appState.daySheep.length;
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

  const alreadyConfirmedAtCurrentPoint = events.some((event) => Number(event.physicalSheepTakenFromPen) === physicalSheepTakenFromPen);
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

function getPenFillForecastAssumption(options = {}) {
  return getPenFillForecastPoints(options).assumption;
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

function isActivePenFillEvent(event) {
  return Boolean(
    event
    && typeof event === "object"
    && !event.undone
    && !event.undoneAt
    && Number.isFinite(Number(event.runIndex))
    && Number.isFinite(Number(event.physicalSheepTakenFromPen))
    && Number.isFinite(Number(event.actualFillAmount))
    && Number(event.actualFillAmount) > 0
    && Number.isFinite(Number(event.resultingPenCount))
  );
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
    .filter((event) => event && typeof event === "object" && !event.undone && !event.undoneAt)
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
    const lastFillSheepNumber = Number(lastFillEvent.physicalSheepTakenFromPen);
    const sheepTakenSinceLastFill = Math.max(physicalSheepTakenFromPen - lastFillSheepNumber, 0);
    const currentPenCount = Number(lastFillEvent.resultingPenCount) - sheepTakenSinceLastFill;
    const nextRefillAllowedInSheep = Math.max(currentPenCount - Number(rule.refillTriggerLeft), 0);
    return {
      recordType,
      rule,
      source: "confirmed",
      physicalSheepTakenFromPen,
      currentPenCount,
      sheepLeftInPen: currentPenCount,
      sheepTakenSinceLastFill,
      nextRefillAllowedInSheep,
      refillAllowedNow: currentPenCount <= Number(rule.refillTriggerLeft),
      lastFillEvent,
      lastFillAmount: Number(lastFillEvent.actualFillAmount),
      lastFillSheepNumber,
      lastFillTime: lastFillEvent.wallClockTime || lastFillEvent.createdAt || null,
      assumption: "Using confirmed refills."
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
    Number(event.runIndex) === currentRunIndex
    && Number(event.physicalSheepTakenFromPen) === currentPhysicalSheep
  )) || null;
}

function refreshPenFillConfirmationDisplays(message = "") {
  updatePenFillForecastDisplay();
  updatePenStateDisplay();
  updatePenFillEarlyReminderDisplay();
  updatePenFillConfirmationControls({ statusOverride: message });
  maybeShowPenFillConfirmationPrompt();
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
  const penState = getCurrentPenStateFromEvents({
    recordType,
    rule,
    physicalSheepTakenFromPen
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
  if (findActivePenFillEventAtCurrentPoint(physicalSheepTakenFromPen)) {
    return fail("Refill already confirmed");
  }

  const draft = createPenFillEventDraft({
    recordType,
    rule,
    penState,
    physicalSheepTakenFromPen,
    actualFillAmount: options.actualFillAmount,
    recommendedFillAmount: options.recommendedFillAmount,
    source: options.source
  });

  if (draft?.error) {
    const message = getPenFillAmountErrorMessage(draft.error);
    return fail(message, draft.error);
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
  return getLatestPenFillEvent(getCurrentRunPenFillEvents());
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
    noFutureFill: "No final refill projected",
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

  const forecastPoints = Array.isArray(options.forecastPoints)
    ? options.forecastPoints
    : simulatePenFillPlan({
      rule,
      physicalSheepTakenFromPen,
      avgCycleSeconds,
      effectiveElapsedSeconds,
      runDurationSeconds,
      reductions: [],
      maxForecastPoints: options.maxForecastPoints
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
      message: "No final refill projected",
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
    maxForecastPoints: options.maxForecastPoints
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

// Official counts exclude rejected sheep for future record target progress.
function getOfficialRunSheepCount() {
  return appState.sheep.filter(isOfficialCounted).length;
}

function getOfficialDaySheepCount() {
  return appState.daySheep.filter(isOfficialCounted).length;
}

function getRejectedRunSheepCount() {
  return appState.sheep.filter((entry) => getSheepStatus(entry) === SHEEP_STATUS.REJECTED).length;
}

function getRejectedDaySheepCount() {
  return appState.daySheep.filter((entry) => getSheepStatus(entry) === SHEEP_STATUS.REJECTED).length;
}

const appState = {
  runActive: false,
  runStartTime: null,
  sheep: [],
  daySheep: [],
  penFillEvents: [],
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
  breakActive: false,
  breakStartedAtMs: null,
  breakSource: null,
  preparedForNextRunBreak: false,
  dayComplete: false,
  breakBannerDismissedForCurrentBreak: false,
  pendingBreakAfterCurrentSheep: false,
  pendingBreakStartedAtMs: null,
  runEndTimeMs: null,
  currentRunIndex: 0,
  dayClockStartRealMs: null,
  dayClockStartSecondsFromMidnight: 0,
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
  trendDetailsExpanded: false,
  autosaveEnabled: true,
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
    motorOn: "O",
    motorOff: "F"
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
  timingAlert: document.getElementById("timingAlert"),
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
  shortcutMessage: document.getElementById("shortcutMessage"),
  shortcutStartRun: document.getElementById("shortcutStartRun"),
  shortcutStopRun: document.getElementById("shortcutStopRun"),
  shortcutPauseRun: document.getElementById("shortcutPauseRun"),
  shortcutResetRun: document.getElementById("shortcutResetRun"),
  shortcutFinishRunBreak: document.getElementById("shortcutFinishRunBreak"),
  shortcutMotorOn: document.getElementById("shortcutMotorOn"),
  shortcutMotorOff: document.getElementById("shortcutMotorOff"),
  resetShortcutsBtn: document.getElementById("resetShortcutsBtn"),
  shortcutSettingsBtn: document.getElementById("shortcutSettingsBtn"),
  shortcutSettingsModalOverlay: document.getElementById("shortcutSettingsModalOverlay"),
  shortcutSettingsModalCloseBtn: document.getElementById("shortcutSettingsModalCloseBtn"),
  farmDropdown: document.getElementById("farmDropdown"),
  farmDropdownToggle: document.getElementById("farmDropdownToggle"),
  farmDropdownMenu: document.getElementById("farmDropdownMenu"),
  dashboardPanels: document.getElementById("dashboardPanels"),
  loadLastSaveBtn: document.getElementById("loadLastSaveBtn"),
  currentSheepNumber: document.getElementById("currentSheepNumber"),
  trendBucketSize: document.getElementById("trendBucketSize"),
  trendGraphCanvas: document.getElementById("trendGraphCanvas"),
  trendGraphMessage: document.getElementById("trendGraphMessage"),
  trendLatestSummary: document.getElementById("trendLatestSummary"),
  trendGraphTooltip: document.getElementById("trendGraphTooltip"),
  trendDetailsToggle: document.getElementById("trendDetailsToggle"),
  reviewList: document.getElementById("reviewList"),
  runReviewText: document.getElementById("runReviewText"),
  trendFlags: document.getElementById("trendFlags"),
  autosaveToggle: document.getElementById("autosaveToggle"),
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
  finishRunBreak: "",
  motorOn: "O",
  motorOff: "F"
});

const SHORTCUT_ACTIONS = [
  { key: "startRun", label: "Start Run", elementKey: "shortcutStartRun", buttonKey: "startRunBtn", titleSuffix: "" },
  { key: "stopRun", label: "Stop Run", elementKey: "shortcutStopRun", buttonKey: "stopRunBtn", titleSuffix: "" },
  { key: "pauseRun", label: "Pause / Resume", elementKey: "shortcutPauseRun", buttonKey: "pauseRunBtn", titleSuffix: "" },
  { key: "resetRun", label: "Reset Run", elementKey: "shortcutResetRun", buttonKey: "resetRunBtn", titleSuffix: "" },
  { key: "finishRunBreak", label: "Finish Run / Break", elementKey: "shortcutFinishRunBreak", buttonKey: "finishRunBreakBtn", titleSuffix: "" },
  { key: "motorOn", label: "Motor ON", elementKey: "shortcutMotorOn", buttonKey: "simMotorOnBtn", titleSuffix: " — Simulation Mode only" },
  { key: "motorOff", label: "Motor OFF", elementKey: "shortcutMotorOff", buttonKey: "simMotorOffBtn", titleSuffix: " — Simulation Mode only" }
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
  return trimmed.length === 1 ? trimmed : "";
}

function formatShortcutLabel(value) {
  return SHORTCUT_KEY_DISPLAY[value] || value;
}

function getFallbackShortcuts() {
  return { ...DEFAULT_KEYBOARD_SHORTCUTS };
}

function normalizeShortcuts(payload) {
  const source = payload && typeof payload === "object" ? payload : {};
  const next = {};
  const used = new Set();
  for (const action of SHORTCUT_ACTIONS) {
    const fallback = DEFAULT_KEYBOARD_SHORTCUTS[action.key] || "";
    const candidate = Object.prototype.hasOwnProperty.call(source, action.key) ? source[action.key] : fallback;
    const raw = sanitizeShortcutKey(candidate);
    if (!raw) {
      next[action.key] = "";
      continue;
    }
    if (used.has(raw)) return getFallbackShortcuts();
    next[action.key] = raw;
    used.add(raw);
  }
  return next;
}

function saveKeyboardShortcuts() {
  localStorage.setItem(KEYBOARD_SHORTCUTS_STORAGE_KEY, JSON.stringify(appState.keyboardShortcuts));
}

function loadKeyboardShortcuts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEYBOARD_SHORTCUTS_STORAGE_KEY) || "null");
    appState.keyboardShortcuts = normalizeShortcuts(parsed);
  } catch (error) {
    appState.keyboardShortcuts = getFallbackShortcuts();
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

function handleShortcutKeydown(event) {
  if (event.repeat || isTypingTarget(event.target)) return;
  const key = sanitizeShortcutKey(event.key);
  if (!key) return;
  for (const action of SHORTCUT_ACTIONS) {
    if (appState.keyboardShortcuts[action.key] !== key) continue;
    event.preventDefault();
    event.stopPropagation();
    if ((action.key === "motorOn" || action.key === "motorOff") && !appState.simulationMode) return;
    const button = elements[action.buttonKey];
    if (!button || button.disabled) return;
    button.click();
    return;
  }
}

function openShortcutSettingsModal() {
  if (!elements.shortcutSettingsModalOverlay) return;
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

function formatPredictedCatchTime(runSeconds) {
  if (!Number.isFinite(runSeconds) || runSeconds < 0) return "—";
  if (appState.predictedCatchClockMode === "run") {
    return `${formatCountdown(runSeconds)} into run`;
  }
  const dayClockSeconds = appState.dayClockStartSecondsFromMidnight + runSeconds;
  return formatSecondsFromMidnightClock(dayClockSeconds);
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
    setText(elements.dayClock, "00:00:00");
    return;
  }
  setText(elements.dayClock, formatSecondsFromMidnightClock(dayClockSeconds));
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
  appState.breakActive = false;
  appState.breakStartedAtMs = null;
  appState.breakSource = null;
  appState.preparedForNextRunBreak = false;
  appState.dayComplete = false;
  appState.breakBannerDismissedForCurrentBreak = false;
  appState.pendingBreakAfterCurrentSheep = false;
  appState.pendingBreakStartedAtMs = null;
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
  appState.targetPacePredictionSnapshot = null;
  appState.pendingPenFillPromptKey = null;
  appState.dismissedPenFillPromptKey = null;
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
    return "Predicted time to reach run target:";
  }
  return `Predicted time to reach run target (${requiredRunTotalSheep}):`;
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

function handleFinishRunBreakClick() {
  if (appState.breakActive || appState.preparedForNextRunBreak) return;
  if (!appState.runActive && appState.sheep.length === 0) return;

  const now = Date.now();
  const breakStartedAtMs = Number.isFinite(appState.runEndTimeMs) && now >= appState.runEndTimeMs
    ? appState.runEndTimeMs
    : now;

  if (appState.currentCycle.motorOn) {
    appState.pendingBreakAfterCurrentSheep = true;
    appState.pendingBreakStartedAtMs = breakStartedAtMs;
    console.log("Finish break requested; waiting for current sheep to finish");
    updateFinishRunBreakButtonUI();
    return;
  }

  finishRunAndEnterBreak("manual-finish-break", breakStartedAtMs);
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
  appState.breakActive = false;
  appState.breakStartedAtMs = null;
  appState.breakSource = null;
  appState.preparedForNextRunBreak = false;
  appState.dayComplete = false;
  appState.breakBannerDismissedForCurrentBreak = false;
  appState.pendingBreakAfterCurrentSheep = false;
  appState.pendingBreakStartedAtMs = null;
  appState.effectiveElapsedBeforePauseMs = 0;
  appState.effectiveResumeRealMs = appState.runStartTime;
  appState.trendBuckets = {};
  appState.reviewBlocks = [];
  appState.nextReviewBlockIndex = 1;
  appState.runReviewText = "Run review will be generated when you stop a run.";
  appState.trendFlags = ["Set a target to enable trend flags."];
  appState.targetPacePredictionSnapshot = null;
  appState.pendingPenFillPromptKey = null;
  appState.dismissedPenFillPromptKey = null;

  elements.startRunBtn.disabled = true;
  elements.stopRunBtn.disabled = false;
  updateSimulationRunLengthControls();
  updateFinishRunBreakButtonUI();

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
  appState.currentMotorDisplay = "OFF";
  appState.pauseStartedAtMs = null;
  appState.breakActive = false;
  appState.breakStartedAtMs = null;
  appState.breakSource = null;
  appState.preparedForNextRunBreak = false;
  appState.breakBannerDismissedForCurrentBreak = false;
  appState.pendingBreakAfterCurrentSheep = false;
  appState.pendingBreakStartedAtMs = null;
  appState.runEndTimeMs = null;

  elements.startRunBtn.disabled = false;
  elements.stopRunBtn.disabled = true;
  updateSimulationRunLengthControls();
  updateFinishRunBreakButtonUI();

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

function finishRunAndEnterBreak(source = "record-day-break", breakStartedAtMs = Date.now()) {
  if (!appState.runActive && appState.sheep.length === 0) {
    return;
  }

  if (appState.effectiveResumeRealMs !== null) {
    appState.effectiveElapsedBeforePauseMs += Math.max(Date.now() - appState.effectiveResumeRealMs, 0);
    appState.effectiveResumeRealMs = null;
  }

  generateRunReview();

  appState.runActive = false;
  appState.paused = false;
  appState.pauseStartedAtMs = null;

  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = null;
  appState.currentMotorDisplay = "OFF";

  appState.runEndTimeMs = null;
  appState.effectiveElapsedBeforePauseMs = 0;
  appState.effectiveResumeRealMs = null;

  appState.preparedForNextRunBreak = true;
  appState.breakBannerDismissedForCurrentBreak = false;

  enterOfficialBreak(source, breakStartedAtMs);

  appState.pendingBreakAfterCurrentSheep = false;
  appState.pendingBreakStartedAtMs = null;

  if (elements.startRunBtn) elements.startRunBtn.disabled = false;
  if (elements.stopRunBtn) elements.stopRunBtn.disabled = true;
  if (elements.runStatus) elements.runStatus.textContent = "Official Break";

  updatePauseButtonUI();
  updateSimulationRunLengthControls();
  updateFinishRunBreakButtonUI();
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

  console.log("Break complete; starting next run automatically");
  startRun();
  return true;
}

function isCountingPaused() {
  return appState.paused || isCountingPausedForBreak();
}


function maybeHandleRunEndExpired(now = Date.now()) {
  if (!appState.runActive) return false;
  if (!appState.runEndTimeMs) return false;
  if (appState.breakActive || appState.preparedForNextRunBreak) return false;
  if (appState.pendingBreakAfterCurrentSheep) return false;
  if (now < appState.runEndTimeMs) return false;

  if (appState.currentCycle.motorOn) {
    appState.pendingBreakAfterCurrentSheep = true;
    appState.pendingBreakStartedAtMs = appState.runEndTimeMs;
    console.log("Run expired; waiting for current sheep to finish before official break");
    return true;
  }

  finishRunAndEnterBreak("record-day-break", appState.runEndTimeMs);
  return true;
}

function handleMotorOn() {
  if (!appState.runActive || isCountingPaused() || appState.currentCycle.motorOn) return;

  const now = Date.now();
  if (appState.runEndTimeMs && now >= appState.runEndTimeMs) {
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
  const dayNumber = appState.daySheep.length + 1;
  const sheepId = `sheep-${Date.now()}-${dayNumber}`;
  const runEntry = {
    id: sheepId,
    status: SHEEP_STATUS.ACCEPTED,
    number: appState.sheep.length + 1,
    dayNumber,
    startTime: appState.currentCycle.shearStart,
    endTime: now,
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
    const scheduledBreakStartedAtMs = appState.pendingBreakStartedAtMs || appState.runEndTimeMs || Date.now();
    refreshAfterSheepEntry();
    finishRunAndEnterBreak("record-day-break", scheduledBreakStartedAtMs);
    return;
  }

  refreshAfterSheepEntry();
}


function enterOfficialBreak(source = "official", breakStartedAtMs = Date.now()) {
  appState.breakActive = true;
  appState.breakStartedAtMs = Number.isFinite(breakStartedAtMs) ? breakStartedAtMs : Date.now();
  appState.breakSource = source;

  // Neutralise any in-progress sheep cycle so a motor test during break
  // cannot later create an inflated or false sheep entry.
  appState.currentCycle.motorOn = false;
  appState.currentCycle.shearStart = null;
  appState.currentCycle.catchStart = null;

  console.log("Official break started");
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

function calculateTargetMetrics() {
  const elapsedSeconds = Math.max(getEffectiveElapsedSeconds(), 0);
  const runLengthSeconds = getCurrentRunDurationSeconds();
  const requiredDaySheep = getRequiredDaySheep();
  const scheduleSeconds = getScheduleSeconds();
  const requiredRunSheep = getRequiredRunSheep(requiredDaySheep, scheduleSeconds, appState.currentRunIndex);

  const requiredRate = runLengthSeconds > 0 ? (requiredRunSheep / runLengthSeconds) * 3600 : 0;
  const requiredCycle = requiredRunSheep > 0 && runLengthSeconds > 0 ? runLengthSeconds / requiredRunSheep : 0;
  const projectedTotal = appState.currentStats.sheepPerHour > 0 && runLengthSeconds > 0
    ? Math.round((appState.currentStats.sheepPerHour * runLengthSeconds) / 3600)
    : appState.sheep.length;

  const avgCycleSeconds = appState.currentStats.avgCycle;
  const sheepDoneThisRun = appState.sheep.length;
  const elapsedRunSeconds = elapsedSeconds;
  const runRemainingSeconds = Math.max(runLengthSeconds - elapsedRunSeconds, 0);
  const remainingToTarget = requiredRunSheep - sheepDoneThisRun;
  let targetCatchRunSeconds = elapsedRunSeconds;
  let timeSpareText = "—";
  let timeSpareIsAhead = null;
  let maxPossibleRunTotal = sheepDoneThisRun;

  if (avgCycleSeconds > 0) {
    const maxExtraSheep = Math.floor(runRemainingSeconds / avgCycleSeconds);
    maxPossibleRunTotal = sheepDoneThisRun + Math.max(maxExtraSheep, 0);
    const targetCatchOffsetSeconds = remainingToTarget <= 0 ? 0 : remainingToTarget * avgCycleSeconds;
    targetCatchRunSeconds = elapsedRunSeconds + targetCatchOffsetSeconds;
    const timeDifference = runLengthSeconds - targetCatchRunSeconds;
    timeSpareText = timeDifference >= 0
      ? `Run target reached ${formatCountdown(timeDifference)} before end of run`
      : `Run target will be missed by ${formatCountdown(Math.abs(timeDifference))} at end of run`;
    timeSpareIsAhead = timeDifference >= 0;
  }

  // Dynamic "last possible catch" = predicted hand-on-door start time for the final sheep that can still begin before the run ends.
  let maxCatchRunSeconds = 0;
  if (avgCycleSeconds > 0 && runLengthSeconds > 0) {
    const maxExtraSheep = Math.floor(runRemainingSeconds / avgCycleSeconds);
    const lastCatchStartRunSeconds = maxExtraSheep <= 0
      ? elapsedRunSeconds
      : elapsedRunSeconds + (maxExtraSheep - 1) * avgCycleSeconds;
    const maxAllowed = Math.max(runLengthSeconds - 2, 0);
    maxCatchRunSeconds = Math.min(lastCatchStartRunSeconds, maxAllowed);
  }
  maxCatchRunSeconds = Math.min(Math.max(maxCatchRunSeconds, 0), Math.max(runLengthSeconds, 0));

  const remainingSeconds = Math.max(runLengthSeconds - elapsedSeconds, 0);
  const remainingSheep = Math.max(requiredRunSheep - appState.sheep.length, 0);
  const requiredCycleRemaining = remainingSheep > 0 ? remainingSeconds / remainingSheep : 0;

  return {
    requiredRate,
    requiredCycle,
    projectedTotal,
    requiredCycleRemaining,
    remainingSheep,
    requiredDaySheep,
    requiredRunSheep,
    targetCatchRunSeconds,
    timeSpareText,
    timeSpareIsAhead,
    maxCatchRunSeconds,
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
        return `On pace — ${paceDiff}s spare per sheep. Projected run total: ${projectedTotal} sheep, ${sheepDiff} ahead.`;
      }
      if (sheepDiff < 0) {
        return `On pace — ${paceDiff}s spare per sheep. Projected run total: ${projectedTotal} sheep, ${Math.abs(sheepDiff)} behind.`;
      }
      return `On pace — ${paceDiff}s spare per sheep. Projected run total: ${projectedTotal} sheep, on target.`;
    }
    return `On pace — ${paceDiff}s spare per sheep.`;
  }

  if (avgCycle > requiredCycle) {
    const paceDiff = (avgCycle - requiredCycle).toFixed(2);
    if (hasOutcomeContext) {
      const sheepDiff = projectedTotal - requiredRunSheep;
      if (sheepDiff > 0) {
        return `Behind — ${paceDiff}s slow per sheep. Projected run total: ${projectedTotal} sheep, ${sheepDiff} ahead.`;
      }
      if (sheepDiff < 0) {
        return `Behind — ${paceDiff}s slow per sheep. Projected run total: ${projectedTotal} sheep, ${Math.abs(sheepDiff)} behind.`;
      }
      return `Behind — ${paceDiff}s slow per sheep. Projected run total: ${projectedTotal} sheep, on target.`;
    }
    return `Behind — ${paceDiff}s slow per sheep.`;
  }

  if (hasOutcomeContext) {
    return `On target — projected finish: ${projectedTotal} sheep.`;
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

function formatClockHHMM(timestamp) {
  if (!Number.isFinite(timestamp)) return "--:--";
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
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
    timeStart: formatClockHHMM(first.startTime),
    timeEnd: formatClockHHMM(last.endTime),
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

function updateTrendFlags() {
  if (!elements.trendFlags) return;
  const { requiredCycle } = calculateTargetMetrics();
  if (requiredCycle <= 0) {
    appState.trendFlags = ["Set a target to enable trend flags."];
    elements.trendFlags.textContent = appState.trendFlags[0];
    return;
  }

  const rows = appState.sheep;
  const cycles = rows.map((s) => s.fullCycle);
  const catches = rows.map((s) => s.catchDuration);
  const windowSize = 5;
  const cards = [];

  const renderCard = ({ title, windowRows, avgCyclePrev, avgCycleCurr, avgCatchPrev, avgCatchCurr }) => {
    const meta = getTrendWindowMeta(windowRows, windowSize);
    const cycleDelta = avgCycleCurr - avgCyclePrev;
    const catchDelta = avgCatchCurr - avgCatchPrev;
    return `
      <div class="trend-flag">
        <div class="trend-flag-title">${title}</div>
        <div class="trend-flag-meta">Sheep ${meta.sheepStart}–${meta.sheepEnd} • ${meta.timeStart}–${meta.timeEnd} • Window: last ${meta.windowSize}</div>
        <div class="trend-flag-lines">
          <div><span class="k">Total Time Per Sheep</span>: <span class="v">${formatSeconds(avgCyclePrev)} → ${formatSeconds(avgCycleCurr)}</span> <span class="d ${getDeltaTone(cycleDelta)}">${formatTrendDelta(cycleDelta)}</span></div>
          <div><span class="k">Catch</span>: <span class="v">${formatSeconds(avgCatchPrev)} → ${formatSeconds(avgCatchCurr)}</span> <span class="d ${getDeltaTone(catchDelta)}">${formatTrendDelta(catchDelta)}</span></div>
        </div>
      </div>
    `;
  };

  if (cycles.length >= windowSize) {
    const lastRows = rows.slice(-windowSize);
    const last5Cycle = cycles.slice(-windowSize);
    const avgLast5Cycle = last5Cycle.reduce((a, b) => a + b, 0) / last5Cycle.length;
    const avgLast5Catch = catches.slice(-windowSize).reduce((a, b) => a + b, 0) / windowSize;
    if (last5Cycle.every((v) => v > requiredCycle)) {
      const lastMeta = getTrendWindowMeta(lastRows, windowSize);
      cards.push(`
        <div class="trend-flag">
          <div class="trend-flag-title">Sustained behind</div>
          <div class="trend-flag-meta">Sheep ${lastMeta.sheepStart}–${lastMeta.sheepEnd} • ${lastMeta.timeStart}–${lastMeta.timeEnd} • Window: last ${windowSize}</div>
          <div class="trend-flag-lines">
            <div><span class="k">Total Time Per Sheep</span>: <span class="v">Target ${formatSeconds(requiredCycle)} → ${formatSeconds(avgLast5Cycle)}</span> <span class="d bad">${formatTrendDelta(avgLast5Cycle - requiredCycle)}</span></div>
            <div><span class="k">Catch</span>: <span class="v">Recent avg ${formatSeconds(avgLast5Catch)}</span> <span class="d neutral">(all 5 above target cycle)</span></div>
          </div>
        </div>
      `);
    }
  }

  if (cycles.length >= 10) {
    const prevRows = rows.slice(-10, -5);
    const recentRows = rows.slice(-5);
    const prevCycle = cycles.slice(-10, -5);
    const recentCycle = cycles.slice(-5);
    const prevCatch = catches.slice(-10, -5);
    const recentCatch = catches.slice(-5);
    const prevAvgCycle = prevCycle.reduce((a, b) => a + b, 0) / prevCycle.length;
    const recentAvgCycle = recentCycle.reduce((a, b) => a + b, 0) / recentCycle.length;
    const prevAvgCatch = prevCatch.reduce((a, b) => a + b, 0) / prevCatch.length;
    const recentAvgCatch = recentCatch.reduce((a, b) => a + b, 0) / recentCatch.length;

    if (recentAvgCycle > prevAvgCycle + 0.2) {
      cards.push(renderCard({
        title: "Pace slipping",
        windowRows: recentRows,
        avgCyclePrev: prevAvgCycle,
        avgCycleCurr: recentAvgCycle,
        avgCatchPrev: prevAvgCatch,
        avgCatchCurr: recentAvgCatch
      }));
    }
    if (prevAvgCycle > recentAvgCycle + 0.2) {
      cards.push(renderCard({
        title: "Recovery",
        windowRows: recentRows,
        avgCyclePrev: prevAvgCycle,
        avgCycleCurr: recentAvgCycle,
        avgCatchPrev: prevAvgCatch,
        avgCatchCurr: recentAvgCatch
      }));
    }
  }

  if (!cards.length && cycles.length >= windowSize) {
    const recentRows = rows.slice(-windowSize);
    const recentCycle = cycles.slice(-windowSize);
    const recentCatch = catches.slice(-windowSize);
    const avgCycle = recentCycle.reduce((a, b) => a + b, 0) / recentCycle.length;
    const avgCatch = recentCatch.reduce((a, b) => a + b, 0) / recentCatch.length;
    const delta = avgCycle - requiredCycle;
    const meta = getTrendWindowMeta(recentRows, windowSize);
    cards.push(`
      <div class="trend-flag">
        <div class="trend-flag-title">No trend warnings</div>
        <div class="trend-flag-meta">Sheep ${meta.sheepStart}–${meta.sheepEnd} • ${meta.timeStart}–${meta.timeEnd} • Window: last ${windowSize}</div>
        <div class="trend-flag-lines">
          <div><span class="k">Total Time Per Sheep</span>: <span class="v">${formatSeconds(avgCycle)} vs target ${formatSeconds(requiredCycle)}</span> <span class="d ${getDeltaTone(delta)}">${formatTrendDelta(delta)}</span></div>
          <div><span class="k">Catch</span>: <span class="v">Recent avg ${formatSeconds(avgCatch)}</span></div>
        </div>
      </div>
    `);
  }

  if (!cards.length) {
    appState.trendFlags = [`No trend warnings yet. Need at least 5 sheep to compare with target ${formatSeconds(requiredCycle)}.`];
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

function renderLogTable() {
  if (!elements.sheepLogBody) return;
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
      <td>${entry.number}</td>
      <td class="sheep-log-time-col">${formatClock(entry.startTime)}</td>
      <td class="sheep-log-time-col">${formatClock(entry.endTime)}</td>
      <td class="sheep-log-time-col ${catchAnomalyClass}">${formatSeconds(entry.catchDuration)}</td>
      <td class="sheep-log-time-col ${shearAnomalyClass}">${formatSeconds(entry.shearDuration)}</td>
      <td class="sheep-log-time-col ${fullCycleClass} ${fullCycleAnomalyClass}">${formatSeconds(entry.fullCycle)}</td>
    `;
    row.appendChild(createSheepLogMarkerNoteCell(entry, plannedDelayMarkers));
    elements.sheepLogBody.appendChild(row);
  });

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

  const manualMarker = sanitizeManualMarker(entry.manualMarker);
  const noteText = normalizeSheepNote(entry.note);
  const allAutoMarkers = plannedDelayMarkers.get(entry.number) || [];
  const autoMarkers = !manualMarker && appState.showPlannedDelayMarkers ? allAutoMarkers : [];

  if (sheepLogMarkerNoteEditorSheepId && entry.id === sheepLogMarkerNoteEditorSheepId) {
    const suggestedMarker = !manualMarker && allAutoMarkers.length ? allAutoMarkers[0] : null;
    markerNoteCell.classList.add("is-editing");
    markerNoteCell.appendChild(createSheepLogMarkerNoteEditor(entry, manualMarker, noteText, suggestedMarker));
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

  if (manualMarker || noteText) {
    markerNoteCell.classList.add("has-marker-note");
    const summary = document.createElement("div");
    summary.className = "sheep-log-marker-note-summary";

    if (manualMarker) {
      const markerSummary = document.createElement("div");
      markerSummary.className = "sheep-log-manual-marker-summary";
      markerSummary.textContent = `Confirmed: ${getManualMarkerDisplayLabel(manualMarker)}`;
      markerSummary.title = getManualMarkerDisplayLabel(manualMarker);
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

function createSheepLogMarkerNoteEditor(entry, manualMarker, noteText, suggestedMarker = null) {
  const editor = document.createElement("div");
  editor.className = "sheep-log-marker-note-editor";
  editor.dataset.sheepId = entry.id || "";

  const select = document.createElement("select");
  select.className = "sheep-log-marker-note-select";
  select.dataset.role = "marker-select";
  select.setAttribute("aria-label", `Manual marker for sheep #${entry.number}`);

  const blankOption = document.createElement("option");
  blankOption.value = "";
  blankOption.textContent = "No confirmed marker";
  select.appendChild(blankOption);

  Object.entries(MANUAL_MARKER_TYPES).forEach(([type, label]) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = label;
    select.appendChild(option);
  });

  const customOption = document.createElement("option");
  customOption.value = MANUAL_MARKER_CUSTOM_TYPE;
  customOption.textContent = "Custom...";
  select.appendChild(customOption);
  const suggestedType = suggestedMarker?.type && isValidManualMarkerType(suggestedMarker.type) ? suggestedMarker.type : "";
  select.value = manualMarker?.type || suggestedType || "";
  editor.appendChild(select);

  const customInput = document.createElement("input");
  customInput.type = "text";
  customInput.className = "sheep-log-marker-custom-input";
  customInput.dataset.role = "custom-label";
  customInput.maxLength = 60;
  customInput.placeholder = "Custom marker label";
  customInput.value = manualMarker?.type === MANUAL_MARKER_CUSTOM_TYPE ? manualMarker.customLabel : "";
  customInput.hidden = select.value !== MANUAL_MARKER_CUSTOM_TYPE;
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

function getResolvedMarkerForEntry(entry, automaticMarkersBySheep) {
  const manualMarker = sanitizeManualMarker(entry?.manualMarker);
  if (manualMarker) return { type: manualMarker.type, label: manualMarker.label, source: "manual" };
  const automaticMarkers = Number.isFinite(entry?.number) ? automaticMarkersBySheep?.get(entry.number) : null;
  const automaticMarker = Array.isArray(automaticMarkers) ? automaticMarkers[0] : null;
  if (automaticMarker?.type && isValidManualMarkerType(automaticMarker.type)) {
    return { type: automaticMarker.type, label: MANUAL_MARKER_TYPES[automaticMarker.type], source: "suggested" };
  }
  return null;
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

  const automaticMarkersBySheep = buildPlannedDelayMarkerMap(entries, markerSettings);
  entries.forEach((entry) => {
    const marker = getResolvedMarkerForEntry(entry, automaticMarkersBySheep);
    if (!marker) return;
    const bucket = stats.buckets[marker.type];
    if (bucket) addMarkerStatCatchDuration(bucket, entry?.catchDuration);
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
}

function resetMarkerSettings() {
  appState.markerSettings = getDefaultMarkerSettings();
  syncMarkerSettingsInputs();
  saveMarkerSettings();
  renderLogTable();
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

function updateSheepEntryMarkerNoteById(sheepId, manualMarker, noteText) {
  if (!sheepId) return false;
  let updated = false;

  [appState.sheep, appState.daySheep].forEach((entries) => {
    if (!Array.isArray(entries)) return;
    entries.forEach((entry) => {
      if (entry?.id !== sheepId) return;
      if (manualMarker) {
        entry.manualMarker = { ...manualMarker };
      } else {
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
    const manualMarker = sanitizeManualMarker(entry.manualMarker);
    if (manualMarker) {
      entry.manualMarker = manualMarker;
    } else {
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

function syncSheepLogCustomMarkerInput(select) {
  const editor = select.closest(".sheep-log-marker-note-editor");
  if (!editor) return;
  const customInput = editor.querySelector('[data-role="custom-label"]');
  if (!(customInput instanceof HTMLInputElement)) return;
  const isCustom = select.value === MANUAL_MARKER_CUSTOM_TYPE;
  customInput.hidden = !isCustom;
  if (isCustom) customInput.focus();
}

function saveSheepLogMarkerNoteFromEditor(editor) {
  const sheepId = editor.dataset.sheepId || "";
  const markerSelect = editor.querySelector('[data-role="marker-select"]');
  const customInput = editor.querySelector('[data-role="custom-label"]');
  const noteInput = editor.querySelector('[data-role="note"]');
  const validation = editor.querySelector('[data-role="validation"]');
  if (!(markerSelect instanceof HTMLSelectElement) || !(noteInput instanceof HTMLTextAreaElement)) return;

  const markerType = markerSelect.value;
  const noteText = normalizeSheepNote(noteInput.value);
  let manualMarker = null;

  if (markerType === MANUAL_MARKER_CUSTOM_TYPE) {
    const customLabel = customInput instanceof HTMLInputElement ? normalizeManualMarkerCustomLabel(customInput.value) : "";
    manualMarker = buildManualMarker(MANUAL_MARKER_CUSTOM_TYPE, customLabel);
    if (!manualMarker) {
      if (validation) validation.textContent = "Enter a custom marker label before saving.";
      if (customInput instanceof HTMLInputElement) customInput.focus();
      return;
    }
  } else if (markerType) {
    manualMarker = buildManualMarker(markerType);
    if (!manualMarker) {
      if (validation) validation.textContent = "Choose a valid marker.";
      markerSelect.focus();
      return;
    }
  }

  const updated = updateSheepEntryMarkerNoteById(sheepId, manualMarker, noteText);
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

function updateQuarterDisplay() {
  const quarterSeconds = 900;
  const hasRunStarted = appState.runStartTime !== null || appState.runActive || appState.effectiveElapsedBeforePauseMs > 0;

  if (!hasRunStarted) {
    setText(elements.currentQuarter, "—");
    setText(elements.quarterClock, "00:00");
    return;
  }

  const elapsedSeconds = Math.max(getEffectiveElapsedSeconds(), 0);
  const runDurationSeconds = Math.max(getCurrentRunDurationSeconds(), 0);
  const totalQuarters = Math.max(Math.ceil(runDurationSeconds / quarterSeconds), 1);
  const currentQuarterNumber = Math.min(Math.floor(elapsedSeconds / quarterSeconds) + 1, totalQuarters);
  const quarterElapsedSeconds = elapsedSeconds % quarterSeconds;

  setText(elements.currentQuarter, `Quarter ${currentQuarterNumber} of ${totalQuarters}`);
  setText(elements.quarterClock, formatElapsedMMSS(quarterElapsedSeconds));
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

  const elapsedSeconds = Math.max(getEffectiveElapsedSeconds(), 0);
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
  const ALERT_GRACE_SECONDS = 10;
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

  const cycleSnapshot = getPenCycleSnapshot(appState.recordType);
  if (!cycleSnapshot) {
    setPenRefillAlertDisplay("none", "—");
    return;
  }

  if (cycleSnapshot.refillAllowed) {
    setPenRefillAlertDisplay("now", "Pen refill allowed");
    return;
  }

  const sheepUntilRefill = cycleSnapshot.sheepUntilRefill;
  if (sheepUntilRefill === 2 || sheepUntilRefill === 1) {
    setPenRefillAlertDisplay("soon", `${sheepUntilRefill} sheep until pen refill`);
    return;
  }

  setPenRefillAlertDisplay("none", "—");
}

function formatPenFillForecastPoint(point) {
  if (point?.isCurrentFill) return `${point.label} — now`;
  const secondsFromNow = Number(point?.secondsFromNow);
  const clockText = formatProjectedLocalClock(secondsFromNow);
  return `${point.label} — in ${formatCountdown(secondsFromNow)}${clockText ? ` — approx ${clockText}` : ""}`;
}

function formatProjectedLocalClock(secondsFromNow) {
  if (!Number.isFinite(secondsFromNow) || secondsFromNow < 0) return "";
  return new Date(Date.now() + secondsFromNow * 1000).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatFinalPenFillForecastPoint(point) {
  const secondsBeforeRunEnd = Number(point?.secondsBeforeRunEnd);
  if (!Number.isFinite(secondsBeforeRunEnd)) return "No final refill projected";
  if (secondsBeforeRunEnd <= 0) return `${point.label} — at end`;
  return `${point.label} — ${formatCountdown(secondsBeforeRunEnd)} before end`;
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
      message: "No final refill projected",
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
  const fillAmount = Number(lastFillEvent.actualFillAmount);
  if (!Number.isFinite(sheepNumber) || !Number.isFinite(fillAmount)) return "—";
  return `Sheep ${sheepNumber} — added ${fillAmount}`;
}

function formatPenStateModel(penState) {
  if (penState?.source === "confirmed") return "Using confirmed refills";
  if (penState?.source === "assumedFull") return "Assuming full refills";
  return "—";
}

function updatePenFillIntervalDisplay(refillEvents = getCurrentRunPenFillEvents()) {
  const averageInterval = calculateAverageFillInterval(refillEvents);
  const recentIntervals = getRecentFillIntervals(refillEvents);

  setText(
    elements.penFillAverageInterval,
    averageInterval ? formatCountdown(averageInterval.averageSeconds) : "—"
  );
  setText(
    elements.penFillRecentIntervals,
    recentIntervals.length
      ? recentIntervals.map((interval) => formatCountdown(interval.seconds)).join(", ")
      : "—"
  );
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

  setText(elements.penStateCurrentCount, formatPenStateCurrentCount(penState));
  setRefillStatus(
    formatPenStateRefillStatus(penState),
    penState.refillAllowedNow ? "pen-state-refill-now" : "pen-state-refill-neutral"
  );
  setText(elements.penStateLastConfirmedFill, formatPenStateLastConfirmedFill(penState));
  updatePenFillIntervalDisplay();
  setModel(
    formatPenStateModel(penState),
    penState.source === "confirmed"
      ? "pen-state-model-confirmed"
      : (penState.source === "assumedFull" ? "pen-state-model-assumed" : "pen-state-model-neutral")
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

  const setForecastDisplay = (nextText, finalText, assumptionText, analysis = { status: "waiting", message: "—" }, planner = buildPlanner()) => {
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
    setForecastDisplay("—", "—", "Waiting for pace data");
    return;
  }

  const elapsedSeconds = Math.max(getEffectiveElapsedSeconds(), 0);
  const runDurationSeconds = Math.max(getCurrentRunDurationSeconds(), 0);
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
  const assumptionText = routedForecast.assumption;
  const finalRefillAnalysis = analyzeFinalFillWindow(displayForecastPoints, { remainingRunSeconds });
  const planner = buildPlanner(displayForecastPoints, remainingRunSeconds);

  if (displayForecastPoints.length === 0) {
    setForecastDisplay("No more projected refills", "—", assumptionText, finalRefillAnalysis, planner);
    return;
  }

  const nextRefill = displayForecastPoints[0];
  const finalRefill = displayForecastPoints[displayForecastPoints.length - 1];
  setForecastDisplay(
    formatPenFillForecastPoint(nextRefill),
    formatFinalPenFillForecastPoint(finalRefill),
    assumptionText,
    finalRefillAnalysis,
    planner
  );
}

function getCurrentSheepRuntimeSeconds() {
  if (!appState.runActive || !appState.currentCycle.catchStart) return null;

  const now = Date.now();
  const catchStart = appState.currentCycle.catchStart;
  if (appState.currentCycle.motorOn && appState.currentCycle.shearStart) {
    const catchDuration = Math.max((appState.currentCycle.shearStart - catchStart) / 1000, 0);
    const shearDuration = Math.max((now - appState.currentCycle.shearStart) / 1000, 0);
    return catchDuration + shearDuration;
  }

  return Math.max((now - catchStart) / 1000, 0);
}

function updateCurrentSheepTimeLeft(requiredCycle) {
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

  const currentSheepRuntime = getCurrentSheepRuntimeSeconds();
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

function updateTotalSheepTimeDisplay(requiredCycle) {
  if (!elements.currentTotalSheepTime) return;

  elements.currentTotalSheepTime.classList.remove("on-pace-good", "on-pace-bad", "on-pace-neutral");

  if (isPreparedForNextRunBreak()) {
    setText(elements.currentTotalSheepTime, formatSeconds(0));
    elements.currentTotalSheepTime.classList.add("on-pace-neutral");
    return;
  }

  const liveSheepRuntime = appState.currentCycle.motorOn && appState.currentCycle.shearStart
    ? getCurrentSheepRuntimeSeconds()
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
  maybeHandleRunEndExpired();
  const autoStartedNextRun = maybeAutoStartNextRunAfterBreak();
  if (autoStartedNextRun) return;
  const preparedForNextRunBreak = isPreparedForNextRunBreak();
  const shearCurrent = !preparedForNextRunBreak && appState.currentCycle.motorOn && appState.currentCycle.shearStart
    ? (Date.now() - appState.currentCycle.shearStart) / 1000
    : 0;

  const catchCurrent = !preparedForNextRunBreak && appState.runActive && !appState.currentCycle.motorOn && appState.currentCycle.catchStart
    ? (Date.now() - appState.currentCycle.catchStart) / 1000
    : 0;
  let countdownSeconds = appState.runEndTimeMs ? Math.max((appState.runEndTimeMs - Date.now()) / 1000, 0) : 0;
  if (preparedForNextRunBreak) {
    const schedule = getScheduleForCurrentType();
    const nextRunIndex = Math.min(appState.currentRunIndex + 1, schedule.length - 1);
    countdownSeconds = schedule[nextRunIndex] || getCurrentRunDurationSeconds();
  }

  setText(elements.motorState, appState.currentMotorDisplay);
  setText(elements.currentShear, formatSeconds(shearCurrent));
  setText(elements.currentCatch, formatSeconds(catchCurrent));
  updateTotalSheepTimeDisplay(calculateTargetMetrics().requiredCycle);
  setText(elements.runClock, formatCountdown(preparedForNextRunBreak ? 0 : getEffectiveElapsedSeconds()));
  setText(elements.runCountdown, formatCountdown(countdownSeconds));
  updateQuarterDisplay();
  if (preparedForNextRunBreak) setText(elements.quarterClock, "00:00");
  updateTimingAlertDisplay();
  updatePenRefillAlertDisplay();
  updateBreakTimingDisplay();
  updateBreakOverlayDisplay();
  updateRunBadge();
  updateStartRunButtonUI();
  updateDayClockDisplay();
  setText(elements.totalSheep, String(appState.daySheep.length));
  const currentSheepNumber = !appState.runActive ? 0 : (appState.currentCycle.motorOn && appState.currentCycle.shearStart ? appState.sheep.length + 1 : appState.sheep.length);
  setText(elements.currentSheepNumber, String(currentSheepNumber));
  updateCurrentSheepTimeLeft(calculateTargetMetrics().requiredCycle);
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
  setText(elements.maxCatchTime, displayPredictions.maxCatchTime);
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
  return {
    predictedQuarterTotal: quarter.predicted,
    predictedHourTotal,
    projectedTotal: target.projectedTotal,
    estimatedLastCatchTime: formatPredictedCatchTime(target.targetCatchRunSeconds),
    maxCatchTime: formatPredictedCatchTime(target.maxCatchRunSeconds),
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
      currentCycle: appState.currentCycle,
      target: appState.target,
      farm: appState.farm,
      recordType: appState.recordType,
      paused: appState.paused,
      pauseStartedAtMs: appState.pauseStartedAtMs,
      breakActive: appState.breakActive,
      breakStartedAtMs: appState.breakStartedAtMs,
      breakSource: appState.breakSource,
      preparedForNextRunBreak: appState.preparedForNextRunBreak,
      dayComplete: appState.dayComplete,
      breakBannerDismissedForCurrentBreak: appState.breakBannerDismissedForCurrentBreak,
      pendingBreakAfterCurrentSheep: appState.pendingBreakAfterCurrentSheep,
      pendingBreakStartedAtMs: appState.pendingBreakStartedAtMs,
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
      effectiveResumeRealMs: appState.effectiveResumeRealMs,
      simulationMode: appState.simulationMode,
      simulationRunLengthMode: appState.simulationMode ? appState.simulationRunLengthMode : "real",
      simulationCustomMinutes: sanitizeSimulationCustomMinutes(appState.simulationCustomMinutes)
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

function loadLastSave() {
  try {
    const autosaveKey = getAutosaveStorageKey();
    const raw = JSON.parse(localStorage.getItem(autosaveKey) || localStorage.getItem(AUTOSAVE_STORAGE_KEY) || 'null');
    if (!raw || !raw.state) return;
    Object.assign(appState, raw.state);
    appState.simulationMode = Boolean(appState.simulationMode);
    appState.simulationCustomMinutes = sanitizeSimulationCustomMinutes(appState.simulationCustomMinutes);
    if (!appState.simulationMode) {
      appState.simulationRunLengthMode = "real";
    } else {
      appState.simulationRunLengthMode = getValidSimulationRunLengthMode(appState.simulationRunLengthMode);
    }
    appState.breakActive = Boolean(appState.breakActive);
    appState.breakStartedAtMs = Number.isFinite(appState.breakStartedAtMs) ? appState.breakStartedAtMs : null;
    appState.breakSource = typeof appState.breakSource === "string" ? appState.breakSource : null;
    appState.preparedForNextRunBreak = appState.breakActive && Boolean(appState.preparedForNextRunBreak);
    appState.dayComplete = Boolean(appState.dayComplete);
    appState.breakBannerDismissedForCurrentBreak = Boolean(appState.breakBannerDismissedForCurrentBreak);
    appState.pendingBreakAfterCurrentSheep = Boolean(appState.pendingBreakAfterCurrentSheep);
    appState.pendingBreakStartedAtMs = Number.isFinite(appState.pendingBreakStartedAtMs) ? appState.pendingBreakStartedAtMs : null;
    appState.daySheep = Array.isArray(appState.daySheep) ? appState.daySheep : [...appState.sheep];
    sanitizeManualMarkersOnSheepEntries(appState.sheep);
    sanitizeManualMarkersOnSheepEntries(appState.daySheep);
    appState.penFillEvents = Array.isArray(appState.penFillEvents) ? appState.penFillEvents : [];
    appState.recordType = appState.recordType === "strongWoolLambs" || appState.recordType === "strongWoolEwes" ? appState.recordType : "none";
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
        ? 'End of Day'
        : (isPreparedForNextRunBreak() ? 'Official Break' : (appState.runActive ? (appState.paused ? 'Paused' : 'Running') : 'Stopped'));
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
    renderLogTable();
    renderReviewList();
    drawTrendGraph();
    if (elements.runReviewText) elements.runReviewText.textContent = appState.runReviewText;
    updateTrendFlags();
    updateTrendDetailsVisibility();
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
    } else if (isPreparedForNextRunBreak()) {
      startRealtimeLoops();
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
  if (elements.breakOverlayDismissBtn) elements.breakOverlayDismissBtn.addEventListener("click", hideBreakBannerForCurrentBreak);
  if (elements.breakOverlayShowBtn) elements.breakOverlayShowBtn.addEventListener("click", showBreakBannerForCurrentBreak);
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
  if (elements.penFillPlannerHelpBtn) elements.penFillPlannerHelpBtn.addEventListener("click", openPenFillPlannerHelpModal);
  if (elements.penFillPlannerHelpModalCloseBtn) elements.penFillPlannerHelpModalCloseBtn.addEventListener("click", closePenFillPlannerHelpModal);
  if (elements.penFillPlannerHelpModalOverlay) {
    elements.penFillPlannerHelpModalOverlay.addEventListener("click", (event) => {
      if (event.target === elements.penFillPlannerHelpModalOverlay) closePenFillPlannerHelpModal();
    });
  }
  if (elements.performancePanelHelpBtn) elements.performancePanelHelpBtn.addEventListener("click", openPerformancePanelHelpModal);
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
      closeSimulationControlsHelpModal();
      closeShortcutSettingsModal();
    }
  }, { capture: true });
  if (elements.autosaveToggle) {
    elements.autosaveToggle.addEventListener("change", () => {
      setAutosaveEnabled(elements.autosaveToggle.checked);
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
      if (!(target instanceof HTMLSelectElement) || !target.classList.contains("sheep-log-marker-note-select")) return;
      syncSheepLogCustomMarkerInput(target);
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
