import { Viewport } from '@/engine/Viewport';
import { HierarchyPanel } from '@/components/HierarchyPanel';
import { PropertiesPanel } from '@/components/PropertiesPanel';
import { StudioToolbar } from '@/components/StudioToolbar';
import { useStudioShortcuts, SHORTCUTS } from '@/hooks/useStudioShortcuts';
import { useViewStore } from '@/store/viewStore';
import { useAssemblyStore } from '@/store/assemblyStore';
import { useState } from 'react';

export default function EngineeringStudio() {
  useStudioShortcuts();
  const left = useViewStore((s) => s.leftCollapsed);
  const right = useViewStore((s) => s.rightCollapsed);
  const toggle = useViewStore((s) => s.toggle);
  const explode = useAssemblyStore((s) => s.explode);
  const [help, setHelp] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <StudioToolbar />
      <div className="flex min-h-0 flex-1">
        {!left && (
          <aside className="w-64 shrink-0 border-r border-line-soft bg-graphite">
            <HierarchyPanel />
          </aside>
        )}

        <div className="relative min-w-0 flex-1">
          <Viewport />

          <div className="pointer-events-none absolute left-2 top-2 flex flex-col gap-1">
            <div className="mono rounded-sm border border-line bg-obsidian/80 px-2 py-1 text-[10px] text-warn">
              PROVISIONAL GEOMETRY — not engineering-accurate
            </div>
            {explode > 0.001 && (
              <div className="mono rounded-sm border border-line bg-obsidian/80 px-2 py-1 text-[10px] text-cyan">
                EXPLODED VIEW {Math.round(explode * 100)}% — transform gizmo disabled
              </div>
            )}
          </div>

          <div className="absolute left-2 bottom-2 flex gap-1">
            <button className="btn" onClick={() => toggle('leftCollapsed')} title="Toggle hierarchy panel">
              {left ? 'Show hierarchy' : 'Hide hierarchy'}
            </button>
            <button className="btn" onClick={() => setHelp((h) => !h)} data-active={help} title="Keyboard shortcuts">
              Shortcuts
            </button>
          </div>
          <div className="absolute right-2 bottom-2">
            <button className="btn" onClick={() => toggle('rightCollapsed')} title="Toggle properties panel">
              {right ? 'Show properties' : 'Hide properties'}
            </button>
          </div>

          {help && (
            <div className="absolute bottom-12 left-2 w-80 rounded-sm border border-line bg-graphite p-3 text-xs shadow-xl">
              <div className="label mb-2">Keyboard shortcuts</div>
              {SHORTCUTS.map((s) => (
                <div key={s.keys} className="mb-1 flex justify-between gap-3">
                  <span className="mono text-cyan">{s.keys}</span>
                  <span className="text-right text-ink-dim">{s.action}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {!right && (
          <aside className="w-72 shrink-0 border-l border-line-soft bg-graphite">
            <PropertiesPanel />
          </aside>
        )}
      </div>
    </div>
  );
}
