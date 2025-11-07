"use client";

import { useGameStore } from "@/lib/store";
import { getPlayerStates, getCurrentDrawer } from "@/lib/game-logic";
import { familyConfig, getMemberById } from "@/lib/family-config";
import { PlayerCard } from "./PlayerCard";
import { QuickDrawAllButton } from "./QuickDrawAllButton";
import { ResultsDisplay } from "./ResultsDisplay";
import { RevealAnimation } from "./RevealAnimation";
import { NarrativePrompt } from "./NarrativePrompt";
import { MysterySelector } from "./MysterySelector";
import { PoolDisplay } from "./PoolDisplay";
import { Button } from "./ui/button";
import { RotateCcw, PartyPopper, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { usePusher } from "@/hooks/usePusher";

export function GameBoard() {
  const gameState = useGameStore();
  const [showReveal, setShowReveal] = useState(false);
  const [hasShownReveal, setHasShownReveal] = useState(false);

  // Set up Pusher for real-time sync
  usePusher();

  const playerStates = getPlayerStates(gameState);
  const currentDrawer = getCurrentDrawer(gameState);

  // Calculate available and drawn members for pool display
  const availableMembers = familyConfig.members.filter((m) =>
    gameState.availableGiftees.includes(m.id)
  );
  const drawnMembers = familyConfig.members.filter(
    (m) => !gameState.availableGiftees.includes(m.id)
  );

  // Handle starting a new turn
  const handleStartTurn = () => {
    setHasShownReveal(false); // Reset for next turn
    gameState.prepareOptions();
  };

  // Handle player selection
  const handleSelection = (index: number) => {
    gameState.makeSelection(index);
  };

  // Handle reveal complete
  const handleRevealComplete = () => {
    setShowReveal(false);
    setHasShownReveal(true);
    // Clear the last draw result to prevent re-triggering
    gameState.setLastDrawResult(null);
  };

  // Show reveal animation when we transition to revealing phase (only once per draw)
  useEffect(() => {
    if (gameState.selectionPhase === 'revealing' && gameState.lastDrawResult && !hasShownReveal) {
      setShowReveal(true);
    }
  }, [gameState.selectionPhase, gameState.lastDrawResult, hasShownReveal]);

  const handleReset = () => {
    if (confirm("Are you sure you want to restart the Secret Santa draw?")) {
      gameState.resetGame();
      setShowReveal(false);
      setHasShownReveal(false);
    }
  };

  const handleQuickDrawAll = async () => {
    if (confirm("This will complete all remaining draws automatically. Continue?")) {
      await gameState.quickDrawAll();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 dark:from-red-950 dark:via-background dark:to-green-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2 sm:space-y-4 mb-6 sm:mb-8">
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
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-center mb-6">
            <p className="text-destructive font-semibold">{gameState.error}</p>
          </div>
        )}

        {/* Game complete message */}
        {gameState.isComplete && (
          <div className="space-y-6 mb-6">
            <div className="bg-green-500/10 border border-green-500 rounded-lg p-6 text-center space-y-4">
              <PartyPopper className="w-16 h-16 mx-auto text-green-500" />
              <h2 className="text-2xl sm:text-3xl font-bold text-green-700 dark:text-green-400">
                All Done! 🎉
              </h2>
              <p className="text-lg text-muted-foreground">
                Everyone has been assigned their Secret Santa!
              </p>
            </div>
            <ResultsDisplay assignments={gameState.assignments} />
          </div>
        )}

        {/* Main game area - Two column layout on desktop */}
        {!gameState.isComplete && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left column: Main game flow (2/3 width on desktop) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Waiting phase: Show narrative prompt and start button */}
              {gameState.selectionPhase === 'waiting' && currentDrawer && !showReveal && (
                <div className="space-y-6">
                  <NarrativePrompt
                    currentDrawerName={currentDrawer.name}
                    phase="announcement"
                    drawerOrder={gameState.currentDrawerIndex + 1}
                    totalDrawers={familyConfig.drawOrder.length}
                  />
                  
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      onClick={handleStartTurn}
                      className="min-w-[250px] shadow-lg hover:shadow-xl transition-all text-lg py-6"
                    >
                      <Sparkles className="w-6 h-6 mr-2" />
                      Start {currentDrawer.name}&apos;s Turn
                    </Button>
                  </div>
                </div>
              )}

              {/* Selecting phase: Show mystery boxes */}
              {gameState.selectionPhase === 'selecting' && currentDrawer && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-6 sm:p-8">
                  <MysterySelector
                    optionCount={gameState.currentOptions.length}
                    onSelect={handleSelection}
                    currentDrawerName={currentDrawer.name}
                  />
                </div>
              )}

              {/* Revealing phase: Show loading state */}
              {gameState.selectionPhase === 'revealing' && currentDrawer && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-6 sm:p-8">
                  <NarrativePrompt
                    currentDrawerName={currentDrawer.name}
                    phase="revealing"
                  />
                </div>
              )}

              {/* Player cards - draw order */}
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                  <span>Draw Order</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    ({gameState.currentDrawerIndex} of {familyConfig.drawOrder.length} complete)
                  </span>
                </h2>
                <div className="space-y-3">
                  {playerStates.map((playerState) => {
                    const gifteeId = gameState.assignments[playerState.member.id];
                    const gifteeName = gifteeId ? getMemberById(gifteeId)?.name : undefined;
                    
                    return (
                      <PlayerCard
                        key={playerState.member.id}
                        playerState={playerState}
                        isCurrentDrawer={playerState.status === "drawing"}
                        gifteeName={gifteeName}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Quick draw all button */}
              <div className="flex justify-center pt-4">
                <QuickDrawAllButton
                  onClick={handleQuickDrawAll}
                  disabled={gameState.isComplete}
                  currentDrawerIndex={gameState.currentDrawerIndex}
                />
              </div>
            </div>

            {/* Right column: Pool display (1/3 width on desktop) */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-8">
                <PoolDisplay
                  availableMembers={availableMembers}
                  drawnMembers={drawnMembers}
                />
              </div>
            </div>
          </div>
        )}

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

        {/* Reveal animation overlay */}
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
