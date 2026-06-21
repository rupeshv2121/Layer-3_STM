// ============================================================
// main.ts
// Layer 3 STM - Complete Pipeline
//
// DATA FLOW:
// Layer 2 (Perception) → Member 1 (Scoring) → Member 2 (Optimization)
// → Member 3 (Safety) → Member 4 (Resilience) → Layer 4 (Actuation)
//
// Single continuous pipeline running every 8 seconds
// ============================================================

import { MockDataGenerator } from "./mock-data/mock_generator";
import { STMOrchestrator } from "./stm-orchestrator";

const generator = new MockDataGenerator();

const safetyConfig = {
  minYellowSeconds: 3,
  minAllRedSeconds: 2,
  minPedestrianWalkSeconds: 8,
  minGreenEnforced: 10,
  conflictMatrix: {
    NORTH: ["SOUTH"],
    SOUTH: ["NORTH"],
    EAST: ["WEST"],
    WEST: ["EAST"],
  },
};

const orchestrator = new STMOrchestrator({
  safetyConfig,
  resilienceThresholds: {
    criticalLowerBound: 0.7,
    warningThreshold: 0.8,
  },
  maxDataAgeSeconds: 10,
  defaultPhaseIfNoProposal: "NORTH",
});

const historicalData = generator.getHistoricalData();

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║       LAYER 3 STM — CONTINUOUS DATA PIPELINE               ║");
console.log("║  Layer 2 → M1 → M2 → M3 → M4 → Layer 4                     ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

console.log("📡 Pipeline Configuration:");
console.log("   • Cycle Interval: Every 8 seconds");
console.log("   • Confidence Threshold: 70%");
console.log("   • Max Data Age: 10 seconds");
console.log("   • Conflict Matrix: NORTH↔SOUTH, EAST↔WEST\n");

let cycleCount = 0;

function runPipeline() {
  cycleCount++;
  const timestamp = new Date().toLocaleTimeString();

  console.log("\n" + "═".repeat(70));
  console.log(`CYCLE #${cycleCount} — ${timestamp}`);
  console.log("═".repeat(70));

  // ─────────────────────────────────────────────────────────────
  // LAYER 2: PERCEPTION (Camera Detection)
  // ─────────────────────────────────────────────────────────────
  const confidenceScore = Math.random() > 0.15 
    ? Math.random() * 0.2 + 0.8  // High: 80-100%
    : Math.random() * 0.3 + 0.35; // Low: 35-65%

  const layer2Data = generator.getLayer2Data(confidenceScore);

  console.log("\n📡 LAYER 2 (Perception):");
  console.log(`   Junction: ${layer2Data.junctionId}`);
  console.log(`   Confidence: ${(layer2Data.cvConfidenceScore * 100).toFixed(1)}%`);
  console.log(`   Detections: ${layer2Data.approaches.map((a) => `${a.approachId}(${a.spatialOccupancyPct}%)`).join(", ")}`);

  // ─────────────────────────────────────────────────────────────
  // ORCHESTRATOR PIPELINE: M1 → M2 → M3 → M4
  // ─────────────────────────────────────────────────────────────
  
  // Random emergency event (10% chance)
  const hasEmergency = Math.random() < 0.1;
  const emergencyToken = hasEmergency
    ? {
        emvId: "AMB-" + String(Math.floor(Math.random() * 9000) + 1000),
        priorityClass: Math.random() > 0.5 ? "CRITICAL" : "HIGH",
        etaSeconds: Math.floor(Math.random() * 40) + 20,
        cryptographicToken: "0xVALID_TOKEN",
        targetPhaseId: ["NORTH", "SOUTH", "EAST", "WEST"][
          Math.floor(Math.random() * 4)
        ],
      } as any
    : null;

  if (hasEmergency) {
    console.log(`\n🚨 EMERGENCY DETECTED: ${emergencyToken.emvId} (${emergencyToken.priorityClass})`);
    console.log(`   Target: ${emergencyToken.targetPhaseId} phase | ETA: ${emergencyToken.etaSeconds}s`);
  }

  const orchestrationResult = orchestrator.orchestrateActuation(
    layer2Data,
    emergencyToken,
    historicalData
  );

  // ─────────────────────────────────────────────────────────────
  // MEMBER 1: NORMAL-MODE ARCHITECT (Scoring)
  // ─────────────────────────────────────────────────────────────
  console.log("\n👤 MEMBER 1 (Normal-Mode Architect):");
  const member1Status = orchestrationResult.executionPath === "NORMAL_MODE" 
    ? "✅ Scoring approaches with weighted-demand" 
    : "⏭️  Bypassed (Emergency/Fallback)";
  console.log(`   Status: ${member1Status}`);

  // ─────────────────────────────────────────────────────────────
  // MEMBER 2: CORE OPTIMIZER (Selection)
  // ─────────────────────────────────────────────────────────────
  console.log("\n👤 MEMBER 2 (Core Optimizer):");
  if (hasEmergency) {
    console.log(`   Status: ✅ EMERGENCY MODE - Prioritizing ${emergencyToken.targetPhaseId}`);
  } else if (orchestrationResult.executionPath === "NORMAL_MODE") {
    console.log(`   Status: ✅ MAX-PRESSURE - Selected ${orchestrationResult.finalCommand.targetPhaseId}`);
  } else {
    console.log(`   Status: ⏭️  Bypassed (Low Confidence)`);
  }

  // ─────────────────────────────────────────────────────────────
  // MEMBER 3: INVARIANT GUARDIAN (Safety)
  // ─────────────────────────────────────────────────────────────
  console.log("\n👤 MEMBER 3 (Invariant Guardian):");
  console.log(`   Conflict Check: ${orchestrationResult.safetyValidationPassed ? "✅ PASSED" : "❌ FAILED"}`);
  console.log(`   Target Phase: ${orchestrationResult.finalCommand.targetPhaseId}`);
  console.log(`   Clearances: Yellow=${orchestrationResult.finalCommand.clearanceIntervals.yellowSeconds}s, AllRed=${orchestrationResult.finalCommand.clearanceIntervals.allRedSeconds}s`);

  // ─────────────────────────────────────────────────────────────
  // MEMBER 4: DATA & RESILIENCE (Fallback Logic)
  // ─────────────────────────────────────────────────────────────
  console.log("\n👤 MEMBER 4 (Data & Resilience):");
  const resilenceStatus = orchestrationResult.executionPath === "FALLBACK_MODE"
    ? `✅ HIJACKED - Confidence ${(confidenceScore * 100).toFixed(1)}% < 70% → Historical Fallback`
    : `✅ Passed - Using ${orchestrationResult.executionPath === "EMERGENCY_MODE" ? "EMERGENCY_MODE" : "optimized data"}`;
  console.log(`   Status: ${resilenceStatus}`);

  // ─────────────────────────────────────────────────────────────
  // DECISION CHAIN (Audit Trail)
  // ─────────────────────────────────────────────────────────────
  console.log("\n📋 Decision Chain:");
  orchestrationResult.reasonChain.forEach((reason, idx) => {
    console.log(`   ${idx + 1}. ${reason}`);
  });

  // ─────────────────────────────────────────────────────────────
  // LAYER 4: ACTUATION (Hardware Command)
  // ─────────────────────────────────────────────────────────────
  console.log("\n🚦 LAYER 4 (Actuation Command):");
  console.log(`   Command ID: ${orchestrationResult.finalCommand.commandId}`);
  console.log(`   Target Phase: ${orchestrationResult.finalCommand.targetPhaseId}`);
  console.log(`   Duration: ${orchestrationResult.finalCommand.durationSeconds}s`);
  console.log(`   Execution Mode: ${orchestrationResult.finalCommand.executionMode}`);
  console.log(`   Path: ${orchestrationResult.executionPath}`);

  // Status indicator
  const statusIcon = orchestrationResult.executionPath === "NORMAL_MODE" 
    ? "🟢" 
    : orchestrationResult.executionPath === "EMERGENCY_MODE"
    ? "🚨"
    : "⚠️";
  console.log(`   ${statusIcon} Status: ${orchestrationResult.safetyValidationPassed ? "SAFE TO EXECUTE" : "SAFETY VIOLATION"}`);
}

console.log("═".repeat(70));
console.log("🔄 Starting continuous pipeline...\n");

runPipeline();
const pipelineInterval = setInterval(runPipeline, 8000);

// Graceful shutdown
process.on("SIGINT", () => {
  clearInterval(pipelineInterval);
  console.log("\n\n✋ Pipeline stopped. Goodbye!");
  process.exit(0);
});
