"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Users,
  Copy,
  LogOut,
  ArrowLeft,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useMultiplayer } from "../../contexts/multiplayer-context";
import { useEffect } from "react";

interface RoomManagerProps {
  user: any;
  token: string;
  onGameStart: (roomCode: string, gameState: any) => void;
  onLogout: () => void;
  onBack: () => void;
}

export default function RoomManager({
  user,
  token,
  onGameStart,
  onLogout,
  onBack,
}: RoomManagerProps) {
  const {
    currentRoom,
    isLoading,
    error,
    isConnected,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
  } = useMultiplayer();
  const [joinCode, setJoinCode] = useState("");

  // Check if game has started
  useEffect(() => {
    if (currentRoom?.status === "playing" && currentRoom?.gameState) {
      onGameStart(currentRoom.roomCode, currentRoom.gameState);
    }
  }, [currentRoom?.status, currentRoom?.gameState]);

  const handleCreateRoom = () => {
    createRoom(token);
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) return;
    joinRoom(joinCode, token);
  };

  const handleStartGame = () => {
    startGame(token);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    setJoinCode("");
  };

  const copyRoomCode = async () => {
    if (currentRoom?.roomCode) {
      try {
        await navigator.clipboard.writeText(currentRoom.roomCode);
      } catch (err) {
        console.error("Failed to copy room code");
      }
    }
  };

  // Show room lobby if in a room
  if (currentRoom) {
    const canStartGame =
      currentRoom.playerUsernames?.length === 2 &&
      currentRoom.hostUsername === user.username;
    const playerCount = currentRoom.playerUsernames?.length || 0;

    return (
      <div className="min-h-screen bg-[#0e1014] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">
              Room: {currentRoom.roomCode}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {playerCount === 2 ? "Ready to start!" : "Waiting for players..."}
            </CardDescription>
            <div
              className={`flex items-center justify-center gap-2 text-sm ${
                isConnected ? "text-green-400" : "text-red-400"
              }`}
            >
              {isConnected ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
              {isConnected ? "Connected" : "Reconnecting..."}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Players ({playerCount}/2)</Label>
              <div className="space-y-1">
                {currentRoom.playerUsernames?.map(
                  (username: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-gray-700 rounded"
                    >
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-white">{username}</span>
                      {username === currentRoom.hostUsername && (
                        <span className="text-xs bg-blue-600 px-2 py-1 rounded text-white">
                          Host
                        </span>
                      )}
                    </div>
                  )
                )}
                {playerCount < 2 && (
                  <div className="flex items-center gap-2 p-2 bg-gray-600 rounded opacity-50">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-400">Waiting for player...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                value={currentRoom.roomCode}
                readOnly
                className="bg-gray-700 border-gray-600 text-white"
              />
              <Button
                onClick={copyRoomCode}
                variant="outline"
                className="border-gray-600 bg-transparent"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}

            <div className="space-y-2">
              {canStartGame ? (
                <Button
                  onClick={handleStartGame}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Starting Game..." : "Start Game"}
                </Button>
              ) : playerCount === 2 ? (
                <div className="text-center text-gray-400 text-sm">
                  {isLoading
                    ? "Game is starting..."
                    : "Waiting for host to start the game..."}
                </div>
              ) : (
                <div className="text-center text-gray-400 text-sm">
                  Share the room code with a friend to start playing!
                </div>
              )}

              <Button
                onClick={handleLeaveRoom}
                variant="outline"
                className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent"
              >
                Leave Room
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show room creation/joining interface
  return (
    <div className="min-h-screen bg-[#0e1014] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-4xl font-bold mb-2">Multiplayer Lobby</h1>
            <p className="text-gray-300">
              Create or join a room to play online!
            </p>
            <div
              className={`flex items-center justify-center gap-2 text-sm mt-2 ${
                isConnected ? "text-green-400" : "text-red-400"
              }`}
            >
              {isConnected ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
              {isConnected ? "Connected" : "Reconnecting..."}
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Room Options */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Create Room */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-green-600 rounded-full w-fit">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">Create Room</CardTitle>
              <CardDescription className="text-gray-300">
                Start a new game and invite a friend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleCreateRoom}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Room"}
              </Button>
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-600 rounded-full w-fit">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">Join Room</CardTitle>
              <CardDescription className="text-gray-300">
                Enter a room code to join a game
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomCode" className="text-gray-300">
                  Room Code
                </Label>
                <Input
                  id="roomCode"
                  type="text"
                  placeholder="Enter room code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="bg-gray-700 border-gray-600 text-white"
                  maxLength={6}
                />
              </div>
              <Button
                onClick={handleJoinRoom}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || !joinCode.trim()}
              >
                {isLoading ? "Joining..." : "Join Room"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {error && <div className="mt-4 text-red-400 text-center">{error}</div>}
      </div>
    </div>
  );
}
