import { useCallback } from 'react';
import { useAssemblyStore } from '@/store/assemblyStore';
import { useViewStore } from '@/store/viewStore';
import { SENSOR_DEFINITIONS } from '@/sensors/sensorDefinitions';
import { SensorPlacementPanel } from '@/components/SensorPlacementPanel';
import { SensorListPanel } from '@/components/SensorListPanel';
import { StudioToolbar } from '@/components/StudioToolbar';
import { Viewport } from '@/engine/Viewport';
import { useSensorPlacement } from '@/hooks/useSensorPlacement';
import type { SensorType } from '@/sensors/sensorDefinitions';

export default function SensorMappingPage() {
  const { active, sensorType, startPlacement, cancelPlacement, confirmPlacement } = useSensorPlacement();
  const sensors = useAssemblyStore((s) => s.sensors);
  const components = useAssemblyStore((s) => s.components);
  const addSensor = useAssemblyStore((s) => s.addSensor);
  const selectedId = useAssemblyStore((s) => s.selectedId);
  const select = useAssemblyStore((s) => s.select);
  const removeSensor = useAssemblyStore((s) => s.removeSensor);
  const getSensorsForComponent = useAssemblyStore((s) => s.getSensorsForComponent);
  const left = useViewStore((s) => s.leftCollapsed);
  const right = useViewStore((s) => s.rightCollapsed);
  const toggle = useViewStore((s) => s.toggle);

  const selectedComponent = components.find((c) => c.id === selectedId) ?? null;
  const componentSensors = selectedComponent ? getSensorsForComponent(selectedComponent.id) : [];

  const handleAddSensor = useCallback(() => {
    if (!sensorType || !selectedComponent) return;
    const newId = addSensor(sensorType, selectedComponent.id);
    select(newId);
  }, [sensorType, selectedComponent, addSensor, select]);

  const handleRemoveSensor = useCallback((id: string) => {
    if (window.confirm('Remove this sensor?')) {
      removeSensor(id);
      select(null);
    }
  }, [removeSensor, select]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <StudioToolbar />
      <div className="flex min-h-0 flex-1">
        {!left && (
          <aside className="w-72 shrink-0 border-r border-line-soft bg-graphite">
            <SensorListPanel
              sensors={sensors}
              components={components}
              selectedId={selectedId}
              onSelect={select}
              onRemove={handleRemoveSensor}
              onAdd={handleAddSensor}
            />
          </aside>
        )}

        <div className="relative min-w-0 flex-1">
          <div className="relative w-full h-full">
            <Viewport />
            {active && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="mono bg-obsidian/90 border border-cyan px-3 py-2 rounded-sm text-cyan text-sm">
                  Click on a component to place {sensorType ? SENSOR_DEFINITIONS[sensorType as SensorType].label : 'sensor'}...
                  <br />ESC to cancel
                </div>
              </div>
            )}
          </div>

          <div className="absolute left-2 bottom-2 flex gap-1">
            <button className="btn" onClick={() => toggle('leftCollapsed')} title="Toggle sensor list">
              {left ? 'Show sensors' : 'Hide sensors'}
            </button>
            <button className="btn" onClick={() => toggle('rightCollapsed')} title="Toggle placement panel">
              {right ? 'Show placement' : 'Hide placement'}
            </button>
          </div>
        </div>

        {!right && (
          <aside className="w-80 shrink-0 border-l border-line-soft bg-graphite">
            <SensorPlacementPanel
              sensorType={sensorType}
              setSensorType={(t) => useSensorPlacement.getState().setSensorType(t)}
              active={active}
              selectedComponent={selectedComponent}
              componentSensors={componentSensors}
              onStartPlacement={startPlacement}
              onCancelPlacement={cancelPlacement}
              onConfirmPlacement={confirmPlacement}
            />
          </aside>
        )}
      </div>
    </div>
  );
}