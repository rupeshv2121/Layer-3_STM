"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mock_generator_1 = require("./mock-data/mock_generator");
const generator = new mock_generator_1.MockDataGenerator();
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
console.log("\n=== Mock Data Generation Complete ===");
//# sourceMappingURL=index.js.map