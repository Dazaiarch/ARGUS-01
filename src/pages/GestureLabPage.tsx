import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';

import { useAssemblyStore } from '@/store/assemblyStore';
import { useViewStore } from '@/store/viewStore';
import { useGestureStore } from '@/store/gestureStore';

import { useSensorPlacement } from '@/hooks/useSensorPlacement';

import { HandTracker } from '@/gestures/handTracker';
import { GestureRecognizer } from '@/gestures/gestureRecognizer';
import { CommandMapper } from '@/gestures/commandMapper';

import { StudioToolbar } from '@/components/StudioToolbar';
import { Viewport } from '@/engine/Viewport';
import { SensorListPanel } from '@/components/SensorListPanel';


interface HandLandmark {
  x: number;
  y: number;
}

export default function GestureLabPage() {

  // =========================================================
  // SENSOR PLACEMENT STORE
  // =========================================================

  const {
    active,
    sensorType,
    startPlacement,
    cancelPlacement,
    confirmPlacement,
    ghostPosition: _ghostPosition,
    ghostRotation: _ghostRotation,
    targetComponentId,
    previewVisible,
  } = useSensorPlacement();

  // =========================================================
  // GESTURE STORE
  // =========================================================

  const {
    webcamStatus,
    hands,
    recognizedGestures,
    gestureHistory,
    enabledGestures,
    sensitivity,
    calibrationMode,
    calibrationData,
    handedness,
    connect,
    disconnect,
  } = useGestureStore();

  // =========================================================
  // ASSEMBLY STORE
  // =========================================================

  const sensors = useAssemblyStore((s) => s.sensors);
  const components = useAssemblyStore((s) => s.components);

  const addSensor = useAssemblyStore((s) => s.addSensor);
  const selectedId = useAssemblyStore((s) => s.selectedId);
  const select = useAssemblyStore((s) => s.select);

  const removeSensor = useAssemblyStore((s) => s.removeSensor);
  const updateSensor = useAssemblyStore((s) => s.updateSensor);

  // =========================================================
  // VIEW STORE
  // =========================================================

  const left = useViewStore((s) => s.leftCollapsed);
  const right = useViewStore((s) => s.rightCollapsed);
  const toggle = useViewStore((s) => s.toggle);

  // =========================================================
  // SELECTED COMPONENT
  // =========================================================

  const selectedComponent = useAssemblyStore((s) =>
    s.components.find((c) => c.id === s.selectedId) ?? null
  );

  const componentSensors = useAssemblyStore((s) =>
    s.sensors.filter((sensor) => sensor.componentId === s.selectedId)
  );

  // =========================================================
  // REFERENCES
  // =========================================================

  const commandMapperRef = useRef<CommandMapper | null>(null);

  const handTrackerRef = useRef<HandTracker | null>(null);

  const gestureRecognizerRef =
    useRef<GestureRecognizer | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const animationFrameRef = useRef<number | null>(null);

  // =========================================================
  // LOCAL STATE
  // =========================================================

  const [webcamActive, setWebcamActive] = useState(false);

  const [cameraError, setCameraError] = useState<string | null>(null);

  const [_calibrationPoints, _setCalibrationPoints] = useState<
    { x: number; y: number; z: number }[]
  >([]);

  const [
    _selectedCalibrationPoint,
    _setSelectedCalibrationPoint,
  ] = useState<number | null>(null);

  // =========================================================
  // INITIALIZE GESTURE SYSTEM
  // =========================================================

  useEffect(() => {

    commandMapperRef.current = new CommandMapper();

    gestureRecognizerRef.current = new GestureRecognizer();

    return () => {
      commandMapperRef.current = null;
      gestureRecognizerRef.current = null;
    };

  }, []);

  // =========================================================
  // INITIALIZE HAND TRACKER
  // =========================================================

  const initializeHandTracker = useCallback(async () => {

    if (handTrackerRef.current) return;

    try {

      setCameraError(null);

      const tracker = new HandTracker(

        (detectedHands) => {

          useGestureStore.setState({ hands: detectedHands });

        },

        {
          maxHands: 2,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
          cameraFacing: 'user',
        }

      );

      handTrackerRef.current = tracker;

      // Pass the page's video element to the tracker
      if (videoRef.current) {
        tracker.setVideoElement(videoRef.current);
      }

      const stream = await tracker.initialize();

      // Ensure the video element has the stream
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setWebcamActive(true);

    } catch (error) {

      console.error('Hand tracker initialization failed:', error);

      setCameraError(
        error instanceof Error
          ? error.message
          : 'Unable to initialize hand tracker.'
      );

      handTrackerRef.current?.dispose();

      handTrackerRef.current = null;

      setWebcamActive(false);

    }

  }, []);

  // =========================================================
  // CONNECT WEBCAM
  // =========================================================

  const handleConnect = useCallback(async () => {

    try {

      await initializeHandTracker();

      if (handTrackerRef.current) {
        await connect();
      }

    } catch (error) {

      console.error('Gesture connection failed:', error);

    }

  }, [initializeHandTracker, connect]);

  // =========================================================
  // DISCONNECT WEBCAM
  // =========================================================

  const handleDisconnect = useCallback(() => {

    disconnect();

    setWebcamActive(false);

    if (handTrackerRef.current) {

      handTrackerRef.current.dispose();

      handTrackerRef.current = null;

    }

    if (videoRef.current) {

      const stream = videoRef.current.srcObject as MediaStream | null;

      stream?.getTracks().forEach((track) => track.stop());

      videoRef.current.srcObject = null;

    }

  }, [disconnect]);

  // =========================================================
  // GESTURE RECOGNITION
  // =========================================================

  useEffect(() => {

    if (!gestureRecognizerRef.current || hands.length === 0) return;

    const recognizer = gestureRecognizerRef.current;

    const gestures = recognizer.recognize(hands);

    if (gestures.length > 0) {

      useGestureStore
        .getState()
        .addGestureToHistory(gestures[0]);

      if (commandMapperRef.current) {

        commandMapperRef.current.mapGesture(gestures[0]);

      }

    }

  }, [hands]);

  // =========================================================
  // DRAW HAND LANDMARKS
  // =========================================================

  useEffect(() => {

    const canvas = canvasRef.current;

    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    let running = true;

    const drawFrame = () => {

      if (!running) return;

      // Only draw if video has valid dimensions
      if (video.videoWidth > 0 && video.videoHeight > 0) {

        canvas.width = video.videoWidth;

        canvas.height = video.videoHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Mirror the canvas
        ctx.save();

        ctx.scale(-1, 1);

        ctx.translate(-canvas.width, 0);

        // Draw detected hands
        hands.forEach((hand) => {

          if (!hand.landmarks || hand.landmarks.length === 0) return;

          const landmarkColor =
            hand.handedness === 'Left'
              ? '#38d1e8'
              : '#e3b341';

          ctx.strokeStyle = landmarkColor;

          ctx.fillStyle = landmarkColor;

          ctx.lineWidth = 2;

          // Hand connections
          const connections = [

            [0, 1],
            [1, 2],
            [2, 3],
            [3, 4],

            [0, 5],
            [5, 6],
            [6, 7],
            [7, 8],

            [9, 10],
            [10, 11],
            [11, 12],

            [13, 14],
            [15, 16],
            [16, 17],

            [17, 18],
            [18, 19],
            [19, 20],

            [0, 5],
            [5, 9],
            [9, 13],
            [13, 17],

          ];

          // Draw connections
          connections.forEach(([start, end]) => {

            const pointA = hand.landmarks[start];

            const pointB = hand.landmarks[end];

            if (!pointA || !pointB) return;

            ctx.beginPath();

            ctx.moveTo(
              pointA.x * canvas.width,
              pointA.y * canvas.height
            );

            ctx.lineTo(
              pointB.x * canvas.width,
              pointB.y * canvas.height
            );

            ctx.stroke();

          });

          // Draw landmarks
          hand.landmarks.forEach((landmark: HandLandmark) => {

            const x = landmark.x * canvas.width;

            const y = landmark.y * canvas.height;

            ctx.beginPath();

            ctx.arc(x, y, 4, 0, Math.PI * 2);

            ctx.fill();

          });

        });

        ctx.restore();

      }

      animationFrameRef.current =
        requestAnimationFrame(drawFrame);

    };

    animationFrameRef.current =
      requestAnimationFrame(drawFrame);

    return () => {

      running = false;

      if (animationFrameRef.current !== null) {

        cancelAnimationFrame(animationFrameRef.current);

        animationFrameRef.current = null;

      }

    };

  }, [hands, webcamActive]);

  // =========================================================
  // ADD SENSOR
  // =========================================================

  const handleAddSensor = useCallback(() => {

    const currentSensorType =
      useSensorPlacement.getState().sensorType;

    const currentComponent =
      useAssemblyStore.getState().components.find(
        (component) =>
          component.id === useAssemblyStore.getState().selectedId
      );

    if (!currentSensorType || !currentComponent) return;

    const newId = addSensor(
      currentSensorType,
      currentComponent.id
    );

    if (newId) {

      select(newId);

    }

  }, [addSensor, select]);

  // =========================================================
  // REMOVE SENSOR
  // =========================================================

  const handleRemoveSensor = useCallback((id: string) => {

    if (!window.confirm('Remove this sensor?')) return;

    removeSensor(id);

    select(null);

  }, [removeSensor, select]);

  // =========================================================
  // START SENSOR PLACEMENT
  // =========================================================

  const handleStartPlacement = useCallback(() => {

    const currentSensorType =
      useSensorPlacement.getState().sensorType;

    const currentComponent =
      useAssemblyStore.getState().components.find(
        (component) =>
          component.id === useAssemblyStore.getState().selectedId
      );

    if (!currentSensorType || !currentComponent) return;

    startPlacement();

  }, [startPlacement]);

  // =========================================================
  // CANCEL SENSOR PLACEMENT
  // =========================================================

  const handleCancelPlacement = useCallback(() => {

    cancelPlacement();

  }, [cancelPlacement]);

  // =========================================================
  // CONFIRM SENSOR PLACEMENT
  // =========================================================

  const handleConfirmPlacement = useCallback(() => {

    const placementState = useSensorPlacement.getState();

    const {
      active: placementActive,
      sensorType: currentSensorType,
      ghostPosition: currentGhostPosition,
      ghostRotation: currentGhostRotation,
      targetComponentId: currentTargetId,
    } = placementState;

    if (
      !placementActive ||
      !currentSensorType ||
      !currentGhostPosition ||
      !currentTargetId
    ) {
      return;
    }

    const newId = addSensor(
      currentSensorType,
      currentTargetId
    );

    if (newId) {

      updateSensor(newId, {

        localPosition: currentGhostPosition,

        localRotation: currentGhostRotation ?? undefined,

      });

      select(newId);

    }

    confirmPlacement();

  }, [addSensor, updateSensor, select, confirmPlacement]);

  // =========================================================
  // COMPONENT CLEANUP
  // =========================================================

  useEffect(() => {

    return () => {

      if (handTrackerRef.current) {

        handTrackerRef.current.dispose();

        handTrackerRef.current = null;

      }

      if (videoRef.current) {

        const stream =
          videoRef.current.srcObject as MediaStream | null;

        stream?.getTracks().forEach((track) => track.stop());

        videoRef.current.srcObject = null;

      }

    };

  }, []);

  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div className="gesture-lab-page">

      {/* TOOLBAR */}

      <StudioToolbar />

      <div className="gesture-lab-layout">

        {/* LEFT PANEL */}

        {!left && (

          <aside className="gesture-lab-sidebar">

            <div className="panel-header">

              <h2>ARGUS Gesture Lab</h2>

              <button onClick={() => toggle('leftCollapsed')}>
                Collapse
              </button>

            </div>

            <section>

              <h3>Assembly Components</h3>

              {components.map((component) => (

                <button
                  key={component.id}
                  onClick={() => select(component.id)}
                  className={
                    selectedId === component.id
                      ? 'selected'
                      : ''
                  }
                >

                  {component.id}

                </button>

              ))}

            </section>

            <section>

              <h3>Sensor Management</h3>

              <SensorListPanel
                sensors={sensors as Parameters<typeof SensorListPanel>[0]['sensors']}
                components={components}
                selectedId={selectedId}
                onSelect={select}
                onRemove={handleRemoveSensor}
                onAdd={handleAddSensor}
              />

              <button
                onClick={handleAddSensor}
                disabled={!selectedComponent || !sensorType}
              >
                Add Sensor
              </button>

              <button
                onClick={handleStartPlacement}
                disabled={!selectedComponent || !sensorType}
              >
                Start Placement
              </button>

            </section>

            <section>

              <h3>Component Sensors</h3>

              {componentSensors.map((sensor) => (

                <div key={sensor.id}>

                  <span>{sensor.id}</span>

                  <button
                    onClick={() => handleRemoveSensor(sensor.id)}
                  >
                    Remove
                  </button>

                </div>

              ))}

            </section>

          </aside>

        )}

        {/* MAIN VIEWPORT */}

        <main className="gesture-lab-main">

          <div className="viewport-header">

            <h2>3D Assembly Viewport</h2>

            <span>
              {active ? 'Placement Active' : 'Ready'}
            </span>

          </div>

          <div className="viewport-container">

            <Viewport />

          </div>

          {/* PLACEMENT CONTROLS */}

          {active && (

            <div className="placement-controls">

              <h3>Sensor Placement Preview</h3>

              <p>
                Target: {targetComponentId ?? 'None'}
              </p>

              <p>
                Preview: {previewVisible ? 'Visible' : 'Hidden'}
              </p>

              <button onClick={handleConfirmPlacement}>
                Confirm Placement
              </button>

              <button onClick={handleCancelPlacement}>
                Cancel Placement
              </button>

            </div>

          )}

        </main>

        {/* RIGHT PANEL */}

        {!right && (

          <aside className="gesture-lab-right-panel">

            <div className="panel-header">

              <h2>Gesture Control</h2>

              <button onClick={() => toggle('rightCollapsed')}>
                Collapse
              </button>

            </div>

            {/* WEBCAM */}

            <section>

              <h3>Live Hand Tracking</h3>

              <div className="webcam-container">

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="webcam-video"
                />

                <canvas
                  ref={canvasRef}
                  className="webcam-canvas"
                />

              </div>

              <div className="webcam-status">

                Status: {webcamStatus}

              </div>

              {cameraError && (

                <p className="camera-error">
                  {cameraError}
                </p>

              )}

              <div className="webcam-controls">

                {!webcamActive ? (

                  <button onClick={handleConnect}>
                    Connect Camera
                  </button>

                ) : (

                  <button onClick={handleDisconnect}>
                    Disconnect Camera
                  </button>

                )}

              </div>

            </section>

            {/* HAND INFORMATION */}

            <section>

              <h3>Hand Detection</h3>

              <p>
                Detected Hands: {hands.length}
              </p>

              <p>
                Handedness: {String(handedness)}
              </p>

              <p>
                Sensitivity: {String(sensitivity)}
              </p>

            </section>

            {/* RECOGNIZED GESTURES */}

            <section>

              <h3>Recognized Gestures</h3>

              <pre>
                {JSON.stringify(recognizedGestures, null, 2)}
              </pre>

            </section>

            {/* GESTURE HISTORY */}

            <section>

              <h3>Gesture History</h3>

              <pre>
                {JSON.stringify(gestureHistory, null, 2)}
              </pre>

            </section>

            {/* CALIBRATION */}

            <section>

              <h3>Calibration</h3>

              <p>
                Mode: {String(calibrationMode)}
              </p>

              <p>
                Calibration Points: {_calibrationPoints.length}
              </p>

              <p>
                Selected Point: {_selectedCalibrationPoint ?? 'None'}
              </p>

              <pre>
                {JSON.stringify(calibrationData, null, 2)}
              </pre>

            </section>

            {/* ENABLED GESTURES */}

            <section>

              <h3>Enabled Gestures</h3>

              <pre>
                {JSON.stringify(enabledGestures, null, 2)}
              </pre>

            </section>

          </aside>

        )}

      </div>

    </div>

  );

}