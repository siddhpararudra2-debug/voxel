/** Orbital Field Manual reminder: standalone mode must be visible as a local mock, but should still exercise the real event contract. */
import type { ClientEventMap, PlayerMovePayload, PlayerState, RoomJoinPayload, ServerEventMap, ShipSteerPayload, VoxelModifyPayload } from "./protocol";

type Listener<K extends keyof ServerEventMap> = (payload: ServerEventMap[K]) => void;

export class MockNetworkServer {
  private listeners = new Map<keyof ServerEventMap, Set<(payload: never) => void>>();
  private roomId = "argon-field";
  private readonly localUser = "local-pilot";

  on<K extends keyof ServerEventMap>(event: K, listener: Listener<K>) {
    const existing = this.listeners.get(event) ?? new Set<(payload: never) => void>();
    existing.add(listener as (payload: never) => void);
    this.listeners.set(event, existing);
    return () => existing.delete(listener as (payload: never) => void);
  }

  emit<K extends keyof ClientEventMap>(event: K, payload: ClientEventMap[K]) {
    window.setTimeout(() => this.handle(event, payload), 45);
  }

  dispose() { this.listeners.clear(); }

  private handle(event: keyof ClientEventMap, payload: ClientEventMap[keyof ClientEventMap]) {
    if (event === "room:join") {
      const join = payload as RoomJoinPayload;
      this.roomId = join.roomId;
      const player: PlayerState = { userId: this.localUser, username: join.username || "LOCAL PILOT", position: join.position ?? { x: -4, y: 9, z: 8 }, velocity: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, updatedAt: Date.now() };
      this.dispatch("room:joined", { roomId: this.roomId, players: [player] });
      return;
    }
    if (event === "player:move") {
      this.dispatch("player:moved", { userId: this.localUser, username: "LOCAL PILOT", ...(payload as PlayerMovePayload), updatedAt: Date.now() });
      return;
    }
    if (event === "voxel:modify") {
      this.dispatch("voxel:modified", { ...(payload as VoxelModifyPayload), userId: this.localUser, updatedAt: Date.now() });
      return;
    }
    if (event === "ship:steer") this.dispatch("ship:steered", { ...(payload as ShipSteerPayload), userId: this.localUser, timestamp: Date.now() });
  }

  private dispatch<K extends keyof ServerEventMap>(event: K, payload: ServerEventMap[K]) {
    this.listeners.get(event)?.forEach((listener) => listener(payload as never));
  }
}
