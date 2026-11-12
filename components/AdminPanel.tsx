"use client";

import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  Shield,
  ChevronDown,
  ChevronUp,
  Users,
  UserCog,
  PlayCircle,
  Zap,
  RotateCcw,
} from "lucide-react";
import { PlayerConnectionStatus } from "./PlayerConnectionStatus";
import { familyConfig, getMemberById } from "@/lib/family-config";
import { GameState } from "@/types";

interface AdminPanelProps {
  gameState: GameState;
  onSetNextResult: () => void;
  /** Draw every remaining player at once */
  onDrawAll: () => void | Promise<void>;
  /** Reset the whole game */
  onReset: () => void | Promise<void>;
  /** A request is in flight */
  busy?: boolean;
  currentPlayerId?: string | null;
}

type PendingConfirm = "drawAll" | "reset" | null;

export function AdminPanel({
  gameState,
  onSetNextResult,
  onDrawAll,
  onReset,
  busy = false,
  currentPlayerId,
}: AdminPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  // Inline confirmation instead of window.confirm(), which some mobile browsers suppress.
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);

  const currentDrawer = getMemberById(
    familyConfig.drawOrder[gameState.currentDrawerIndex]
  );
  
  const totalPlayers = familyConfig.members.length;
  const connectedPlayers = Object.values(gameState.activePlayerSessions).filter(
    (s) => s.isOnline
  ).length;
  const completedDraws = gameState.currentDrawerIndex;
  const remainingDraws = familyConfig.drawOrder.length - completedDraws;
  const canDrawAll =
    gameState.gameLifecycle === "in_progress" && !gameState.isComplete && remainingDraws > 0;

  const runConfirmed = async () => {
    const action = pendingConfirm;
    setPendingConfirm(null);
    if (action === "drawAll") await onDrawAll();
    if (action === "reset") await onReset();
  };

  return (
    // Height uses dvh (the *visible* viewport) so the header with the minimize
    // button never slides under mobile Chrome's URL bar; 100vh is the fallback
    // for old browsers. On phones the panel is capped lower so the game stays usable,
    // and the bottom offset respects the iPhone home-indicator safe area.
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-50 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] supports-[height:100dvh]:max-h-[min(calc(100dvh-2rem),75dvh)] sm:supports-[height:100dvh]:max-h-[calc(100dvh-2rem)] flex flex-col">
      <Card className="bg-purple-50 dark:bg-purple-950/50 border-2 border-purple-300 dark:border-purple-700 flex flex-col min-h-0 max-h-full overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors rounded-t-lg flex-shrink-0"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-purple-900 dark:text-purple-100">
              Panel de Admin
            </h3>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          )}
        </button>

        {/* Content */}
        {isExpanded && (
          <div className="flex-1 min-h-0 p-4 space-y-4 border-t border-purple-200 dark:border-purple-800 overflow-y-auto">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Users className="w-3 h-3" />
                  <span>Conectados</span>
                </div>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {connectedPlayers} / {totalPlayers}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <PlayCircle className="w-3 h-3" />
                  <span>Progreso</span>
                </div>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {completedDraws} / {totalPlayers}
                </p>
              </div>
            </div>

            {/* Current Drawer Info */}
            {currentDrawer && !gameState.isComplete && (
              <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-green-300 dark:border-green-700">
                <p className="text-xs text-muted-foreground mb-1">
                  Turno Actual
                </p>
                <p className="font-semibold text-green-700 dark:text-green-300">
                  🎯 {currentDrawer.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fase: <span className="font-medium">{gameState.selectionPhase}</span>
                </p>
              </div>
            )}

            {/* Admin Actions */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                Acciones de Admin
              </h4>
              
              <Button
                onClick={onSetNextResult}
                disabled={gameState.isComplete || gameState.selectionPhase !== 'waiting'}
                variant="outline"
                size="sm"
                className="w-full gap-2 border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-950/30"
              >
                <UserCog className="w-4 h-4" />
                Establecer Próximo Resultado
              </Button>

              <Button
                onClick={() => setPendingConfirm("drawAll")}
                disabled={!canDrawAll || busy}
                variant="outline"
                size="sm"
                className="w-full gap-2 border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:hover:bg-amber-950/30"
              >
                <Zap className="w-4 h-4" />
                Sortear a Todos los Restantes{canDrawAll ? ` (${remainingDraws})` : ""}
              </Button>

              <Button
                onClick={() => setPendingConfirm("reset")}
                disabled={busy}
                variant="outline"
                size="sm"
                className="w-full gap-2 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/30"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar Juego
              </Button>

              {pendingConfirm && (
                <div
                  role="alertdialog"
                  className="rounded-lg border-2 border-purple-400 bg-white dark:bg-slate-900 p-3 space-y-3"
                >
                  <p className="text-sm font-medium">
                    {pendingConfirm === "drawAll"
                      ? `Esto sorteará automáticamente a las ${remainingDraws} personas que faltan y terminará el sorteo. ¿Continuar?`
                      : "Esto borrará todos los resultados y empezará un sorteo nuevo para todos. ¿Continuar?"}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={pendingConfirm === "reset" ? "destructive" : "default"}
                      className="flex-1"
                      onClick={runConfirmed}
                    >
                      {pendingConfirm === "drawAll" ? "Sí, sortear" : "Sí, reiniciar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setPendingConfirm(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Player Connection Status */}
            <PlayerConnectionStatus
              members={familyConfig.members}
              sessions={gameState.activePlayerSessions}
              currentDrawerId={currentDrawer?.id}
              currentPlayerId={currentPlayerId}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

