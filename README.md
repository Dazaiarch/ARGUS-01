<div align="center">

# ARGUS

**Immersive 3D engineering environment and digital twin for rotating-machinery condition monitoring**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r170-000000?logo=threedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/tests-10%20passing-brightgreen)
![License](https://img.shields.io/badge/license-proprietary-lightgrey)

</div>

> [!IMPORTANT]
> **Status: Milestones 01 to 07 of 8 complete.** Everything shown is a software model.
> No hardware is connected, all machine geometry is **provisional** (real ARGUS CAD dimensions have not been supplied), and all sensor data is simulated.

---

## Table of contents

- [Quick start](#quick-start)
- [Modules](#modules)
- [Sensor types](#sensor-types)
- [Provisional ARGUS assembly](#provisional-argus-assembly)
- [Controls](#controls)
- [Digital twin simulation](#digital-twin-simulation)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Commands](#commands)
- [Testing](#testing)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)
- [License](#license)

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

Requires **Node 20+** and a browser with **WebGL** (current Chrome, Edge or Firefox).

## Modules

| Module | State | What it does |
| --- | :---: | --- |
| **Command Centre** | Built | Project status, live component summary, provisional/simulated labelling, quick links |
| **Engineering Studio** | Built | 3D viewport with orbit, pan and zoom. Perspective and orthographic cameras. Front, side, top and isometric views. Grid, axes and lighting control. Raycast selection with highlight. Move, rotate and scale gizmo with optional snapping. Hierarchy and properties panels. Hide, lock, duplicate, remove and reset transform. Undo/redo, exploded view, keyboard shortcuts |
| **Gesture Lab** | Built | MediaPipe hand tracking (MediaPipe Hands 0.1.1647608626). Recognizes pinch, open palm, swipe, two-hand zoom and rotate, fist, three fingers and rotate. Command mapping to viewport actions, sensor placement integration, calibration mode, webcam connect and disconnect, live hand landmark overlay |
| **Assembly Lab** | Built | Sensor list and placement panels, component hierarchy, add and remove sensors, virtual sensor positioning and rotation |
| **Digital Twin** | Built | 60 Hz fixed-timestep simulation, motor physics, shaft dynamics, sensor simulation, fault injection, motor control panel, fault panel, sensor readouts, component status updates from faults |
| **Sensor Mapping** | Built | 15 industrial sensor types with full definitions, placement workflow, component-specific compatibility, ghost placement preview, sensor list grouped by component |
| **Analytics** | Built | Real-time uPlot charts across 6 sensor categories, time windows from 1 minute to 24 hours, pause and resume, cursor inspection, fault markers, rolling-buffer data pipeline, CSV and PNG export buttons |
| **Project Configuration** | Built | Save, load, import and export (JSON, GLTF, STEP, CSV, BOM), asset library management, view state persistence |

## Sensor types

Fifteen industrial sensor types are defined. Each includes its category, applicable components, standard mounting, typical sampling rate, and warning and danger thresholds.

<details>
<summary><b>Show all 15 sensor types</b></summary>

| Type | Label | Unit | Category | Typical sampling |
| --- | --- | --- | --- | --- |
| `vibration` | Vibration (Accelerometer) | mm/s RMS | vibration | 25.6 kHz |
| `temperature` | Temperature (RTD/Thermocouple) | °C | thermal | 10 Hz |
| `rpm` | Speed (Encoder/Tacho) | RPM | mechanical | 1 kHz |
| `current` | Motor Current (CT) | A RMS | electrical | 5 kHz |
| `acoustic` | Acoustic Emission / Noise | dB SPL | vibration | 51.2 kHz |
| `pressure` | Pressure (Transducer) | bar | fluid | 1 kHz |
| `oil-temperature` | Oil Temperature (RTD) | °C | thermal | 10 Hz |
| `oil-pressure` | Oil Pressure (Transducer) | bar | fluid | 1 kHz |
| `displacement` | Shaft Displacement (Proximity Probe) | µm | mechanical | 25.6 kHz |
| `torque` | Torque (Rotary Transducer) | Nm | mechanical | 10 kHz |
| `strain` | Strain (Strain Gauge) | µε | structural | 1 kHz |
| `speed` | Linear Speed (Encoder) | m/s | mechanical | 1 kHz |
| `power` | Active Power (Wattmeter) | kW | electrical | 5 kHz |
| `voltage` | Voltage (PT/VT) | V RMS | electrical | 5 kHz |
| `power-factor` | Power Factor | cos φ | electrical | 5 kHz |

</details>

## Provisional ARGUS assembly

The default assembly has **13 independent, selectable parts**:

- base frame
- motor mounting plate
- electric motor
- drive shaft
- flexible coupling
- two bearing housings
- two bearing assemblies
- rotating load disc
- three sensor mount points

The shaft axis runs along **+X**, **Y** is up, and units are metres. Constrained parts (shaft, coupling, bearings) block scaling and ask for confirmation before a dimension edit.

## Controls

### Keyboard shortcuts (Engineering Studio)

| Key | Action | Key | Action |
| --- | --- | --- | --- |
| `W` / `E` / `R` | Move / rotate / scale | `Ctrl+D` | Duplicate |
| `1` to `6` | Camera views | `Del` | Remove |
| `F` | Reset camera | `Ctrl+Z` / `Ctrl+Y` | Undo / redo |
| `H` | Hide / show | `X` | Explode |
| `L` | Lock / unlock | `G` | Snap |
| `Esc` | Deselect | | |

### Gesture Lab

| Gesture | Action |
| --- | --- |
| Pinch | Zoom viewport |
| Open palm | Pan viewport |
| Two-hand zoom | Zoom (both hands) |
| Two-hand rotate | Orbit (both hands) |
| Swipe left / right | Rotate view |
| Fist | Select component |
| Three fingers | Reset view |
| Rotate | Rotate selected object |

## Digital twin simulation

| Aspect | Model |
| --- | --- |
| **Timestep** | Fixed 1/60 s, with interpolation for rendering |
| **Motor** | Induction motor torque curve (slip-based), inertia, viscous damping |
| **Load torque** | Base load plus fault contributions (imbalance, misalignment, bearing defect) |
| **Faults** | Imbalance, misalignment, bearing defect, overheating. Activated and deactivated at runtime, they affect sensor readings and component status |
| **Component status** | Updated automatically from fault severity: healthy, warning, fault |

Simulated sensor signals:

| Sensor | Signal composition |
| --- | --- |
| Vibration | 1× and 2× RPM plus bearing defect frequencies |
| Temperature | Ambient plus load plus fault heating |
| RPM | Motor speed plus noise |
| Current | Base plus load plus imbalance ripple |
| Acoustic | SPL plus RPM harmonics plus bearing tones |

## Tech stack

| Area | Technology |
| --- | --- |
| UI | React 19, TypeScript 5.7 (strict mode) |
| Build | Vite 6 |
| 3D | Three.js r170 |
| State | Zustand (assembly, view and gesture stores) |
| Charts | uPlot |
| Hand tracking | MediaPipe Hands (WASM) |
| Testing | Vitest |
| Linting | ESLint (flat config), Prettier |

## Project structure

```text
src/
├── analytics/     # Data pipeline, Chart (uPlot wrapper)
├── components/    # UI panels (SensorList, SensorPlacement, FaultPanel, ...)
├── digital-twin/  # SimulationEngine, createInitialState
├── engine/        # Three.js viewport, scene, camera, gizmos
├── gestures/      # HandTracker, GestureRecognizer, CommandMapper
├── hooks/         # useSensorPlacement (Zustand)
├── machinery/     # Default assembly, geometry
├── pages/         # Route pages (GestureLab, DigitalTwin, Analytics, ...)
├── sensors/       # sensorDefinitions (15 types, VirtualSensor)
├── services/      # assetLoader, export (JSON/GLTF/STEP/CSV/BOM)
├── store/         # assemblyStore, viewStore, gestureStore
└── types/         # Shared TypeScript interfaces
```

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (port 5173) |
| `npm run typecheck` | TypeScript build check (`tsc -b --noEmit`) |
| `npm test` | Run Vitest tests |
| `npm run build` | Production build (`tsc -b && vite build`) |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format |

## Testing

```bash
npm test
```

All 10 assembly store tests pass. They cover adding, removing and updating sensors, selection, undo/redo, component management and sensor filtering.

## Known limitations

- **Hierarchy is organisational.** Parts keep world positions, so moving a parent does not move its children.
- **Gizmo and exploded view.** The transform gizmo is disabled while the exploded view is active, and edits apply to the assembled position.
- **Fonts.** They load from Google Fonts, and fall back to system fonts offline.
- **Bundle size.** The 3D chunk is about 1.3 MB (about 370 KB gzipped) and is lazy-loaded when Studio opens.
- **No hardware integration.** All data is simulated.
- **No real CAD dimensions.** All geometry is provisional.
- **Unvalidated physics.** Sensor simulation is a physics-based approximation, not validated against real machinery.
- **Webcam.** MediaPipe Hands runs in-browser (WASM) and needs camera permission plus HTTPS or localhost.
- **Dependencies.** `npm audit` reports 3 issues in the dev toolchain, not yet triaged.

## Roadmap

| Milestone | Focus | Status |
| :---: | --- | :---: |
| 01 to 03 | Foundation, 3D engine, machinery core | Done |
| 04 | Engineering tools (assembly lab, sensors, save/load/import/export) | Done |
| 05 | Gesture control (MediaPipe) | Done |
| 06 | Digital twin | Done |
| 07 | Analytics | Done |
| 08 | Integration, end-to-end tests, backend (FastAPI + SQLite) | Planned |

Further documentation (architecture, component specifications, gesture mapping and the development log) is in [`documentation/`](documentation/).

## License

Proprietary. ARGUS research project.
