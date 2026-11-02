import { useEffect } from 'react';
import { useAssemblyStore } from '@/store/assemblyStore';
import { useViewStore } from '@/store/viewStore';
import type { ViewPreset } from '@/types';

const VIEW_KEYS: Record<string, ViewPreset> = {
  '1': 'perspective',
  '2': 'orthographic',
  '3': 'front',
  '4': 'side',
  '5': 'top',
  '6': 'isometric',
};

export const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: 'W / E / R', action: 'Translate / Rotate / Scale' },
  { keys: '1 – 6', action: 'Perspective, Ortho, Front, Side, Top, Isometric' },
  { keys: 'F', action: 'Reset camera' },
  { keys: 'H', action: 'Hide / show selected' },
  { keys: 'L', action: 'Lock / unlock selected' },
  { keys: 'Ctrl+D', action: 'Duplicate selected' },
  { keys: 'Del', action: 'Remove selected' },
  { keys: 'Ctrl+Z / Ctrl+Y', action: 'Undo / Redo' },
  { keys: 'X', action: 'Toggle exploded view' },
  { keys: 'G', action: 'Toggle snapping' },
  { keys: 'Esc', action: 'Clear selection' },
];

/** Keyboard shortcuts for the Engineering Studio. Ignored while typing in a field. */
export function useStudioShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

      const asm = useAssemblyStore.getState();
      const view = useViewStore.getState();
      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;

      if (mod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) asm.redo();
        else asm.undo();
        return;
      }
      if (mod && key === 'y') {
        e.preventDefault();
        asm.redo();
        return;
      }
      if (mod && key === 'd') {
        e.preventDefault();
        if (asm.selectedId) asm.duplicate(asm.selectedId);
        return;
      }
      if (mod || e.altKey) return;

      if (VIEW_KEYS[key]) return view.setViewPreset(VIEW_KEYS[key]);
      switch (key) {
        case 'w':
          return view.setTransformMode('translate');
        case 'e':
          return view.setTransformMode('rotate');
        case 'r':
          return view.setTransformMode('scale');
        case 'f':
          return view.resetCamera();
        case 'g':
          return view.toggle('snap');
        case 'x':
          return asm.setExplode(asm.explode > 0.5 ? 0 : 1);
        case 'h':
          if (asm.selectedId) asm.toggleVisible(asm.selectedId);
          return;
        case 'l':
          if (asm.selectedId) asm.toggleLocked(asm.selectedId);
          return;
        case 'delete':
        case 'backspace':
          if (asm.selectedId) asm.remove(asm.selectedId);
          return;
        case 'escape':
          return asm.select(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
