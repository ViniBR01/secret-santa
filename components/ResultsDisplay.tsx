"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMemberById } from "@/lib/family-config";
import { Gift, ArrowRight } from "lucide-react";

interface ResultsDisplayProps {
  assignments: Record<string, string>; // drawerId -> gifteeId
}

export function ResultsDisplay({ assignments }: ResultsDisplayProps) {
  // Convert assignments to a sorted array for display
  const assignmentsList = Object.entries(assignments).map(([drawerId, gifteeId]) => {
    const drawer = getMemberById(drawerId);
    const giftee = getMemberById(gifteeId);
    
    return {
      drawerId,
      drawerName: drawer?.name || "Unknown",
      gifteeName: giftee?.name || "Unknown",
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
            className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 sm:gap-3 flex-1">
              <span className="font-semibold text-sm sm:text-base text-primary min-w-[100px] sm:min-w-[150px]">
                {assignment.drawerName}
              </span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base text-green-700 dark:text-green-400 min-w-[100px] sm:min-w-[150px]">
                {assignment.gifteeName}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

