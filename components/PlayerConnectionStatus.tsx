"use client";

import { FamilyMember, PlayerSession } from "@/types";
import { Circle, Clock } from "lucide-react";
import { Card } from "./ui/card";

interface PlayerConnectionStatusProps {
  members: FamilyMember[];
  sessions: Record<string, PlayerSession>;
  currentDrawerId?: string;
  currentPlayerId?: string | null;
}

export function PlayerConnectionStatus({
  members,
  sessions,
  currentDrawerId,
  currentPlayerId,
}: PlayerConnectionStatusProps) {
  const formatLastSeen = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Circle className="w-4 h-4" />
        Player Status
      </h3>
      <div className="space-y-2">
        {members.map((member) => {
          const session = sessions[member.id];
          const isOnline = session?.isOnline;
          const isCurrentDrawer = member.id === currentDrawerId;
          const isCurrentUser = member.id === currentPlayerId;

          return (
            <div
              key={member.id}
              className={`flex items-center justify-between p-2 rounded-lg ${
                isCurrentDrawer
                  ? "bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700"
                  : "bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2 flex-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isOnline
                      ? "bg-green-500 animate-pulse"
                      : "bg-gray-400"
                  }`}
                />
                <span className={`text-sm ${isCurrentUser ? "font-bold" : ""}`}>
                  {member.name}
                  {isCurrentUser && " (You)"}
                  {isCurrentDrawer && " 🎯"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {isOnline ? (
                  <span className="text-green-600 dark:text-green-400">
                    Online
                  </span>
                ) : session ? (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatLastSeen(session.lastSeen)}
                  </span>
                ) : (
                  <span className="text-gray-500">Not connected</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

