"use client";

import { useEffect } from "react";
import { GameBoard } from "@/components/GameBoard";
import { useGameStore } from "@/lib/store";

export default function Home() {
  const initGame = useGameStore((state) => state.initGame);

  useEffect(() => {
    // Initialize game on mount
    initGame();
  }, [initGame]);

  return <GameBoard />;
}

