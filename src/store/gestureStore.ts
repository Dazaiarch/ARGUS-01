import { create } from 'zustand';
import type { GestureType, RecognizedGesture } from '@/types';

interface GestureState {
  // Connection
  webcamStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  selectedCamera: MediaDeviceInfo | null;
  connect: () => Promise<void>;
  disconnect: () => void;

  // Recognition
  hands: any[]; // HandData[]
  recognizedGestures: RecognizedGesture[];
  gestureHistory: RecognizedGesture[];

  // Settings
  enabledGestures: Record<GestureType, boolean>;
  sensitivity: { pinch: number; swipe: number; 'two-hand-zoom': number; rotate: number };
  cooldowns: Partial<Record<GestureType, number>>;
  handedness: 'Left' | 'Right' | 'Both';

  // Calibration
  calibrationMode: boolean;
  calibrationData: {
    pinchThreshold: number;
    swipeThreshold: number;
    zoomSensitivity: number;
    rotateSensitivity: number;
    handToViewportMatrix: number[]; // 4x4 matrix
  };

  // Actions
  setEnabledGestures: (gestures: Record<GestureType, boolean>) => void;
  setSensitivity: (s: GestureState['sensitivity']) => void;
  startCalibration: () => void;
  finishCalibration: () => void;
  addGestureToHistory: (gesture: RecognizedGesture) => void;
}

const DEFAULT_GESTURES: Record<GestureType, boolean> = {
  'open-palm': true,
  'pinch': true,
  'two-hand-zoom': true,
  'two-hand-rotate': true,
  'swipe-left': true,
  'swipe-right': true,
  'fist': true,
  'three-fingers': true,
  'open-palm-held': true,
  'rotate': true,
};

export const useGestureStore = create<GestureState>((set, _get) => ({
  webcamStatus: 'disconnected',
  selectedCamera: null,
  hands: [],
  recognizedGestures: [],
  gestureHistory: [],

  enabledGestures: DEFAULT_GESTURES,
  sensitivity: { pinch: 0.05, swipe: 0.15, 'two-hand-zoom': 1.0, rotate: 1.0 },
  cooldowns: { 
    pinch: 300, 
    'swipe-left': 300, 
    'swipe-right': 300, 
    'two-hand-zoom': 200, 
    rotate: 200 
  },
  handedness: 'Both',

  calibrationMode: false,
  calibrationData: {
    pinchThreshold: 0.05,
    swipeThreshold: 0.15,
    zoomSensitivity: 1.0,
    rotateSensitivity: 1.0,
    handToViewportMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  },

  connect: async () => {
    set({ webcamStatus: 'connecting' });
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      if (videoDevices.length > 0) {
        set({ selectedCamera: videoDevices[0], webcamStatus: 'connected' });
      } else {
        set({ webcamStatus: 'error' });
      }
    } catch (error) {
      console.error('Failed to connect webcam:', error);
      set({ webcamStatus: 'error' });
    }
  },

  disconnect: () => {
    set({ webcamStatus: 'disconnected', selectedCamera: null });
  },

  setEnabledGestures: (gestures) => set({ enabledGestures: gestures }),

  setSensitivity: (s) => set({ sensitivity: s }),

  startCalibration: () => set({ calibrationMode: true }),

  finishCalibration: () => set({ calibrationMode: false }),

  addGestureToHistory: (gesture) =>
    set((state) => ({
      gestureHistory: [gesture, ...state.gestureHistory].slice(0, 100),
      recognizedGestures: [...state.recognizedGestures, gesture].slice(-10),
    })),
}));

export type { GestureState };