// STM Orchestrator: Master Coordinator for Members 1-4
// Chains: Layer 2 Data → Member 1 (Optimization) → Member 2 (Emergency) →
//         Member 3 (Safety) → Member 4 (Resilience) → Hardware Actuation

// This file acts as the central nervous system for your entire traffic management engine. It perfectly encapsulates the "Decide" and "Guard" flow we established, explicitly wiring together the work of your 4-to-5 team members into a single, cohesive 30-second execution loop.

import { ConfidenceThresholds, ResilienceHandler } from "./resilience-handler";
import { SafetyConfig, SafetySupervisor } from "./safety-supervisor";
import {
  ActuationCommand,
  EmergencyResponse,
  EmergencyToken,
  HistoricalTimingPlan,
  Layer2Payload,
  OptimizationProposal,
} from "./types/types";

export interface OrchestratorConfig {
  safetyConfig: SafetyConfig;
  resilienceThresholds?: ConfidenceThresholds;
  maxDataAgeSeconds?: number; // How old Layer 2 data can be before forcing fallback
  defaultPhaseIfNoProposal?: string;
}

export interface OrchestratorResult {
  finalCommand: ActuationCommand;
  executionPath: string; // Debug info: "NORMAL_MODE" | "EMERGENCY_MODE" | "FALLBACK_MODE"
  safetyValidationPassed: boolean;
  confidenceScore: number;
  reasonChain: string[]; // Audit trail of decisions
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
export class STMOrchestrator {
  private safetyValidator: SafetySupervisor;
  private resilienceHandler: ResilienceHandler;
  private config: OrchestratorConfig;
  private lastValidTimestamp: string;

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.safetyValidator = new SafetySupervisor(config.safetyConfig);
    this.resilienceHandler = new ResilienceHandler(config.resilienceThresholds);
    this.lastValidTimestamp = new Date().toISOString();
  }

  /**
   * Main entry point: Evaluates all inputs and produces final actuation command.
   */
  public orchestrateActuation(
    layer2Data: Layer2Payload,
    emergencyToken: EmergencyToken | null,
    historicalPlans: HistoricalTimingPlan[],
  ): OrchestratorResult {
    const reasonChain: string[] = [];
    const commandId = `CMD-${Date.now()}`;

    // ===== STAGE 1: Data Staleness Check =====
    const dataAge = this.calculateDataAgeSeconds(layer2Data.timestamp);
    const maxAge = this.config.maxDataAgeSeconds ?? 10;

    if (dataAge > maxAge) {
      reasonChain.push(
        `STALE_DATA: Layer 2 data is ${dataAge}s old (threshold: ${maxAge}s)`,
      );
      return this.produceFallbackCommand(
        commandId,
        layer2Data.junctionId,
        historicalPlans,
        "HISTORICAL_FALLBACK",
        reasonChain,
        1.0,
      );
    }

    // ===== STAGE 2: Resilience Check (Member 4 Entry Point) =====
    // This determines if we trust the AI optimization or force historical fallback
    const resilienceDecision =
      this.resilienceHandler.evaluateConfidenceAndDecide(
        layer2Data,
        historicalPlans,
      );
    reasonChain.push(`Resilience Check: ${resilienceDecision.action}`);

    if (resilienceDecision.action === "SWITCH_TO_HISTORICAL_FALLBACK") {
      reasonChain.push(
        `Confidence too low: ${(
          resilienceDecision.confidenceScore * 100
        ).toFixed(2)}%`,
      );
      return this.produceFallbackCommand(
        commandId,
        layer2Data.junctionId,
        historicalPlans,
        "HISTORICAL_FALLBACK",
        reasonChain,
        resilienceDecision.confidenceScore,
      );
    }

    if (resilienceDecision.action === "MAINTAIN_FALLBACK") {
      reasonChain.push(`Continuing fallback: Confidence still below threshold`);
      return this.produceFallbackCommand(
        commandId,
        layer2Data.junctionId,
        historicalPlans,
        "HISTORICAL_FALLBACK",
        reasonChain,
        resilienceDecision.confidenceScore,
      );
    }

    // ===== STAGE 3: Optimization Decision =====
    // Decide between Normal Mode (Member 1) or Emergency Mode (Member 2)

    let selectedProposal: OptimizationProposal | EmergencyResponse | null =
      null;
    let executionPath = "NORMAL_MODE";

    // Check if emergency has higher priority
    if (emergencyToken) {
      reasonChain.push(`Emergency detected: ${emergencyToken.emvId}`);
      // TODO: Member 2 will implement this - for now, we'll use a placeholder
      selectedProposal = this.generateEmergencyResponse(emergencyToken);
      executionPath = "EMERGENCY_MODE";
      reasonChain.push(
        `Using EMERGENCY_MODE with phase ${emergencyToken.targetPhaseId}`,
      );
    } else {
      // TODO: Member 1 will implement this - for now, use fallback
      reasonChain.push(
        `Using NORMAL_MODE - would call Member 1 for optimization`,
      );
      selectedProposal = this.generateNormalModeProposal(layer2Data);
    }

    // ===== STAGE 4: Safety Validation (Member 3 Entry Point) =====
    const currentState = {
      phaseId: "CURRENT_PHASE", // In real system, track current phase
      activeGreens: ["CURRENT_PHASE"],
      pedestrianWalkActive: false,
    };

    const activeTimers = {
      currentPhaseDuration: 10, // Placeholder
      pedestrianWalkDuration: 0,
    };

    const proposedState = {
      phaseId:
        "targetPhaseId" in selectedProposal
          ? selectedProposal.targetPhaseId
          : selectedProposal.approachId,
      activeGreens: [
        "targetPhaseId" in selectedProposal
          ? selectedProposal.targetPhaseId
          : selectedProposal.approachId,
      ],
    };

    const safetyResult = this.safetyValidator.validateProposedActuation(
      currentState,
      proposedState,
      activeTimers,
    );

    reasonChain.push(
      `Safety Check: ${safetyResult.isSafe ? "PASSED" : "FAILED"} - ${
        safetyResult.command.action
      }`,
    );

    if (!safetyResult.isSafe) {
      if (safetyResult.command.action === "FORCE_FALLBACK") {
        reasonChain.push(
          `Safety override: Forcing fallback - ${safetyResult.command.reason}`,
        );
        return this.produceFallbackCommand(
          commandId,
          layer2Data.junctionId,
          historicalPlans,
          "SAFE_DEFAULT",
          reasonChain,
          resilienceDecision.confidenceScore,
        );
      }
    }

    // ===== STAGE 5: Build Final Actuation Command =====
    const targetPhase =
      "targetPhaseId" in selectedProposal
        ? selectedProposal.targetPhaseId
        : selectedProposal.approachId;

    const proposedDuration =
      "requiredGreenDuration" in selectedProposal
        ? selectedProposal.requiredGreenDuration
        : selectedProposal.proposedGreenTime;

    const finalCommand: ActuationCommand = {
      junctionId: layer2Data.junctionId,
      commandId,
      targetPhaseId: targetPhase,
      durationSeconds: proposedDuration,
      clearanceIntervals: {
        yellowSeconds: safetyResult.command.yellowSeconds || 3,
        allRedSeconds: safetyResult.command.allRedSeconds || 2,
      },
      executionMode:
        executionPath === "EMERGENCY_MODE"
          ? "GREEN_CORRIDOR"
          : "NORMAL_MAX_PRESSURE",
    };

    // ===== STAGE 6: Resilience Enforcement (Member 4 Final Check) =====
    const enforcedCommand = this.resilienceHandler.hijackAndEnforceHistorical(
      finalCommand,
      historicalPlans,
    );

    if (enforcedCommand.executionMode === "HISTORICAL_FALLBACK") {
      reasonChain.push(
        `Resilience enforcement: Overridden to historical timing`,
      );
    }

    return {
      finalCommand: enforcedCommand,
      executionPath,
      safetyValidationPassed: safetyResult.isSafe,
      confidenceScore: resilienceDecision.confidenceScore,
      reasonChain,
    };
  }

  /**
   * Produces a fallback command using historical data
   */
  private produceFallbackCommand(
    commandId: string,
    junctionId: string,
    historicalPlans: HistoricalTimingPlan[],
    mode: "HISTORICAL_FALLBACK" | "SAFE_DEFAULT",
    reasonChain: string[],
    confidenceScore: number,
  ): OrchestratorResult {
    // Use first available phase from historical data
    const fallbackPhase = historicalPlans[0] || {
      phaseId: "NORTH",
      recommendedGreenTime: 45,
      historicalDemand: 60,
    };
    const command: ActuationCommand = {
      junctionId,
      commandId,
      targetPhaseId: fallbackPhase.phaseId,
      durationSeconds: fallbackPhase.recommendedGreenTime,
      clearanceIntervals: {
        yellowSeconds: 3,
        allRedSeconds: 2,
      },
      executionMode:
        mode === "SAFE_DEFAULT" ? "SAFE_DEFAULT" : "HISTORICAL_FALLBACK",
    };

    return {
      finalCommand: command,
      executionPath: "FALLBACK_MODE",
      safetyValidationPassed: true,
      confidenceScore,
      reasonChain,
    };
  }

  /**
   * Placeholder for Member 1's optimization logic
   * In real implementation, Member 1 will provide:
   * - Person-centric weighted vehicle counts
   * - Priority Score calculation
   * - Max-Pressure formula application
   */
  private generateNormalModeProposal(
    layer2Data: Layer2Payload,
  ): OptimizationProposal {
    // TODO: Replace with actual Member 1 implementation
    // For now, just propose the approach with highest occupancy
    const approaches = layer2Data.approaches;
    const maxApproach = approaches.reduce((prev, current) =>
      current.spatialOccupancyPct > prev.spatialOccupancyPct ? current : prev,
    );

    return {
      approachId: maxApproach.approachId,
      priorityScore: maxApproach.spatialOccupancyPct, // Placeholder
      proposedGreenTime: 45, // Placeholder
      method: "MAX_PRESSURE",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Placeholder for Member 2's emergency response logic
   * In real implementation, Member 2 will provide:
   * - Conflict Index: Priority Class * 100 - ETA
   * - Green Corridor timing calculations
   */
  private generateEmergencyResponse(
    emergency: EmergencyToken,
  ): EmergencyResponse {
    // TODO: Replace with actual Member 2 implementation
    // For now, simple Conflict Index calculation
    const priorityMultiplier =
      emergency.priorityClass === "CRITICAL"
        ? 3
        : emergency.priorityClass === "HIGH"
          ? 2
          : 1;

    const conflictIndex = priorityMultiplier * 100 - emergency.etaSeconds;
    // Cast targetPhaseId to valid type (already validated in EmergencyToken)
    const phaseId = emergency.targetPhaseId as
      | "NORTH"
      | "SOUTH"
      | "EAST"
      | "WEST";

    return {
      emvId: emergency.emvId,
      targetPhaseId: phaseId,
      conflictIndex,
      requiredGreenDuration: 60, // Placeholder: allocate sufficient time
      executionUrgency: emergency.priorityClass,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate age of perception data in seconds
   */
  private calculateDataAgeSeconds(timestamp: string): number {
    const dataTime = new Date(timestamp).getTime();
    const now = new Date().getTime();
    return (now - dataTime) / 1000;
  }

  /**
   * Get orchestrator state for monitoring
   */
  public getOrchestrationState() {
    return {
      resilience: this.resilienceHandler.getState(),
      lastValidTimestamp: this.lastValidTimestamp,
    };
  }
}
