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
      // - If NEXT_PUBLIC_SOCKET_URL is set, use it.
      // - Else, when the page is HTTPS, use same-origin (so it becomes WSS).
      // - Else (local dev), use the local socket server.
      const isBrowser = typeof window !== "undefined";
      const defaultUrl =
        isBrowser && window.location.protocol === "https:"
          ? window.location.origin // e.g. https://xxxo.bothosts.com
          : "http://localhost:3001";

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
