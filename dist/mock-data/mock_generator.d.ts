import type { EmergencyToken, Layer2Payload } from "../types/types";
export declare class MockDataGenerator {
    private generateRandomDetections;
    private generateApproach;
    triggerEmergency(): EmergencyToken | null;
    getLayer2Data(overrideConfidence?: number): Layer2Payload;
    getHistoricalData(): {
        phaseId: string;
        recommendedGreenTime: number;
        historicalDemand: number;
    }[];
}
//# sourceMappingURL=mock_generator.d.ts.map