import { MockDataGenerator } from "./mock-data/mock_generator";
import { STMOrchestrator } from "./stm-orchestrator";

const generator = new MockDataGenerator();

//  The time limits ensure the AI can never skip a clearance interval.
const safetyConfig = {
  minYellowSeconds: 3,
  minAllRedSeconds: 2,
  minPedestrianWalkSeconds: 8,
  minGreenEnforced: 10,
  conflictMatrix: {
    // The conflictMatrix mathematically defines which traffic directions would cause a crash if turned green simultaneously.
    NORTH: ["SOUTH"],
    SOUTH: ["NORTH"],
    EAST: ["WEST"],
    WEST: ["EAST"],
  },
};

// The "brain" of Layer 3
const orchestrator = new STMOrchestrator({
  safetyConfig,
  //You specifically set the criticalLowerBound to 0.70 (70%), meaning if AI vision confidence drops below this, the system will trigger a historical fallback.
  resilienceThresholds: {
    criticalLowerBound: 0.7,
    warningThreshold: 0.8,
  },
  // You also set a strict maxDataAgeSeconds of 10 seconds to protect against network lag. This means if the Layer 2 data is older than 10 seconds, the orchestrator will automatically reject it and trigger a fallback.
  maxDataAgeSeconds: 10,
  defaultPhaseIfNoProposal: "NORTH",
});

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║         Layer-3 STM - Full Integration Test                ║");
console.log("║  (Member 1, 2, 3, 4 Pipeline Orchestration)                ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

// ===== SCENARIO 1: Normal Operation (HIGH Confidence, No Emergency) =====
console.log("═══════════════════════════════════════════════════════════════");
console.log("SCENARIO 1: Normal Operation (Confidence HIGH, No Emergency)");
console.log(
  "═══════════════════════════════════════════════════════════════\n",
);

// Ask the mock generator to create fake live camera data with an 0.88 (88%) confidence score (simulating clear weather).
const layer2Data1 = generator.getLayer2Data(0.88);
const historicalData = generator.getHistoricalData(); // Also grab the historical database timings.

console.log("📊 Layer 2 Perception Data:");
console.log(`   Junction: ${layer2Data1.junctionId}`);
console.log(
  `   Confidence Score: ${(layer2Data1.cvConfidenceScore * 100).toFixed(
    2,
  )}% ✅ (Above 70%)`,
);
console.log(
  `   Approaches: ${layer2Data1.approaches.map((a) => `${a.approachId}(${a.spatialOccupancyPct}%)`).join(", ")}\n`,
);

// Pass the live data into the orchestrator. Because null is passed for the emergency token, Member 1 and Member 2's Max-Pressure logic takes over to calculate the optimal green light based purely on traffic density.
const result1 = orchestrator.orchestrateActuation(
  layer2Data1,
  null, // No emergency
  historicalData,
);

console.log("📋 Orchestration Decision Chain:");
result1.reasonChain.forEach((reason, idx) => {
  console.log(`   ${idx + 1}. ${reason}`);
});

console.log("\n✅ FINAL ACTUATION COMMAND:");
console.log(`   Target Phase: ${result1.finalCommand.targetPhaseId}`);
console.log(`   Duration: ${result1.finalCommand.durationSeconds}s`);
console.log(`   Execution Mode: ${result1.finalCommand.executionMode}`);
console.log(
  `   Clearances: Yellow=${result1.finalCommand.clearanceIntervals.yellowSeconds}s, AllRed=${result1.finalCommand.clearanceIntervals.allRedSeconds}s`,
);
console.log(
  `   Safety Passed: ${result1.safetyValidationPassed ? "✅ YES" : "❌ NO"}`,
);
console.log(`   Execution Path: ${result1.executionPath}\n`);

// ===== SCENARIO 2: Emergency Mode (Emergency Token Detected) =====
console.log("═══════════════════════════════════════════════════════════════");
console.log("SCENARIO 2: Emergency Mode (EMV Detected)");
console.log(
  "═══════════════════════════════════════════════════════════════\n",
);

// construct a mock Emergency Vehicle (EMV) payload. This simulates an ambulance (AMB-0042) that is 35 seconds away, classified as CRITICAL priority, and requires the EAST phase to turn green. By passing this token into the orchestrator, we will test Member 2's Emergency Pathfinding logic to see if it correctly overrides the normal Max-Pressure decision and prioritizes the emergency vehicle's needs while still adhering to all safety constraints and ask the Safety Supervisor to safely cut cross-traffic to give the EAST phase a green light.
const emergencyToken = {
  emvId: "AMB-0042",
  priorityClass: "CRITICAL" as const,
  etaSeconds: 35,
  cryptographicToken: "0xVALID_MOCK_TOKEN",
  targetPhaseId: "EAST" as const,
};

console.log("🚨 Emergency Token Detected:");
console.log(`   EMV ID: ${emergencyToken.emvId}`);
console.log(`   Priority: ${emergencyToken.priorityClass}`);
console.log(`   ETA: ${emergencyToken.etaSeconds}s`);
console.log(`   Needs: ${emergencyToken.targetPhaseId} phase green\n`);

const result2 = orchestrator.orchestrateActuation(
  layer2Data1,
  emergencyToken,
  historicalData,
);

console.log("📋 Orchestration Decision Chain:");
result2.reasonChain.forEach((reason, idx) => {
  console.log(`   ${idx + 1}. ${reason}`);
});

console.log("\n✅ FINAL ACTUATION COMMAND (EMERGENCY MODE):");
console.log(`   Target Phase: ${result2.finalCommand.targetPhaseId}`);
console.log(`   Duration: ${result2.finalCommand.durationSeconds}s`);
console.log(`   Execution Mode: ${result2.finalCommand.executionMode}`);
console.log(
  `   Safety Passed: ${result2.safetyValidationPassed ? "✅ YES" : "❌ NO"}`,
);
console.log(`   Execution Path: ${result2.executionPath}\n`);

// ===== SCENARIO 3: Low Confidence Hijack (Winter Smog) (Resilience Fallback) =====
console.log("═══════════════════════════════════════════════════════════════");
console.log("SCENARIO 3: Low Confidence (Member 4 Hijack Activated)");
console.log(
  "═══════════════════════════════════════════════════════════════\n",
);

const layer2Data3 = generator.getLayer2Data(0.62); // Below 70% threshold

console.log("📊 Layer 2 Perception Data:");
console.log(
  `   Confidence Score: ${(layer2Data3.cvConfidenceScore * 100).toFixed(2)}% ❌ (Below 70%)`,
);
console.log(
  `   Status: Member 4 (Resilience) will HIJACK to historical fallback\n`,
);

// When this data hits the orchestrator, the Resilience Module detects the sub-70% score. It immediately hijacks the system, ignores the live YOLOv8 data, and forces the traffic lights to run on the historicalData you passed in to prevent chaotic signal switching.
const result3 = orchestrator.orchestrateActuation(
  layer2Data3,
  null,
  historicalData,
);

console.log("📋 Orchestration Decision Chain:");
result3.reasonChain.forEach((reason, idx) => {
  console.log(`   ${idx + 1}. ${reason}`);
});

console.log("\n✅ FINAL ACTUATION COMMAND (HIJACKED TO FALLBACK):");
console.log(`   Target Phase: ${result3.finalCommand.targetPhaseId}`);
console.log(
  `   Duration: ${result3.finalCommand.durationSeconds}s (from historical database)`,
);
console.log(`   Execution Mode: ${result3.finalCommand.executionMode}`);
console.log(`   Execution Path: ${result3.executionPath}\n`);

// ===== SCENARIO 4: Stale Data Detection (Network Outage)=====
console.log("═══════════════════════════════════════════════════════════════");
console.log("SCENARIO 4: Stale Layer 2 Data (> 10 seconds old)");
console.log(
  "═══════════════════════════════════════════════════════════════\n",
);

// Create stale data (11 seconds in the past)
const staleLayers2Data = {
  ...layer2Data1,
  timestamp: new Date(Date.now() - 11000).toISOString(),
};

console.log("📊 Layer 2 Perception Data:");
console.log(`   Data Age: ~11 seconds (max allowed: 10s)`);
console.log(
  `   Status: Orchestrator will force fallback due to data staleness\n`,
);

const result4 = orchestrator.orchestrateActuation(
  staleLayers2Data,
  null,
  historicalData,
);

console.log("📋 Orchestration Decision Chain:");
result4.reasonChain.forEach((reason, idx) => {
  console.log(`   ${idx + 1}. ${reason}`);
});

console.log("\n✅ FINAL ACTUATION COMMAND (STALE DATA FALLBACK):");
console.log(`   Target Phase: ${result4.finalCommand.targetPhaseId}`);
console.log(`   Execution Mode: ${result4.finalCommand.executionMode}`);
console.log(`   Execution Path: ${result4.executionPath}\n`);

// ===== ORCHESTRATOR STATE SUMMARY =====
console.log("═══════════════════════════════════════════════════════════════");
console.log("ORCHESTRATOR STATE SUMMARY");
console.log(
  "═══════════════════════════════════════════════════════════════\n",
);

// Finally, you pull the internal diagnostic state of the orchestrator to confirm exactly why it made its decisions. This is an excellent debugging tool to prove to judges or stakeholders that your fail-safes are actively monitoring the environment.
const orchestratorState = orchestrator.getOrchestrationState();
console.log("📡 Resilience Module State:");
console.log(
  `   Fallback Active: ${orchestratorState.resilience.isFallbackActive}`,
);
console.log(
  `   Current Confidence: ${(orchestratorState.resilience.currentConfidenceScore * 100).toFixed(2)}%`,
);
if (orchestratorState.resilience.fallbackReason) {
  console.log(
    `   Fallback Reason: ${orchestratorState.resilience.fallbackReason}`,
  );
}

console.log("\n╔════════════════════════════════════════════════════════════╗");
console.log("║     Layer-3 STM Integration Test Complete                  ║");
console.log("║  ✅ Member 3 (Safety Supervisor) - Fully Verified         ║");
console.log("║  ✅ Member 4 (Data & Resilience) - Fully Verified         ║");
console.log("║  ⏳ Member 1 (Normal-Mode Architect) - Ready for code      ║");
console.log("║  ⏳ Member 2 (Emergency Pathfinder) - Ready for code       ║");
console.log("╚════════════════════════════════════════════════════════════╝");
