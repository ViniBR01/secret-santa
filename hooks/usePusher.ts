"use client";

import { useEffect } from "react";
import { getPusherClient, PUSHER_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";
import { useGameStore } from "@/lib/store";
import { DrawResult, GameState } from "@/types";

export function usePusher() {
  const setGameState = useGameStore((state) => state.setGameState);
  const setLastDrawResult = useGameStore((state) => state.setLastDrawResult);
  const resetGame = useGameStore((state) => state.resetGame);

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

    // Listen for draw executed events
    channel.bind(
      PUSHER_EVENTS.DRAW_EXECUTED,
      (data: { drawResult: DrawResult; newGameState: GameState }) => {
        setGameState(data.newGameState);
        setLastDrawResult(data.drawResult);
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

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [setGameState, setLastDrawResult, resetGame]);
}

