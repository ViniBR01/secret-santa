"use client";

import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { familyConfig } from "@/lib/family-config";

interface QuickDrawAllButtonProps {
  onClick: () => void;
  disabled?: boolean;
  currentDrawerIndex: number;
}

export function QuickDrawAllButton({ 
  onClick, 
  disabled = false, 
  currentDrawerIndex 
}: QuickDrawAllButtonProps) {
  const remainingDraws = familyConfig.drawOrder.length - currentDrawerIndex;

  return (
    <Button
      size="xl"
      variant="secondary"
      onClick={onClick}
      disabled={disabled || remainingDraws <= 0}
      className="min-w-[200px] sm:min-w-[250px] shadow-lg hover:shadow-xl transition-all"
    >
      <Zap className="w-6 h-6 mr-2" />
      Sorteo Rápido de Todos {remainingDraws > 0 && `(${remainingDraws})`}
    </Button>
  );
}

