import { useCallback, useState, useEffect } from 'react';
import { useAssemblyStore } from '@/store/assemblyStore';
import { useViewStore } from '@/store/viewStore';
import { StudioToolbar } from '@/components/StudioToolbar';
import { Viewport } from '@/engine/Viewport';
import { FaultPanel } from '@/components/FaultPanel';
import { SensorReadoutsPanel } from '@/components/SensorReadoutsPanel';
import { MotorControlPanel } from '@/components/MotorControlPanel';
import { SimulationEngine, createInitialState } from '@/digital-twin/simulationEngine';

export default function DigitalTwinPage() {
  const components = useAssemblyStore((s) => s.components);
  const [simulation] = useState(() => new SimulationEngine(createInitialState(components)));
  const [sensorReadings, setSensorReadings] = useState<Record<string, number>>({});
  
  const left = useViewStore((s) => s.leftCollapsed);
  const right = useViewStore((s) => s.rightCollapsed);
  const toggle = useViewStore((s) => s.toggle);

  // Subscribe to simulation updates
  useEffect(() => {
    const unsubscribe = simulation.subscribe((state) => {
      const readings: Record<string, number> = {};
      for (const [id, reading] of Object.entries(state.sensors)) {
        readings[id] = reading.value;
      }
      setSensorReadings(readings);
      
      // Update component status based on faults
      const assemblyStore = require('@/store/assemblyStore').useAssemblyStore.getState();
      const updatedComponents = state.components.map((c) => {
        const componentFaults = state.faults.filter((f) => f.componentId === c.id);
        let status = c.status;
        if (componentFaults.some((f) => f.severity > 0.7)) status = 'fault';
        else if (componentFaults.some((f) => f.severity > 0.3)) status = 'warning';
        else if (componentFaults.length > 0) status = 'warning';
        return c.status !== status ? { ...c, status } : c;
      });
      assemblyStore.replaceAll(updatedComponents);
    });
    
    return unsubscribe;
  }, []);

  const handleMotorStart = useCallback(() => {
    simulation.start();
  }, []);

  const handleMotorStop = useCallback(() => {
    simulation.stop();
  }, []);

  const handleSetRpm = useCallback((rpm: number) => {
    simulation.setTargetRpm(rpm);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <StudioToolbar />
      <div className="flex min-h-0 flex-1">
        {!left && (
          <aside className="w-72 shrink-0 border-r border-line-soft bg-graphite">
            <MotorControlPanel 
              running={simulation.getState().motor.running}
              currentRpm={simulation.getState().motor.currentRpm}
              targetRpm={simulation.getState().motor.targetRpm}
              onStart={handleMotorStart}
              onStop={handleMotorStop}
              onSetRpm={handleSetRpm}
            />
          </aside>
        )}

        <div className="relative min-w-0 flex-1">
          <Viewport />
          
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            <div className="mono rounded-sm border border-line bg-obsidian/80 px-2 py-1 text-[10px] text-warn">
              SIMULATION MODE — No hardware connected
            </div>
            <div className="mono rounded-sm border border-line bg-obsidian/80 px-2 py-1 text-[10px] text-cyan">
              Motor: {simulation.getState().motor.running ? 'RUNNING' : 'STOPPED'} · {simulation.getState().motor.currentRpm.toFixed(0)} RPM
            </div>
            {simulation.getState().faults.length > 0 && (
              <div className="mono rounded-sm border border-fault bg-fault/10 px-2 py-1 text-[10px] text-fault">
                {simulation.getState().faults.length} ACTIVE FAULT(S)
              </div>
            )}
          </div>

          <div className="absolute left-2 bottom-2 flex gap-1">
            <button className="btn" onClick={() => toggle('leftCollapsed')} title="Toggle motor panel">
              {left ? 'Show motor' : 'Hide motor'}
            </button>
            <button className="btn" onClick={() => toggle('rightCollapsed')} title="Toggle panels">
              {right ? 'Show panels' : 'Hide panels'}
            </button>
          </div>
        </div>

        {!right && (
          <aside className="w-96 shrink-0 border-l border-line-soft bg-graphite">
            <div className="flex h-full flex-col">
              <FaultPanel 
                faults={simulation.getState().faults}
                components={require('@/store/assemblyStore').useAssemblyStore.getState().components}
                onActivateFault={(fault) => simulation.activateFault(fault)}
                onDeactivateFault={(id) => simulation.deactivateFault(id)}
              />
              <SensorReadoutsPanel 
                sensors={require('@/store/assemblyStore').useAssemblyStore.getState().sensors}
                readings={sensorReadings}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}