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
  const setPusherReady = useGameStore((state) => state.setPusherReady);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      console.log("⚠️ usePusher: Not on client side, skipping");
      return;
    }

    // Check if Pusher credentials are configured
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    console.log("🔍 DEBUG - Pusher key check:", pusherKey ? "Present" : "Missing");
    
    if (!pusherKey || pusherKey === "your_pusher_key_here") {
      console.log("⚠️ Pusher not configured, running in local-only mode");
      return;
    }

    console.log("🔌 Initializing Pusher client...");
    const pusher = getPusherClient();
    console.log("🔍 DEBUG - Pusher client created:", pusher);
    
    // Listen for connection state changes
    pusher.connection.bind('state_change', (states: any) => {
      console.log(`🔌 Pusher connection state: ${states.previous} → ${states.current}`);
    });

    console.log(`🔌 Subscribing to channel: ${PUSHER_CHANNEL}`);
    const channel = pusher.subscribe(PUSHER_CHANNEL);
    
    // Wait for successful subscription
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Pusher subscription successful');
      setPusherReady(true);
    });
    
    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('❌ Pusher subscription error:', error);
      setPusherReady(false);
    });

    // Listen for options prepared events
    channel.bind(
      PUSHER_EVENTS.OPTIONS_PREPARED,
      (data: { newGameState: GameState }) => {
        console.log("📨 Received OPTIONS_PREPARED event");
        setGameState(data.newGameState);
      }
    );

    // Listen for selection revealing events
    channel.bind(
      PUSHER_EVENTS.SELECTION_REVEALING,
      (data: { newGameState: GameState }) => {
        console.log("📨 Received SELECTION_REVEALING event");
        setGameState(data.newGameState);
      }
    );

    // Listen for draw executed events
    channel.bind(
      PUSHER_EVENTS.DRAW_EXECUTED,
      (data: { drawResult: DrawResult; newGameState: GameState }) => {
        console.log("📨 Received DRAW_EXECUTED event");
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
      console.log("📨 Received GAME_RESET event");
      resetGame();
    });

    // Listen for game state updates
    channel.bind(PUSHER_EVENTS.GAME_STATE_UPDATE, (data: GameState) => {
      console.log("📨 Received GAME_STATE_UPDATE event");
      console.log("🔍 DEBUG - GAME_STATE_UPDATE data:", data); // DEBUG: Log full data
      console.log("🔍 DEBUG - gameLifecycle in update:", data.gameLifecycle); // DEBUG: Log lifecycle specifically
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
      console.log("🔌 Cleaning up Pusher subscription");
      setPusherReady(false);
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [setGameState, setLastDrawResult, resetGame, updatePlayerSession, removePlayerSession, setAdmin, setPusherReady]);
}

