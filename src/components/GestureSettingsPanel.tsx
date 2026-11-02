import { useGestureStore } from '@/store/gestureStore';
import type { GestureType } from '@/types';

const GESTURE_LABELS: Record<GestureType, string> = {
  'open-palm': 'Open Palm',
  'pinch': 'Pinch',
  'two-hand-zoom': 'Two-Hand Zoom',
  'two-hand-rotate': 'Two-Hand Rotate',
  'swipe-left': 'Swipe Left',
  'swipe-right': 'Swipe Right',
  'fist': 'Fist',
  'three-fingers': 'Three Fingers',
  'open-palm-held': 'Open Palm Held',
  'rotate': 'Rotate',
};

export function GestureSettingsPanel() {
  const { 
    webcamStatus, 
    connect, 
    disconnect, 
    enabledGestures, 
    setEnabledGestures, 
    sensitivity, 
    setSensitivity,
    startCalibration,
    finishCalibration,
    calibrationMode,
    handedness 
  } = useGestureStore();

  return (
    <div className="flex h-full flex-col p-3">
      <div className="border-b border-line-soft pb-2 mb-2">
        <span className="label">Gesture Control</span>
      </div>

      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="label">Webcam</span>
          <span className={`mono text-[10px] px-1.5 py-0.5 rounded-sm ${
            webcamStatus === 'connected' ? 'bg-ok/20 text-ok' :
            webcamStatus === 'connecting' ? 'bg-warn/20 text-warn' :
            webcamStatus === 'error' ? 'bg-fault/20 text-fault' : 'bg-line text-ink-dim'
          }`}>
            {webcamStatus.toUpperCase()}
          </span>
        </div>
        {webcamStatus === 'disconnected' && (
          <button className="btn w-full" onClick={connect}>
            Connect Webcam
          </button>
        )}
        {webcamStatus === 'connected' && (
          <button className="btn w-full" onClick={disconnect} style={{ background: '#2a2f36', borderColor: '#e5534b', color: '#e5534b' }}>
            Disconnect
          </button>
        )}
        {webcamStatus === 'connecting' && (
          <div className="text-xs text-ink-dim">Connecting...</div>
        )}
      </div>

      <div className="mb-3">
        <div className="label mb-1">Handedness</div>
        <select
          className="field w-full"
          value={handedness}
          onChange={(e) => useGestureStore.setState({ handedness: e.target.value as any })}
        >
          <option value="Left">Left Hand Only</option>
          <option value="Right">Right Hand Only</option>
          <option value="Both">Both Hands</option>
        </select>
      </div>

      <div className="mb-3">
        <div className="label mb-1">Enabled Gestures</div>
        <div className="space-y-1">
          {Object.entries(GESTURE_LABELS).map(([type, label]) => (
            <label key={type} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabledGestures[type as GestureType]}
                onChange={(e) => setEnabledGestures({ ...enabledGestures, [type]: e.target.checked })}
                className="accent-cyan"
              />
              <span className="text-xs">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <div className="label mb-1">Sensitivity</div>
        <div className="space-y-2">
          {(['pinch', 'swipe', 'zoom', 'rotate'] as const).map((key) => (
            <div key={key}>
              <div className="flex justify-between text-[10px] mb-1">
                <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span className="mono">{sensitivity[key as keyof typeof sensitivity].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.05"
                value={sensitivity[key as keyof typeof sensitivity]}
                onChange={(e) => setSensitivity({ ...sensitivity, [key]: parseFloat(e.target.value) })}
                className="w-full accent-cyan"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <div className="label mb-1">Cooldowns (ms)</div>
        <div className="space-y-2">
          {(['pinch', 'swipe-left', 'swipe-right', 'two-hand-zoom', 'rotate'] as const).map((key) => (
            <div key={key}>
              <div className="flex justify-between text-[10px] mb-1">
                <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span className="mono">{useGestureStore.getState().cooldowns[key] ?? 0}ms</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={useGestureStore.getState().cooldowns[key] ?? 0}
                onChange={(e) => useGestureStore.setState((s) => ({ cooldowns: { ...s.cooldowns, [key]: parseInt(e.target.value) } }))}
                className="w-full accent-cyan"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line-soft pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="label">Calibration</span>
          <button 
            className={`btn ${calibrationMode ? 'bg-cyan/20 border-cyan' : ''}`}
            onClick={calibrationMode ? finishCalibration : startCalibration}
          >
            {calibrationMode ? 'Finish' : 'Start'}
          </button>
        </div>
        {calibrationMode && (
          <div className="space-y-2 text-xs text-ink-dim">
            <p>1. Hold open palm in front of camera</p>
            <p>2. Perform each gesture slowly</p>
            <p>3. Adjust thresholds if needed</p>
            <p>Pinch threshold: {useGestureStore.getState().calibrationData.pinchThreshold.toFixed(3)}</p>
            <p>Swipe threshold: {useGestureStore.getState().calibrationData.swipeThreshold.toFixed(3)}</p>
          </div>
        )}
      </div>
    </div>
  );
}