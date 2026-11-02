import { Component, Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Scene } from './Scene';
import { useAssemblyStore } from '@/store/assemblyStore';

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

class ViewportBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-obsidian text-center">
          <div className="label">3D viewport error</div>
          <div className="mono max-w-md text-xs text-ink-dim">{this.state.error}</div>
          <button className="btn" onClick={() => this.setState({ error: null })}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Viewport() {
  const select = useAssemblyStore((s) => s.select);

  if (!webglAvailable()) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-obsidian text-center">
        <div className="label">WebGL unavailable</div>
        <div className="max-w-sm text-xs text-ink-dim">
          This browser or device cannot create a WebGL context, so the 3D viewport cannot run. Try a current
          version of Chrome, Edge or Firefox with hardware acceleration enabled.
        </div>
      </div>
    );
  }

  return (
    <ViewportBoundary>
      <Canvas
        dpr={[1, 2]}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        onPointerMissed={() => select(null)}
        style={{ background: 'radial-gradient(ellipse at 50% 40%, #151a21 0%, #0b0d10 75%)' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </ViewportBoundary>
  );
}
