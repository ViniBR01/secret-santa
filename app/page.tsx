"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GameBoard } from "@/components/GameBoard";
import { WaitingForGameStart } from "@/components/WaitingForGameStart";
import { AdminStartGame } from "@/components/AdminStartGame";
import { useGameStore } from "@/lib/store";
import { UserRole } from "@/types";
import { getMemberById } from "@/lib/family-config";
import { usePusher } from "@/hooks/usePusher";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initGame = useGameStore((state) => state.initGame);
  const isGameReady = useGameStore((state) => state.isGameReady);
  const gameLifecycle = useGameStore((state) => state.gameLifecycle);
  
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Set up Pusher at the top level so it persists across component transitions
  usePusher();

  // DEBUG: Log when component renders and what gameLifecycle value is
  console.log("🎯 Home component render:", {
    sessionChecked,
    isAuthenticated,
    isGameReady,
    gameLifecycle,
    userRole,
    playerId
  });

  useEffect(() => {
    const checkSession = async () => {
      // Check for admin URL parameter first
      const adminCode = searchParams.get("admin");
      
      if (adminCode) {
        try {
          const response = await fetch("/api/session/admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ secretCode: adminCode }),
          });

          if (response.ok) {
            setIsAuthenticated(true);
            setUserRole("admin");
            setSessionChecked(true);
            
            // Remove admin parameter from URL for security
            router.replace("/");
            return;
          }
        } catch (err) {
          console.error("Error setting admin session:", err);
        }
      }

      // Check existing session
      try {
        const response = await fetch("/api/session/status");
        const data = await response.json();

        if (data.authenticated) {
          setIsAuthenticated(true);
          setUserRole(data.role);
          setPlayerId(data.playerId || null);
        } else {
          // Not authenticated, redirect to identify page
          router.push("/identify");
          return;
        }
      } catch (err) {
        console.error("Error checking session:", err);
        router.push("/identify");
        return;
      }

      setSessionChecked(true);
    };

    checkSession();
  }, [router, searchParams]);

  useEffect(() => {
    // Initialize game once session is confirmed
    // Check isGameReady from store - it persists across hot reloads
    const initialize = async () => {
      if (sessionChecked && isAuthenticated && !isGameReady) {
        console.log("🎮 Starting game initialization...");
        try {
          await initGame();
          console.log("✅ Game initialization complete");
        } catch (error) {
          console.error("❌ Game initialization failed:", error);
        }
      }
    };
    
    initialize();
    // Note: initGame is intentionally NOT in deps to prevent re-initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionChecked, isAuthenticated, isGameReady]);

  // Show loading state while checking session and initializing game
  if (!sessionChecked || !isAuthenticated || !isGameReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 dark:from-red-950 dark:via-background dark:to-green-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {!sessionChecked ? "Verificando sesión..." : !isGameReady ? "Cargando estado del juego..." : "Cargando..."}
          </p>
        </div>
      </div>
    );
  }

  // Route based on game lifecycle and user role
  if (gameLifecycle === 'not_started') {
    // Game hasn't started yet
    if (userRole === 'admin') {
      return <AdminStartGame />;
    } else {
      // Player waiting for game to start
      const playerName = playerId ? getMemberById(playerId)?.name : undefined;
      return <WaitingForGameStart playerName={playerName} />;
    }
  }

  // Game is in progress or completed - show game board
  return <GameBoard role={userRole!} playerId={playerId} />;
}

