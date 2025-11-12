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
import { WaitingForTurn } from "./WaitingForTurn";
import { YourTurnNotification } from "./YourTurnNotification";
import { AdminPanel } from "./AdminPanel";
import { AdminSetNextResult } from "./AdminSetNextResult";
import { Button } from "./ui/button";
import { RotateCcw, PartyPopper, Sparkles, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { resetPusherClient } from "@/lib/pusher";
import { UserRole } from "@/types";

interface GameBoardProps {
  role: UserRole;
  playerId: string | null;
}

export function GameBoard({ role, playerId }: GameBoardProps) {
  const router = useRouter();
  const gameState = useGameStore();
  const [showReveal, setShowReveal] = useState(false);
  const [showAdminSetResultDialog, setShowAdminSetResultDialog] = useState(false);
  const lastShownDrawerIdRef = useRef<string | null>(null);
  const mysterySelectorRef = useRef<HTMLDivElement>(null);
  
  // Set up heartbeat for players (not for admin)
  useHeartbeat({ enabled: role === "player" && !!playerId });

  const playerStates = getPlayerStates(gameState);
  const currentDrawer = getCurrentDrawer(gameState);
  
  // Determine if current user can interact
  const isAdmin = role === "admin";
  const isCurrentDrawer = currentDrawer?.id === playerId;
  const canInteract = isAdmin || isCurrentDrawer;
  
  // Get player info for display
  const playerInfo = playerId ? getMemberById(playerId) : null;
  const playerPosition = playerId
    ? familyConfig.drawOrder.indexOf(playerId) + 1
    : undefined;

  // Calculate available and drawn members for pool display
  const availableMembers = familyConfig.members.filter((m) =>
    gameState.availableGiftees.includes(m.id)
  );
  const drawnMembers = familyConfig.members.filter(
    (m) => !gameState.availableGiftees.includes(m.id)
  );

  // Handle starting a new turn
  const handleStartTurn = () => {
    if (!canInteract) {
      return;
    }
    gameState.prepareOptions();
  };

  // Handle player selection
  const handleSelection = (index: number) => {
    if (!canInteract) {
      return;
    }
    console.log('🎁 Player selected box:', index);
    gameState.makeSelection(index);
  };

  // Handle reveal complete
  const handleRevealComplete = () => {
    console.log('🎉 Reveal animation complete, hiding overlay');
    setShowReveal(false);
    // Clear the last draw result after a short delay to prevent re-triggering
    setTimeout(() => {
      console.log('🧹 Clearing lastDrawResult');
      gameState.setLastDrawResult(null);
    }, 100);
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      // Reset Pusher client to ensure fresh connection on next login
      resetPusherClient();
      await fetch("/api/session/logout", { method: "POST" });
      router.push("/identify");
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };
  
  // Admin action: Set next result
  const handleAdminSetNextResult = () => {
    if (gameState.selectionPhase !== 'waiting') {
      alert("Solo se puede establecer el próximo resultado cuando se espera que comience el turno");
      return;
    }
    setShowAdminSetResultDialog(true);
  };
  
  // Admin action: Confirm set next result
  const handleConfirmSetNextResult = async (selectedGifteeId: string) => {
    try {
      const response = await fetch("/api/admin/set-next-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameState, selectedGifteeId }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error al establecer el próximo resultado: ${error.error}`);
        return;
      }

      setShowAdminSetResultDialog(false);
      // State will be updated via Pusher
    } catch (err) {
      console.error("Error setting next result:", err);
      alert("Error al establecer el próximo resultado. Por favor, intenta de nuevo.");
    }
  };

  // Show reveal animation when we have a new draw result
  useEffect(() => {
    console.log('🔍 useEffect triggered:', {
      selectionPhase: gameState.selectionPhase,
      hasLastDrawResult: !!gameState.lastDrawResult,
      drawerId: gameState.lastDrawResult?.drawerId,
      lastShownDrawerId: lastShownDrawerIdRef.current,
      showReveal,
    });
    
    if (
      gameState.selectionPhase === 'revealing' && 
      gameState.lastDrawResult && 
      gameState.lastDrawResult.drawerId !== lastShownDrawerIdRef.current
    ) {
      console.log('✅ Setting showReveal to TRUE for drawer:', gameState.lastDrawResult.drawerId);
      lastShownDrawerIdRef.current = gameState.lastDrawResult.drawerId;
      setShowReveal(true);
    }
  }, [gameState.selectionPhase, gameState.lastDrawResult]);

  // Auto-scroll to mystery selector when selection phase begins
  useEffect(() => {
    if (gameState.selectionPhase === 'selecting' && mysterySelectorRef.current) {
      // Add a small delay to ensure the component is rendered
      setTimeout(() => {
        mysterySelectorRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [gameState.selectionPhase]);

  const handleReset = () => {
    if (confirm("¿Estás seguro de que quieres reiniciar el sorteo del Intercambio?")) {
      gameState.resetGame();
      setShowReveal(false);
      lastShownDrawerIdRef.current = null;
    }
  };

  const handleQuickDrawAll = async () => {
    if (confirm("Esto completará todos los sorteos restantes automáticamente. ¿Continuar?")) {
      await gameState.quickDrawAll();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 dark:from-red-950 dark:via-background dark:to-green-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2 sm:space-y-4 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1" />
            <h1 className="text-4xl sm:text-6xl font-bold text-primary flex items-center gap-3 flex-1 justify-center">
              <Gift className="w-10 h-10 sm:w-14 sm:h-14" />
              Intercambio 2025
            </h1>
            <div className="flex-1 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2 whitespace-normal text-center leading-tight h-auto py-2 px-3"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="max-w-[80px]">Cambiar Jugador</span>
              </Button>
            </div>
          </div>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Intercambio Familiar de Regalos
          </p>
          {/* Role indicator */}
          <div className="flex items-center justify-center gap-2 text-sm">
            {isAdmin ? (
              <span className="px-3 py-1 bg-purple-500 text-white rounded-full font-semibold">
                👑 Admin
              </span>
            ) : playerInfo ? (
              <span className="px-3 py-1 bg-blue-500 text-white rounded-full">
                {playerInfo.emoji || "👤"} {playerInfo.name}
              </span>
            ) : null}
          </div>
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
                ¡Todo Listo! 🎉
              </h2>
              <p className="text-lg text-muted-foreground">
                ¡Todos han sido asignados su persona secreta!
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
              {/* Show "It's your turn!" notification for current drawer */}
              {gameState.selectionPhase === 'waiting' && isCurrentDrawer && currentDrawer && !showReveal && (
                <YourTurnNotification playerName={currentDrawer.name} />
              )}
              
              {/* Show waiting state for non-current players */}
              {gameState.selectionPhase === 'waiting' && !isCurrentDrawer && !isAdmin && currentDrawer && !showReveal && (
                <WaitingForTurn
                  currentDrawerName={currentDrawer.name}
                  playerName={playerInfo?.name}
                  position={playerPosition}
                  total={familyConfig.drawOrder.length}
                />
              )}
              
              {/* Waiting phase: Show narrative prompt and start button */}
              {gameState.selectionPhase === 'waiting' && currentDrawer && !showReveal && (
                <div className="space-y-6">
                  {canInteract && (
                    <div className="flex justify-center">
                      <Button
                        size="lg"
                        onClick={handleStartTurn}
                        className="min-w-[250px] shadow-lg hover:shadow-xl transition-all text-lg py-6"
                      >
                        <Sparkles className="w-6 h-6 mr-2" />
                        Comenzar Turno de {currentDrawer.name}
                      </Button>
                    </div>
                  )}
                  
                  <NarrativePrompt
                    currentDrawerName={currentDrawer.name}
                    phase="announcement"
                    drawerOrder={gameState.currentDrawerIndex + 1}
                    totalDrawers={familyConfig.drawOrder.length}
                  />
                </div>
              )}

              {/* Selecting phase: Show mystery boxes ONLY to active player/admin */}
              {gameState.selectionPhase === 'selecting' && currentDrawer && (
                <>
                  {canInteract ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-6 sm:p-8">
                      <MysterySelector
                        ref={mysterySelectorRef}
                        optionCount={gameState.currentOptions.length}
                        onSelect={handleSelection}
                        currentDrawerName={currentDrawer.name}
                      />
                    </div>
                  ) : (
                    <WaitingForTurn
                      currentDrawerName={currentDrawer.name}
                      playerName={playerInfo?.name}
                      position={playerPosition}
                      total={familyConfig.drawOrder.length}
                      isActivelySelecting={true}
                    />
                  )}
                </>
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

              {/* Pool display - shown on mobile/tablet here, hidden on desktop */}
              <div className="lg:hidden">
                <PoolDisplay
                  availableMembers={availableMembers}
                  drawnMembers={drawnMembers}
                />
              </div>

              {/* Player cards - draw order */}
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                  <span>Orden de Sorteo</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    ({gameState.currentDrawerIndex} de {familyConfig.drawOrder.length} completado)
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
                        onStartTurn={
                          playerState.status === "drawing" && gameState.selectionPhase === 'waiting'
                            ? handleStartTurn
                            : undefined
                        }
                      />
                    );
                  })}
                </div>
              </div>

              {/* Quick draw all button (admin only) */}
              {isAdmin && (
                <div className="flex justify-center pt-4">
                  <QuickDrawAllButton
                    onClick={handleQuickDrawAll}
                    disabled={gameState.isComplete}
                    currentDrawerIndex={gameState.currentDrawerIndex}
                  />
                </div>
              )}
            </div>

            {/* Right column: Pool display (1/3 width on desktop, hidden on mobile) */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="lg:sticky lg:top-8">
                <PoolDisplay
                  availableMembers={availableMembers}
                  drawnMembers={drawnMembers}
                />
              </div>
            </div>
          </div>
        )}

        {/* Reset button (admin only) */}
        {isAdmin && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar Juego
            </Button>
          </div>
        )}

        {/* Reveal animation overlay */}
        {showReveal && gameState.lastDrawResult && (
          <RevealAnimation
            gifteeName={gameState.lastDrawResult.gifteeName}
            drawerName={getMemberById(gameState.lastDrawResult.drawerId)?.name || "Someone"}
            gifteeAvatar={getMemberById(gameState.lastDrawResult.gifteeId)?.avatar}
            drawerAvatar={getMemberById(gameState.lastDrawResult.drawerId)?.avatar}
            onComplete={handleRevealComplete}
          />
        )}
        
        {/* Admin Panel (only for admin) */}
        {isAdmin && (
          <AdminPanel
            gameState={gameState}
            onSetNextResult={handleAdminSetNextResult}
            currentPlayerId={playerId}
          />
        )}
        
        {/* Admin Set Next Result Dialog */}
        {showAdminSetResultDialog && currentDrawer && gameState.selectionPhase === 'waiting' && (
          <AdminSetNextResult
            currentDrawerName={currentDrawer.name}
            availableMembers={availableMembers}
            onSelect={handleConfirmSetNextResult}
            onCancel={() => setShowAdminSetResultDialog(false)}
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
