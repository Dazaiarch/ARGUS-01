import { Link } from 'react-router-dom';
import { useAssemblyStore } from '@/store/assemblyStore';
import { COMPLETED_MILESTONES, MILESTONES, SECTIONS } from '@/app/sections';
import { STATUS_COLORS } from '@/machinery/materials';
import type { ComponentStatus } from '@/types';

function Card({ title, tag, children }: { title: string; tag?: string; children: React.ReactNode }) {
  return (
    <section className="panel flex flex-col rounded-sm">
      <header className="flex items-center justify-between border-b border-line-soft px-3 py-2">
        <span className="label">{title}</span>
        {tag && <span className="mono rounded-sm border border-line px-1.5 py-px text-[9px] text-warn">{tag}</span>}
      </header>
      <div className="flex-1 p-3">{children}</div>
    </section>
  );
}

function Stat({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex justify-between gap-3">
      <span className="text-ink-dim">{k}</span>
      <span className="mono text-right text-[11px]">{v}</span>
    </div>
  );
}

export default function CommandCentre() {
  const components = useAssemblyStore((s) => s.components);
  const historyDepth = useAssemblyStore((s) => s.past.length);
  const explode = useAssemblyStore((s) => s.explode);

  const byCategory = components.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1;
    return acc;
  }, {});
  const byStatus = components.reduce<Record<ComponentStatus, number>>(
    (acc, c) => ({ ...acc, [c.status]: acc[c.status] + 1 }),
    { healthy: 0, warning: 0, fault: 0, offline: 0 },
  );
  const provisional = components.filter((c) => c.provisional).length;

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="label">Project</div>
          <h1 className="mt-1 text-xl font-semibold tracking-wide">ARGUS — Rotating Machinery Digital Twin</h1>
          <p className="mt-1 max-w-2xl text-xs text-ink-dim">
            Virtual engineering workstation for the ARGUS condition-monitoring research rig. Everything shown here is a
            software model; no physical hardware is connected.
          </p>
        </div>
        <Link to="/studio" className="btn" data-active="true">
          Open Engineering Studio
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card title="Project status">
          <div className="grid grid-cols-4 gap-1.5">
            {MILESTONES.map((m) => {
              const done = COMPLETED_MILESTONES.includes(m.n);
              return (
                <div
                  key={m.n}
                  className={`rounded-sm border px-2 py-1.5 ${done ? 'border-cyan-dim bg-cyan/5' : 'border-line-soft'}`}
                  title={m.title}
                >
                  <div className="mono text-[10px] text-ink-faint">M{String(m.n).padStart(2, '0')}</div>
                  <div className={`truncate text-[11px] ${done ? 'text-cyan' : 'text-ink-dim'}`}>{m.title}</div>
                </div>
              );
            })}
          </div>
          <div className="mono mt-3 text-[10px] text-ink-faint">
            {COMPLETED_MILESTONES.length} of {MILESTONES.length} milestones built
          </div>
        </Card>

        <Card title="Current machine configuration" tag="PROVISIONAL">
          <Stat k="Configuration" v="Default ARGUS rig (unsaved)" />
          <Stat k="Components" v={components.length} />
          <Stat k="Provisional geometry" v={`${provisional} / ${components.length}`} />
          <Stat k="Assembly state" v={explode > 0.001 ? `exploded ${Math.round(explode * 100)}%` : 'assembled'} />
          <Stat k="Edits this session" v={historyDepth} />
          <p className="mt-2 text-[10px] leading-snug text-ink-faint">
            ARGUS CAD dimensions have not been supplied, so shapes and sizes are placeholders.
          </p>
        </Card>

        <Card title="Simulation state" tag="SIMULATED">
          <Stat k="Motor" v="Stopped" />
          <Stat k="Data source" v="None (simulation engine not built yet)" />
          <Stat k="Active faults" v="0" />
          <p className="mt-2 text-[10px] leading-snug text-ink-faint">
            The Digital Twin module (Milestone 06) will drive motion and sensor values. Until then no readings exist.
          </p>
        </Card>

        <Card title="Machinery component summary">
          {Object.entries(byCategory).map(([cat, n]) => (
            <Stat key={cat} k={cat} v={n} />
          ))}
          <div className="mt-3 flex gap-3 border-t border-line-soft pt-2">
            {(Object.keys(byStatus) as ComponentStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-[11px] text-ink-dim">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLORS[s] }} />
                {byStatus[s]} {s}
              </span>
            ))}
          </div>
        </Card>

        <Card title="Sensor status">
          <Stat k="Virtual sensors placed" v="0" />
          <Stat k="Sensor mount points" v={components.filter((c) => c.type === 'sensor-mount').length} />
          <p className="mt-2 text-[10px] leading-snug text-ink-faint">
            Sensor placement arrives in Milestone 04. Mount points exist on the model but no sensors are attached.
          </p>
        </Card>

        <Card title="Recent projects">
          <div className="text-xs text-ink-dim">No saved projects yet.</div>
          <p className="mt-2 text-[10px] leading-snug text-ink-faint">
            Configuration save/load is part of Milestone 04. Saved configurations will be listed here.
          </p>
        </Card>
      </div>

      <div className="mt-5">
        <div className="label mb-2">Engineering tools</div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {SECTIONS.filter((s) => s.id !== 'command-centre').map((s) => {
            const ready = COMPLETED_MILESTONES.includes(s.milestone);
            return (
              <Link key={s.id} to={s.path} className="panel group rounded-sm p-3 hover:border-cyan-dim">
                <div className="flex items-center justify-between">
                  <span className="mono text-[11px] text-cyan">{s.code}</span>
                  <span className={`mono text-[9px] ${ready ? 'text-ok' : 'text-ink-faint'}`}>
                    {ready ? 'AVAILABLE' : `M${String(s.milestone).padStart(2, '0')}`}
                  </span>
                </div>
                <div className="mt-1 text-xs font-medium">{s.label}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-ink-dim">{s.summary}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
