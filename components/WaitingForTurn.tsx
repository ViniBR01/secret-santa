"use client";

import { Clock, Sparkles } from "lucide-react";
import { Card } from "./ui/card";

interface WaitingForTurnProps {
  currentDrawerName: string;
  playerName?: string;
  position?: number;
  total?: number;
  isActivelySelecting?: boolean;
}

export function WaitingForTurn({
  currentDrawerName,
  playerName,
  position,
  total,
  isActivelySelecting = false,
}: WaitingForTurnProps) {
  return (
    <Card className={`p-8 border-2 ${
      isActivelySelecting 
        ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30" 
        : "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30"
    }`}>
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <Clock className={`w-16 h-16 ${
              isActivelySelecting ? "text-amber-500 animate-spin" : "text-blue-500 animate-pulse"
            }`} style={isActivelySelecting ? { animationDuration: "3s" } : undefined} />
            <Sparkles className={`w-6 h-6 ${
              isActivelySelecting ? "text-orange-500" : "text-purple-500"
            } absolute -top-1 -right-1 animate-bounce`} />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {isActivelySelecting ? "Selection in Progress..." : "Waiting for Turn..."}
          </h2>
          <p className="text-lg text-muted-foreground">
            <span className={`font-semibold ${
              isActivelySelecting 
                ? "text-amber-600 dark:text-amber-400" 
                : "text-blue-600 dark:text-blue-400"
            }`}>
              {currentDrawerName}
            </span>{" "}
            {isActivelySelecting 
              ? "is choosing from the mystery gifts right now..." 
              : "is currently selecting their Secret Santa"}
          </p>
        </div>

        {playerName && position && total && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              You are <span className="font-bold">{playerName}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Position{" "}
              <span className="font-bold text-primary">
                #{position}
              </span>{" "}
              of {total} in the draw order
            </p>
          </div>
        )}

        <div className="flex justify-center gap-2 pt-2">
          <div className={`w-2 h-2 rounded-full ${
            isActivelySelecting ? "bg-amber-500" : "bg-blue-500"
          } animate-bounce [animation-delay:-0.3s]`}></div>
          <div className={`w-2 h-2 rounded-full ${
            isActivelySelecting ? "bg-orange-500" : "bg-purple-500"
          } animate-bounce [animation-delay:-0.15s]`}></div>
          <div className={`w-2 h-2 rounded-full ${
            isActivelySelecting ? "bg-red-500" : "bg-pink-500"
          } animate-bounce`}></div>
        </div>
      </div>
    </Card>
  );
}

