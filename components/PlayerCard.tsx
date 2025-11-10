"use client";

import { PlayerState } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  playerState: PlayerState;
  isCurrentDrawer?: boolean;
  gifteeName?: string;
  onStartTurn?: () => void;
}

export function PlayerCard({ playerState, isCurrentDrawer = false, gifteeName, onStartTurn }: PlayerCardProps) {
  const { member, status, order } = playerState;

  const statusConfig = {
    waiting: {
      icon: Clock,
      bgColor: "bg-muted",
      textColor: "text-muted-foreground",
      label: "Esperando",
    },
    drawing: {
      icon: Sparkles,
      bgColor: "bg-primary",
      textColor: "text-primary-foreground",
      label: "¡Sorteando ahora!",
    },
    completed: {
      icon: Check,
      bgColor: "bg-green-500",
      textColor: "text-white",
      label: "Completado",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  // Only clickable if it's the current drawer in waiting status and has onStartTurn handler
  const isClickable = isCurrentDrawer && status === "drawing" && onStartTurn;

  return (
    <Card
      className={cn(
        "transition-all duration-300",
        isCurrentDrawer && "ring-4 ring-primary ring-offset-2 shadow-xl scale-105",
        status === "completed" && "opacity-75",
        isClickable && "cursor-pointer hover:shadow-2xl hover:scale-[1.07]"
      )}
      onClick={isClickable ? onStartTurn : undefined}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Order badge */}
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary flex items-center justify-center font-bold text-lg sm:text-xl">
            {order}
          </div>

          {/* Name and status */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg sm:text-xl truncate">
              {member.name}
              {status === "completed" && gifteeName && (
                <span className="text-muted-foreground font-normal ml-2">
                  → {gifteeName}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Icon className="w-4 h-4" />
              <span className="text-sm">{config.label}</span>
              {isClickable && (
                <span className="text-xs italic ml-1">(toca para comenzar)</span>
              )}
            </div>
          </div>

          {/* Status indicator */}
          <div
            className={cn(
              "flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full",
              config.bgColor
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

