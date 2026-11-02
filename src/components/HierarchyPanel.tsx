import { useAssemblyStore } from '@/store/assemblyStore';
import { useViewStore } from '@/store/viewStore';
import { STATUS_COLORS } from '@/machinery/materials';
import type { MachineComponent } from '@/types';

function Row({
  c,
  depth,
  allComponents,
  dimmed,
}: { c: MachineComponent; depth: number; allComponents: MachineComponent[]; dimmed: boolean }) {
  const selectedId = useAssemblyStore((s) => s.selectedId);
  const select = useAssemblyStore((s) => s.select);
  const toggleVisible = useAssemblyStore((s) => s.toggleVisible);
  const toggleLocked = useAssemblyStore((s) => s.toggleLocked);
  const setMoveWithParent = useAssemblyStore((s) => s.setMoveWithParent);
  const isolate = useViewStore((s) => s.isolate);
  const clearIsolation = useViewStore((s) => s.clearIsolation);
  const isolatedId = useViewStore((s) => s.isolatedId);
  const isolatedAncestors = useViewStore((s) => s.isolatedAncestors);
  const active = selectedId === c.id;
  const isIsolated = isolatedId === c.id;
  const isAncestorOfIsolated = isolatedAncestors.includes(c.id);

  return (
    <div
      role="treeitem"
      aria-selected={active}
      onClick={() => select(c.id)}
      className={`group flex cursor-pointer items-center gap-1.5 border-l-2 py-1 pr-1 ${
        active ? 'border-cyan bg-cyan/10' : 'border-transparent hover:bg-gunmetal'
      } ${isIsolated ? 'bg-cyan/5' : ''} ${isAncestorOfIsolated ? 'bg-cyan/3' : ''} ${dimmed ? 'opacity-30' : ''}`}
      style={{ paddingLeft: 8 + depth * 14 }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: STATUS_COLORS[c.status] }} title={c.status} />
      <span className={`flex-1 truncate ${c.visible ? 'text-ink' : 'text-ink-faint line-through'}`}>
        {isIsolated && <span className="text-cyan mr-1">● </span>}
        {isAncestorOfIsolated && <span className="text-cyan mr-1">▲ </span>}
        {c.name}
      </span>
      {c.parentId && (
        <button
          className={`mono w-5 text-[10px] hover:text-cyan ${c.moveWithParent ? 'text-cyan' : 'text-ink-faint'}`}
          title={c.moveWithParent ? 'Move with parent (local)' : 'Fixed world position'}
          onClick={(e) => {
            e.stopPropagation();
            setMoveWithParent(c.id, !c.moveWithParent);
          }}
        >
          {c.moveWithParent ? '↗' : '◆'}
        </button>
      )}
      <button
        className={`mono w-5 text-[10px] hover:text-cyan ${isIsolated ? 'text-cyan' : 'text-ink-faint'}`}
        title={isIsolated ? 'Exit isolation' : 'Isolate this component'}
        onClick={(e) => {
          e.stopPropagation();
          if (isIsolated) {
            clearIsolation();
          } else {
            isolate(c.id, allComponents);
          }
        }}
      >
        {isIsolated ? '◎' : '○'}
      </button>
      <button
        className="mono w-5 text-[10px] text-ink-faint hover:text-cyan"
        title={c.visible ? 'Hide' : 'Show'}
        onClick={(e) => {
          e.stopPropagation();
          toggleVisible(c.id);
        }}
      >
        {c.visible ? 'V' : '–'}
      </button>
      <button
        className={`mono w-5 text-[10px] hover:text-cyan ${c.locked ? 'text-warn' : 'text-ink-faint'}`}
        title={c.locked ? 'Unlock' : 'Lock'}
        onClick={(e) => {
          e.stopPropagation();
          toggleLocked(c.id);
        }}
      >
        {c.locked ? 'L' : '·'}
      </button>
    </div>
  );
}

function Branch({
  parentId,
  all,
  depth,
  isolatedId,
  isolatedAncestors,
}: {
  parentId: string | null;
  all: MachineComponent[];
  depth: number;
  isolatedId: string | null;
  isolatedAncestors: string[];
}) {
  const children = all.filter((c) => c.parentId === parentId);
  const isParentIsolated = Boolean(isolatedId && (parentId === isolatedId || isolatedAncestors.includes(parentId ?? '')));
  const shouldDim = Boolean(isolatedId && !isParentIsolated && parentId !== isolatedId);

  return (
    <>
      {children.map((c) => (
        <div key={c.id} style={{ opacity: shouldDim ? 0.35 : 1 }}>
          <Row c={c} depth={depth} allComponents={all} dimmed={shouldDim} />
          <Branch
            parentId={c.id}
            all={all}
            depth={depth + 1}
            isolatedId={isolatedId}
            isolatedAncestors={isolatedAncestors}
          />
        </div>
      ))}
    </>
  );
}

export function HierarchyPanel() {
  const components = useAssemblyStore((s) => s.components);
  const isolatedId = useViewStore((s) => s.isolatedId);
  const isolatedAncestors = useViewStore((s) => s.isolatedAncestors);
  const searchQuery = useViewStore((s) => s.searchQuery);
  const setSearchQuery = useViewStore((s) => s.setSearchQuery);

  // Filter components by search query
  const filteredComponents = searchQuery
    ? components.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : components;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line-soft px-3 py-2">
        <span className="label">Assembly hierarchy</span>
        <span className="mono text-[10px] text-ink-faint">{components.length} parts</span>
      </div>

      {/* Search */}
      <div className="border-b border-line-soft px-3 py-2">
        <input
          type="text"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="field w-full"
          aria-label="Search components"
        />
      </div>

      <div role="tree" className="flex-1 overflow-y-auto py-1 text-xs">
        <Branch
          parentId={null}
          all={filteredComponents}
          depth={0}
          isolatedId={isolatedId}
          isolatedAncestors={isolatedAncestors}
        />
      </div>

      <div className="border-t border-line-soft px-3 py-2 text-[10px] leading-snug text-ink-faint">
        ↗ = moves with parent (local transform) · ◆ = fixed world position. Root parts always use world position.
        <br />
        ○ = isolate component · ◎ = exit isolation · Dimmed = hidden by isolation
      </div>
    </div>
  );
}