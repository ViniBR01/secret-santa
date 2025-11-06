"use client";

import { useGameStore } from "@/lib/store";
import { getPlayerStates, getCurrentDrawer } from "@/lib/game-logic";
import { PlayerCard } from "./PlayerCard";
import { DrawButton } from "./DrawButton";
import { RevealAnimation } from "./RevealAnimation";
import { Button } from "./ui/button";
import { RotateCcw, PartyPopper } from "lucide-react";
import { useState } from "react";
import { getMemberById } from "@/lib/family-config";

export function GameBoard() {
  const gameState = useGameStore();
  const [showReveal, setShowReveal] = useState(false);

  const playerStates = getPlayerStates(gameState);
  const currentDrawer = getCurrentDrawer(gameState);

  const handleDraw = () => {
    gameState.performDraw();
    setShowReveal(true);
  };

  const handleRevealComplete = () => {
    setShowReveal(false);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to restart the Secret Santa draw?")) {
      gameState.resetGame();
      setShowReveal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 dark:from-red-950 dark:via-background dark:to-green-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 sm:space-y-4">
          <h1 className="text-4xl sm:text-6xl font-bold text-primary flex items-center justify-center gap-3">
            <Gift className="w-10 h-10 sm:w-14 sm:h-14" />
            Secret Santa
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Family Gift Exchange
          </p>
        </div>

        {/* Error message */}
        {gameState.error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-center">
            <p className="text-destructive font-semibold">{gameState.error}</p>
          </div>
        )}

        {/* Game complete message */}
        {gameState.isComplete && (
          <div className="bg-green-500/10 border border-green-500 rounded-lg p-6 text-center space-y-4">
            <PartyPopper className="w-16 h-16 mx-auto text-green-500" />
            <h2 className="text-2xl sm:text-3xl font-bold text-green-700 dark:text-green-400">
              All Done! 🎉
            </h2>
            <p className="text-lg text-muted-foreground">
              Everyone has been assigned their Secret Santa!
            </p>
          </div>
        )}

        {/* Draw button */}
        {!gameState.isComplete && (
          <div className="flex justify-center py-4">
            <DrawButton
              onClick={handleDraw}
              disabled={gameState.isComplete}
              currentDrawerName={currentDrawer?.name}
            />
          </div>
        )}

        {/* Player cards */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-semibold">Draw Order</h2>
          <div className="space-y-3">
            {playerStates.map((playerState) => (
              <PlayerCard
                key={playerState.member.id}
                playerState={playerState}
                isCurrentDrawer={playerState.status === "drawing"}
              />
            ))}
          </div>
        </div>

        {/* Reset button */}
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Game
          </Button>
        </div>

        {/* Reveal animation */}
        {showReveal && gameState.lastDrawResult && (
          <RevealAnimation
            gifteeName={gameState.lastDrawResult.gifteeName}
            drawerName={getMemberById(gameState.lastDrawResult.drawerId)?.name || "Someone"}
            onComplete={handleRevealComplete}
          />
        )}
      </div>
    </div>
  );
}

function Gift(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

