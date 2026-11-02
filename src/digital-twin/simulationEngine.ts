import type { SimulationState, Fault, MachineComponent } from '@/types';

const FIXED_TIMESTEP = 1 / 60;

export class SimulationEngine {
  private state: SimulationState;
  private running = false;
  private lastTime = 0;
  private accumulator = 0;
  private subscribers: ((state: SimulationState) => void)[] = [];

  constructor(initialState: SimulationState) {
    this.state = initialState;
  }

  getState(): SimulationState {
    return this.state;
  }

  subscribe(fn: (state: SimulationState) => void): () => void {
    this.subscribers.push(fn);
    return () => {
      this.subscribers = this.subscribers.filter(f => f !== fn);
    }
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.running = false;
  }

  setSpeed(speed: number): void {
    this.state.speed = Math.max(0.1, Math.min(10, speed));
  }

  setTargetRpm(rpm: number): void {
    this.state.motor.targetRpm = Math.max(0, Math.min(5000, rpm));
  }

  activateFault(fault: Omit<Fault, 'id' | 'activatedAt'>): string {
    const id = `fault-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newFault: Fault = {
      ...fault,
      id,
      activatedAt: this.state.time,
    };
    this.state.faults.push(newFault);
    this.notify();
    return id;
  }

  deactivateFault(id: string): void {
    this.state.faults = this.state.faults.filter(f => f.id !== id);
    this.notify();
  }

  clearFaults(): void {
    this.state.faults = [];
    this.notify();
  }

  bindSensor(_sensorId: string, _componentId: string): void {
    // Sensor binding handled in sensor simulation
  }

  private loop(): void {
    if (!this.running) return;

    const now = performance.now();
    const dt = (now - this.lastTime) / 1000 * this.state.speed;
    this.lastTime = now;

    this.accumulator += dt;

    while (this.accumulator >= FIXED_TIMESTEP) {
      this.step(FIXED_TIMESTEP);
      this.accumulator -= FIXED_TIMESTEP;
    }

    // Interpolate for rendering
    const alpha = this.accumulator / FIXED_TIMESTEP;
    const renderState = this.interpolateState(alpha);

    this.subscribers.forEach(fn => fn(renderState));
    requestAnimationFrame(() => this.loop());
  }

  private step(dt: number): void {
    // Motor physics: dω/dt = (T_motor - T_load - B·ω) / J
    const motor = this.state.motor;
    const shaft = this.state.shaft;

    // Motor torque curve
    const torque = this.motorTorque(motor.currentRpm);
    const loadTorque = this.calculateLoadTorque();
    const viscousDamping = 0.1 * motor.currentRpm;
    const netTorque = torque - loadTorque - viscousDamping;
    const alpha = netTorque / motor.inertia;

    motor.currentRpm += alpha * dt * 60 / (2 * Math.PI);
    motor.currentRpm = Math.max(0, Math.min(motor.targetRpm * 1.1, motor.currentRpm));

    // Shaft physics
    shaft.angularVelocity = motor.currentRpm * 2 * Math.PI / 60;
    shaft.angle += shaft.angularVelocity * dt;

    // Update sensors
    this.updateSensors();

    // Update time
    this.state.time += dt;
  }

  private motorTorque(rpm: number): number {
    const syncSpeed = 3000;
    const ratedTorque = 50;
    const maxTorque = 2.5 * ratedTorque;
    const slip = (syncSpeed - rpm) / syncSpeed;

    if (slip <= 0) return 0;
    if (slip > 0.2) return maxTorque * (0.2 / slip);
    return maxTorque * (slip / 0.1) / (1 + Math.pow(slip / 0.1, 2));
  }

  private calculateLoadTorque(): number {
    let torque = 5; // Base load
    
    // Add fault effects
    for (const fault of this.state.faults) {
      if (fault.type === 'imbalance') {
        torque += 2 * fault.severity;
      } else if (fault.type === 'misalignment') {
        torque += 3 * fault.severity;
      } else if (fault.type === 'bearing-defect') {
        torque += 1.5 * fault.severity;
      }
    }
    
    return torque + 0.02 * this.state.motor.currentRpm;
  }

  private updateSensors(): void {
    for (const [id, reading] of Object.entries(this.state.sensors)) {
      const sensor = this.getSensorById(id);
      if (!sensor) continue;

      switch (sensor.definition.type) {
        case 'vibration':
          reading.value = this.simulateVibration(sensor);
          break;
        case 'temperature':
          reading.value = this.simulateTemperature(sensor);
          break;
        case 'rpm':
          reading.value = this.simulateRpm(sensor);
          break;
        case 'current':
          reading.value = this.simulateCurrent(sensor);
          break;
        case 'acoustic':
          reading.value = this.simulateAcoustic(sensor);
          break;
      }
      reading.timestamp = this.state.time;
    }
  }

  private simulateVibration(sensor: any): number {
    const baseNoise = 0.1 * (Math.random() - 0.5);
    const rpm = this.state.motor.currentRpm;
    const freq1x = rpm / 60;

    let signal = baseNoise;
    signal += Math.sin(2 * Math.PI * freq1x * this.state.time) * 0.05;
    signal += Math.sin(4 * Math.PI * freq1x * this.state.time) * 0.02;

    for (const fault of this.state.faults) {
      if (fault.componentId === sensor.componentId && fault.type === 'bearing-defect') {
        const defectFreq = (fault.parameters?.defectFrequency as number) || 120;
        signal += Math.sin(2 * Math.PI * defectFreq * this.state.time) * fault.severity * 0.5;
      }
    }

    return Math.abs(signal);
  }

  private simulateTemperature(sensor: any): number {
    const ambient = 22;
    const loadFactor = this.state.motor.currentRpm / 3000;
    const motorHeat = 40 * loadFactor;

    let temp = ambient + motorHeat * 0.3;

    for (const fault of this.state.faults) {
      if (fault.componentId === sensor.componentId) {
        if (fault.type === 'overheating') {
          const tempRiseRate = (fault.parameters?.tempRiseRate as number) || 0;
          temp += tempRiseRate * (this.state.time - fault.activatedAt) * fault.severity;
        }
        if (fault.type === 'bearing-defect') {
          temp += 15 * fault.severity;
        }
      }
    }

    return temp + (Math.random() - 0.5) * 0.5;
  }

  private simulateRpm(_sensor: any): number {
    return this.state.motor.currentRpm + (Math.random() - 0.5) * 2;
  }

  private simulateCurrent(_sensor: any): number {
    const baseCurrent = 10;
    const loadCurrent = 40 * (this.state.motor.torque / 125);
    let current = baseCurrent + loadCurrent;

    for (const fault of this.state.faults) {
      if (fault.type === 'imbalance') {
        current += 2 * fault.severity * Math.sin(2 * Math.PI * this.state.motor.currentRpm / 60 * this.state.time);
      }
    }

    return current + (Math.random() - 0.5) * 0.2;
  }

  private simulateAcoustic(_sensor: any): number {
    const rpm = this.state.motor.currentRpm;
    const freq1x = rpm / 60;
    let spl = 60;
    spl += 10 * Math.log10(1 + rpm / 1000);
    spl += 5 * Math.sin(2 * Math.PI * freq1x * this.state.time);

    for (const fault of this.state.faults) {
      if (fault.type === 'bearing-defect') {
        spl += 10 * fault.severity;
      }
    }

    return spl + (Math.random() - 0.5) * 1;
  }

  private interpolateState(_alpha: number): SimulationState {
    // For now return current state; interpolation would need previous state
    return { ...this.state };
  }

  private getSensorById(_id: string): any {
    // This would need access to the sensor registry
    return null;
  }

  private notify(): void {
    this.subscribers.forEach(fn => fn(this.state));
  }
}

export function createInitialState(components: MachineComponent[] = []): SimulationState {
  return {
    motor: {
      running: false,
      targetRpm: 0,
      currentRpm: 0,
      acceleration: 0,
      inertia: 0.1,
      torque: 0,
    },
    shaft: {
      angle: 0,
      angularVelocity: 0,
      angularAcceleration: 0,
    },
    sensors: {},
    faults: [],
    components,
    time: 0,
    speed: 1.0,
  };
}