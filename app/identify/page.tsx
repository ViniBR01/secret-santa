"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { familyConfig } from "@/lib/family-config";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gift, Users } from "lucide-react";

export default function IdentifyPage() {
  const router = useRouter();
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedPlayers, setConnectedPlayers] = useState<string[]>([]);

  useEffect(() => {
    // Check if already authenticated
    fetch("/api/session/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          // Already logged in, redirect to main page
          router.push("/");
        }
      })
      .catch((err) => {
        console.error("Error checking session:", err);
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlayer) {
      setError("Por favor selecciona tu nombre");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/session/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: selectedPlayer }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to identify player");
      }

      // Success! Redirect to main game
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join game");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 dark:from-red-950 dark:via-background dark:to-green-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-4">
          <Gift className="w-16 h-16 mx-auto text-primary" />
          <h1 className="text-3xl font-bold text-primary">Intercambio 2025</h1>
          <p className="text-muted-foreground">
            ¡Bienvenidos al intercambio familiar de regalos!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="player-select"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <Users className="w-4 h-4" />
              ¿Quién eres?
            </label>
            <select
              id="player-select"
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            >
              <option value="">Selecciona tu nombre...</option>
              {familyConfig.members.map((member) => (
                <option
                  key={member.id}
                  value={member.id}
                  disabled={connectedPlayers.includes(member.id)}
                >
                  {member.name}
                  {connectedPlayers.includes(member.id) ? " (ya conectado)" : ""}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!selectedPlayer || isLoading}
          >
            {isLoading ? "Uniéndose..." : "Unirse al Juego"}
          </Button>
        </form>

        <div className="pt-4 border-t border-border text-center text-sm text-muted-foreground">
          <p>Solo selecciona tu propio nombre</p>
          <p className="mt-1">Cada miembro de la familia debe usar su propio dispositivo</p>
        </div>
      </Card>
    </div>
  );
}

