/** Orbital Field Manual reminder: live status is explicitly reported—never pretend an absent mission server is connected. */
/** Orbital Field Manual reminder: status reflects the real transport—authenticated server, explicit local mock, or disconnected—never an invented connection. */
import { io, type Socket } from "socket.io-client";
import { loadStandaloneSession, saveStandaloneSession } from "./LocalPersistence";
import { MockNetworkServer } from "./MockNetworkServer";
import { INBOUND_EVENTS, type ClientEventMap, type PlayerMovePayload, type RoomJoinPayload, type ServerEventMap, type ShipSteerPayload, type VoxelModifyPayload } from "./protocol";

export type NetworkStatus = "LOCAL" | "MOCK" | "CONNECTING" | "SYNCED" | "OFFLINE";
type EventListener<K extends keyof ServerEventMap> = (payload: ServerEventMap[K]) => void;

class NebulaNetworkClient {
  private socket?: Socket;
  private mock?: MockNetworkServer;
  private status: NetworkStatus = "LOCAL";
  private token = typeof window === "undefined" ? "" : sessionStorage.getItem("nebula-bound-jwt") ?? "";
  private room: RoomJoinPayload = { roomId: "argon-field", username: "FIELD PILOT" };
  private statusListeners = new Set<(status: NetworkStatus) => void>();
  private eventListeners = new Map<keyof ServerEventMap, Set<(payload: never) => void>>();

  constructor() {
    void loadStandaloneSession().then((session) => {
      if (!session) return;
      this.room = { roomId: session.roomId, username: session.username };
    }).catch(() => undefined);
  }

  setAuthToken(token: string) {
    this.token = token.trim();
    if (this.token) sessionStorage.setItem("nebula-bound-jwt", this.token);
    else sessionStorage.removeItem("nebula-bound-jwt");
  }

  connect() {
    const endpoint = import.meta.env.VITE_SOCKET_URL as string | undefined;
    const wantsServer = Boolean(endpoint && this.token);
    if (wantsServer && this.socket) return;
    if (!wantsServer && this.mock) return;
    this.closeTransport();
    if (!wantsServer) {
      this.startMock();
      return;
    }
    this.status = "CONNECTING";
    this.notifyStatus();
    this.socket = io(endpoint!, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 3,
      auth: { token: this.token },
      extraHeaders: { Authorization: `Bearer ${this.token}` },
    });
    this.socket.on("connect", () => { this.status = "SYNCED"; this.notifyStatus(); this.emit("room:join", this.room); });
    this.socket.on("disconnect", () => { this.status = "OFFLINE"; this.notifyStatus(); });
    this.socket.on("connect_error", () => { this.status = "OFFLINE"; this.notifyStatus(); });
    INBOUND_EVENTS.forEach((event) => this.socket?.on(event, (payload: ServerEventMap[typeof event]) => this.dispatch(event, payload)));
  }

  joinRoom(payload: RoomJoinPayload) {
    this.room = payload;
    this.emit("room:join", payload);
  }

  emitPlayerMove(payload: PlayerMovePayload) { this.emit("player:move", payload); }
  emitVoxelModify(payload: VoxelModifyPayload) { this.emit("voxel:modify", payload); }
  emitShipSteer(payload: ShipSteerPayload) { this.emit("ship:steer", payload); }

  onStatus(listener: (status: NetworkStatus) => void) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  onEvent<K extends keyof ServerEventMap>(event: K, listener: EventListener<K>) {
    const listeners = this.eventListeners.get(event) ?? new Set<(payload: never) => void>();
    listeners.add(listener as (payload: never) => void);
    this.eventListeners.set(event, listeners);
    return () => listeners.delete(listener as (payload: never) => void);
  }

  dispose() { this.closeTransport(); }

  private startMock() {
    this.mock = new MockNetworkServer();
    INBOUND_EVENTS.forEach((event) => this.mock?.on(event, (payload: ServerEventMap[typeof event]) => this.dispatch(event, payload)));
    this.status = "MOCK";
    this.notifyStatus();
    this.emit("room:join", this.room);
  }

  private emit<K extends keyof ClientEventMap>(event: K, payload: ClientEventMap[K]) {
    if (this.socket?.connected) this.socket.emit(event, payload);
    else this.mock?.emit(event, payload);
  }

  private dispatch<K extends keyof ServerEventMap>(event: K, payload: ServerEventMap[K]) {
    if (event === "room:joined" && this.status === "MOCK") {
      const joinedRoom = payload as ServerEventMap["room:joined"];
      void saveStandaloneSession({ roomId: joinedRoom.roomId, username: this.room.username ?? "FIELD PILOT", updatedAt: Date.now(), lastMode: "MOCK" }).catch(() => undefined);
    }
    this.eventListeners.get(event)?.forEach((listener) => listener(payload as never));
  }

  private closeTransport() {
    this.socket?.disconnect();
    this.socket = undefined;
    this.mock?.dispose();
    this.mock = undefined;
  }

  private notifyStatus() { this.statusListeners.forEach((listener) => listener(this.status)); }
}

export const networkClient = new NebulaNetworkClient();
