import { SENSOR_DEFINITIONS, VirtualSensor } from '@/sensors/sensorDefinitions';
import type { MachineComponent } from '@/types';

function SensorItem({ s, selectedId, onSelect, onRemove }: { s: VirtualSensor; selectedId: string | null; onSelect: (id: string) => void; onRemove: (id: string) => void }) {
  const def = SENSOR_DEFINITIONS[s.definition.type];
  return (
    <div
      key={s.id}
      className={`group flex items-center gap-1.5 border-l-2 py-1 pr-1 ${
        selectedId === s.id ? 'border-cyan bg-cyan/10' : 'border-transparent hover:bg-gunmetal'
      }`}
      style={{ paddingLeft: 22 }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(s.id);
      }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: def.color }} title={def.label} />
      <span className="flex-1 truncate">{s.id}</span>
      <span className="mono text-[10px] text-ink-faint">{def.unit}</span>
      {s.locked && <span className="mono w-5 text-[10px] text-warn" title="Locked">🔒</span>}
      <button
        className="mono w-5 text-[10px] text-ink-faint hover:text-fault"
        title="Remove sensor"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(s.id);
        }}
      >
        ✕
      </button>
    </div>
  );
}

function ComponentItem({ c, sensorsByComponent, selectedId, onSelect, onRemove }: { c: MachineComponent; sensorsByComponent: Record<string, VirtualSensor[]>; selectedId: string | null; onSelect: (id: string) => void; onRemove: (id: string) => void }) {
  const componentSensors = sensorsByComponent[c.id] || [];
  return (
    <div key={c.id}>
      <div
        className="flex items-center gap-1.5 px-2 py-1 text-ink-dim hover:bg-gunmetal cursor-pointer"
        onClick={() => onSelect(c.id)}
      >
        <span className="mono w-4 text-[10px] text-cyan">▸</span>
        <span className="truncate font-medium">{c.name}</span>
        <span className="mono text-[10px] text-ink-faint ml-auto">
          {componentSensors.length}
        </span>
      </div>
      {componentSensors.map((s) => (
        <SensorItem key={s.id} s={s} selectedId={selectedId} onSelect={onSelect} onRemove={onRemove} />
      ))}
    </div>
  );
}

export function SensorListPanel({ sensors, components, selectedId, onSelect, onRemove, onAdd }: {
  sensors: VirtualSensor[];
  components: MachineComponent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  const active = selectedId ? sensors.find((s) => s.id === selectedId) : null;

  // Group sensors by component
  const sensorsByComponent = sensors.reduce<Record<string, VirtualSensor[]>>((acc, s) => {
    (acc[s.componentId] = acc[s.componentId] || []).push(s);
    return acc;
  }, {});

  const componentWithSensors = components.filter((c) => (sensorsByComponent[c.id]?.length ?? 0) > 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line-soft px-3 py-2">
        <span className="label">Virtual Sensors</span>
        <span className="mono text-[10px] text-ink-faint">{sensors.length} placed</span>
      </div>

      <div className="flex items-center gap-1 border-b border-line-soft px-3 py-2">
        <select
          className="field flex-1 text-[11px]"
          onChange={(e) => {
            const SensorPlacement = require('@/hooks/useSensorPlacement').useSensorPlacement;
            SensorPlacement.getState().setSensorType(e.target.value as import('@/sensors/sensorDefinitions').SensorType);
          }}
        >
          <option value="">Select sensor type…</option>
          {Object.entries(SENSOR_DEFINITIONS).map(([type, def]) => (
            <option key={type} value={type}>
              {def.icon} {def.label}
            </option>
          ))}
        </select>
        <button className="btn" disabled={!active} onClick={onAdd} title="Place sensor on selected component">
          Place
        </button>
      </div>

      <div role="tree" className="flex-1 overflow-y-auto py-1 text-xs">
        {componentWithSensors.length === 0 ? (
          <div className="px-3 py-4 text-center text-ink-dim">
            No sensors placed yet. Select a component and click "Place".
          </div>
        ) : (
          componentWithSensors.map((c) => (
            <ComponentItem
              key={c.id}
              c={c}
              sensorsByComponent={sensorsByComponent}
              selectedId={selectedId}
              onSelect={onSelect}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      <div className="border-t border-line-soft px-3 py-2 text-[10px] leading-snug text-ink-faint">
        Select a component in the 3D view or list, choose a sensor type, then click "Place" to enter placement mode.
      </div>
    </div>
  );
}