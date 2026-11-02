import { useEffect, useState } from 'react';
import { MathUtils } from 'three';
import { useAssemblyStore } from '@/store/assemblyStore';
import { MATERIALS, STATUS_COLORS } from '@/machinery/materials';
import type { Vec3, MachineComponent } from '@/types';

function NumField({
  value,
  onCommit,
  disabled,
  step = 0.01,
}: {
  value: number;
  onCommit: (v: number) => void;
  disabled?: boolean;
  step?: number;
}) {
  const fmt = (v: number) => String(Math.round(v * 10000) / 10000);
  const [text, setText] = useState(fmt(value));
  useEffect(() => setText(fmt(value)), [value]);

  const commit = () => {
    const n = parseFloat(text);
    if (Number.isFinite(n) && n !== value) onCommit(n);
    else setText(fmt(value));
  };

  return (
    <input
      className="field"
      type="number"
      step={step}
      value={text}
      disabled={disabled}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') setText(fmt(value));
        e.stopPropagation();
      }}
    />
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line-soft px-3 py-2.5">
      <div className="label mb-2">{title}</div>
      {children}
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <span className="text-ink-dim">{k}</span>
      <span className="mono text-right text-[11px]">{children}</span>
    </div>
  );
}

function Vec3Row({
  label,
  value,
  onChange,
  disabled,
  step,
}: {
  label: string;
  value: Vec3;
  onChange: (v: Vec3) => void;
  disabled?: boolean;
  step?: number;
}) {
  return (
    <div className="mb-2">
      <div className="mb-1 text-ink-dim">{label}</div>
      <div className="grid grid-cols-3 gap-1">
        {(['X', 'Y', 'Z'] as const).map((axis, i) => (
          <label key={axis} className="flex items-center gap-1">
            <span className="mono w-2 text-[10px] text-ink-faint">{axis}</span>
            <NumField
              value={value[i]}
              disabled={disabled}
              step={step}
              onCommit={(n) => {
                const next = [...value] as Vec3;
                next[i] = n;
                onChange(next);
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function TransformSection({ c, setTransform, setLocalTransform, setMoveWithParent, getWorldTransform }: {
  c: MachineComponent;
  setTransform: (id: string, patch: { position?: Vec3; rotation?: Vec3; scale?: Vec3 }) => void;
  setLocalTransform: (id: string, patch: { localPosition?: Vec3; localRotation?: Vec3; localScale?: Vec3 }) => void;
  setMoveWithParent: (id: string, value: boolean) => void;
  getWorldTransform: (id: string) => { position: Vec3; rotation: Vec3; scale: Vec3 } | null;
}) {
  const rotDeg: Vec3 = [
    MathUtils.radToDeg(c.rotation[0]),
    MathUtils.radToDeg(c.rotation[1]),
    MathUtils.radToDeg(c.rotation[2]),
  ];
  const localRotDeg: Vec3 = [
    MathUtils.radToDeg(c.localRotation[0]),
    MathUtils.radToDeg(c.localRotation[1]),
    MathUtils.radToDeg(c.localRotation[2]),
  ];
  const world = getWorldTransform(c.id);

  const isLocal = c.moveWithParent && c.parentId;

  if (isLocal) {
    return (
      <>
        <div className="mb-2 p-2 rounded-sm border border-cyan/20 bg-cyan/5">
          <div className="flex items-center gap-2 mb-2">
            <span className="mono text-[10px] text-cyan">LOCAL TRANSFORM</span>
            <span className="text-[10px] text-ink-dim">(relative to parent)</span>
            <label className="flex items-center gap-1.5 ml-auto">
              <input
                type="checkbox"
                checked={c.moveWithParent}
                onChange={(e) => setMoveWithParent(c.id, e.target.checked)}
                className="accent-cyan"
              />
              <span className="mono text-[10px] text-ink-dim">Move with parent</span>
            </label>
          </div>
          <Vec3Row
            label="Local Position (m)"
            value={c.localPosition}
            disabled={c.locked}
            onChange={(localPosition) => setLocalTransform(c.id, { localPosition })}
          />
          <Vec3Row
            label="Local Rotation (deg)"
            value={localRotDeg}
            disabled={c.locked}
            step={1}
            onChange={(deg) =>
              setLocalTransform(c.id, {
                localRotation: [MathUtils.degToRad(deg[0]), MathUtils.degToRad(deg[1]), MathUtils.degToRad(deg[2])],
              })
            }
          />
          <Vec3Row
            label="Local Scale"
            value={c.localScale}
            disabled={c.locked}
            step={0.01}
            onChange={(localScale) => setLocalTransform(c.id, { localScale })}
          />
          {world && (
            <div className="mt-2 p-2 rounded-sm border border-line bg-obsidian/50">
              <div className="mono text-[10px] text-ink-dim mb-1">Computed World Transform (read-only)</div>
              <div className="grid grid-cols-3 gap-1 text-[10px] text-ink-faint">
                <div>Pos: {world.position.map(v => v.toFixed(4)).join(', ')}</div>
                <div>Rot: {world.rotation.map(v => MathUtils.radToDeg(v).toFixed(1)).join(', ')}°</div>
                <div>Scale: {world.scale.map(v => v.toFixed(2)).join(', ')}</div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <span className="mono text-[10px] text-ink-dim">WORLD TRANSFORM</span>
        {c.parentId && (
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={c.moveWithParent}
              onChange={(e) => setMoveWithParent(c.id, e.target.checked)}
              className="accent-cyan"
            />
            <span className="mono text-[10px] text-ink-dim">Move with parent</span>
          </label>
        )}
      </div>
      <Vec3Row label="Position (m)" value={c.position} disabled={c.locked} onChange={(position) => setTransform(c.id, { position })} />
      <Vec3Row
        label="Rotation (deg)"
        value={rotDeg}
        disabled={c.locked}
        step={1}
        onChange={(deg) =>
          setTransform(c.id, {
            rotation: [MathUtils.degToRad(deg[0]), MathUtils.degToRad(deg[1]), MathUtils.degToRad(deg[2])],
          })
        }
      />
      <Row k="Scale">{c.scale.map((s) => s.toFixed(2)).join(' · ')}</Row>
      {c.locked && <div className="mt-1 text-[10px] text-warn">Locked — unlock to edit the transform.</div>}
    </>
  );
}

export function PropertiesPanel() {
  const selectedId = useAssemblyStore((s) => s.selectedId);
  const c = useAssemblyStore((s) => s.components.find((x) => x.id === selectedId) ?? null);
  const setTransform = useAssemblyStore((s) => s.setTransform);
  const setLocalTransform = useAssemblyStore((s) => s.setLocalTransform);
  const setDimensions = useAssemblyStore((s) => s.setDimensions);
  const setMoveWithParent = useAssemblyStore((s) => s.setMoveWithParent);
  const getWorldTransform = useAssemblyStore((s) => s.getWorldTransform);

  if (!c) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-line-soft px-3 py-2">
          <span className="label">Properties</span>
        </div>
        <div className="p-4 text-xs leading-relaxed text-ink-dim">
          Select a component in the viewport or the hierarchy to inspect it.
        </div>
      </div>
    );
  }

  const dimEntries = Object.entries(c.dimensions) as [keyof typeof c.dimensions, number][];

  const onDimension = (key: keyof typeof c.dimensions, v: number) => {
    if (v <= 0) return;
    if (
      c.scaleConstrained &&
      !window.confirm(
        `${c.name} is a mechanically constrained part. Changing its ${key} may no longer match the mating bearings, coupling or housings. Continue?`,
      )
    )
      return;
    setDimensions(c.id, { [key]: v });
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-line-soft px-3 py-2">
        <span className="label">Properties</span>
      </div>

      <Section title="Identity">
        <Row k="ID">{c.id}</Row>
        <Row k="Name">{c.name}</Row>
        <Row k="Category">{c.category}</Row>
        <Row k="Type">{c.type}</Row>
        <Row k="Status">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLORS[c.status] }} />
            {c.status}
          </span>
        </Row>
        <Row k="State">{[c.locked ? 'locked' : 'unlocked', c.visible ? 'visible' : 'hidden'].join(' · ')}</Row>
      </Section>

      <Section title="Transform (m, deg)">
        <TransformSection
          c={c}
          setTransform={setTransform}
          setLocalTransform={setLocalTransform}
          setMoveWithParent={setMoveWithParent}
          getWorldTransform={getWorldTransform}
        />
      </Section>

      <Section title="Dimensions (m)">
        {dimEntries.map(([k, v]) => (
          <div key={k} className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-ink-dim">{k}</span>
            <div className="w-24">
              <NumField value={v} disabled={c.locked} onCommit={(n) => onDimension(k, n)} />
            </div>
          </div>
        ))}
        {c.scaleConstrained && (
          <div className="mt-1 text-[10px] text-ink-faint">Constrained part — edits ask for confirmation, scaling is blocked.</div>
        )}
        {c.provisional && (
          <div className="mt-1 text-[10px] text-warn">Provisional geometry — not supplied by ARGUS CAD.</div>
        )}
      </Section>

      <Section title="Material">
        <Row k="Material">{MATERIALS[c.material].label}</Row>
      </Section>

      <Section title="Hierarchy">
        <Row k="Parent">{c.parentId ?? '— (root)'}</Row>
        <Row k="Move with parent">{c.moveWithParent ? 'Yes (local)' : 'No (world)'}</Row>
      </Section>

      <Section title="Associated sensors">
        {c.sensorIds.length ? (
          c.sensorIds.map((id) => (
            <div key={id} className="mono text-[11px]">
              {id}
            </div>
          ))
        ) : (
          <div className="text-ink-dim">None placed yet.</div>
        )}
      </Section>
    </div>
  );
}
