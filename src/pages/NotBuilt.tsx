import { Link } from 'react-router-dom';
import type { SectionDef } from '@/app/sections';

/** Honest placeholder for modules scheduled for later milestones. It contains no controls. */
export default function NotBuilt({ section }: { section: SectionDef }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="panel max-w-md rounded-sm p-6">
        <div className="mono text-[10px] text-warn">NOT YET BUILT · MILESTONE {String(section.milestone).padStart(2, '0')}</div>
        <h1 className="mt-2 text-lg font-semibold">{section.label}</h1>
        <p className="mt-2 text-xs leading-relaxed text-ink-dim">{section.summary}</p>
        <p className="mt-3 text-xs leading-relaxed text-ink-dim">
          This module is scheduled for Milestone {section.milestone} and is intentionally empty so no unfinished
          workflow is presented as working.
        </p>
        <Link to="/studio" className="btn mt-4">
          Go to Engineering Studio
        </Link>
      </div>
    </div>
  );
}
