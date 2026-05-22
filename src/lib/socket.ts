import { io, type Socket } from "socket.io-client";

class SocketManager {
  private socket: Socket | null = null;
  private static instance: SocketManager;

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  connect(): Socket {
    if (!this.socket) {
      // Decide URL:
      // 1. If NEXT_PUBLIC_SOCKET_URL is set, use it.
      // 2. HTTPS (production): same-origin (nginx proxies /socket.io/ → 3001),
      //    so the connection upgrades to WSS automatically.
      // 3. HTTP from a non-localhost host (LAN dev: phone, emulator, other
      //    machine on the wifi): use the same hostname with port 3001. This
      //    avoids "localhost" being interpreted as the emulator itself.
      // 4. Local dev on the host machine: localhost:3001.
      const isBrowser = typeof window !== "undefined";
      let defaultUrl = "http://localhost:3001";
      if (isBrowser) {
        const { protocol, hostname } = window.location;
        if (protocol === "https:") {
          defaultUrl = window.location.origin;
        } else if (hostname !== "localhost" && hostname !== "127.0.0.1") {
          defaultUrl = `http://${hostname}:3001`;
        }
      }

      const url = process.env.NEXT_PUBLIC_SOCKET_URL || defaultUrl;

      // Allow overriding the Socket.IO path if needed
      const path = process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io";

      this.socket = io(url, {
        path,
        // You can add "polling" as a fallback if you want:
        transports: ["websocket"],
        withCredentials: true,
        autoConnect: true,
      });

      // Optional: tiny helper logs (safe to keep or remove)
      this.socket.on("connect_error", (err) => {
        console.error("[socket] connect_error:", err?.message || err);
      });
    }

    return this.socket as Socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export default SocketManager;
