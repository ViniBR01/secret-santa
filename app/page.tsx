"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GameBoard } from "@/components/GameBoard";
import { useGameStore } from "@/lib/store";
import { UserRole } from "@/types";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initGame = useGameStore((state) => state.initGame);
  
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

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
    if (sessionChecked && isAuthenticated) {
      initGame();
    }
  }, [sessionChecked, isAuthenticated, initGame]);

  // Show loading state while checking session
  if (!sessionChecked || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 dark:from-red-950 dark:via-background dark:to-green-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <GameBoard role={userRole!} playerId={playerId} />;
}

