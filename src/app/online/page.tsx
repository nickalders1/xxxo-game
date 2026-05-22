"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Socket } from "socket.io-client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import SocketManager from "@/lib/socket";

import { Clock, Play, Search, Users, Wifi, WifiOff } from "lucide-react";

export default function OnlinePage() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [onlinePlayers, setOnlinePlayers] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedName = typeof window !== "undefined"
      ? window.localStorage.getItem("playerName")
      : null;
    if (savedName) setPlayerName(savedName);

    const socketManager = SocketManager.getInstance();
    const socket = socketManager.connect();
    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      setError("");
    };
    const onDisconnect = () => {
      setConnected(false);
      setIsSearching(false);
    };
    const onQueueJoined = ({
      position,
      estimatedWait,
    }: {
      position: number;
      estimatedWait: number;
    }) => {
      setQueuePosition(position);
      setEstimatedWait(estimatedWait);
      setIsSearching(true);
    };
    const onQueueUpdate = ({
      position,
      estimatedWait,
    }: {
      position: number;
      estimatedWait: number;
    }) => {
      setQueuePosition(position);
      setEstimatedWait(estimatedWait);
    };
    const onMatchFound = ({ gameId }: { gameId: string }) => {
      setIsSearching(false);
      const currentName =
        playerNameInputRef.current?.value?.trim() || playerName.trim();
      const encoded = encodeURIComponent(currentName);
      window.location.href = `/online/game?id=${gameId}&name=${encoded}`;
    };
    const onQueueLeft = () => {
      setIsSearching(false);
      setQueuePosition(0);
      setEstimatedWait(0);
    };
    const onOnlineCount = ({ count }: { count: number }) => {
      setOnlinePlayers(count);
    };
    const onError = ({ message }: { message: string }) => {
      setError(message);
      setIsSearching(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("queue-joined", onQueueJoined);
    socket.on("queue-update", onQueueUpdate);
    socket.on("match-found", onMatchFound);
    socket.on("queue-left", onQueueLeft);
    socket.on("online-count", onOnlineCount);
    socket.on("error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("queue-joined", onQueueJoined);
      socket.off("queue-update", onQueueUpdate);
      socket.off("match-found", onMatchFound);
      socket.off("queue-left", onQueueLeft);
      socket.off("online-count", onOnlineCount);
      socket.off("error", onError);
      socketManager.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable ref to the input so the match-found handler can read the latest
  // name without re-subscribing to socket events on every keystroke.
  const playerNameInputRef = useRef<HTMLInputElement>(null);

  const joinQueue = () => {
    const trimmed = playerName.trim();
    if (!trimmed) {
      setError("Voer een naam in");
      return;
    }
    const socket = socketRef.current;
    if (!socket) {
      setError("Socket niet beschikbaar");
      return;
    }
    if (!connected) {
      socket.connect();
      setError("Verbinding maken…");
      setTimeout(() => {
        if (socket.connected) {
          socket.emit("join-queue", { playerName: trimmed });
          localStorage.setItem("playerName", trimmed);
          setError("");
        } else {
          setError("Kan geen verbinding maken met server");
        }
      }, 1000);
      return;
    }
    localStorage.setItem("playerName", trimmed);
    setError("");
    socket.emit("join-queue", { playerName: trimmed });
  };

  const leaveQueue = () => {
    socketRef.current?.emit("leave-queue");
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}m ${rest}s`;
  };

  return (
    <AppShell>
      <TopBar
        title="Online spelen"
        subtitle={
          <span className="inline-flex items-center gap-2">
            {connected ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-accent" />
                <span>Verbonden</span>
                <span className="text-border">•</span>
                <Users className="h-3.5 w-3.5" />
                <span className="tabular">{onlinePlayers} online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-destructive" />
                <span>Niet verbonden</span>
              </>
            )}
          </span>
        }
        backHref="/"
      />

      <div className="max-w-xl mx-auto space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Speler naam</CardTitle>
            <CardDescription>
              Deze naam zien tegenstanders tijdens het spelen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              ref={playerNameInputRef}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Voer je naam in…"
              maxLength={20}
              disabled={isSearching}
              autoComplete="nickname"
            />
            {error && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Matchmaking</CardTitle>
            </div>
            <CardDescription>
              Vind automatisch een tegenstander.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSearching ? (
              <Button
                onClick={joinQueue}
                disabled={!playerName.trim()}
                size="lg"
                className="w-full tap-target"
              >
                <Play className="h-4 w-4" />
                {connected ? "Zoek spel" : "Verbinding maken…"}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="font-semibold">Zoeken naar tegenstander…</p>
                  <p className="text-sm text-muted-foreground">
                    Positie in wachtrij: #{queuePosition}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-muted/30 px-3 py-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Wachttijd:</span>
                    <span className="ml-auto font-semibold tabular">
                      {formatTime(estimatedWait)}
                    </span>
                  </div>
                  <div className="rounded-lg bg-muted/30 px-3 py-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Positie:</span>
                    <span className="ml-auto font-semibold tabular">
                      #{queuePosition}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={leaveQueue}
                  variant="outline"
                  size="lg"
                  className="w-full tap-target"
                >
                  Annuleren
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Snelle regels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">4 op een rij</span>
              <span className="font-semibold text-accent">1 punt</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">5 op een rij</span>
              <span className="font-semibold text-accent">2 punten</span>
            </div>
            <p className="pt-2 text-foreground/80">
              <strong>Belangrijk:</strong> je mag niet naast je eigen laatste
              zet plaatsen. Alle 8 vakjes rondom je laatste zet zijn verboden.
            </p>
            <div className="pt-3">
              <Link href="/rules">
                <Button variant="outline" size="sm" className="w-full">
                  Volledige regels
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
