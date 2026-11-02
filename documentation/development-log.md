# Development log

## 2026-10-31 — Milestones 01–03

**Done**
- Vite + React 19 + TypeScript + Tailwind v4 project; folder architecture per the master prompt.
- App shell: collapsible left navigation, top bar, status bar, 8 section routes.
- Command Centre built from real store data; simulated/provisional items labelled.
- Engineering Studio: R3F viewport, cameras and views, grid/axes/lighting, raycast selection, TransformControls with snapping, hierarchy and properties panels, hide/lock/duplicate/remove/reset, undo/redo, exploded view, shortcuts.
- Provisional 13-part ARGUS assembly with procedural geometry.
- Vitest suite for the assembly store (10 tests passing).

**Verified**
- `tsc` clean, `vite build` succeeds, tests pass.
- Headless Chrome run: studio renders, hierarchy selection and canvas raycast selection work, explode (X) and front view (3) work, no application errors in the console. Only external font loading and a missing favicon were reported (favicon since fixed).

- Second headless run: editing position in the properties panel then Undo restores the value; dragging the transform gizmo moves the part and records an undo step; Scale mode on a constrained part (bearing) is blocked with a status-bar warning; no console errors.

**Not verified**
- Performance on a low-end laptop has not been measured (headless run used software rendering).
- Touch and non-Chrome browsers have not been tested.

**Remaining**
- M04 engineering tools, M05 gestures, M06 digital twin, M07 analytics, M08 integration, backend, Playwright end-to-end tests.
- Open items: `npm audit` triage; code-splitting the large 3D chunk further.
