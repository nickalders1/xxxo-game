"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Home, Wifi, WifiOff, Users, Clock, Search, Play } from "lucide-react";
import SocketManager from "@/lib/socket";
import type { Socket } from "socket.io-client";

export default function OnlinePage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [onlinePlayers, setOnlinePlayers] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load saved player name
    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      setPlayerName(savedName);
    }

    const socketManager = SocketManager.getInstance();
    const socketConnection = socketManager.connect();
    setSocket(socketConnection);

    socketConnection.on("connect", () => {
      setConnected(true);
      setError("");
    });

    socketConnection.on("disconnect", () => {
      setConnected(false);
      setIsSearching(false);
    });

    socketConnection.on("queue-joined", ({ position, estimatedWait }) => {
      setQueuePosition(position);
      setEstimatedWait(estimatedWait);
      setIsSearching(true);
    });

    socketConnection.on("queue-update", ({ position, estimatedWait }) => {
      setQueuePosition(position);
      setEstimatedWait(estimatedWait);
    });

    socketConnection.on("match-found", ({ gameId }) => {
      setIsSearching(false);
      // Fix: Ensure playerName is properly encoded and not empty
      const encodedName = encodeURIComponent(playerName.trim());
      console.log(`Redirecting to game with name: ${encodedName}`); // Debug log
      window.location.href = `/online/game?id=${gameId}&name=${encodedName}`;
    });

    socketConnection.on("queue-left", () => {
      setIsSearching(false);
      setQueuePosition(0);
      setEstimatedWait(0);
    });

    socketConnection.on("online-count", ({ count }) => {
      setOnlinePlayers(count);
    });

    socketConnection.on("error", ({ message }) => {
      setError(message);
      setIsSearching(false);
    });

    return () => {
      socketManager.disconnect();
    };
  }, []);

  const joinQueue = () => {
    if (!playerName.trim()) {
      setError("Voer een naam in");
      return;
    }

    // Probeer verbinding te maken als we niet verbonden zijn
    if (!connected && socket) {
      socket.connect();
      setError("Verbinding maken...");
      setTimeout(() => {
        if (socket.connected) {
          socket.emit("join-queue", { playerName: playerName.trim() });
          localStorage.setItem("playerName", playerName.trim());
          setError("");
        } else {
          setError("Kan geen verbinding maken met server");
        }
      }, 1000);
      return;
    }

    if (!socket) {
      setError("Socket niet beschikbaar");
      return;
    }

    // Save player name
    localStorage.setItem("playerName", playerName.trim());

    setError("");
    socket.emit("join-queue", { playerName: playerName.trim() });
  };

  const leaveQueue = () => {
    if (socket) {
      socket.emit("leave-queue");
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/">
            <Button
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              Online Spelen
            </h1>
            <div className="flex items-center gap-2 justify-center text-slate-300">
              {connected ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <span className="text-sm">
                {connected ? "Verbonden" : "Niet verbonden"}
              </span>
              {connected && (
                <>
                  <span>•</span>
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{onlinePlayers} online</span>
                </>
              )}
            </div>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="max-w-2xl mx-auto space-y-8">
          {/* Player Name Input */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Speler Naam</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Voer je naam in..."
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  maxLength={20}
                  disabled={isSearching}
                />
                {error && <div className="text-red-400 text-sm">{error}</div>}
              </div>
            </CardContent>
          </Card>

          {/* Matchmaking */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="h-5 w-5" />
                Matchmaking
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isSearching ? (
                <div className="space-y-4">
                  <p className="text-slate-300">
                    Klik op "Zoek Spel" om automatisch een tegenstander te
                    vinden van jouw niveau.
                  </p>
                  <Button
                    onClick={joinQueue}
                    disabled={!playerName.trim() || isSearching}
                    className="w-full bg-purple-500 hover:bg-purple-600 h-12"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    {!connected ? "Verbinding maken..." : "Zoek Spel"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Zoeken naar tegenstander...
                    </h3>
                    <p className="text-slate-300">
                      Je staat op positie {queuePosition} in de wachtrij
                    </p>
                  </div>

                  <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">
                        Geschatte wachttijd:
                      </span>
                      <div className="flex items-center gap-2 text-white">
                        <Clock className="h-4 w-4" />
                        <span className="font-bold">
                          {formatTime(estimatedWait)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">
                        Positie in wachtrij:
                      </span>
                      <span className="text-white font-bold">
                        #{queuePosition}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={leaveQueue}
                    variant="outline"
                    className="w-full border-red-500 text-red-400 hover:bg-red-500 hover:text-white bg-transparent"
                  >
                    Annuleren
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* How it Works */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Hoe het werkt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-300">
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">1.</span>
                <span>Voer je naam in en klik op "Zoek Spel"</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">2.</span>
                <span>
                  Ons matchmaking systeem zoekt een tegenstander van jouw niveau
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">3.</span>
                <span>
                  Zodra een match is gevonden, start het spel automatisch!
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">4.</span>
                <span>
                  Speel volgens de XXXo regels en probeer meer punten te scoren
                  dan je tegenstander
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Game Rules Quick Reference */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Snelle Regels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>4 op een rij:</span>
                <span className="text-yellow-400 font-bold">1 punt</span>
              </div>
              <div className="flex justify-between">
                <span>5 op een rij:</span>
                <span className="text-green-400 font-bold">2 punten</span>
              </div>
              <div className="mt-3 p-3 bg-slate-700/50 rounded">
                <p className="text-xs">
                  <strong>Belangrijk:</strong> Je mag niet naast je laatste zet
                  plaatsen. Alle 8 vakjes rondom je laatste zet zijn verboden
                  voor je volgende zet.
                </p>
              </div>
              <div className="text-center pt-2">
                <Link href="/rules">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 bg-transparent"
                  >
                    Volledige Regels
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
