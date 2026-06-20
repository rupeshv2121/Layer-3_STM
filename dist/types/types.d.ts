export declare const VEHICLE_WEIGHTS: {
    readonly Motorcycle: 0.5;
    readonly Car: 1;
    readonly AutoRickshaw: 1.2;
    readonly MiniTruck: 2;
    readonly Bus: 3;
    readonly HeavyTruck: 4;
    readonly Ambulance: 10;
};
export type VehicleType = keyof typeof VEHICLE_WEIGHTS;
export interface VehicleDetection {
    type: VehicleType;
    count: number;
}
export interface ApproachData {
    approachId: "NORTH" | "SOUTH" | "EAST" | "WEST";
    spatialOccupancyPct: number;
    detections: VehicleDetection[];
    waitingTimeSeconds: number;
    arrivalRatePerMin: number;
}
export interface Layer2Payload {
    junctionId: string;
    timestamp: string;
    cvConfidenceScore: number;
    approaches: ApproachData[];
}
export type PriorityClass = "CRITICAL" | "HIGH" | "NORMAL";
export declare const PRIORITY_CLASS_MULTIPLIER: Record<PriorityClass, number>;
export interface EmergencyToken {
    emvId: string;
    priorityClass: PriorityClass;
    etaSeconds: number;
    cryptographicToken: string;
    targetPhaseId: string;
}
export interface HistoricalTimingPlan {
    phaseId: string;
    recommendedGreenTime: number;
    historicalDemand: number;
}
export interface OptimizationProposal {
    approachId: "NORTH" | "SOUTH" | "EAST" | "WEST";
    priorityScore: number;
    proposedGreenTime: number;
    method: "MAX_PRESSURE";
    timestamp: string;
}
export interface EmergencyResponse {
    emvId: string;
    targetPhaseId: "NORTH" | "SOUTH" | "EAST" | "WEST";
    conflictIndex: number;
    requiredGreenDuration: number;
    executionUrgency: "CRITICAL" | "HIGH" | "NORMAL";
    timestamp: string;
}
export interface ActuationCommand {
    junctionId: string;
    commandId: string;
    targetPhaseId: string;
    durationSeconds: number;
    clearanceIntervals: {
        yellowSeconds: number;
        allRedSeconds: number;
    };
    executionMode: "NORMAL_MAX_PRESSURE" | "GREEN_CORRIDOR" | "SAFE_DEFAULT" | "HISTORICAL_FALLBACK";
}
//# sourceMappingURL=types.d.ts.map