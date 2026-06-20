// mock-generator.ts
import type {
    ApproachData,
    EmergencyToken,
    Layer2Payload,
} from "../types/types";
import { VEHICLE_WEIGHTS } from "../types/types";

export class MockDataGenerator {
  private generateRandomDetections() {
    return Object.keys(VEHICLE_WEIGHTS).map((type) => ({
      type: type as keyof typeof VEHICLE_WEIGHTS,
      // Randomly generate between 0 and 15 vehicles per type
      count: Math.floor(Math.random() * 15),
    }));
  }

  private generateApproach(
    approachId: "NORTH" | "SOUTH" | "EAST" | "WEST",
  ): ApproachData {
    return {
      approachId,
      spatialOccupancyPct: Math.floor(Math.random() * 90) + 10, // 10% to 100%
      detections: this.generateRandomDetections(),
      waitingTimeSeconds: Math.floor(Math.random() * 120), // 0 to 120s
      arrivalRatePerMin: Math.floor(Math.random() * 30), // 0 to 30 cars/min
    };
  }

  // Change this to true to test Member 3 & Member 4's Emergency Logic
  public triggerEmergency(): EmergencyToken | null {
    const isEmergency = Math.random() > 0.8; // 20% chance of emergency
    if (!isEmergency) return null;

    return {
      emvId: `AMB-${Math.floor(Math.random() * 9999)}`,
      priorityClass: "CRITICAL",
      etaSeconds: Math.floor(Math.random() * 60) + 10, // 10s to 70s away
      cryptographicToken: "0xVALID_MOCK_TOKEN",
      targetPhaseId: "NORTH",
    };
  }

  public getLayer2Data(overrideConfidence?: number): Layer2Payload {
    // If no override provided, randomly vary confidence to test both scenarios
    // ~50% of the time will be below 0.70 to trigger Member 4 hijack logic
    let simulatedConfidence = overrideConfidence ?? (Math.random() < 0.5 ? 0.65 : 0.88);

    return {
      junctionId: "DEL_DL_ITO_01",
      timestamp: new Date().toISOString(),
      cvConfidenceScore: simulatedConfidence,
      approaches: [
        this.generateApproach("NORTH"),
        this.generateApproach("SOUTH"),
        this.generateApproach("EAST"),
        this.generateApproach("WEST"),
      ],
    };
  }

  public getHistoricalData() {
    return [
      { phaseId: "NORTH", recommendedGreenTime: 45, historicalDemand: 60 },
      { phaseId: "SOUTH", recommendedGreenTime: 30, historicalDemand: 40 },
    ];
  }
}
