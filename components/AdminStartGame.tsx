"use client";

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Gift, LogOut, Play, Users, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { resetPusherClient } from "@/lib/pusher";
import { useGameStore } from "@/lib/store";
import { familyConfig, getMemberById } from "@/lib/family-config";
import { useState } from "react";

export function AdminStartGame() {
  const router = useRouter();
  const gameState = useGameStore();
  const [isStarting, setIsStarting] = useState(false);

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

  const handleStartGame = async () => {
    console.log("🎮 DEBUG - Admin clicked Start Game button");
    console.log("🔍 DEBUG - Current gameLifecycle before start:", gameState.gameLifecycle);
    setIsStarting(true);
    try {
      await gameState.startGame();
      console.log("✅ DEBUG - startGame() completed");
      console.log("🔍 DEBUG - Current gameLifecycle after start:", gameState.gameLifecycle);
    } catch (err) {
      console.error("Error starting game:", err);
      setIsStarting(false);
    }
    // Don't set isStarting to false - let the state update handle the transition
  };

  const handleResetGame = () => {
    if (confirm("Are you sure you want to reset the game? This will clear all progress.")) {
      gameState.resetGame();
    }
  };

  // Get connected players info
  const connectedPlayerIds = Object.keys(gameState.activePlayerSessions);
  const connectedPlayers = connectedPlayerIds
    .map(id => getMemberById(id))
    .filter(Boolean);
  const totalPlayers = familyConfig.members.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950 dark:via-background dark:to-blue-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Gift className="w-16 h-16 text-primary" />
            <div className="px-4 py-2 bg-purple-500 text-white rounded-full font-semibold">
              👑 Admin
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary">Secret Santa</h1>
          <p className="text-lg text-muted-foreground">
            Ready to start the gift exchange?
          </p>
        </div>

        {/* Error message */}
        {gameState.error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-center">
            <p className="text-destructive font-semibold">{gameState.error}</p>
          </div>
        )}

        {/* Connected players status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-muted-foreground">Connected Players</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {connectedPlayerIds.length} / {totalPlayers}
                </p>
              </div>
            </div>
            {connectedPlayerIds.length === totalPlayers && (
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            )}
          </div>

          {/* Players list */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Player Status
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {familyConfig.members.map((member) => {
                const isConnected = connectedPlayerIds.includes(member.id);
                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-2 p-2 rounded ${
                      isConnected
                        ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300"
                        : "bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {isConnected ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="text-sm truncate">{member.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Tip:</strong> You can start the game even if not all players are connected. 
              Late joiners will be able to see the current game state when they connect.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleStartGame}
            disabled={isStarting}
            size="lg"
            className="w-full text-lg py-6 shadow-lg hover:shadow-xl transition-all"
          >
            <Play className="w-6 h-6 mr-2" />
            {isStarting ? "Starting Game..." : "Start Game"}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleResetGame}
              disabled={isStarting}
            >
              Reset Game
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={isStarting}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

