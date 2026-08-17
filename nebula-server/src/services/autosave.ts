import { env } from '../config/env.js';
import { GameRepository } from '../database/repository.js';
import { RoomManager } from '../sockets/room-manager.js';

export class AutosaveWorker {
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly rooms: RoomManager, private readonly repository: GameRepository) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.flush(), env.AUTOSAVE_INTERVAL_MS);
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  async flush(): Promise<void> {
    if (this.running) return;
    this.running = true;
    const snapshot = this.rooms.dirtySnapshot();
    try {
      await Promise.all([
        this.repository.saveChunks(snapshot.chunks),
        this.repository.savePlayers(snapshot.players),
        this.repository.saveShips(snapshot.ships)
      ]);
      this.rooms.markClean();
    } catch (error) {
      console.error('[autosave] flush failed; dirty state retained for retry', error);
    } finally {
      this.running = false;
    }
  }
}
