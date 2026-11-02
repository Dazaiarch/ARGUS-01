# PROJECT ARGUS

Immersive 3D engineering environment and digital twin for the ARGUS rotating-machinery condition-monitoring research system.

> **Status: Milestones 01–03 of 8 complete.** Everything shown is a software model. No hardware is connected, all machine geometry is **provisional** (real ARGUS CAD dimensions have not been supplied), and no simulated data exists yet.

## Quick start

```bash
npm install

npm run dev        # http://localhost:5173
npm run typecheck
npm test
npm run build
```

Requires Node 20+ and a browser with WebGL (current Chrome, Edge or Firefox).

## What works now

| Module | State |
| --- | --- |
| **Command Centre** | Built. Project status, live component summary, provisional/simulated labelling, quick links. |
| **Engineering Studio** | Built. 3D viewport, orbit/pan/zoom, perspective and orthographic cameras, front/side/top/isometric views, grid, axes, lighting control, raycast selection with highlight, move/rotate/scale gizmo with optional snapping, hierarchy panel, properties panel, hide/show, lock, duplicate, remove, reset transform, undo/redo, exploded view, keyboard shortcuts. |
| **Gesture Lab** | Built. MediaPipe hand tracking (MediaPipe Hands @0.1.1647608626), gesture recognition (pinch, open-palm, swipe, two-hand zoom/rotate, fist, three-fingers, rotate), command mapping to viewport actions, sensor placement integration, calibration mode, webcam connection/disconnection, real-time hand landmark overlay. |
| **Assembly Lab** | Built. Sensor list panel, sensor placement panel, component hierarchy, add/remove sensors, virtual sensor management with positioning and rotation. |
| **Digital Twin** | Built. Real-time simulation engine (60 Hz fixed timestep), motor physics (torque curve, load, damping), shaft dynamics, sensor simulation (vibration, temperature, RPM, current, acoustic), fault injection (imbalance, misalignment, bearing defect, overheating), motor control panel (start/stop, target RPM), fault panel, sensor readouts panel, component status updates from faults. |
| **Sensor Mapping** | Built. 15 industrial sensor types with full definitions, sensor placement workflow, component-specific sensor compatibility, placement preview with ghost position/rotation, sensor list grouped by component. |
| **Analytics** | Built. Real-time charting with uPlot, 6 sensor categories (vibration, mechanical, electrical, thermal, fluid, structural), time window selection (1 min – 24 hr), pause/resume, cursor inspection, fault markers on charts, data pipeline with rolling buffer, CSV/PNG export buttons. |
| **Project Configuration** | Built. Save/load/import/export configurations (JSON, GLTF, STEP, CSV, BOM), asset library management, view state persistence. |

## Sensor Types (15 Industrial Sensors)

| Type | Label | Unit | Category | Typical Sampling |
|------|-------|------|----------|------------------|
| vibration | Vibration (Accelerometer) | mm/s RMS | vibration | 25.6 kHz |
| temperature | Temperature (RTD/Thermocouple) | °C | thermal | 10 Hz |
| rpm | Speed (Encoder/Tacho) | RPM | mechanical | 1 kHz |
| current | Motor Current (CT) | A RMS | electrical | 5 kHz |
| acoustic | Acoustic Emission / Noise | dB SPL | vibration | 51.2 kHz |
| pressure | Pressure (Transducer) | bar | fluid | 1 kHz |
| oil-temperature | Oil Temperature (RTD) | °C | thermal | 10 Hz |
| oil-pressure | Oil Pressure (Transducer) | bar | fluid | 1 kHz |
| displacement | Shaft Displacement (Proximity Probe) | µm | mechanical | 25.6 kHz |
| torque | Torque (Rotary Transducer) | Nm | mechanical | 10 kHz |
| strain | Strain (Strain Gauge) | µε | structural | 1 kHz |
| speed | Linear Speed (Encoder) | m/s | mechanical | 1 kHz |
| power | Active Power (Wattmeter) | kW | electrical | 5 kHz |
| voltage | Voltage (PT/VT) | V RMS | electrical | 5 kHz |
| power-factor | Power Factor | cos φ | electrical | 5 kHz |

Each sensor includes: category, applicable components, standard mounting, typical sampling rate, critical thresholds (warning/danger).

## Provisional ARGUS assembly

13 independent, selectable parts: base frame, motor mounting plate, electric motor, drive shaft, flexible coupling, two bearing housings, two bearing assemblies, rotating load disc, three sensor mount points. Shaft axis runs along +X, Y is up, units are metres.

Constrained parts (shaft, coupling, bearings) block scaling and ask for confirmation before a dimension edit.

## Keyboard shortcuts (Engineering Studio)

`W/E/R` move/rotate/scale · `1–6` views · `F` reset camera · `H` hide/show · `L` lock/unlock · `Ctrl+D` duplicate · `Del` remove · `Ctrl+Z/Y` undo/redo · `X` explode · `G` snap · `Esc` deselect

## Gesture Lab Controls

| Gesture | Action |
|---------|--------|
| Pinch | Zoom viewport |
| Open Palm | Pan viewport |
| Two-Hand Zoom | Zoom (both hands) |
| Two-Hand Rotate | Orbit (both hands) |
| Swipe Left/Right | Rotate view |
| Fist | Select component |
| Three Fingers | Reset view |
| Rotate | Rotate selected object |

## Digital Twin Simulation

- **Fixed timestep**: 1/60 s with interpolation for rendering
- **Motor model**: Induction motor torque curve (slip-based), inertia, viscous damping
- **Load torque**: Base + fault contributions (imbalance, misalignment, bearing defect)
- **Sensors simulated**: vibration (1×/2× RPM + bearing defect frequencies), temperature (ambient + load + fault heating), RPM (motor speed + noise), current (base + load + imbalance ripple), acoustic (SPL + RPM harmonics + bearing tones)
- **Faults**: Activate/deactivate at runtime, affect sensor readings and component status
- **Component status**: Auto-updated from fault severity (healthy → warning → fault)

## Tech Stack

- **React 19** + **TypeScript 5.7** (strict mode)
- **Vite 6** for dev/build
- **Three.js r170** for 3D rendering
- **Zustand** for state management (assembly, view, gesture stores)
- **uPlot** for high-performance charting
- **MediaPipe Hands** (WASM) for hand tracking
- **Vitest** for testing
- **ESLint** (flat config) + **Prettier** for linting/formatting

## Project Structure

```
src/
├── analytics/           # Data pipeline, Chart (uPlot wrapper)
├── components/          # UI panels (SensorList, SensorPlacement, FaultPanel, etc.)
├── digital-twin/        # SimulationEngine, createInitialState
├── engine/              # Three.js viewport, scene, camera, gizmos
├── gestures/            # HandTracker, GestureRecognizer, CommandMapper
├── hooks/               # useSensorPlacement (Zustand)
├── machinery/           # Default assembly, geometry
├── pages/               # Route pages (GestureLab, DigitalTwin, Analytics, etc.)
├── sensors/             # sensorDefinitions (15 types, VirtualSensor)
├── services/            # assetLoader, export (JSON/GLTF/STEP/CSV/BOM)
├── store/               # assemblyStore, viewStore, gestureStore
└── types/               # Shared TypeScript interfaces
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 5173) |
| `npm run typecheck` | TypeScript build check (`tsc -b --noEmit`) |
| `npm test` | Run Vitest tests |
| `npm run build` | Production build (`tsc -b && vite build`) |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format |

## Testing

```bash
npm test
```

All 10 assembly store tests pass (add/remove/update sensors, select, undo/redo, component management, sensor filtering).

## Known Limitations

- Hierarchy is organisational: parts keep world positions; moving a parent does not move children.
- Transform gizmo disabled while exploded view is active (edits apply to assembled position).
- Fonts load from Google Fonts; offline falls back to system fonts.
- 3D chunk is large (~1.3 MB, ~370 KB gzip) and lazy-loaded when Studio opens.
- No hardware integration — all data is simulated.
- No real CAD dimensions — all geometry is provisional.
- Sensor simulation is physics-based approximation, not validated against real machinery.
- MediaPipe Hands runs in-browser (WASM); requires webcam permissions and HTTPS or localhost.
- `npm audit` reports 3 issues in the dev toolchain; not yet triaged.

## Roadmap

| Milestone | Focus |
|-----------|-------|
| **04** | Engineering tools (assembly lab, sensors, save/load/import/export) — **DONE** |
| **05** | Gesture control (MediaPipe) — **DONE** |
| **06** | Digital twin — **DONE** |
| **07** | Analytics — **DONE** |
| **08** | Integration, end-to-end tests, backend (FastAPI + SQLite) |

See `documentation/` for architecture, component specifications, gesture mapping and the development log.

## License

Proprietary — ARGUS research project.#   A R G U S - 0 1  
 