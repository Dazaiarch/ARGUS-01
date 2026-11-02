# Component specifications (provisional)

**These values are placeholders.** Real ARGUS CAD dimensions have not been supplied. All parts are flagged `provisional: true`. Units are metres.

| ID | Name | Type | Key dimensions | Constrained |
| --- | --- | --- | --- | --- |
| ARGUS-FRM-001 | Mechanical Base Frame | base-frame | 2.4 × 0.08 × 0.7 | no |
| ARGUS-MTP-001 | Motor Mounting Plate | mounting-plate | 0.6 × 0.03 × 0.5 | no |
| ARGUS-MOT-001 | Electric Motor | motor | length 0.5, radius 0.16 | no |
| ARGUS-SHF-001 | Drive Shaft | shaft | length 1.7, radius 0.025 | yes |
| ARGUS-CPL-001 | Flexible Coupling | coupling | length 0.14, radius 0.055 | yes |
| ARGUS-BHS-001/002 | Bearing Housing 1/2 | bearing-housing | 0.14 × 0.22 × 0.2 | no |
| ARGUS-BRG-001/002 | Bearing Assembly 1/2 | bearing | length 0.05, radius 0.052 | yes |
| ARGUS-LDD-001 | Rotating Load Disc | load-disc | length 0.04, radius 0.2 | no |
| ARGUS-SNM-001/002/003 | Sensor Mounts A/B/C | sensor-mount | 0.04 × 0.02 × 0.04 | no |

Data structure: see `MachineComponent` in `src/types/index.ts`. Default layout: `src/machinery/defaultAssembly.ts`.
