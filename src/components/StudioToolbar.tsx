import { useAssemblyStore } from '@/store/assemblyStore';
import { useViewStore } from '@/store/viewStore';
import type { TransformMode, ViewPreset } from '@/types';

const VIEWS: { id: ViewPreset; label: string; key: string }[] = [
  { id: 'perspective', label: 'Persp', key: '1' },
  { id: 'orthographic', label: 'Ortho', key: '2' },
  { id: 'front', label: 'Front', key: '3' },
  { id: 'side', label: 'Side', key: '4' },
  { id: 'top', label: 'Top', key: '5' },
  { id: 'isometric', label: 'Iso', key: '6' },
];

const MODES: { id: TransformMode; label: string; key: string }[] = [
  { id: 'translate', label: 'Move', key: 'W' },
  { id: 'rotate', label: 'Rotate', key: 'E' },
  { id: 'scale', label: 'Scale', key: 'R' },
];

const MEASUREMENT_MODES: { id: 'none' | 'distance' | 'angle' | 'diameter'; label: string; key: string }[] = [
  { id: 'none', label: 'Measure', key: 'M' },
  { id: 'distance', label: 'Dist', key: 'D' },
  { id: 'angle', label: 'Angle', key: 'A' },
  { id: 'diameter', label: 'Diam', key: 'I' },
];

function Sep() {
  return <div className="mx-1 h-5 w-px bg-line" />;
}

export function StudioToolbar() {
  const view = useViewStore();
  const asm = useAssemblyStore();
  const sel = asm.components.find((c) => c.id === asm.selectedId) ?? null;
  const isolatedId = useViewStore((s) => s.isolatedId);

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-line-soft bg-graphite px-2 py-1.5">
      <div className="flex items-center gap-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            className="btn"
            data-active={view.transformMode === m.id}
            onClick={() => view.setTransformMode(m.id)}
            title={`${m.label} (${m.key})`}
          >
            {m.label}
          </button>
        ))}
        <button className="btn" data-active={view.snap} onClick={() => view.toggle('snap')} title="Snap to grid (G)">
          Snap
        </button>
      </div>
      <Sep />
      <div className="flex items-center gap-1">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            className="btn"
            data-active={view.viewPreset === v.id}
            onClick={() => view.setViewPreset(v.id)}
            title={`${v.label} view (${v.key})`}
          >
            {v.label}
          </button>
        ))}
        <button className="btn" onClick={view.resetCamera} title="Reset camera (F)">
          Reset
        </button>
      </div>
      <Sep />
      <div className="flex items-center gap-1">
        <button className="btn" data-active={view.showGrid} onClick={() => view.toggle('showGrid')} title="Toggle grid">
          Grid
        </button>
        <button className="btn" data-active={view.showAxes} onClick={() => view.toggle('showAxes')} title="Toggle coordinate axes">
          Axes
        </button>
        <button className="btn" data-active={view.showLabels} onClick={() => view.toggle('showLabels')} title="Toggle component ID labels">
          Labels
        </button>
        <button className="btn" data-active={view.wireframeMode} onClick={() => view.setWireframeMode(!view.wireframeMode)} title="Wireframe mode">
          Wire
        </button>
        <button className="btn" data-active={view.xrayMode} onClick={() => view.setXrayMode(!view.xrayMode)} title="X-ray mode">
          X-ray
        </button>
        <label className="ml-1 flex items-center gap-1.5" title="Lighting intensity">
          <span className="label">Light</span>
          <input
            type="range"
            min={0.3}
            max={2}
            step={0.05}
            value={view.lightIntensity}
            onChange={(e) => view.setLightIntensity(parseFloat(e.target.value))}
            className="w-20 accent-cyan"
          />
        </label>
      </div>
      <Sep />
      <div className="flex items-center gap-1">
        <label className="flex items-center gap-1.5" title="Exploded view (X)">
          <span className="label">Explode</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={asm.explode}
            onChange={(e) => asm.setExplode(parseFloat(e.target.value))}
            className="w-24 accent-cyan"
          />
        </label>
        <button
          className="btn"
          data-active={view.explodeAnimating}
          onClick={() => view.animateExplode(view.explodeTarget > 0.5 ? 0 : 1, 800)}
          title="Animate explode/collapse (X)"
          disabled={view.explodeAnimating}
        >
          ▶
        </button>
      </div>
      <Sep />
      <div className="flex items-center gap-1">
        {MEASUREMENT_MODES.map((m) => (
          <button
            key={m.id}
            className="btn"
            data-active={view.measurementMode === m.id}
            onClick={() => view.setMeasurementMode(m.id)}
            title={`${m.label} (${m.key})`}
            disabled={m.id !== 'none' && view.measurementMode !== 'none' && view.measurementMode !== m.id}
          >
            {m.label}
          </button>
        ))}
        <button
          className="btn"
          disabled={view.measurementPoints.length === 0}
          onClick={view.clearMeasurementPoints}
          title="Clear measurements"
        >
          Clear
        </button>
      </div>
      <Sep />
      <div className="flex items-center gap-1">
        <span className="label">Clipping</span>
        <button className="btn" onClick={() => view.addClippingPlane({ enabled: true, normal: [0, 1, 0], constant: 0, color: '#38d1e8' })} title="Add horizontal clipping plane">
          +H
        </button>
        <button className="btn" onClick={() => view.addClippingPlane({ enabled: true, normal: [1, 0, 0], constant: 0, color: '#e3b341' })} title="Add vertical clipping plane (X)">
          +V
        </button>
        <button className="btn" onClick={() => view.addClippingPlane({ enabled: true, normal: [0, 0, 1], constant: 0, color: '#e5534b' })} title="Add vertical clipping plane (Z)">
          +Z
        </button>
        <button className="btn" disabled={view.clippingPlanes.length === 0} onClick={() => view.removeClippingPlane(view.clippingPlanes.length - 1)} title="Remove last clipping plane">
          −
        </button>
        <button className="btn" disabled={view.clippingPlanes.length === 0} onClick={() => view.clippingPlanes.forEach((_, i) => view.removeClippingPlane(i))} title="Clear all clipping planes">
          ✕
        </button>
      </div>
      <Sep />
      <div className="flex items-center gap-1">
        <button className="btn" onClick={asm.undo} disabled={!asm.past.length} title="Undo (Ctrl+Z)">
          Undo
        </button>
        <button className="btn" onClick={asm.redo} disabled={!asm.future.length} title="Redo (Ctrl+Y)">
          Redo
        </button>
        <button className="btn" disabled={!sel} onClick={() => sel && asm.toggleVisible(sel.id)} title="Hide / show selected (H)">
          {sel && !sel.visible ? 'Show' : 'Hide'}
        </button>
        <button className="btn" disabled={!sel} onClick={() => sel && asm.toggleLocked(sel.id)} title="Lock / unlock selected (L)">
          {sel?.locked ? 'Unlock' : 'Lock'}
        </button>
        <button className="btn" disabled={!sel} onClick={() => sel && asm.duplicate(sel.id)} title="Duplicate (Ctrl+D)">
          Duplicate
        </button>
        <button className="btn" disabled={!sel || sel.locked} onClick={() => sel && asm.resetTransform(sel.id)} title="Reset transformation">
          Reset xform
        </button>
        <button className="btn" disabled={!sel || sel.locked} onClick={() => sel && asm.remove(sel.id)} title="Remove (Del)">
          Remove
        </button>
        <button
          className="btn"
          onClick={() => {
            if (window.confirm('Reset the whole assembly to the default provisional layout?')) asm.resetAssembly();
          }}
          title="Reset assembly"
        >
          Reset assembly
        </button>
        {isolatedId && (
          <button className="btn" data-active="true" onClick={useViewStore.getState().clearIsolation} title="Exit isolation mode (I)">
            Exit Isolation
          </button>
        )}
      </div>
    </div>
  );
}