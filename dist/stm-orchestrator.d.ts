import { Layer2Payload, EmergencyToken, HistoricalTimingPlan, ActuationCommand } from "./types/types";
import { SafetyConfig } from "./safety-supervisor";
import { ConfidenceThresholds } from "./resilience-handler";
export interface OrchestratorConfig {
    safetyConfig: SafetyConfig;
    resilienceThresholds?: ConfidenceThresholds;
    maxDataAgeSeconds?: number;
    defaultPhaseIfNoProposal?: string;
}
export interface OrchestratorResult {
    finalCommand: ActuationCommand;
    executionPath: string;
    safetyValidationPassed: boolean;
    confidenceScore: number;
    reasonChain: string[];
}
/**
 * STM Orchestrator: Master Coordination Layer
 *
 * Flow:
 * 1. Receives Layer 2 perception data + optional Emergency token
 * 2. Calls Member 1 (Normal-Mode Architect) to generate optimization proposal
 * 3. Calls Member 2 (Emergency Pathfinder) if emergency exists
 * 4. Selects proposal (emergency overrides normal mode)
 * 5. Calls Member 3 (Invariant Guardian) to validate against safety interlocks
 * 6. Calls Member 4 (Data & Resilience) to enforce fallback if needed
 * 7. Returns final ActuationCommand to hardware
 */
export declare class STMOrchestrator {
    private safetyValidator;
    private resilienceHandler;
    private config;
    private lastValidTimestamp;
    constructor(config: OrchestratorConfig);
    /**
     * Main entry point: Evaluates all inputs and produces final actuation command.
     * This is where the 4 members collaborate.
     */
    orchestrateActuation(layer2Data: Layer2Payload, emergencyToken: EmergencyToken | null, historicalPlans: HistoricalTimingPlan[]): OrchestratorResult;
    /**
     * Produces a fallback command using historical data
     */
    private produceFallbackCommand;
    /**
     * Placeholder for Member 1's optimization logic
     * In real implementation, Member 1 will provide:
     * - Person-centric weighted vehicle counts
     * - Priority Score calculation
     * - Max-Pressure formula application
     */
    private generateNormalModeProposal;
    /**
     * Placeholder for Member 2's emergency response logic
     * In real implementation, Member 2 will provide:
     * - Conflict Index: Priority Class * 100 - ETA
     * - Green Corridor timing calculations
     */
    private generateEmergencyResponse;
    /**
     * Calculate age of perception data in seconds
     */
    private calculateDataAgeSeconds;
    /**
     * Get orchestrator state for monitoring
     */
    getOrchestrationState(): {
        resilience: import("./resilience-handler").ResilienceState;
        lastValidTimestamp: string;
    };
}
//# sourceMappingURL=stm-orchestrator.d.ts.map