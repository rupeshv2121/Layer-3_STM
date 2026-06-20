"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mock_generator_1 = require("./mock-data/mock_generator");
const resilience_handler_1 = require("./resilience-handler");
const generator = new mock_generator_1.MockDataGenerator();
const resilience = new resilience_handler_1.ResilienceHandler();
console.log("=== Layer-3 STM Mock Data Generation ===\n");
// Generate Layer 2 Perception Data
console.log("--- Layer 2 Payload (Perception Data) ---");
const layer2Data = generator.getLayer2Data();
console.log(JSON.stringify(layer2Data, null, 2));
// Check for Emergency Data
console.log("\n--- Emergency Token ---");
const emergency = generator.triggerEmergency();
if (emergency) {
    console.log(JSON.stringify(emergency, null, 2));
}
else {
    console.log("No emergency detected");
}
// Get Historical Data
console.log("\n--- Historical Timing Plan Data ---");
const historicalData = generator.getHistoricalData();
console.log(JSON.stringify(historicalData, null, 2));
// ===== TEST MEMBER 4: DATA & RESILIENCE LAYER =====
console.log("\n=== Member 4: Data & Resilience Layer Test ===\n");
// Test Scenario 1: Confidence ABOVE 70% (Normal Operation)
console.log("--- Test 1: HIGH Confidence (0.88) - Should use optimized plan ---");
const highConfidenceData = generator.getLayer2Data(0.88);
const resilientDecision1 = resilience.evaluateConfidenceAndDecide(highConfidenceData, historicalData);
console.log(`Action: ${resilientDecision1.action}`);
console.log(`Confidence: ${(resilientDecision1.confidenceScore * 100).toFixed(2)}%`);
console.log(`Reason: ${resilientDecision1.reason}\n`);
// Test Scenario 2: Confidence BELOW 70% (Hijack Activated)
console.log("--- Test 2: LOW Confidence (0.65) - Should HIJACK to historical fallback ---");
const lowConfidenceData = generator.getLayer2Data(0.65);
const resilientDecision2 = resilience.evaluateConfidenceAndDecide(lowConfidenceData, historicalData);
console.log(`Action: ${resilientDecision2.action}`);
console.log(`Confidence: ${(resilientDecision2.confidenceScore * 100).toFixed(2)}%`);
console.log(`Reason: ${resilientDecision2.reason}`);
console.log(`Historical Plans Override: ${resilientDecision2.historicalPlanOverride?.length} plans provided\n`);
// Test Scenario 3: Verify hijackAndEnforceHistorical enforcement
console.log("--- Test 3: Verify HIJACK enforcement on actuation command ---");
const proposedCommand = {
    junctionId: "DEL_DL_ITO_01",
    commandId: "CMD-001",
    targetPhaseId: "NORTH",
    durationSeconds: 60, // Proposed optimized duration
    clearanceIntervals: { yellowSeconds: 3, allRedSeconds: 2 },
    executionMode: "NORMAL_MAX_PRESSURE",
};
// Get the state after hijack was activated
const resilientState = resilience.getState();
console.log(`Fallback Active: ${resilientState.isFallbackActive}`);
console.log(`Fallback Reason: ${resilientState.fallbackReason}`);
// Apply the hijack enforcement
const hijackedCommand = resilience.hijackAndEnforceHistorical(proposedCommand, historicalData);
console.log(`Original Duration: ${proposedCommand.durationSeconds}s`);
console.log(`Hijacked Duration: ${hijackedCommand.durationSeconds}s (from historical: 45s for NORTH)`);
console.log(`Execution Mode Changed: ${proposedCommand.executionMode} → ${hijackedCommand.executionMode}\n`);
// Test Scenario 4: Recovery (confidence recovers above 70%)
console.log("--- Test 4: Confidence RECOVERS (0.75) - Should exit fallback ---");
const recoveredConfidenceData = generator.getLayer2Data(0.75);
const resilientDecision4 = resilience.evaluateConfidenceAndDecide(recoveredConfidenceData, historicalData);
console.log(`Action: ${resilientDecision4.action}`);
console.log(`Confidence: ${(resilientDecision4.confidenceScore * 100).toFixed(2)}%`);
console.log(`Reason: ${resilientDecision4.reason}\n`);
const finalState = resilience.getState();
console.log(`Fallback Active After Recovery: ${finalState.isFallbackActive}`);
console.log("\n=== Mock Data Generation & Member 4 Verification Complete ===");
//# sourceMappingURL=index.js.map