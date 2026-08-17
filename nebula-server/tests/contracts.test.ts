import { describe, expect, it } from 'vitest';
import { parseContract, playerMoveSchema, voxelModifySchema } from '../src/types/contracts.js';

describe('socket contract validation', () => {
  it('accepts ship entity chunk keys without weakening coordinate key validation', () => {
    expect(() => parseContract(voxelModifySchema, { chunkKey: 'ship:starter-vessel', x: 1, y: 1, z: 1, block: 8 })).not.toThrow();
    expect(() => parseContract(voxelModifySchema, { chunkKey: 'd_d_d', x: 1, y: 1, z: 1, block: 8 })).toThrow('Invalid event payload');
  });

  it('requires a complete quaternion instead of an Euler-quaternion hybrid', () => {
    const movement = { position: { x: 0, y: 1, z: 2 }, velocity: { x: 0, y: 0, z: 0 } };
    expect(() => parseContract(playerMoveSchema, { ...movement, rotation: { x: 0, y: 0, z: 0 } })).toThrow('Invalid event payload');
    expect(() => parseContract(playerMoveSchema, { ...movement, rotation: { x: 0, y: 0, z: 0, w: 1 } })).not.toThrow();
  });
});
