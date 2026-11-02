# Architecture

## Layers

Rendering, state, simulation, gestures and persistence are kept independent.

| Layer | Location | Responsibility |
| --- | --- | --- |
| App shell | `src/app` | Router, navigation, status bar, section registry (`sections.ts`) |
| Pages | `src/pages` | One page per section; unbuilt sections use `NotBuilt` |
| UI components | `src/components` | Toolbar, hierarchy, properties panels |
| 3D engine | `src/engine` | R3F canvas, scene, camera rig, selection box, component nodes |
| Machinery | `src/machinery` | Default assembly data, materials, procedural geometry |
| State | `src/store` | Zustand stores: `assemblyStore` (data + history), `viewStore` (UI/camera) |
| Types | `src/types` | Shared TypeScript interfaces |

Reserved for later milestones: `gestures`, `digital-twin`, `sensor-mapping`, `analytics`, `assembly`, `engineering`, `services`, and `backend/`.

## Decisions

1. **Flat world-space components.** Each `MachineComponent` stores a world transform. `parentId` is organisational only. This keeps selection, gizmo editing and JSON export simple. Revisit if constraint-driven assembly needs transform inheritance.
2. **Assembly store owns undo/redo.** Discrete edits call `commit`; gizmo drags mutate the Three.js object live and write one history entry on mouse-up (`patchLive` + `checkpoint`).
3. **Geometry is procedural and provisional.** Every part carries `provisional` and `dimensionsVerified` flags so the UI can never present placeholder geometry as accurate. Replace with GLB assets when CAD exists.
4. **Explode is a view-layer offset.** `position + explodeVector × explode` is applied at render time, never saved to component data. The gizmo is disabled while exploded.
5. **Camera presets.** Perspective and isometric use a perspective camera; orthographic, front, side and top use an orthographic camera.
6. **HashRouter.** Avoids server rewrite rules for static hosting.
7. **Honest placeholders.** Unbuilt modules render a page with no controls, never a fake UI.
8. **Tailwind v4 via `@tailwindcss/vite`**, design tokens in `src/styles/index.css`.

## Coordinate system

Right-handed, Y up, metres. Shaft axis along +X. Rotation stored as Euler XYZ radians, shown in degrees in the UI.
