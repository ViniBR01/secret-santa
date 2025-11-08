"use client";

import { useEffect } from "react";
import { getPusherClient, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { useGameStore } from "@/lib/store";
import { DrawResult, GameState, PlayerSession } from "@/types";

export function usePusher() {
  const setGameState = useGameStore((state) => state.setGameState);
  const setLastDrawResult = useGameStore((state) => state.setLastDrawResult);
  const resetGame = useGameStore((state) => state.resetGame);
  const updatePlayerSession = useGameStore((state) => state.updatePlayerSession);
  const removePlayerSession = useGameStore((state) => state.removePlayerSession);
  const setAdmin = useGameStore((state) => state.setAdmin);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Check if Pusher credentials are configured
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (!pusherKey || pusherKey === "your_pusher_key_here") {
      console.log("Pusher not configured, running in local-only mode");
      return;
    }

    const pusher = getPusherClient();
    const channel = pusher.subscribe(PUSHER_CHANNEL);

    // Listen for options prepared events
    channel.bind(
      PUSHER_EVENTS.OPTIONS_PREPARED,
      (data: { newGameState: GameState }) => {
        setGameState(data.newGameState);
      }
    );

    // Listen for selection revealing events
    channel.bind(
      PUSHER_EVENTS.SELECTION_REVEALING,
      (data: { newGameState: GameState }) => {
        setGameState(data.newGameState);
      }
    );

    // Listen for draw executed events
    channel.bind(
      PUSHER_EVENTS.DRAW_EXECUTED,
      (data: { drawResult: DrawResult; newGameState: GameState }) => {
        // Update state and lastDrawResult atomically by merging them
        setGameState({
          ...data.newGameState,
          // Temporarily set to revealing to trigger animation
          selectionPhase: 'revealing',
        });
        setLastDrawResult(data.drawResult);
        
        // Then update to the final state after a brief moment
        setTimeout(() => {
          setGameState(data.newGameState);
        }, 50);
      }
    );

    // Listen for game reset events
    channel.bind(PUSHER_EVENTS.GAME_RESET, () => {
      resetGame();
    });

    // Listen for game state updates
    channel.bind(PUSHER_EVENTS.GAME_STATE_UPDATE, (data: GameState) => {
      setGameState(data);
    });

    // Listen for player connection events
    channel.bind(
      PUSHER_EVENTS.PLAYER_CONNECTED,
      (data: { playerId: string; playerName: string; timestamp: number }) => {
        const session: PlayerSession = {
          playerId: data.playerId,
          connectedAt: data.timestamp,
          lastSeen: data.timestamp,
          isOnline: true,
        };
        updatePlayerSession(data.playerId, session);
      }
    );

    // Listen for player disconnection events
    channel.bind(
      PUSHER_EVENTS.PLAYER_DISCONNECTED,
      (data: { playerId: string }) => {
        removePlayerSession(data.playerId);
      }
    );

    // Listen for admin set events
    channel.bind(
      PUSHER_EVENTS.ADMIN_SET,
      (data: { adminId: string }) => {
        setAdmin(data.adminId);
      }
    );

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [setGameState, setLastDrawResult, resetGame, updatePlayerSession, removePlayerSession, setAdmin]);
}

