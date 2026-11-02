import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { SECTIONS } from './sections';
import { useViewStore } from '@/store/viewStore';
import { useAssemblyStore } from '@/store/assemblyStore';

export function Shell() {
  const collapsed = useViewStore((s) => s.navCollapsed);
  const toggle = useViewStore((s) => s.toggle);
  const warning = useViewStore((s) => s.scaleWarning);
  const view = useViewStore((s) => s.viewPreset);
  const mode = useViewStore((s) => s.transformMode);
  const selected = useAssemblyStore((s) => s.components.find((c) => c.id === s.selectedId) ?? null);
  const count = useAssemblyStore((s) => s.components.length);
  const location = useLocation();
  const current = SECTIONS.find((s) => s.path === location.pathname);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-line-soft bg-graphite px-3">
        <div className="flex items-center gap-3">
          <button className="btn !h-6 !px-2" onClick={() => toggle('navCollapsed')} title="Collapse navigation" aria-label="Toggle navigation">
            ≡
          </button>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-[0.25em] text-ink">ARGUS</span>
            <span className="label hidden sm:inline">Engineering environment</span>
          </div>
        </div>
        <div className="mono text-[11px] text-ink-dim">{current?.label ?? ''}</div>
        <div className="mono hidden rounded-sm border border-line px-2 py-0.5 text-[10px] text-warn md:block">
          SIMULATION · NO HARDWARE CONNECTED
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className={`shrink-0 border-r border-line-soft bg-graphite ${collapsed ? 'w-12' : 'w-48'} transition-[width] duration-150`}>
          <ul className="py-1">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <NavLink
                  to={s.path}
                  end
                  title={s.label}
                  className={({ isActive }) =>
                    `flex h-9 items-center gap-3 border-l-2 px-3 text-xs ${
                      isActive ? 'border-cyan bg-cyan/10 text-ink' : 'border-transparent text-ink-dim hover:bg-gunmetal hover:text-ink'
                    }`
                  }
                >
                  <span className="mono w-5 shrink-0 text-[11px] text-cyan">{s.code}</span>
                  {!collapsed && <span className="truncate">{s.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1 bg-obsidian">
          <Outlet />
        </main>
      </div>

      <footer className="mono flex h-6 shrink-0 items-center justify-between gap-4 border-t border-line-soft bg-graphite px-3 text-[10px] text-ink-dim">
        <div className="flex items-center gap-4 truncate">
          <span>{count} components</span>
          <span>{selected ? `Selected: ${selected.id}` : 'No selection'}</span>
          {location.pathname === '/studio' && (
            <>
              <span>View: {view}</span>
              <span>Mode: {mode}</span>
            </>
          )}
        </div>
        <div className="truncate text-warn">{warning ?? 'Provisional geometry · simulated data only'}</div>
      </footer>
    </div>
  );
}
