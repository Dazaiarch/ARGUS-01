import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Shell } from './Shell';
import { COMPLETED_MILESTONES, SECTIONS } from './sections';
import CommandCentre from '@/pages/CommandCentre';
import NotBuilt from '@/pages/NotBuilt';

// The 3D studio pulls in Three.js; load it only when the user opens it.
const EngineeringStudio = lazy(() => import('@/pages/EngineeringStudio'));
const GestureLab = lazy(() => import('@/pages/GestureLabPage'));
const DigitalTwin = lazy(() => import('@/pages/DigitalTwinPage'));
const SensorMapping = lazy(() => import('@/pages/SensorMappingPage'));
const Analytics = lazy(() => import('@/pages/AnalyticsPage'));

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div className="mono p-4 text-xs text-ink-dim">Loading…</div>}>
    {children}
  </Suspense>
);

const BUILT: Record<string, React.ReactElement> = {
  'command-centre': <CommandCentre />,
  'engineering-studio': (
    <SuspenseWrapper>
      <EngineeringStudio />
    </SuspenseWrapper>
  ),
  'gesture-lab': (
    <SuspenseWrapper>
      <GestureLab />
    </SuspenseWrapper>
  ),
  'digital-twin': (
    <SuspenseWrapper>
      <DigitalTwin />
    </SuspenseWrapper>
  ),
  'sensor-mapping': (
    <SuspenseWrapper>
      <SensorMapping />
    </SuspenseWrapper>
  ),
  'analytics': (
    <SuspenseWrapper>
      <Analytics />
    </SuspenseWrapper>
  ),
  // assembly-lab and project-configuration are not built yet - they will show NotBuilt
};

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          {SECTIONS.map((s) => (
            <Route
              key={s.id}
              path={s.path}
              element={BUILT[s.id] && COMPLETED_MILESTONES.includes(s.milestone) ? BUILT[s.id] : <NotBuilt section={s} />}
            />
          ))}
        </Route>
      </Routes>
    </HashRouter>
  );
}