import type { HandData } from '@/types';

export interface HandTrackerOptions {
  maxHands: number;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
  cameraFacing: 'user' | 'environment';
}

export class HandTracker {
  private landmarker: any = null;
  private video: HTMLVideoElement | null = null;
  private running = false;
  private onHandsUpdate: (hands: HandData[]) => void;
  private options: HandTrackerOptions;
  private externalVideo = false;
  private animationFrame: number | null = null;

  constructor(onHandsUpdate: (hands: HandData[]) => void, options: Partial<HandTrackerOptions> = {}) {
    this.onHandsUpdate = onHandsUpdate;
    this.options = {
      maxHands: options.maxHands ?? 2,
      minDetectionConfidence: options.minDetectionConfidence ?? 0.7,
      minTrackingConfidence: options.minTrackingConfidence ?? 0.5,
      cameraFacing: options.cameraFacing ?? 'user',
    };
  }

  setVideoElement(video: HTMLVideoElement): void {
    this.video = video;
    this.externalVideo = true;
  }

  async initialize(): Promise<MediaStream> {
    if (this.running) return this.video?.srcObject as MediaStream;

    try {
      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
      
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: this.options.maxHands,
        minHandDetectionConfidence: this.options.minDetectionConfidence,
        minHandPresenceConfidence: this.options.minTrackingConfidence,
        minTrackingConfidence: this.options.minTrackingConfidence,
      });

      if (!this.video) {
        this.video = document.createElement('video');
        this.video.setAttribute('playsinline', '');
        this.video.style.display = 'none';
        document.body.appendChild(this.video);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: this.options.cameraFacing === 'user' 
          ? { facingMode: 'user' } 
          : { facingMode: 'environment' },
        audio: false,
      });

      this.video.srcObject = stream;
      await this.video.play();

      // Wait for video to be ready (have dimensions)
      await new Promise<void>((resolve) => {
        if (this.video!.readyState >= 2) {
          resolve();
        } else {
          this.video!.onloadedmetadata = () => resolve();
        }
      });

      this.running = true;
      this.processFrame();
      
      return stream;
    } catch (error) {
      console.error('Failed to initialize hand tracker:', error);
      throw error;
    }
  }

  private async processFrame(): Promise<void> {
    if (!this.running || !this.landmarker || !this.video) return;

    // Skip if video doesn't have valid dimensions yet
    if (this.video.videoWidth === 0 || this.video.videoHeight === 0) {
      this.animationFrame = requestAnimationFrame(() => this.processFrame());
      return;
    }

    try {
      const results = this.landmarker.detectForVideo(this.video, performance.now());
      
      const hands: HandData[] = results.landmarks.map((landmarks: any[], i: number) => ({
        handedness: results.handedness[i][0].categoryName,
        landmarks: landmarks.map((l: any) => ({ x: l.x, y: l.y, z: l.z })),
        confidence: results.handedness[i][0].score,
        timestamp: performance.now(),
      }));
      
      this.onHandsUpdate(hands);
    } catch (error) {
      console.error('Error processing frame:', error);
    }

    if (this.running) {
      this.animationFrame = requestAnimationFrame(() => this.processFrame());
    }
  }

  dispose(): void {
    this.running = false;
    this.landmarker?.destroy();
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    const stream = this.video?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    if (!this.externalVideo) {
      this.video?.remove();
    }
    this.video = null;
    this.externalVideo = false;
  }

  isRunning(): boolean {
    return this.running;
  }
}