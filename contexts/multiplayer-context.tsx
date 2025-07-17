"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

interface MultiplayerContextType {
  currentRoom: any
  isLoading: boolean
  error: string
  isConnected: boolean
  createRoom: (token: string) => Promise<void>
  joinRoom: (roomCode: string, token: string) => Promise<void>
  leaveRoom: () => void
  startGame: (token: string) => Promise<void>
  makeMove: (row: number, col: number, token: string) => Promise<void>
}

const MultiplayerContext = createContext<MultiplayerContextType | null>(null)

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext)
  if (!context) {
    throw new Error("useMultiplayer must be used within a MultiplayerProvider")
  }
  return context
}

export function MultiplayerProvider({ children }: { children: React.ReactNode }) {
  const [currentRoom, setCurrentRoom] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isConnected, setIsConnected] = useState(true)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [lastRoomState, setLastRoomState] = useState<string>("")

  // Fast polling when we have a room
  useEffect(() => {
    if (currentRoom?.roomCode) {
      console.log("Starting fast polling for room:", currentRoom.roomCode)
      startPolling(currentRoom.roomCode)
    } else {
      stopPolling()
    }

    return () => stopPolling()
  }, [currentRoom?.roomCode])

  const startPolling = (roomCode: string) => {
    stopPolling() // Clear any existing interval

    const poll = async () => {
      try {
        const response = await fetch(`/api/rooms/status?roomCode=${roomCode}&t=${Date.now()}`, {
          cache: "no-store",
        })

        if (response.ok) {
          const data = await response.json()
          const newRoomState = JSON.stringify(data.room)

          // Only update if state actually changed
          if (newRoomState !== lastRoomState) {
            console.log("Room state changed:", data.room)
            setCurrentRoom(data.room)
            setLastRoomState(newRoomState)
          }

          setError("")
          setIsConnected(true)
        } else {
          setIsConnected(false)
          setError("Connection lost")
        }
      } catch (err) {
        console.error("Polling error:", err)
        setIsConnected(false)
        setError("Connection lost. Retrying...")
      }
    }

    // Poll immediately, then every 500ms for fast updates
    poll()
    const interval = setInterval(poll, 500)
    setPollingInterval(interval)
  }

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }

  const createRoom = useCallback(async (token: string) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/rooms/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      if (data.success) {
        setCurrentRoom(data.room)
        setLastRoomState(JSON.stringify(data.room))
      } else {
        setError(data.error || "Failed to create room")
      }
    } catch (err) {
      setError("Network error. Please try again.")
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const joinRoom = useCallback(async (roomCode: string, token: string) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomCode: roomCode.toUpperCase() }),
      })

      const data = await response.json()
      if (data.success) {
        setCurrentRoom(data.room)
        setLastRoomState(JSON.stringify(data.room))
      } else {
        setError(data.error || "Failed to join room")
      }
    } catch (err) {
      setError("Network error. Please try again.")
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const leaveRoom = useCallback(() => {
    setCurrentRoom(null)
    setLastRoomState("")
    setError("")
    stopPolling()
  }, [])

  const startGame = useCallback(
    async (token: string) => {
      if (!currentRoom?.roomCode) return

      setIsLoading(true)
      setError("")

      try {
        const response = await fetch("/api/rooms/start", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ roomCode: currentRoom.roomCode }),
        })

        const data = await response.json()
        if (!data.success) {
          setError(data.error || "Failed to start game")
          setIsLoading(false)
        }
        // Let polling handle the update
      } catch (err) {
        setError("Network error. Please try again.")
        setIsConnected(false)
        setIsLoading(false)
      }
    },
    [currentRoom],
  )

  const makeMove = useCallback(
    async (row: number, col: number, token: string) => {
      if (!currentRoom?.roomCode) return

      try {
        const response = await fetch("/api/game/move", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomCode: currentRoom.roomCode,
            row,
            col,
          }),
        })

        const data = await response.json()
        if (!data.success) {
          setError(data.error || "Move failed")
          setTimeout(() => setError(""), 3000)
        }
        // Let polling handle the update
      } catch (err) {
        setError("Network error")
        setIsConnected(false)
        setTimeout(() => setError(""), 3000)
      }
    },
    [currentRoom],
  )

  return (
    <MultiplayerContext.Provider
      value={{
        currentRoom,
        isLoading,
        error,
        isConnected,
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        makeMove,
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  )
}
