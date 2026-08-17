import { describe, expect, it, vi } from 'vitest';
import { AutosaveWorker } from '../src/services/autosave.js';
import { GameRepository } from '../src/database/repository.js';
import { RoomManager } from '../src/sockets/room-manager.js';

describe('AutosaveWorker', () => {
  it('shares one in-flight flush across concurrent callers', async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const repository = {
      saveChunks: vi.fn(() => pending),
      savePlayers: vi.fn(() => pending),
      saveShips: vi.fn(() => pending)
    } as unknown as GameRepository;
    const worker = new AutosaveWorker(new RoomManager(), repository);

    const first = worker.flush();
    const second = worker.flush();
    expect((repository.saveChunks as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
    expect((repository.savePlayers as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
    expect((repository.saveShips as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
    release();
    await Promise.all([first, second]);
  });
});
