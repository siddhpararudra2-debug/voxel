import { describe, expect, it } from 'vitest';
import { RoomManager } from '../src/sockets/room-manager.js';
import type { PlayerState } from '../src/models/domain.js';

const player = (userId: string): PlayerState => ({
  userId,
  username: userId,
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  updatedAt: Date.now()
});

describe('RoomManager', () => {
  it('enforces the configured ten-player room cap', () => {
    const manager = new RoomManager();
    for (let i = 0; i < 10; i += 1) manager.join('alpha', player(`user-${i}`));
    expect(() => manager.join('alpha', player('user-10'))).toThrow('Room is full');
  });

  it('rejects movement beyond the authoritative speed envelope', () => {
    const manager = new RoomManager();
    manager.join('alpha', player('user-1'));
    expect(() => manager.updatePlayer('alpha', 'user-1', {
      position: { x: 1000, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 }
    })).toThrow('Movement rejected');
  });

  it('validates voxel coordinates and faction permissions', () => {
    const manager = new RoomManager();
    const faction = manager.createFaction('Builders', 'leader');
    expect(manager.canBuild(faction.factionId, 'leader')).toBe(true);
    expect(manager.canBuild(faction.factionId, 'outsider')).toBe(false);
    expect(() => manager.modifyVoxel('leader', '0_0_0', 16, 0, 0, 1)).toThrow('Invalid voxel coordinate');
  });

  it('accepts coordinate and ship entity chunk keys while rejecting malformed keys', () => {
    const manager = new RoomManager();
    expect(() => manager.modifyVoxel('pilot', '-2_0_7', 0, 0, 0, 1)).not.toThrow();
    expect(() => manager.modifyVoxel('pilot', 'ship:starter-vessel', 1, 1, 1, 8)).not.toThrow();
    expect(() => manager.modifyVoxel('pilot', 'd_d_d', 1, 1, 1, 8)).toThrow('Invalid voxel coordinate');
  });

  it('allows only a faction leader to add members', () => {
    const manager = new RoomManager();
    const faction = manager.createFaction('Builders', 'leader');
    expect(() => manager.addFactionMember(faction.factionId, 'pilot', 'outsider')).toThrow('Only the faction leader');
    expect(() => manager.addFactionMember(faction.factionId, 'pilot', 'leader')).not.toThrow();
  });
});
