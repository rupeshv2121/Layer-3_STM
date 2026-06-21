// ============================================================
// weighted-demand.ts
// Member 1 — Normal-Mode Architect
//
// RESPONSIBILITY:
//   Scores each approach based on:
//   - Vehicle count (weighted by person capacity)
//   - Waiting time
//   - Queue length relative to capacity
//   - Spillback detection
//   - Starvation prevention
//
// USED BY:
//   max-pressure-optimizer.ts → calls scoreAllApproaches
// ============================================================

export interface VehicleDetection {
  type: string;
  count: number;
}

export interface ApproachMetrics {
  direction: string;
  detections: VehicleDetection[];
  avgWaitingTime: number;
  arrivalRate: number;
  queueLength: number;
  roadCapacity: number;
  hasBus: boolean;
  hasEmergencyVehicle: boolean;
  lastGreenSeconds: number;
}

export interface ScoredApproach {
  direction: string;
  priorityScore: number;
  personFlow: number;
  spillbackBoost: boolean;
  starvationOverride: boolean;
}

// ─── Vehicle Weights (Person capacity) ────────────────────
const VEHICLE_WEIGHTS: Record<string, number> = {
  motorcycle: 0.5,
  car: 1.0,
  auto_rickshaw: 1.2,
  mini_truck: 2.0,
  bus: 3.0,
  heavy_truck: 4.0,
};

// ─── Scoring Constants ────────────────────────────────────
const WAITING_TIME_FACTOR = 0.5;
const QUEUE_FACTOR = 0.8;
const SPILLBACK_THRESHOLD = 0.85; // If queue > 85% of capacity
const SPILLBACK_BOOST = 15;
const STARVATION_THRESHOLD = 45; // seconds since last green
const STARVATION_BOOST = 20;
const BUS_BONUS = 3;

// ─── Calculate person equivalents from vehicle detections ─
function calculatePersonFlow(detections: VehicleDetection[]): number {
  return detections.reduce((sum, detection) => {
    const weight = VEHICLE_WEIGHTS[detection.type] ?? 1.0;
    return sum + detection.count * weight;
  }, 0);
}

// ─── Detect spillback condition ──────────────────────────
function detectSpillback(
  queueLength: number,
  roadCapacity: number
): boolean {
  return queueLength / roadCapacity > SPILLBACK_THRESHOLD;
}

// ─── Detect starvation (approach hasn't had green in a while)
function detectStarvation(lastGreenSeconds: number): boolean {
  return lastGreenSeconds > STARVATION_THRESHOLD;
}

// ─── Main Scoring Function ──────────────────────────────
export function scoreAllApproaches(approaches: ApproachMetrics[]): ScoredApproach[] {
  return approaches.map(approach => {
    // Step 1: Base priority from person flow
    const personFlow = calculatePersonFlow(approach.detections);

    // Step 2: Waiting time component
    const waitingComponent =
      approach.avgWaitingTime * WAITING_TIME_FACTOR;

    // Step 3: Queue utilization component
    const queueUtilization = Math.min(approach.queueLength / approach.roadCapacity, 1.0);
    const queueComponent = queueUtilization * 100 * QUEUE_FACTOR;

    // Step 4: Arrival rate component
    const arrivalComponent = approach.arrivalRate * 2;

    // Step 5: Bus bonus (priority to public transport)
    const busBonus = approach.hasBus ? BUS_BONUS : 0;

    // Base priority score
    let priorityScore =
      personFlow +
      waitingComponent +
      queueComponent +
      arrivalComponent +
      busBonus;

    // Step 6: Spillback detection and boost
    const spillbackDetected = detectSpillback(
      approach.queueLength,
      approach.roadCapacity
    );
    if (spillbackDetected) {
      priorityScore += SPILLBACK_BOOST;
    }

    // Step 7: Starvation prevention and boost
    const starvationDetected = detectStarvation(approach.lastGreenSeconds);
    if (starvationDetected) {
      priorityScore += STARVATION_BOOST;
    }

    return {
      direction: approach.direction,
      priorityScore,
      personFlow,
      spillbackBoost: spillbackDetected,
      starvationOverride: starvationDetected,
    };
  });
}
