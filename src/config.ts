// Shared Layer-3 pipeline configuration (single source of truth)

export const PIPELINE_CYCLE_MS = 30_000;
export const PIPELINE_CYCLE_SECONDS = 30;

export const MIN_YELLOW_SECONDS = 5;
export const MIN_ALL_RED_SECONDS = 2;
export const MIN_PEDESTRIAN_WALK_SECONDS = 8;
export const MIN_GREEN_ENFORCED = 10;

export const CONFIDENCE_CRITICAL = 0.7;
export const CONFIDENCE_WARNING = 0.8;
export const MAX_DATA_AGE_SECONDS = 10;

export const DEFAULT_PHASE = "NORTH";

export const safetyConfig = {
  minYellowSeconds: MIN_YELLOW_SECONDS,
  minAllRedSeconds: MIN_ALL_RED_SECONDS,
  minPedestrianWalkSeconds: MIN_PEDESTRIAN_WALK_SECONDS,
  minGreenEnforced: MIN_GREEN_ENFORCED,
  conflictMatrix: {
    NORTH: ["SOUTH"],
    SOUTH: ["NORTH"],
    EAST: ["WEST"],
    WEST: ["EAST"],
  },
};

export const orchestratorConfig = {
  safetyConfig,
  resilienceThresholds: {
    criticalLowerBound: CONFIDENCE_CRITICAL,
    warningThreshold: CONFIDENCE_WARNING,
  },
  maxDataAgeSeconds: MAX_DATA_AGE_SECONDS,
  defaultPhaseIfNoProposal: DEFAULT_PHASE,
};
