# Layer-3 STM (Signal Timing Module) - Complete Project Guide

## 🎯 Project Overview

**Layer-3 STM** is a traffic signal control orchestration system that manages intelligent decision-making for traffic light timing at intersections. It's built in TypeScript and uses a **Member-based pipeline architecture** where each "Member" handles a specific responsibility.

### Repository
- **Name**: `layer-3_stm`
- **Type**: TypeScript/Node.js
- **Purpose**: Intelligent traffic signal timing with safety guarantees and resilience handling

---

## 🏗️ Architecture Overview - "The 4 Members Pipeline"

The system is designed as a **4-member collaboration pipeline**:

```
Layer 2 Data (Perception) 
    ↓
Member 1: Normal-Mode Architect 
    ↓
Member 2: Emergency Pathfinder 
    ↓
Member 3: Safety Supervisor (Invariant Guardian) 
    ↓
Member 4: Data & Resilience Handler 
    ↓
Layer 4 (Hardware Actuation)
```

### Member Responsibilities

| Member | File | Role | Status |
|--------|------|------|--------|
| **1** | `stm-orchestrator.ts` (placeholder) | Generate optimization proposals using Max-Pressure algorithm | ⏳ TODO |
| **2** | `stm-orchestrator.ts` (placeholder) | Handle emergency vehicle (EMV) requests with Green Corridor logic | ⏳ TODO |
| **3** | `safety-supervisor.ts` | ✅ Validate safety constraints & enforce clearance intervals | ✅ DONE |
| **4** | `resilience-handler.ts` | ✅ Monitor confidence scores & hijack to fallback if needed | ✅ DONE |

---

## 📂 Project Structure & Reading Order

### Start Here: Entry Point
**File**: `src/index.ts`

This is where the orchestrator is configured and tested. It demonstrates:
1. Creating safety configuration
2. Initializing the orchestrator
3. Running 4 scenarios to test the system

**Read this first to understand the big picture!**

---

### Core Files (Read in This Order)

#### 1. **Types & Data Structures** 
**File**: `src/types/types.ts`

**What it defines**:
- `Layer2Payload` - Input from camera perception system
- `ActuationCommand` - Output to hardware
- `EmergencyToken` - Emergency vehicle signals
- `OptimizationProposal` - Member 1's output
- `EmergencyResponse` - Member 2's output
- `HistoricalTimingPlan` - Fallback database

**Key constants**:
- `VEHICLE_WEIGHTS` - Weight multipliers for different vehicle types (Car=1.0, Bus=3.0, Ambulance=10.0)

**Read this second** - understand the data contracts

---

#### 2. **Master Orchestrator** 
**File**: `src/stm-orchestrator.ts`

**What it does**:
- Coordinates all 4 members
- Implements the decision pipeline
- Manages data flow between stages

**Key method**: `orchestrateActuation()`
- Stage 1: Check if Layer 2 data is stale (>10 seconds old)
- Stage 2: Resilience check (Member 4 entry)
- Stage 3: Decide between normal mode (Member 1) or emergency (Member 2)
- Stage 4: Safety validation (Member 3 entry)
- Stage 5: Build final command
- Stage 6: Resilience enforcement (Member 4 final)

**TODOs for Members 1 & 2** are marked with comments

**Read this third** - understand the orchestration flow

---

#### 3. **Safety Supervisor** 
**File**: `src/safety-supervisor.ts` ✅ COMPLETE

**What it does** (Member 3):
- Prevents conflicting green lights simultaneously
- Enforces minimum green time before phase change
- Validates clearance intervals (yellow & all-red times)
- Protects pedestrian walk phases

**Key rules**:
```
Rule 1: No conflicting phases active at same time
Rule 2: Phase transitions must include:
        - Minimum green time (minGreenEnforced)
        - Yellow clearance (minYellowSeconds)
        - All-red clearance (minAllRedSeconds)
Rule 3: Don't interrupt pedestrian walk phases prematurely
```

**Configuration** (from index.ts):
```javascript
safetyConfig = {
    minYellowSeconds: 3,
    minAllRedSeconds: 2,
    minPedestrianWalkSeconds: 8,
    minGreenEnforced: 10,
    conflictMatrix: {
        NORTH: ["SOUTH"],  // NORTH conflicts with SOUTH
        SOUTH: ["NORTH"],
        EAST: ["WEST"],
        WEST: ["EAST"],
    }
}
```

**Read this fourth** - understand safety constraints

---

#### 4. **Resilience Handler** 
**File**: `src/resilience-handler.ts` ✅ COMPLETE

**What it does** (Member 4):
- Monitors CV (Computer Vision) confidence score from cameras
- If confidence < 70% (critical threshold), **HIJACKS** the system
- Forces fallback to historical database timings
- Graceful degradation when perception fails

**Decision logic**:
```
if (confidence < 70%)  → SWITCH_TO_HISTORICAL_FALLBACK
else if (confidence < 80%) → USE_OPTIMIZED_PLAN (but warn)
else → USE_OPTIMIZED_PLAN (normal operation)
```

**Key thresholds** (configurable):
- `criticalLowerBound: 0.70` (70%) - Below this, force fallback
- `warningThreshold: 0.80` (80%) - Monitor closely

**Read this fifth** - understand resilience & fallback

---

#### 5. **Mock Data Generator** 
**File**: `src/mock-data/mock_generator.ts`

**What it does**:
- Generates fake Layer 2 perception data for testing
- Creates random vehicle detections per approach
- Generates historical timing plans
- Can simulate emergency tokens

**Used in**: `index.ts` for scenario testing

**Read this last** - for understanding test data generation

---

## 🔄 Complete Data Flow (With Real Scenario)

### Scenario: Normal Operations (High Confidence, No Emergency)

```
INPUT: Layer 2 Data
├─ junctionId: "DEL_DL_ITO_01"
├─ timestamp: "2026-06-21T00:40:54Z"
├─ cvConfidenceScore: 0.88 (88%) ✅ HIGH
└─ approaches: [
   ├─ NORTH: 45% occupancy, 8 buses, 12 cars
   ├─ SOUTH: 30% occupancy, ...
   ├─ EAST: 60% occupancy, ...
   └─ WEST: 35% occupancy, ...

STAGE 1: Data Staleness Check
├─ Data age: 0.5 seconds (< 10s max) ✅ FRESH
└─ → Continue to Stage 2

STAGE 2: Resilience Check (Member 4)
├─ Confidence: 88% > 70% threshold ✅ 
├─ → USE_OPTIMIZED_PLAN (fallback not active)
└─ → Continue to Stage 3

STAGE 3: Optimization Decision
├─ Emergency token? NO
├─ → Use Member 1 (Normal Mode)
├─ Member 1 analyzes approaches, finds EAST has highest occupancy (60%)
├─ Proposes: "EAST phase, 45 seconds green"
└─ Execution Path: NORMAL_MODE

STAGE 4: Safety Validation (Member 3)
├─ Check conflicting phases: 
│  └─ EAST doesn't conflict with itself ✅
├─ Check phase transition:
│  ├─ Currently: NORTH is green
│  └─ Proposed: EAST
│  ├─ NORTH conflicts with SOUTH? YES, but SOUTH not active ✅
│  ├─ Min green enforced (10s) met? YES ✅
│  └─ Insert clearances: Yellow=3s, AllRed=2s ✅
└─ Safety: PASSED

STAGE 5: Build Final Command
├─ targetPhaseId: "EAST"
├─ durationSeconds: 45
├─ executionMode: "NORMAL_MAX_PRESSURE"
├─ clearanceIntervals:
│  ├─ yellowSeconds: 3
│  └─ allRedSeconds: 2
└─ commandId: "CMD-1719000054996"

STAGE 6: Resilience Enforcement (Member 4)
├─ Fallback active? NO
└─ → Return proposed command as-is ✅

OUTPUT: ActuationCommand
├─ Command: Switch EAST green for 45 seconds
├─ Insert 3s yellow before cut-off
├─ Insert 2s all-red after
└─ Mode: NORMAL_MAX_PRESSURE (AI-optimized)
```

---

### Scenario: Emergency Mode (EMV Detected)

```
INPUT: 
├─ Layer 2 Data (88% confidence)
└─ Emergency Token:
   ├─ emvId: "AMB-0042" (Ambulance)
   ├─ priorityClass: "CRITICAL"
   ├─ etaSeconds: 35
   └─ targetPhaseId: "EAST"

STAGES 1-2: Same as above (data fresh, confidence OK)

STAGE 3: Optimization Decision
├─ Emergency token? YES ✅
├─ → Use Member 2 (Emergency Mode)
├─ Member 2 calculates:
│  ├─ Conflict Index = (CRITICAL multiplier × 100) - ETA
│  ├─ = (3 × 100) - 35 = 265
│  └─ Urgency: CRITICAL
├─ Proposes: "EAST phase, 60 seconds green" (extended for corridor)
└─ Execution Path: EMERGENCY_MODE

STAGE 4: Safety Validation (Member 3)
├─ Same checks, but emergency overrides some constraints
└─ Safety: PASSED (with emergency override)

STAGES 5-6: Same as normal mode

OUTPUT: ActuationCommand
├─ Command: Switch EAST green for 60 seconds (extended)
├─ executionMode: "GREEN_CORRIDOR" (emergency mode)
└─ Full clearances applied
```

---

### Scenario: Low Confidence Hijack (Fallback Activated)

```
INPUT: Layer 2 Data
├─ cvConfidenceScore: 0.62 (62%) ❌ LOW
└─ (Cameras have poor visibility - rain, glare, etc.)

STAGE 1: Data Staleness Check
└─ Data is fresh ✅

STAGE 2: Resilience Check (Member 4) 🔴 HIJACK
├─ Confidence: 62% < 70% critical threshold ❌
├─ ACTION: SWITCH_TO_HISTORICAL_FALLBACK
├─ Mark: isFallbackActive = true
├─ Reason: "CONFIDENCE_CRITICAL: 62.00% < 70% threshold"
└─ → EARLY EXIT (Skip Stages 3-6)

OUTPUT: Fallback Command (Immediate)
├─ Source: Historical Database
├─ Timing: Use proven historical patterns
├─ Example:
│  ├─ Phase: NORTH (first in historical data)
│  ├─ Duration: 45 seconds (historical recommendation)
│  └─ Mode: "HISTORICAL_FALLBACK"
└─ Safety: GUARANTEED (pre-tested timings)

Result: System degrades gracefully to safe, predictable behavior
```

---

## 🧪 Test Scenarios in index.ts

The project runs 4 integration test scenarios:

| # | Scenario | Input | Expected Result |
|---|----------|-------|-----------------|
| **1** | Normal Operation | Confidence 88% | NORMAL_MODE, EAST phase |
| **2** | Emergency Mode | Confidence 88% + EMV | EMERGENCY_MODE, EAST extended |
| **3** | Low Confidence Hijack | Confidence 62% | HISTORICAL_FALLBACK, NORTH phase |
| **4** | Stale Data | Data age 11s (>10s limit) | HISTORICAL_FALLBACK, forced |

### Run Tests
```bash
npm run dev              # Run with ts-node
npm run build           # Compile to JavaScript
npm start               # Run compiled version
```

---

## 🔴 What's Incomplete (TODOs)

### Member 1: Normal-Mode Architect
**File**: `src/stm-orchestrator.ts` → `generateNormalModeProposal()`

**What needs to be implemented**:
- Person-centric weighted vehicle counting
  - Weight each vehicle by `VEHICLE_WEIGHTS[type]` and occupancy
- Max-Pressure formula:
  ```
  Priority Score = Sum of (Vehicle Weight × Count) for each approach
  Proposed Green Time = Calculate based on queue buildup rate
  ```
- Return `OptimizationProposal` with:
  - `approachId`: Which phase should be green
  - `priorityScore`: Weighted vehicle count
  - `proposedGreenTime`: Duration calculation

---

### Member 2: Emergency Pathfinder
**File**: `src/stm-orchestrator.ts` → `generateEmergencyResponse()`

**What needs to be implemented**:
- Green Corridor timing calculations
- Conflict Index refinement (currently `priority * 100 - eta`)
- Determine optimal green duration for emergency vehicle
- Return `EmergencyResponse` with detailed planning

---

## 📊 Key Concepts

### Confidence Score
- From Layer 2 (camera perception system)
- Range: 0.0 to 1.0 (0% to 100%)
- **Critical threshold: 70%** - Below this, force fallback
- **Warning threshold: 80%** - Monitor closely

### Clearance Intervals
- **Yellow**: Warning period when signal changes from green to red (typically 3-5 seconds)
- **All-Red**: Safety gap where all conflicting phases are red (typically 2-3 seconds)

### Execution Modes
1. **NORMAL_MAX_PRESSURE**: AI-optimized timing
2. **GREEN_CORRIDOR**: Emergency mode (extended green for EMV)
3. **HISTORICAL_FALLBACK**: Using pre-calculated timings from database
4. **SAFE_DEFAULT**: Hardcoded safe fallback if system fails

### Vehicle Weights
- Motorcycle: 0.5 (light, quick)
- Car: 1.0 (baseline)
- AutoRickshaw: 1.2
- MiniTruck: 2.0
- Bus: 3.0 (heavier)
- HeavyTruck: 4.0 (very heavy)
- **Ambulance: 10.0** (emergency - highest priority)

---

## 🛠️ Development Workflow

### To Add a Feature:
1. Update **types.ts** if new data structures needed
2. Implement logic in the appropriate member file
3. Update **stm-orchestrator.ts** to call new methods
4. Test in **index.ts** with scenarios
5. Run: `npm run dev`

### To Debug:
- `reasonChain` array in `OrchestratorResult` shows decision audit trail
- `executionPath` shows which mode was used (NORMAL, EMERGENCY, FALLBACK)
- Enable console.log in individual member functions

---

## 📝 Configuration Reference

From `index.ts`:
```javascript
const safetyConfig = {
    minYellowSeconds: 3,          // Minimum yellow light duration
    minAllRedSeconds: 2,          // Minimum all-red safety gap
    minPedestrianWalkSeconds: 8,  // Minimum pedestrian walk duration
    minGreenEnforced: 10,         // Minimum green before transition
    conflictMatrix: {             // Which phases conflict
        NORTH: ["SOUTH"],
        SOUTH: ["NORTH"],
        EAST: ["WEST"],
        WEST: ["EAST"],
    },
};

const resilienceThresholds = {
    criticalLowerBound: 0.70,     // Hijack threshold (70%)
    warningThreshold: 0.80,       // Warning zone (80%)
};

const maxDataAgeSeconds = 10;     // Force fallback if data older
const defaultPhaseIfNoProposal = "NORTH";  // Safe default
```

---

## 🎓 Learning Path

### For New Team Members:
1. **Day 1**: Read this guide + `index.ts` + `types.ts`
2. **Day 2**: Trace through `stm-orchestrator.ts` manually
3. **Day 3**: Study `safety-supervisor.ts` and `resilience-handler.ts`
4. **Day 4**: Run scenarios and understand the outputs
5. **Day 5**: Implement Member 1 (Normal-Mode Architect)

### For Understanding Safety:
→ Read `safety-supervisor.ts` first

### For Understanding Resilience:
→ Read `resilience-handler.ts` first

### For Implementing Features:
→ Understand Members 1 & 2 TODOs in `stm-orchestrator.ts`

---

## 🚀 Next Steps

1. **Implement Member 1**: Max-Pressure optimization
2. **Implement Member 2**: Emergency pathfinding
3. **Add integration tests** for edge cases
4. **Deploy to real junction** with safety validation
5. **Monitor confidence scores** in production

---

## 📞 Quick Reference

| Term | Definition |
|------|-----------|
| **Layer 2** | Perception/camera system that inputs data |
| **Layer 3** | This project - signal timing orchestration |
| **Layer 4** | Hardware - the actual traffic lights |
| **Member 1-4** | Four specialized decision-making modules |
| **EMV** | Emergency Vehicle (ambulance, fire truck) |
| **Hijack** | When Member 4 forces historical fallback |
| **Max-Pressure** | Algorithm that prioritizes based on queue buildup |
| **Conflict Index** | Priority measure for emergency routing |
| **Green Corridor** | Coordinated green lights for emergency vehicles |