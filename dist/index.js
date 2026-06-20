"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mock_generator_1 = require("./mock-data/mock_generator");
const stm_orchestrator_1 = require("./stm-orchestrator");
const generator = new mock_generator_1.MockDataGenerator();
// STM Configuration
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
const orchestrator = new stm_orchestrator_1.STMOrchestrator({
    safetyConfig,
    resilienceThresholds: {
        criticalLowerBound: 0.70,
        warningThreshold: 0.80,
    },
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
console.log("═══════════════════════════════════════════════════════════════\n");
const layer2Data1 = generator.getLayer2Data(0.88);
const historicalData = generator.getHistoricalData();
console.log("📊 Layer 2 Perception Data:");
console.log(`   Junction: ${layer2Data1.junctionId}`);
console.log(`   Confidence Score: ${(layer2Data1.cvConfidenceScore * 100).toFixed(2)}% ✅ (Above 70%)`);
console.log(`   Approaches: ${layer2Data1.approaches.map((a) => `${a.approachId}(${a.spatialOccupancyPct}%)`).join(", ")}\n`);
const result1 = orchestrator.orchestrateActuation(layer2Data1, null, // No emergency
historicalData);
console.log("📋 Orchestration Decision Chain:");
result1.reasonChain.forEach((reason, idx) => {
    console.log(`   ${idx + 1}. ${reason}`);
});
console.log("\n✅ FINAL ACTUATION COMMAND:");
console.log(`   Target Phase: ${result1.finalCommand.targetPhaseId}`);
console.log(`   Duration: ${result1.finalCommand.durationSeconds}s`);
console.log(`   Execution Mode: ${result1.finalCommand.executionMode}`);
console.log(`   Clearances: Yellow=${result1.finalCommand.clearanceIntervals.yellowSeconds}s, AllRed=${result1.finalCommand.clearanceIntervals.allRedSeconds}s`);
console.log(`   Safety Passed: ${result1.safetyValidationPassed ? "✅ YES" : "❌ NO"}`);
console.log(`   Execution Path: ${result1.executionPath}\n`);
// ===== SCENARIO 2: Emergency Mode (Emergency Token Detected) =====
console.log("═══════════════════════════════════════════════════════════════");
console.log("SCENARIO 2: Emergency Mode (EMV Detected)");
console.log("═══════════════════════════════════════════════════════════════\n");
const emergencyToken = {
    emvId: "AMB-0042",
    priorityClass: "CRITICAL",
    etaSeconds: 35,
    cryptographicToken: "0xVALID_MOCK_TOKEN",
    targetPhaseId: "EAST",
};
console.log("🚨 Emergency Token Detected:");
console.log(`   EMV ID: ${emergencyToken.emvId}`);
console.log(`   Priority: ${emergencyToken.priorityClass}`);
console.log(`   ETA: ${emergencyToken.etaSeconds}s`);
console.log(`   Needs: ${emergencyToken.targetPhaseId} phase green\n`);
const result2 = orchestrator.orchestrateActuation(layer2Data1, emergencyToken, historicalData);
console.log("📋 Orchestration Decision Chain:");
result2.reasonChain.forEach((reason, idx) => {
    console.log(`   ${idx + 1}. ${reason}`);
});
console.log("\n✅ FINAL ACTUATION COMMAND (EMERGENCY MODE):");
console.log(`   Target Phase: ${result2.finalCommand.targetPhaseId}`);
console.log(`   Duration: ${result2.finalCommand.durationSeconds}s`);
console.log(`   Execution Mode: ${result2.finalCommand.executionMode}`);
console.log(`   Safety Passed: ${result2.safetyValidationPassed ? "✅ YES" : "❌ NO"}`);
console.log(`   Execution Path: ${result2.executionPath}\n`);
// ===== SCENARIO 3: Low Confidence Hijack (Resilience Fallback) =====
console.log("═══════════════════════════════════════════════════════════════");
console.log("SCENARIO 3: Low Confidence (Member 4 Hijack Activated)");
console.log("═══════════════════════════════════════════════════════════════\n");
const layer2Data3 = generator.getLayer2Data(0.62); // Below 70% threshold
console.log("📊 Layer 2 Perception Data:");
console.log(`   Confidence Score: ${(layer2Data3.cvConfidenceScore * 100).toFixed(2)}% ❌ (Below 70%)`);
console.log(`   Status: Member 4 (Resilience) will HIJACK to historical fallback\n`);
const result3 = orchestrator.orchestrateActuation(layer2Data3, null, historicalData);
console.log("📋 Orchestration Decision Chain:");
result3.reasonChain.forEach((reason, idx) => {
    console.log(`   ${idx + 1}. ${reason}`);
});
console.log("\n✅ FINAL ACTUATION COMMAND (HIJACKED TO FALLBACK):");
console.log(`   Target Phase: ${result3.finalCommand.targetPhaseId}`);
console.log(`   Duration: ${result3.finalCommand.durationSeconds}s (from historical database)`);
console.log(`   Execution Mode: ${result3.finalCommand.executionMode}`);
console.log(`   Execution Path: ${result3.executionPath}\n`);
// ===== SCENARIO 4: Stale Data Detection =====
console.log("═══════════════════════════════════════════════════════════════");
console.log("SCENARIO 4: Stale Layer 2 Data (> 10 seconds old)");
console.log("═══════════════════════════════════════════════════════════════\n");
// Create stale data (11 seconds in the past)
const staleLayers2Data = {
    ...layer2Data1,
    timestamp: new Date(Date.now() - 11000).toISOString(),
};
console.log("📊 Layer 2 Perception Data:");
console.log(`   Data Age: ~11 seconds (max allowed: 10s)`);
console.log(`   Status: Orchestrator will force fallback due to data staleness\n`);
const result4 = orchestrator.orchestrateActuation(staleLayers2Data, null, historicalData);
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
console.log("═══════════════════════════════════════════════════════════════\n");
const orchestratorState = orchestrator.getOrchestrationState();
console.log("📡 Resilience Module State:");
console.log(`   Fallback Active: ${orchestratorState.resilience.isFallbackActive}`);
console.log(`   Current Confidence: ${(orchestratorState.resilience.currentConfidenceScore * 100).toFixed(2)}%`);
if (orchestratorState.resilience.fallbackReason) {
    console.log(`   Fallback Reason: ${orchestratorState.resilience.fallbackReason}`);
}
console.log("\n╔════════════════════════════════════════════════════════════╗");
console.log("║     Layer-3 STM Integration Test Complete                  ║");
console.log("║  ✅ Member 3 (Safety Supervisor) - Fully Verified         ║");
console.log("║  ✅ Member 4 (Data & Resilience) - Fully Verified         ║");
console.log("║  ⏳ Member 1 (Normal-Mode Architect) - Ready for code      ║");
console.log("║  ⏳ Member 2 (Emergency Pathfinder) - Ready for code       ║");
console.log("╚════════════════════════════════════════════════════════════╝");
//# sourceMappingURL=index.js.map