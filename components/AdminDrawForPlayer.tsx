"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { X, Gift } from "lucide-react";

interface AdminDrawForPlayerProps {
  currentDrawerName: string;
  optionCount: number;
  onSelect: (index: number) => void;
  onCancel: () => void;
}

export function AdminDrawForPlayer({
  currentDrawerName,
  optionCount,
  onSelect,
  onCancel,
}: AdminDrawForPlayerProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleConfirm = () => {
    if (selectedIndex !== null) {
      onSelect(selectedIndex);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-w-2xl w-full p-6 space-y-6 bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">
              Draw for {currentDrawerName}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select a mystery box on behalf of this player
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Mystery boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: optionCount }).map((_, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`aspect-square rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 p-4 ${
                selectedIndex === index
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 scale-105"
                  : "border-border hover:border-purple-300 hover:scale-105"
              }`}
            >
              <Gift className={`w-12 h-12 ${
                selectedIndex === index ? "text-purple-600" : "text-muted-foreground"
              }`} />
              <span className="text-lg font-semibold">#{index + 1}</span>
            </button>
          ))}
        </div>

        {/* Warning */}
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <p className="text-sm text-orange-700 dark:text-orange-300">
            ⚠️ <span className="font-semibold">Admin Override:</span> This action will make a selection on behalf of{" "}
            <span className="font-bold">{currentDrawerName}</span>. They will see the result like a normal draw.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIndex === null}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Confirm Selection
          </Button>
        </div>
      </Card>
    </div>
  );
}

