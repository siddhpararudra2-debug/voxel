import * as CANNON from 'cannon-es';
import { env } from '../config/env.js';
import type { Vector3 } from '../models/domain.js';

export class PhysicsValidator {
  private readonly world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) });

  validateMove(previous: Vector3, next: Vector3, deltaSeconds: number): boolean {
    const distance = Math.hypot(next.x - previous.x, next.y - previous.y, next.z - previous.z);
    const maxDistance = Math.max(0.05, env.MAX_MOVE_SPEED * Math.max(deltaSeconds, 0.016) * 1.5);
    return Number.isFinite(distance) && distance <= maxDistance;
  }

  validateVoxelEdit(chunkKey: string, x: number, y: number, z: number): boolean {
    if (!/^-?\\d+_-?\\d+_-?\\d+$/.test(chunkKey)) return false;
    return Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(z) &&
      x >= 0 && x < 16 && y >= 0 && y < 16 && z >= 0 && z < 16;
  }

  step(seconds: number): void {
    this.world.step(Math.min(seconds, 0.1));
  }
}
