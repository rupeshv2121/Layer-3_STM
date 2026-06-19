// 1. Vehicle Weights
export const VEHICLE_WEIGHTS = {
  Motorcycle: 0.5,
  Car: 1.0,
  AutoRickshaw: 1.2,
  MiniTruck: 2.0,
  Bus: 3.0,
  HeavyTruck: 4.0,
  Ambulance: 10.0,
} as const;

export type VehicleType = keyof typeof VEHICLE_WEIGHTS;

// 2. Layer 2 Perception Inputs (The Mock Cameras)
export interface VehicleDetection {
  type: VehicleType;
  count: number;
}

export interface ApproachData {
  approachId: "NORTH" | "SOUTH" | "EAST" | "WEST";
  spatialOccupancyPct: number; // 0.0 to 100.0
  detections: VehicleDetection[];
  waitingTimeSeconds: number;
  arrivalRatePerMin: number;
}

export interface Layer2Payload {
  junctionId: string;
  timestamp: string;
  cvConfidenceScore: number; // 0.0 to 1.0
  approaches: ApproachData[];
}

// 3. Emergency Dispatch System (EMVS)
export type PriorityClass = "CRITICAL" | "HIGH" | "NORMAL";

export const PRIORITY_CLASS_MULTIPLIER: Record<PriorityClass, number> = {
  CRITICAL: 3,
  HIGH: 2,
  NORMAL: 1,
};

export interface EmergencyToken {
  emvId: string;
  priorityClass: PriorityClass;
  etaSeconds: number;
  cryptographicToken: string;
  targetPhaseId: string; // Which approach they need green
}

// 4. Historical Fallback Database
export interface HistoricalTimingPlan {
  phaseId: string;
  recommendedGreenTime: number;
  historicalDemand: number;
}

// 5. Output to Layer 4 (Hardware Actuation)
export interface ActuationCommand {
  junctionId: string;
  commandId: string;
  targetPhaseId: string;
  durationSeconds: number;
  clearanceIntervals: {
    yellowSeconds: number;
    allRedSeconds: number;
  };
  executionMode:
    | "NORMAL_MAX_PRESSURE"
    | "GREEN_CORRIDOR"
    | "SAFE_DEFAULT"
    | "HISTORICAL_FALLBACK";
}
