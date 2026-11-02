# ARGUS_IMPROVEMENT_PLAN.md

**Project**: ARGUS — Immersive 3D Engineering Environment
**Based on**: ARGUS_CODEBASE_AUDIT.md
**Approach**: Incremental, preserving working code; no wholesale rewrites

---

## IMPROVEMENT PHILOSOPHY

1. **Preserve working code** — The Engineering Studio, stores, and machinery system are solid foundations
2. **Incremental delivery** — Each milestone adds verifiable functionality
3. **Honest placeholders** — Never fake features; use `NotBuilt` pattern for incomplete modules
4. **Provisional flags** — All geometry remains `provisional: true` until CAD supplied
5. **Test-first where practical** — Store logic already tested; extend for new features

---

## PHASE A: ARCHITECTURE FOUNDATIONS (Week 1)

### A.1 Parent-Child Transform System
**File**: `src/store/assemblyStore.ts`, `src/engine/Scene.tsx`, `src/engine/ComponentNode.tsx`

```typescript
// New: compute world transform from local + parent
interface MachineComponent {
  // ...existing
  localPosition: Vec3;    // Relative to parent
  localRotation: Vec3;    // Relative to parent
  localScale: Vec3;       // Relative to parent
  // position/rotation/scale become computed world values
}
```

**Tasks**:
- [ ] Add `localPosition`, `localRotation`, `localScale` to `MachineComponent` type
- [ ] Add `computeWorldTransform(id): { position, rotation, scale }` utility
- [ ] Update `ComponentNode` to use computed world transform for rendering
- [ ] Update `TransformControls` to edit local transform when parent exists
- [ ] Update `setTransform` to write local transform
- [ ] Update hierarchy panel to show "(local)" indicator
- [ ] Add "Move with parent" toggle per component
- [ ] Migration: convert existing flat assembly to local transforms (one-time)

**Verification**: Move base frame → motor, shaft, bearings, load disc all move together

### A.2 Configuration Persistence
**File**: `src/store/assemblyStore.ts` (add), `src/services/configPersistence.ts` (new)

```typescript
// New service
interface SavedConfiguration {
  version: number;
  name: string;
  description?: string;
  createdAt: string;        // ISO 8601
  components: MachineComponent[];
  viewState: ViewState;     // Camera, explode, etc.
}
```

**Tasks**:
- [ ] Create `configPersistence.ts` with IndexedDB (idb) or localStorage
- [ ] Add `saveConfiguration(name, description?)` to assemblyStore
- [ ] Add `loadConfiguration(id)` to assemblyStore
- [ ] Add `exportConfiguration(id): string` (JSON)
- [ ] Add `importConfiguration(json: string)` to assemblyStore
- [ ] Add `listConfigurations(): SavedConfiguration[]`
- [ ] Add `deleteConfiguration(id)`
- [ ] Wire into Command Centre "Recent projects" card
- [ ] Add Configuration page (M04) with save/load/import/export UI

**Verification**: Save config → refresh page → load config → assembly identical

### A.3 Component Library & Add/Remove Workflow
**File**: `src/machinery/componentLibrary.ts` (new), `src/components/ComponentPalette.tsx` (new)

**Tasks**:
- [ ] Define component templates (type, default dimensions, material, category)
- [ ] Create `ComponentPalette` panel (left of hierarchy or bottom)
- [ ] Drag-to-add or click-to-add at cursor position
- [ ] Auto-generate unique IDs (`ARGUS-TYPE-NNN`)
- [ ] Add to assemblyStore: `addComponent(templateId, position?)`
- [ ] Update hierarchy to show library categories

---

## PHASE B: ENGINEERING STUDIO ENHANCEMENTS (Week 2)

### B.1 Component Isolation (Solo Mode)
**File**: `src/store/viewStore.ts`, `src/engine/Scene.tsx`, `src/components/HierarchyPanel.tsx`

**Tasks**:
- [ ] Add `isolatedId: string | null` to viewStore
- [ ] Add `isolate(id)` / `clearIsolation()` actions
- [ ] In `Scene.tsx`: filter components — show only isolated + its ancestors
- [ ] Hierarchy: "Solo" button per row (when not isolated)
- [ ] Viewport badge: "ISOLATED: {name}" with exit button
- [ ] Shortcut: `I` to isolate selected

### B.2 Exploded View Animation
**File**: `src/store/assemblyStore.ts`, `src/engine/Scene.tsx`

**Tasks**:
- [ ] Add `explodeTarget: number` and `explodeAnimating: boolean` to assemblyStore
- [ ] Add `animateExplode(target: number, durationMs = 800)` using `requestAnimationFrame`
- [ ] Stagger: each component starts at `delay = index * 30ms`
- [ ] Easing: `easeOutCubic`
- [ ] Toolbar: "Animate" checkbox next to explode slider
- [ ] Disable gizmo during animation

### B.3 Measurement Tools
**File**: `src/components/MeasurementTools.tsx` (new), `src/store/viewStore.ts`

**Tasks**:
- [ ] Add `measurementMode: 'none' | 'distance' | 'angle' | 'diameter'` to viewStore
- [ ] Click two points → show distance label in world space
- [ ] Click three points → show angle
- [ ] Click two points on cylinder → show diameter (project to plane)
- [ ] Measurements persist in configuration
- [ ] Toolbar: measurement mode buttons

### B.4 Section / Clipping Plane
**File**: `src/components/SectionPlane.tsx` (new), `src/engine/Scene.tsx`

**Tasks**:
- [ ] Add `clippingPlanes: THREE.Plane[]` to viewStore
- [ ] UI: add up to 3 clipping planes (X, Y, Z axes)
- [ ] Per-plane: enable, offset, normal flip
- [ ] Apply to all materials via `material.clippingPlanes`
- [ ] Visual gizmo for plane (semi-transparent grid)

### B.5 Visual Identity Polish
**File**: `src/styles/index.css`, `src/app/Shell.tsx`, `src/engine/Viewport.tsx`

**Tasks**:
- [ ] Add subtle grid pattern to panel backgrounds (`background-image: linear-gradient...`)
- [ ] Thin technical border on viewport (1px cyan/10%)
- [ ] Panel expand/collapse transitions (already 150ms)
- [ ] Selection flash animation (emissive pulse 200ms)
- [ ] Tooltip system for toolbar buttons (already title attr)
- [ ] Viewport corner coordinate display (world X/Y/Z)

---

## PHASE C: SENSOR MAPPING SYSTEM (Week 3)

### C.1 Sensor Types & Definitions
**File**: `src/types/sensors.ts` (new), `src/machinery/sensorDefinitions.ts` (new)

```typescript
type SensorType = 'vibration' | 'temperature' | 'rpm' | 'current' | 'acoustic';

interface SensorDefinition {
  type: SensorType;
  label: string;
  unit: string;
  icon: string;           // Lucide or custom SVG
  color: string;          // Cyan, amber, blue, etc.
  defaultRange: [number, number];
}

interface VirtualSensor {
  id: string;             // SNS-XXX
  definition: SensorDefinition;
  componentId: string;    // Mounted on
  localPosition: Vec3;    // Relative to component
  localRotation: Vec3;
  visible: boolean;
  locked: boolean;
}
```

### C.2 Sensor Placement UI
**File**: `src/components/SensorPlacement.tsx` (new), `src/pages/SensorMappingPage.tsx` (new)

**Tasks**:
- [ ] Sensor palette (left panel): 5 sensor types with icons
- [ ] Click sensor → enter placement mode (ghost preview follows cursor)
- [ ] Raycast to component surface → snap preview to surface normal
- [ ] Click to place → create `VirtualSensor` with local transform
- [ ] Selected sensor: show gizmo for move/rotate
- [ ] Properties panel: sensor ID, type, range, component association
- [ ] Save/load with configuration

### C.3 Sensor Visualization
**File**: `src/engine/SensorNode.tsx` (new), `src/machinery/geometry.tsx`

**Tasks**:
- [ ] Distinct marker per sensor type (accelerometer cube, thermocouple bead, etc.)
- [ ] Color-coded by type
- [ ] Label with sensor ID
- [ ] Hover → show type, unit, component
- [ ] Status indicator (green/grey) for simulation connection

---

## PHASE D: GESTURE RECOGNITION (Week 4)

### D.1 MediaPipe Integration
**File**: `src/gestures/handTracker.ts` (new), `src/gestures/gestureRecognizer.ts` (new)

**Dependencies**: `@mediapipe/tasks-vision` (hand landmarker)

**Tasks**:
- [ ] Install `@mediapipe/tasks-vision`
- [ ] Create `HandTracker` class: webcam access, landmarker init, frame loop
- [ ] Output: `HandLandmarks[]` at ~30fps
- [ ] Handle webcam permission, device selection, fallback

### D.2 Gesture Recognition
**File**: `src/gestures/gestureRecognizer.ts`

**Tasks**:
- [ ] Finger state classification (extended/folded per finger)
- [ ] Pinch distance (thumb tip → index tip)
- [ ] Palm orientation (normal vector)
- [ ] Hand velocity (smoothed)
- [ ] Gesture state machine:
  - `IDLE` → `OPEN_PALM` → `INTERACTION_ACTIVE`
  - `PINCH` → `SELECT` / `DRAG`
  - `TWO_HAND` → `ZOOM` / `ROTATE`
  - `FIST` → `PAUSE`
  - `THREE_FINGERS` → `INSPECTION`

### D.3 Command Mapping
**File**: `src/gestures/commandMapper.ts` (new), `src/gestures/GestureStore.ts` (new Zustand store)

**Tasks**:
- [ ] Map recognized gestures → engineering commands:
  - `SELECT(componentUnderCursor)`
  - `MOVE_SELECTED(delta)`
  - `ZOOM(delta)`
  - `ORBIT(delta)`
  - `TOGGLE_INTERACTION()`
  - `INSPECTION_MODE()`
  - `RELEASE_SELECTION()`
- [ ] Cooldowns (200ms between commands)
- [ ] Smoothing (exponential moving average on positions)
- [ ] Calibration UI: sensitivity, handedness, dead zones
- [ ] Settings page: enable/disable per gesture

### D.4 Integration with 3D Engine
**File**: `src/engine/Scene.tsx`, `src/store/assemblyStore.ts`

**Tasks**:
- [ ] Gesture store feeds commands to assemblyStore/viewStore
- [ ] Raycast from normalized screen coords for selection
- [ ] Visual feedback: cursor ring, selection highlight
- [ ] Mouse/keyboard fallback always active
- [ ] Webcam indicator in status bar (connected/disconnected)

---

## PHASE E: DIGITAL TWIN SIMULATION (Week 5)

### E.1 Simulation Engine
**File**: `src/digital-twin/simulationEngine.ts` (new), `src/digital-twin/types.ts` (new)

```typescript
interface SimulationState {
  motor: {
    running: boolean;
    targetRpm: number;
    currentRpm: number;
    acceleration: number;   // rpm/s
  };
  shaft: {
    angle: number;          // radians
    angularVelocity: number;
  };
  sensors: Record<string, SensorReading>;
  faults: Fault[];
}

interface SensorReading {
  sensorId: string;
  value: number;
  timestamp: number;
  quality: 'good' | 'degraded' | 'bad';
}

type FaultType = 'imbalance' | 'misalignment' | 'bearing-defect' | 'overheating';
interface Fault {
  id: string;
  type: FaultType;
  componentId: string;
  severity: number;         // 0–1
  activatedAt: number;
}
```

**Tasks**:
- [ ] Create simulation loop (fixed timestep 1/60s)
- [ ] Motor: ramp to target RPM, simulate inertia
- [ ] Shaft: rotate at motor RPM (through coupling)
- [ ] Load disc: rotate with shaft
- [ ] Coupling: visual flex (procedural animation)
- [ ] Bearings: subtle orbital motion

### E.2 Sensor Simulation
**File**: `src/digital-twin/sensorSimulation.ts` (new)

**Tasks**:
- [ ] Vibration: base noise + RPM harmonic + fault signatures
  - Imbalance: 1×RPM sine
  - Misalignment: 2×RPM sine
  - Bearing defect: BPFO/BPFI/BSF/FTF frequencies
- [ ] Temperature: ambient + load-dependent rise + fault offset
- [ ] RPM: motor RPM + small jitter
- [ ] Current: base + load torque + fault signature
- [ ] Acoustic: RPM harmonics + bearing tones
- [ ] Update virtual sensors in real-time

### E.3 Fault System
**File**: `src/digital-twin/faultSystem.ts` (new), `src/components/FaultPanel.tsx` (new)

**Tasks**:
- [ ] Fault panel (right side): list fault types, activate/deactivate
- [ ] On activate: highlight component (status → warning/fault)
- [ ] Update sensor readings per fault model
- [ ] Fault history log with timestamps
- [ ] Visual: affected component pulses/emissive

### E.4 Digital Twin Page
**File**: `src/pages/DigitalTwinPage.tsx` (new)

**Tasks**:
- [ ] Motor control: Start/Stop, RPM slider (0–3600)
- [ ] Live sensor readouts (numeric + mini sparklines)
- [ ] Fault activation buttons
- [ ] Shaft rotation animation (Three.js)
- [ ] Coupling flex animation
- [ ] Status badges: SIMULATED, NO HARDWARE

---

## PHASE F: ANALYTICS & CHARTS (Week 6)

### F.1 Chart Library Selection
**Decision**: Use `uPlot` (tiny, fast, no React wrapper needed) or `recharts` (React-native)

**Recommendation**: `uPlot` — 25 KB, Canvas, excellent for real-time streaming

### F.2 Analytics Components
**File**: `src/analytics/Charts.tsx` (new), `src/pages/AnalyticsPage.tsx` (new)

**Tasks**:
- [ ] Time-series chart component (uPlot)
- [ ] Multiple series per chart (RPM, vibration, temp, current)
- [ ] Time window selector (1m, 5m, 15m, 1h, 4h)
- [ ] Fault markers on timeline
- [ ] Component health dashboard (grid of status cards)
- [ ] Operating duration counter
- [ ] Sensor status table (last reading, quality, age)

### F.3 Data Pipeline
**File**: `src/analytics/dataPipeline.ts` (new)

**Tasks**:
- [ ] Circular buffer for each sensor (max 3600 points = 1hr at 1Hz)
- [ ] Downsampling for longer windows (min/max/avg)
- [ ] Export CSV button

---

## PHASE G: ADVANCED FEATURES (Week 7–8)

### G.1 GLB Asset Pipeline
**File**: `src/machinery/assetLoader.ts` (new), `public/models/` (new)

**Tasks**:
- [ ] Add `modelUrl?: string` to `MachineComponent`
- [ ] Loader: prefer GLB → fallback to procedural
- [ ] GLB must use same coordinate system (Y-up, metres, shaft +X)
- [ ] Material override: apply ARGUS materials to GLB meshes
- [ ] Bounds computation for explode vectors

### G.2 Assembly Constraints
**File**: `src/engineering/constraints.ts` (new)

**Tasks**:
- [ ] Mate constraints (coincident, concentric, parallel, distance)
- [ ] Constraint solver (simple iterative)
- [ ] Visual constraint indicators
- [ ] Prevent invalid assemblies

### G.3 Collaboration & Export
**File**: `src/services/export.ts` (new)

**Tasks**:
- [ ] Export assembly as STEP/IGES (via wasm cad kernel)
- [ ] Export as glTF for web viewing
- [ ] Generate BOM (CSV)
- [ ] Screenshot (high-res) with annotations

---

## CROSS-CUTTING CONCERNS

### Testing Strategy
| Layer | Tool | Target Coverage |
|-------|------|-----------------|
| Store logic | Vitest | 90% |
| 3D rendering | Playwright + pixel diff | Critical paths |
| Gesture recognition | Vitest (mock landmarks) | 80% |
| Simulation | Vitest (deterministic seed) | 90% |
| E2E workflows | Playwright | 10 key journeys |

### Performance Budgets
| Metric | Budget |
|--------|--------|
| Initial load (gzipped) | < 300 KB |
| Studio chunk (gzipped) | < 400 KB |
| Frame time (desktop) | < 16.67 ms (60 FPS) |
| Frame time (laptop) | < 33 ms (30 FPS) |
| Memory (idle) | < 150 MB |
| Memory (simulation) | < 300 MB |

### Accessibility
- [ ] Keyboard navigation for all panels
- [ ] ARIA labels on all interactive elements
- [ ] Focus management (traps in modals)
- [ ] High contrast mode (already dark)
- [ ] Screen reader announcements for selection changes

### Browser Support
- Chrome 120+ (primary)
- Edge 120+
- Firefox 120+
- Safari 17+ (WebGL2)

---

## DEFINITION OF DONE PER MILESTONE

| Milestone | Criteria |
|-----------|----------|
| M04 Engineering Tools | Save/load config, add/remove components, sensor placement, parent-child transforms |
| M05 Gesture Control | Webcam tracks hands, 7 gestures recognized, mapped to 3D commands, calibration UI |
| M06 Digital Twin | Motor runs, shaft rotates, 5 sensor types simulated, 4 faults activatable, visual feedback |
| M07 Analytics | 4 charts streaming, time window, fault markers, health dashboard, CSV export |
| M08 Integration | All milestones work together, Playwright E2E passes, performance budgets met |

---

## RISK MITIGATION

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| MediaPipe performance on low-end | Medium | High | Offload to WebWorker; reduce model complexity |
| Three.js + React 19 compat issues | Low | High | Pin versions; test after each upgrade |
| Parent-child transform breaks existing | Medium | Medium | Feature flag; migrate incrementally |
| Bundle size exceeds budget | Medium | Medium | Code-split charts, simulation, gestures |
| Gesture false positives | High | Medium | Cooldowns, confirmation gestures, sensitivity tuning |

---

**Next**: Create `ARGUS_TECHNICAL_ROADMAP.md` with detailed technical specifications for each phase.