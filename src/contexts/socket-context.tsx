"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

type RoomData = any;
type GameStartData = { roomCode: string; gameState: any };

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (code: string) => void;
  leaveRoom: (code: string) => void;
  startGame: (code: string) => void;
  onRoomUpdate: (callback: (room: RoomData) => void) => void;
  onGameStart: (callback: (data: GameStartData) => void) => void;
  onError: (callback: (msg: string) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(
      process.env.NODE_ENV === "production" ? "" : "http://localhost:3000",
      {
        path: "/api/socket",
      }
    );

    socketInstance.on("connect", () => {
      console.log("✅ Connected to socket server");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Disconnected from socket server");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinRoom = (roomCode: string) => {
    socket?.emit("joinRoom", { roomCode });
  };

  const leaveRoom = (roomCode: string) => {
    socket?.emit("leaveRoom", { roomCode });
  };

  const startGame = (roomCode: string) => {
    socket?.emit("startGame", { roomCode });
  };

  const onRoomUpdate = (callback: (room: RoomData) => void) => {
    socket?.on("roomUpdate", callback);
  };

  const onGameStart = (callback: (data: GameStartData) => void) => {
    socket?.on("game-started", (data) => {
      console.log("✅ game-started ontvangen:", data);
      callback(data);
    });
  };

  const onError = (callback: (msg: string) => void) => {
    socket?.on("error", callback);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinRoom,
        leaveRoom,
        startGame,
        onRoomUpdate,
        onGameStart,
        onError,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
