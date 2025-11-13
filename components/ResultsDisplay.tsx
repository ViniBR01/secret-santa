"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMemberById, getClicThemeByMemberId } from "@/lib/family-config";
import { Gift, ArrowRight, ArrowDown } from "lucide-react";

interface ResultsDisplayProps {
  assignments: Record<string, string>; // drawerId -> gifteeId
}

export function ResultsDisplay({ assignments }: ResultsDisplayProps) {
  // Convert assignments to a sorted array for display
  const assignmentsList = Object.entries(assignments).map(([drawerId, gifteeId]) => {
    const drawer = getMemberById(drawerId);
    const giftee = getMemberById(gifteeId);
    const drawerClic = getClicThemeByMemberId(drawerId);
    const gifteeClic = getClicThemeByMemberId(gifteeId);
    
    return {
      drawerId,
      drawerName: drawer?.name || "Unknown",
      drawerEmoji: drawer?.emoji,
      drawerClicBg: drawerClic?.bgColor || "",
      gifteeName: giftee?.name || "Unknown",
      gifteeEmoji: giftee?.emoji,
      gifteeClicBg: gifteeClic?.bgColor || "",
    };
  });

  return (
    <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-red-50 dark:from-green-950/20 dark:to-red-950/20">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2 text-2xl sm:text-3xl">
          <Gift className="w-8 h-8 text-green-600" />
          Asignaciones del Intercambio 🎁
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {assignmentsList.map((assignment) => (
          <div
            key={assignment.drawerId}
            className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 p-3 sm:p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:flex-1">
              <span className={`font-semibold text-sm sm:text-base text-primary w-full sm:w-auto sm:min-w-[150px] px-2 py-1 rounded text-center sm:text-left ${assignment.drawerClicBg}`}>
                {assignment.drawerEmoji && <span className="mr-1">{assignment.drawerEmoji}</span>}
                {assignment.drawerName}
              </span>
              <ArrowDown className="w-5 h-5 sm:hidden text-green-600 flex-shrink-0" />
              <ArrowRight className="hidden sm:block w-6 h-6 text-green-600 flex-shrink-0" />
              <span className={`font-semibold text-sm sm:text-base text-green-700 dark:text-green-400 w-full sm:w-auto sm:min-w-[150px] px-2 py-1 rounded text-center sm:text-left ${assignment.gifteeClicBg}`}>
                {assignment.gifteeEmoji && <span className="mr-1">{assignment.gifteeEmoji}</span>}
                {assignment.gifteeName}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

