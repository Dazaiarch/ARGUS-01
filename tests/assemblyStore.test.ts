import { beforeEach, describe, expect, it } from 'vitest';
import { useAssemblyStore } from '@/store/assemblyStore';
import { createDefaultAssembly } from '@/machinery/defaultAssembly';

const get = () => useAssemblyStore.getState();

beforeEach(() => {
  get().replaceAll(createDefaultAssembly());
});

describe('default assembly', () => {
  it('has unique IDs and valid parents', () => {
    const cs = createDefaultAssembly();
    const ids = new Set(cs.map((c) => c.id));
    expect(ids.size).toBe(cs.length);
    for (const c of cs) if (c.parentId) expect(ids.has(c.parentId)).toBe(true);
  });

  it('contains every required component type and flags geometry as provisional', () => {
    const cs = createDefaultAssembly();
    const types = new Set(cs.map((c) => c.type));
    for (const t of ['motor', 'mounting-plate', 'shaft', 'coupling', 'bearing-housing', 'bearing', 'base-frame', 'load-disc', 'sensor-mount']) {
      expect(types.has(t as never)).toBe(true);
    }
    expect(cs.filter((c) => c.type === 'bearing-housing')).toHaveLength(2);
    expect(cs.every((c) => c.provisional && !c.dimensionsVerified)).toBe(true);
  });
});

describe('assembly store', () => {
  it('selects and deselects', () => {
    get().select('ARGUS-MOT-001');
    expect(get().selectedId).toBe('ARGUS-MOT-001');
    get().select(null);
    expect(get().selectedId).toBeNull();
  });

  it('moves a component and undoes / redoes it', () => {
    get().setTransform('ARGUS-MOT-001', { position: [1, 2, 3] });
    expect(get().components.find((c) => c.id === 'ARGUS-MOT-001')!.position).toEqual([1, 2, 3]);
    get().undo();
    expect(get().components.find((c) => c.id === 'ARGUS-MOT-001')!.position).toEqual([-0.85, 0.28, 0]);
    get().redo();
    expect(get().components.find((c) => c.id === 'ARGUS-MOT-001')!.position).toEqual([1, 2, 3]);
  });

  it('does not move a locked component', () => {
    get().toggleLocked('ARGUS-MOT-001');
    get().setTransform('ARGUS-MOT-001', { position: [9, 9, 9] });
    expect(get().components.find((c) => c.id === 'ARGUS-MOT-001')!.position).toEqual([-0.85, 0.28, 0]);
  });

  it('duplicates with the next free ID and selects the copy', () => {
    get().duplicate('ARGUS-BRG-001');
    expect(get().components.some((c) => c.id === 'ARGUS-BRG-003')).toBe(true);
    expect(get().selectedId).toBe('ARGUS-BRG-003');
  });

  it('removes a component and re-parents its children', () => {
    get().remove('ARGUS-BHS-001');
    const cs = get().components;
    expect(cs.some((c) => c.id === 'ARGUS-BHS-001')).toBe(false);
    expect(cs.find((c) => c.id === 'ARGUS-BRG-001')!.parentId).toBe('ARGUS-FRM-001');
  });

  it('resets a transform to the default layout', () => {
    get().setTransform('ARGUS-LDD-001', { position: [5, 5, 5] });
    get().resetTransform('ARGUS-LDD-001');
    expect(get().components.find((c) => c.id === 'ARGUS-LDD-001')!.position).toEqual([0.95, 0.28, 0]);
  });

  it('clamps the explode factor', () => {
    get().setExplode(3);
    expect(get().explode).toBe(1);
    get().setExplode(-1);
    expect(get().explode).toBe(0);
  });

  it('flags dimension edits as provisional', () => {
    get().setDimensions('ARGUS-LDD-001', { radius: 0.25 });
    const c = get().components.find((x) => x.id === 'ARGUS-LDD-001')!;
    expect(c.dimensions.radius).toBe(0.25);
    expect(c.provisional).toBe(true);
  });
});
