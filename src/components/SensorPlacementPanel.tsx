import { SENSOR_DEFINITIONS, SensorType } from '@/sensors/sensorDefinitions';
import { useSensorPlacement } from '@/hooks/useSensorPlacement';
import type { MachineComponent } from '@/types';

interface Props {
  sensorType: SensorType | null;
  setSensorType: (type: SensorType | null) => void;
  active: boolean;
  selectedComponent: MachineComponent | null;
  componentSensors: Array<{ id: string; definition: { type: SensorType } }>;
  onStartPlacement: () => void;
  onCancelPlacement: () => void;
  onConfirmPlacement: () => void;
}

export function SensorPlacementPanel({
  sensorType,
  setSensorType,
  active,
  selectedComponent,
  componentSensors,
  onStartPlacement,
  onCancelPlacement,
  onConfirmPlacement,
}: Props) {
  const { ghostPosition, ghostRotation, previewVisible } = useSensorPlacement(
    (s) => ({ ghostPosition: s.ghostPosition, ghostRotation: s.ghostRotation, previewVisible: s.previewVisible })
  );

  if (!selectedComponent && !active) {
    return (
      <div className="flex h-full flex-col p-3">
        <div className="border-b border-line-soft pb-2 mb-2">
          <span className="label">Sensor Placement</span>
        </div>
        <div className="text-xs text-ink-dim leading-relaxed">
          Select a component in the hierarchy or 3D view to enable sensor placement.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line-soft pb-2 mb-2">
        <span className="label">Sensor Placement</span>
        {active && (
          <span className="ml-2 mono text-[10px] text-cyan">PLACEMENT MODE</span>
        )}
      </div>

      <div className="mb-3">
        <div className="label mb-1">Sensor Type</div>
        <select
          className="field w-full"
          value={sensorType || ''}
          onChange={(e) => setSensorType(e.target.value as SensorType | null)}
          disabled={active}
        >
          <option value="">Select type…</option>
          {Object.entries(SENSOR_DEFINITIONS).map(([type, def]) => (
            <option key={type} value={type}>
              {def.icon} {def.label} ({def.unit})
            </option>
          ))}
        </select>
      </div>

      {selectedComponent && (
        <div className="mb-3 p-2 rounded-sm border border-line bg-obsidian/50">
          <div className="label mb-1">Target Component</div>
          <div className="font-medium">{selectedComponent.name}</div>
          <div className="mono text-[10px] text-ink-dim mt-1">{selectedComponent.id}</div>
        </div>
      )}

      <div className="mb-3">
        <div className="label mb-1">Placement Preview</div>
        <div className="mono text-[10px] text-ink-dim">
          {active && ghostPosition
            ? `Pos: [${ghostPosition.map((v) => v.toFixed(3)).join(', ')}]`
            : 'Hover a component surface…'}
        </div>
        {active && ghostRotation && (
          <div className="mono text-[10px] text-ink-dim">
            Rot: [{ghostRotation.map((v) => v.toFixed(3)).join(', ')}] rad
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        {!active && sensorType && selectedComponent && (
          <button className="btn flex-1" onClick={onStartPlacement} title="Enter placement mode (click on component surface)">
            Start Placement
          </button>
        )}
        {active && (
          <>
            <button className="btn flex-1 bg-warn/20 border-warn text-warn hover:bg-warn/30" onClick={onCancelPlacement} title="Cancel placement (ESC)">
              Cancel
            </button>
            <button className="btn flex-1" onClick={onConfirmPlacement} title="Confirm placement (click again)" disabled={!previewVisible}>
              Confirm
            </button>
          </>
        )}
        {!active && sensorType && !selectedComponent && (
          <button className="btn flex-1" disabled onClick={onStartPlacement} title="Select a component first">
            Start Placement
          </button>
        )}
      </div>

      {componentSensors.length > 0 && (
        <div className="border-t border-line-soft pt-3">
          <div className="label mb-2">Sensors on this component ({componentSensors.length})</div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {componentSensors.map((s) => {
              const def = SENSOR_DEFINITIONS[s.definition.type];
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-sm border border-line bg-obsidian/50 text-xs"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span style={{ color: def.color }}>{def.icon}</span>
                    <span className="font-medium">{s.id}</span>
                    <span className="mono text-[9px] text-ink-faint">({def.unit})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-auto border-t border-line-soft pt-3 text-[10px] leading-relaxed text-ink-dim">
        <strong>Controls:</strong>
        <ul className="list-disc list-inside mt-1 space-y-0.5">
          <li>Hover component surface to preview position</li>
          <li>Click to set position, click again to confirm</li>
          <li>ESC to cancel placement mode</li>
          <li>Sensor aligns to surface normal automatically</li>
        </ul>
      </div>
    </div>
  );
}