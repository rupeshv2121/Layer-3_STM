// Member 3: The Invariant Guardian (Deterministic Safety Core)
// safety-supervisor.ts

export interface SafetyConfig {
  minYellowSeconds: number;
  minAllRedSeconds: number;
  minPedestrianWalkSeconds: number;
  minGreenEnforced: number;
  conflictMatrix: Record<string, string[]>;
}

export interface CurrentState {
  phaseId: string;
  activeGreens: string[];
  pedestrianWalkActive: boolean;
}

export interface ProposedState {
  phaseId: string;
  activeGreens: string[];
  yellowSeconds?: number;
  allRedSeconds?: number;
}

export interface ActiveTimers {
  currentPhaseDuration: number;
  pedestrianWalkDuration: number;
}

export interface SafetyValidationResult {
  isSafe: boolean;
  command: {
    action:
      | "ACTUATE_OPTIMIZED_PLAN"
      | "EXECUTE_PHASE_TRANSITION"
      | "MAINTAIN_CURRENT_STATE"
      | "FORCE_FALLBACK";
    targetPhaseId: string;
    yellowSeconds?: number;
    allRedSeconds?: number;
    reason?: string;
  };
}

export class SafetySupervisor {
  private config: SafetyConfig;

  constructor(config: SafetyConfig) {
    this.config = config;
  }

  /**
   * Strictly synchronous validation gate.
   * Evaluates any proposed plan against immutable physical interlocks.
   */
  public validateProposedActuation(
    currentState: CurrentState,
    proposedState: ProposedState,
    activeTimers: ActiveTimers,
  ): SafetyValidationResult {
    // Rule 1: Prevent Conflicting Greens Invariant
    for (const phaseA of proposedState.activeGreens) {
      const conflicts = this.config.conflictMatrix[phaseA] || [];
      for (const phaseB of proposedState.activeGreens) {
        if (conflicts.includes(phaseB)) {
          return {
            isSafe: false,
            command: this.forceSafeDefault(
              "CRITICAL_CONFLICTING_GREENS_DETECTED",
            ),
          };
        }
      }
    }

    // Rule 2: Enforce Clearance Interval Constraints
    if (currentState.phaseId !== proposedState.phaseId) {
      // Verify proposed phase doesn't conflict with currently active phase
      const activePhaseConflicts =
        this.config.conflictMatrix[currentState.phaseId] || [];
      if (activePhaseConflicts.includes(proposedState.phaseId)) {
        return {
          isSafe: false,
          command: this.forceSafeDefault(
            "PROPOSED_PHASE_CONFLICTS_WITH_CURRENT_PHASE",
          ),
        };
      }

      // Block premature cutoff from hyper-aggressive optimization requests
      if (activeTimers.currentPhaseDuration < this.config.minGreenEnforced) {
        return {
          isSafe: false,
          command: this.maintainCurrentState(
            currentState.phaseId,
            "MINIMUM_GREEN_NOT_MET",
          ),
        };
      }

      // Insert deterministic clearance delays (Yellow & All-Red)
      return {
        isSafe: true, // The transition is safe, but we MUST inject clearances
        command: {
          action: "EXECUTE_PHASE_TRANSITION",
          targetPhaseId: proposedState.phaseId,
          yellowSeconds: Math.max(
            proposedState.yellowSeconds || 0,
            this.config.minYellowSeconds,
          ),
          allRedSeconds: Math.max(
            proposedState.allRedSeconds || 0,
            this.config.minAllRedSeconds,
          ),
        },
      };
    }

    // Rule 3: Pedestrian Phase Protection Integrity
    if (currentState.pedestrianWalkActive) {
      if (
        activeTimers.pedestrianWalkDuration <
        this.config.minPedestrianWalkSeconds
      ) {
        return {
          isSafe: false,
          command: this.maintainCurrentState(
            currentState.phaseId,
            "PEDESTRIAN_WALK_ACTIVE",
          ),
        };
      }
    }

    // If all checks pass and no transition is needed, allow the optimized plan to proceed
    return {
      isSafe: true,
      command: {
        action: "ACTUATE_OPTIMIZED_PLAN",
        targetPhaseId: proposedState.phaseId,
      },
    };
  }

  /**
   * Executes the Safe Default fallback if AI logic crashes or hallucinates.
   */
  private forceSafeDefault(reasonString: string) {
    return {
      action: "FORCE_FALLBACK" as const,
      reason: reasonString,
      targetPhaseId: "FIXED_TIME_DEFAULT_LOOP_PHASE_1",
    };
  }

  /**
   * Overrides the optimizer and forces the current light to stay green.
   */
  private maintainCurrentState(targetPhaseId: string, reasonString: string) {
    return {
      action: "MAINTAIN_CURRENT_STATE" as const,
      reason: reasonString,
      targetPhaseId: targetPhaseId,
    };
  }
}
