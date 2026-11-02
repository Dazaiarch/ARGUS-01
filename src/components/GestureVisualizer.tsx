import { useGestureStore } from '@/store/gestureStore';

export function GestureVisualizer() {
  const { hands, recognizedGestures, gestureHistory } = useGestureStore();

  return (
    <div className="w-full h-full p-3">
      <div className="mb-3">
        <span className="label">Live Hands</span>
      </div>
      <div className="mb-4">
        {hands.length === 0 ? (
          <div className="text-xs text-ink-dim">No hands detected</div>
        ) : (
          hands.map((hand, i) => (
            <div key={i} className="mb-2 p-2 rounded-sm border border-line bg-obsidian/50 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className={`mono px-1.5 py-0.5 rounded-sm text-[9px] ${hand.handedness === 'Left' ? 'bg-cyan/20 text-cyan' : 'bg-amber/20 text-amber'}`}>
                  {hand.handedness}
                </span>
                <span className="mono text-[10px] text-ink-dim">Confidence: {hand.confidence.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-[9px] text-ink-dim">
                {['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'].map((finger, j) => (
                  <div key={j}>
                    <span className="font-medium">{finger[0]}</span>
                    <span className="ml-1">{hand.landmarks?.[[4,8,12,16,20][j]] ? '✓' : '✗'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mb-3">
        <span className="label">Recognized Gestures</span>
      </div>
      <div className="max-h-40 overflow-y-auto space-y-1">
        {recognizedGestures.length === 0 ? (
          <div className="text-xs text-ink-dim">No gestures recognized</div>
        ) : (
          recognizedGestures.slice(-10).map((gesture, i) => (
            <div key={i} className="p-1.5 rounded-sm border border-line bg-obsidian/50 text-xs">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${getGestureColor(gesture.type)}`}>{getGestureLabel(gesture.type)}</span>
                <span className="mono text-[9px] text-ink-dim">{gesture.confidence.toFixed(2)}</span>
              </div>
              <div className="mono text-[9px] text-ink-dim">
                {gesture.hand} hand · {gesture.data.pinchDistance ? `dist: ${gesture.data.pinchDistance.toFixed(3)}` : ''}
                {gesture.data.twoHandDistanceDelta ? ` zoom: ${gesture.data.twoHandDistanceDelta > 0 ? '+' : ''}${gesture.data.twoHandDistanceDelta.toFixed(3)}` : ''}
                {gesture.data.twoHandAngleDelta ? ` rot: ${gesture.data.twoHandAngleDelta.toFixed(3)}rad` : ''}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-line-soft pt-3">
        <span className="label">History</span>
        <div className="max-h-40 overflow-y-auto space-y-1 mt-1">
          {gestureHistory.length === 0 ? (
            <div className="text-xs text-ink-dim">No history</div>
          ) : (
            gestureHistory.slice(0, 20).map((gesture, i) => (
              <div key={i} className="p-1 rounded-sm border border-line bg-obsidian/30 text-xs">
                <div className="flex justify-between">
                  <span className={getGestureColor(gesture.type)}>{getGestureLabel(gesture.type)}</span>
                  <span className="mono text-[9px] text-ink-dim">{new Date(gesture.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getGestureLabel(type: string): string {
  const labels: Record<string, string> = {
    'open-palm': 'Open Palm',
    'pinch': 'Pinch',
    'two-hand-zoom': 'Two-Hand Zoom',
    'two-hand-rotate': 'Two-Hand Rotate',
    'swipe-left': 'Swipe Left',
    'swipe-right': 'Swipe Right',
    'fist': 'Fist',
    'three-fingers': 'Three Fingers',
    'open-palm-held': 'Open Palm Held',
  };
  return labels[type] || type;
}

function getGestureColor(type: string): string {
  const colors: Record<string, string> = {
    'open-palm': 'text-cyan',
    'pinch': 'text-green',
    'two-hand-zoom': 'text-blue',
    'two-hand-rotate': 'text-blue',
    'swipe-left': 'text-amber',
    'swipe-right': 'text-amber',
    'fist': 'text-red',
    'three-fingers': 'text-purple',
    'open-palm-held': 'text-cyan',
  };
  return colors[type] || 'text-ink';
}