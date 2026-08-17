/** Orbital Field Manual reminder: live status is explicitly reported—never pretend an absent mission server is connected. */
import { io, type Socket } from "socket.io-client";

export type NetworkStatus = "LOCAL" | "CONNECTING" | "SYNCED" | "OFFLINE";
export type RemotePlayerState = { id: string; position: [number, number, number]; rotation: number };

class NebulaNetworkClient {
  private socket?: Socket;
  private status: NetworkStatus = "LOCAL";
  private listeners = new Set<(status: NetworkStatus) => void>();

  connect() {
    const endpoint = import.meta.env.VITE_SOCKET_URL as string | undefined;
    if (!endpoint || this.socket) return;
    this.status = "CONNECTING";
    this.notify();
    this.socket = io(endpoint, { transports: ["websocket"], reconnectionAttempts: 3 });
    this.socket.on("connect", () => { this.status = "SYNCED"; this.notify(); });
    this.socket.on("disconnect", () => { this.status = "OFFLINE"; this.notify(); });
  }

  onStatus(listener: (status: NetworkStatus) => void) {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  emitPlayerState(state: Omit<RemotePlayerState, "id">) {
    this.socket?.emit("player:state", state);
  }

  dispose() {
    this.socket?.disconnect();
    this.socket = undefined;
  }

  private notify() { this.listeners.forEach((listener) => listener(this.status)); }
}

export const networkClient = new NebulaNetworkClient();
