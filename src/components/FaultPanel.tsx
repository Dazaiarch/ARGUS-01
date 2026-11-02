import { useState } from 'react';
import type { Fault, FaultType, MachineComponent } from '@/types';

const FAULT_DEFINITIONS: Record<FaultType, { label: string; icon: string; color: string; description: string }> = {
  'imbalance': { label: 'Rotor Imbalance', icon: '⚖️', color: '#e3b341', description: 'Mass unbalance on rotor causing 1× RPM vibration' },
  'misalignment': { label: 'Shaft Misalignment', icon: '↔️', color: '#e5534b', description: 'Angular or parallel misalignment causing 2× RPM vibration' },
  'bearing-defect': { label: 'Bearing Defect', icon: '🔘', color: '#4cc38a', description: 'Inner/outer race or ball defect with characteristic frequencies' },
  'overheating': { label: 'Overheating', icon: '🌡️', color: '#e5534b', description: 'Excessive temperature rise due to friction or overload' },
};

function ActiveFaultsTab({ faults, components, onDeactivateFault }: { faults: Fault[]; components: MachineComponent[]; onDeactivateFault: (id: string) => void }) {
  if (faults.length === 0) {
    return (
      <div className="p-4 text-center text-ink-dim">
        No active faults. System operating normally.
      </div>
    );
  }

  return (
    <div className="p-2 space-y-2">
      {faults.map((fault) => {
        const def = FAULT_DEFINITIONS[fault.type];
        const component = components.find(c => c.id === fault.componentId);
        const duration = Date.now() - fault.activatedAt;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);

        return (
          <div key={fault.id} className="p-2 rounded-sm border border-fault/30 bg-fault/5">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <span style={{ color: def.color }}>{def.icon}</span>
                <span className="font-medium" style={{ color: def.color }}>{def.label}</span>
                <span className="mono text-[10px] text-ink-dim">Severity: {Math.round(fault.severity * 100)}%</span>
              </div>
              <button
                className="btn text-[10px] bg-fault/20 border-fault text-fault hover:bg-fault/30"
                onClick={() => onDeactivateFault(fault.id)}
              >
                Clear
              </button>
            </div>
            <div className="text-[10px] text-ink-dim mb-1">
              <span className="font-medium">{component?.name || fault.componentId}</span>
              <span className="ml-2">Active for {minutes}m {seconds}s</span>
            </div>
            <div className="text-[10px] text-ink-dim italic">{def.description}</div>
{fault.parameters && (
                      <div className="mt-1 text-[9px] text-ink-faint">
                        {Object.entries(fault.parameters).map(([k, v]) => (
                          <div key={k} className="mono">{k}: {String(v)}</div>
                        ))}
                      </div>
                    )}
          </div>
        );
      })}
    </div>
  );
}

function FaultLibraryTab({ onActivateFault }: { onActivateFault: (fault: Omit<Fault, 'id' | 'activatedAt'>) => string }) {
  return (
    <div className="p-2 space-y-2">
      {Object.entries(FAULT_DEFINITIONS).map(([type, def]) => (
        <button
          key={type}
          className="btn w-full text-left justify-start p-2 border border-line bg-obsidian/50 hover:bg-cyan/5 hover:border-cyan"
          onClick={() => {
            const component = prompt('Enter component ID to apply fault to:', 'ARGUS-BRG-001');
            if (component) {
              onActivateFault({
                type: type as any,
                componentId: component,
                severity: 0.5,
                parameters: {},
              });
            }
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: def.color }} className="text-lg">{def.icon}</span>
            <div>
              <div className="font-medium" style={{ color: def.color }}>{def.label}</div>
              <div className="text-[10px] text-ink-dim">{def.description}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function FaultPanel({ faults, components, onActivateFault, onDeactivateFault }: { faults: Fault[]; components: MachineComponent[]; onActivateFault: (fault: Omit<Fault, 'id' | 'activatedAt'>) => string; onDeactivateFault: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState<'active' | 'library'>('active');

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line-soft px-3 py-2">
        <div className="flex gap-1 mb-2">
          <button className={`btn ${activeTab === 'active' ? 'data-active="true"' : ''}`} onClick={() => setActiveTab('active')}>
            Active Faults ({faults.length})
          </button>
          <button className={`btn ${activeTab === 'library' ? 'data-active="true"' : ''}`} onClick={() => setActiveTab('library')}>
            Fault Library
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'active' ? (
          <ActiveFaultsTab faults={faults} components={components} onDeactivateFault={onDeactivateFault} />
        ) : (
          <FaultLibraryTab onActivateFault={onActivateFault} />
        )}
      </div>

      <div className="border-t border-line-soft px-3 py-2 text-[10px] leading-relaxed text-ink-dim">
        Active faults modify sensor readings in real-time. Click a fault in the library to inject it into a component.
      </div>
    </div>
  );
}