import { useState } from 'react';

interface Props {
  running: boolean;
  currentRpm: number;
  targetRpm: number;
  onStart: () => void;
  onStop: () => void;
  onSetRpm: (rpm: number) => void;
}

export function MotorControlPanel({ running, currentRpm, targetRpm, onStart, onStop, onSetRpm }: Props) {
  const [rpmInput, setRpmInput] = useState(String(targetRpm));

  return (
    <div className="flex h-full flex-col p-3">
      <div className="border-b border-line-soft pb-2 mb-2">
        <span className="label">Motor Control</span>
      </div>

      <div className="mb-3">
        <div className="label mb-1">Status</div>
        <div className={`flex items-center gap-2 p-2 rounded-sm ${running ? 'bg-ok/20 border-ok' : 'bg-fault/20 border-fault'}`}>
          <div className={`h-2 w-2 rounded-full ${running ? 'bg-ok' : 'bg-fault'}`} />
          <span className="mono text-sm">{running ? 'RUNNING' : 'STOPPED'}</span>
        </div>
      </div>

      <div className="mb-3">
        <div className="label mb-1">Current RPM</div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-3xl font-mono font-bold text-cyan">{currentRpm.toFixed(0)}</div>
            <div className="text-xs text-ink-dim">RPM</div>
          </div>
          <div className="h-16 w-px bg-line" />
          <div className="text-3xl font-mono font-bold text-ink-dim">{targetRpm.toFixed(0)}</div>
          <div className="text-xs text-ink-dim">Target RPM</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="label mb-1">Set Target RPM</div>
        <div className="flex gap-1">
          <input
            type="number"
            className="field flex-1"
            value={rpmInput}
            onChange={(e) => setRpmInput(e.target.value)}
            placeholder="Target RPM"
            min="0"
            max="5000"
            step="10"
          />
          <button className="btn" onClick={() => onSetRpm(parseInt(rpmInput) || 0)} disabled={!running}>
            Apply
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="label mb-1">Quick RPM Presets</div>
        <div className="grid grid-cols-2 gap-1">
          {[0, 500, 1000, 1500, 2000, 2500, 3000, 3600].map((rpm) => (
            <button
              key={rpm}
              className={`btn ${targetRpm === rpm ? 'data-active="true"' : ''}`}
              onClick={() => onSetRpm(rpm)}
              disabled={!running}
            >
              {rpm} RPM
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <div className="flex gap-2">
          <button className="btn flex-1" onClick={onStart} disabled={running}>
            Start Motor
          </button>
          <button className="btn flex-1 bg-fault/20 border-fault text-fault hover:bg-fault/30" onClick={onStop} disabled={!running}>
            Stop Motor
          </button>
        </div>
      </div>

      <div className="border-t border-line-soft pt-3 text-[10px] leading-relaxed text-ink-dim">
        <strong>Motor Parameters:</strong>
        <ul className="list-disc list-inside mt-1 space-y-0.5">
          <li>Inertia: 0.1 kg·m²</li>
          <li>Rated Torque: 50 N·m</li>
          <li>Max Speed: 3600 RPM</li>
          <li>Viscous Damping: 0.1 N·m·s/rad</li>
        </ul>
      </div>
    </div>
  );
}