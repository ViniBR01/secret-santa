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
} from "lucide-react";
import { PlayerConnectionStatus } from "./PlayerConnectionStatus";
import { familyConfig, getMemberById } from "@/lib/family-config";
import { GameState } from "@/types";

interface AdminPanelProps {
  gameState: GameState;
  onDrawForPlayer: () => void;
  currentPlayerId?: string | null;
}

export function AdminPanel({
  gameState,
  onDrawForPlayer,
  currentPlayerId,
}: AdminPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const currentDrawer = getMemberById(
    familyConfig.drawOrder[gameState.currentDrawerIndex]
  );
  
  const totalPlayers = familyConfig.members.length;
  const connectedPlayers = Object.values(gameState.activePlayerSessions).filter(
    (s) => s.isOnline
  ).length;
  const completedDraws = gameState.currentDrawerIndex;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] flex flex-col">
      <Card className="bg-purple-50 dark:bg-purple-950/50 border-2 border-purple-300 dark:border-purple-700 flex flex-col overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors rounded-t-lg flex-shrink-0"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-purple-900 dark:text-purple-100">
              Admin Panel
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
                  <span>Connected</span>
                </div>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {connectedPlayers} / {totalPlayers}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <PlayCircle className="w-3 h-3" />
                  <span>Progress</span>
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
                  Current Turn
                </p>
                <p className="font-semibold text-green-700 dark:text-green-300">
                  🎯 {currentDrawer.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Phase: <span className="font-medium">{gameState.selectionPhase}</span>
                </p>
              </div>
            )}

            {/* Admin Actions */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                Admin Actions
              </h4>
              
              <Button
                onClick={onDrawForPlayer}
                disabled={gameState.isComplete || gameState.selectionPhase !== 'selecting'}
                variant="outline"
                size="sm"
                className="w-full gap-2 border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-950/30"
              >
                <UserCog className="w-4 h-4" />
                Draw for Player
              </Button>
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

