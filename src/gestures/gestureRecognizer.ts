import type { HandData, HandLandmark, RecognizedGesture, GestureData, GestureType } from '@/types';
import * as THREE from 'three';

export class GestureRecognizer {
  private prevHands: HandData[] = [];
  private gestureCooldowns: Map<GestureType, number> = new Map();
  private readonly COOLDOWN_MS = 300;

  recognize(hands: HandData[]): RecognizedGesture[] {
    const gestures: RecognizedGesture[] = [];
    const now = performance.now();

    for (const hand of hands) {
      const fingerStates = this.classifyFingers(hand.landmarks);
      const pinchDistance = this.calculatePinchDistance(hand.landmarks);
      const palmNormal = this.calculatePalmNormal(hand.landmarks);
      // const _velocity = this.calculateVelocity(hand);

      // Single-hand gestures
      if (this.isOpenPalm(fingerStates)) {
        gestures.push(this.makeGesture('open-palm', hand, { fingerStates, palmNormal }));
      }
      if (this.isPinch(fingerStates, pinchDistance)) {
        gestures.push(this.makeGesture('pinch', hand, { fingerStates, pinchDistance, palmNormal }));
      }
      if (this.isFist(fingerStates)) {
        gestures.push(this.makeGesture('fist', hand, { fingerStates }));
      }
      if (this.isThreeFingers(fingerStates)) {
        gestures.push(this.makeGesture('three-fingers', hand, { fingerStates }));
      }
      if (this.isOpenPalmHeld(fingerStates, hand)) {
        gestures.push(this.makeGesture('open-palm-held', hand, { fingerStates }));
      }

      // Swipe detection
      const prevHand = this.prevHands.find(h => h.handedness === hand.handedness);
      if (prevHand) {
        const swipe = this.detectSwipe(prevHand.landmarks, hand.landmarks);
        if (swipe) {
          gestures.push(this.makeGesture(swipe.direction === 'left' ? 'swipe-left' : 'swipe-right', hand, { fingerStates }));
        }
      }
    }

    // Two-hand gestures
    if (hands.length === 2) {
      const [left, right] = hands.sort((a, b) => a.handedness.localeCompare(b.handedness));
      const distance = this.calculateTwoHandDistance(left.landmarks, right.landmarks);
      const angle = this.calculateTwoHandAngle(left.landmarks, right.landmarks);
      const prevLeft = this.prevHands.find(h => h.handedness === 'Left');
      const prevRight = this.prevHands.find(h => h.handedness === 'Right');

      if (prevLeft && prevRight) {
        const prevDistance = this.calculateTwoHandDistance(prevLeft.landmarks, prevRight.landmarks);
        const prevAngle = this.calculateTwoHandAngle(prevLeft.landmarks, prevRight.landmarks);

        if (Math.abs(distance - prevDistance) > 0.02) {
          gestures.push(this.makeGesture('two-hand-zoom', left, { 
            twoHandDistance: distance, 
            twoHandDistanceDelta: distance - prevDistance 
          }));
        }
        if (Math.abs(angle - prevAngle) > 0.05) {
          gestures.push(this.makeGesture('two-hand-rotate', left, { 
            twoHandAngle: angle, 
            twoHandAngleDelta: angle - prevAngle 
          }));
        }
      }
    }

    this.prevHands = hands;
    return gestures.filter(g => !this.isInCooldown(g.type, now));
  }

  private classifyFingers(landmarks: HandLandmark[]): boolean[] {
    const tips = [4, 8, 12, 16, 20];
    const pips = [3, 6, 10, 14, 18];

    return tips.map((tip, i) => {
      if (i === 0) {
        // Thumb: compare x (horizontal)
        return landmarks[tip].x > landmarks[pips[i]].x;
      }
      // Other fingers: compare y (vertical, up is smaller in image coords)
      return landmarks[tip].y < landmarks[pips[i]].y;
    });
  }

  private calculatePinchDistance(landmarks: HandLandmark[]): number {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    return Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2) +
      Math.pow(thumbTip.z - indexTip.z, 2)
    );
  }

  private isPinch(fingerStates: boolean[], pinchDistance: number): boolean {
    return !fingerStates[0] && !fingerStates[1] &&
           fingerStates[2] && fingerStates[3] && fingerStates[4] &&
           pinchDistance < 0.05;
  }

  private isOpenPalm(fingerStates: boolean[]): boolean {
    return fingerStates.every(s => s);
  }

  private isFist(fingerStates: boolean[]): boolean {
    return fingerStates.every(s => !s);
  }

  private isThreeFingers(fingerStates: boolean[]): boolean {
    return fingerStates[1] && fingerStates[2] && fingerStates[3] && !fingerStates[0] && !fingerStates[4];
  }

  private isOpenPalmHeld(fingerStates: boolean[], hand: HandData): boolean {
    return this.isOpenPalm(fingerStates) && hand.confidence > 0.8;
  }

  private calculatePalmNormal(landmarks: HandLandmark[]): [number, number, number] {
    // Use wrist (0), index MCP (5), pinky MCP (17) to compute palm plane
    const wrist = new THREE.Vector3(landmarks[0].x, landmarks[0].y, landmarks[0].z);
    const indexMcp = new THREE.Vector3(landmarks[5].x, landmarks[5].y, landmarks[5].z);
    const pinkyMcp = new THREE.Vector3(landmarks[17].x, landmarks[17].y, landmarks[17].z);
    
    const v1 = indexMcp.clone().sub(wrist);
    const v2 = pinkyMcp.clone().sub(wrist);
    const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
    
    return [normal.x, normal.y, normal.z];
}
 
  private detectSwipe(prevLandmarks: HandLandmark[], currLandmarks: HandLandmark[]): { direction: 'left' | 'right' } | null {
    const prevWrist = prevLandmarks[0];
    const currWrist = currLandmarks[0];
    const dx = currWrist.x - prevWrist.x;
    
    if (Math.abs(dx) > 0.15) {
      return { direction: dx > 0 ? 'right' : 'left' };
    }
    return null;
  }

  private calculateTwoHandDistance(left: HandLandmark[], right: HandLandmark[]): number {
    const leftWrist = left[0];
    const rightWrist = right[0];
    return Math.sqrt(
      Math.pow(leftWrist.x - rightWrist.x, 2) +
      Math.pow(leftWrist.y - rightWrist.y, 2) +
      Math.pow(leftWrist.z - rightWrist.z, 2)
    );
  }

  private calculateTwoHandAngle(left: HandLandmark[], right: HandLandmark[]): number {
    const leftWrist = left[0];
    const rightWrist = right[0];
    return Math.atan2(rightWrist.y - leftWrist.y, rightWrist.x - leftWrist.x);
  }

  private makeGesture(
    type: GestureType, 
    hand: HandData, 
    data: GestureData
  ): RecognizedGesture {
    return {
      type,
      hand: hand.handedness,
      confidence: hand.confidence,
      data,
      timestamp: hand.timestamp,
    };
  }

  private isInCooldown(type: GestureType, now: number): boolean {
    const lastTime = this.gestureCooldowns.get(type) || 0;
    if (now - lastTime < this.COOLDOWN_MS) return true;
    this.gestureCooldowns.set(type, now);
    return false;
  }
}