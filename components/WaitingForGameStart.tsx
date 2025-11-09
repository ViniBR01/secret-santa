"use client";

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Gift, LogOut, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { resetPusherClient } from "@/lib/pusher";

interface WaitingForGameStartProps {
  playerName?: string;
}

export function WaitingForGameStart({ playerName }: WaitingForGameStartProps) {
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 dark:from-red-950 dark:via-background dark:to-green-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-4">
          <Gift className="w-16 h-16 mx-auto text-primary animate-pulse" />
          <h1 className="text-3xl font-bold text-primary">Secret Santa</h1>
          
          {playerName && (
            <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Welcome, <span className="font-semibold">{playerName}</span>!
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4 py-6">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Clock className="w-5 h-5 animate-spin" />
            <p className="text-lg">Waiting for game to start...</p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
              The admin will start the game when everyone is ready.
            </p>
          </div>

          <div className="text-center text-sm text-muted-foreground space-y-2 pt-4">
            <p>Stay on this page and wait for the game to begin.</p>
            <p>You&apos;ll automatically enter the game when it starts!</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </Card>
    </div>
  );
}

