"use client";

import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";

interface DrawButtonProps {
  onClick: () => void;
  disabled?: boolean;
  currentDrawerName?: string;
}

export function DrawButton({ onClick, disabled = false, currentDrawerName }: DrawButtonProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {currentDrawerName && (
        <div className="text-center">
          <p className="text-lg sm:text-xl text-muted-foreground">
            It&apos;s <span className="font-bold text-primary">{currentDrawerName}</span>&apos;s turn
          </p>
        </div>
      )}
      
      <Button
        size="xl"
        onClick={onClick}
        disabled={disabled}
        className="min-w-[200px] sm:min-w-[250px] shadow-lg hover:shadow-xl transition-all"
      >
        <Gift className="w-6 h-6 mr-2" />
        Draw a Name
      </Button>
    </div>
  );
}

