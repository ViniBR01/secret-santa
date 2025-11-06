"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevealAnimationProps {
  gifteeName: string;
  drawerName: string;
  onComplete?: () => void;
}

export function RevealAnimation({ gifteeName, drawerName, onComplete }: RevealAnimationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setShow(true), 100);
    
    // Call onComplete after animation
    if (onComplete) {
      const completeTimer = setTimeout(onComplete, 3000);
      return () => {
        clearTimeout(timer);
        clearTimeout(completeTimer);
      };
    }
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card
        className={cn(
          "w-full max-w-md transition-all duration-700",
          show ? "animate-reveal opacity-100" : "opacity-0"
        )}
      >
        <CardContent className="p-8 sm:p-12 text-center space-y-6">
          {/* Animated gift icon */}
          <div className="relative inline-block">
            <Gift className="w-20 h-20 sm:w-24 sm:h-24 text-primary mx-auto animate-bounce" />
            <Sparkles className="w-8 h-8 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
            <Sparkles className="w-6 h-6 text-yellow-500 absolute -bottom-1 -left-1 animate-pulse delay-100" />
          </div>

          {/* Reveal text */}
          <div className="space-y-3">
            <p className="text-lg sm:text-xl text-muted-foreground">
              <span className="font-bold text-foreground">{drawerName}</span> will give a gift to...
            </p>
            
            <h2 className="text-3xl sm:text-5xl font-bold text-primary animate-pulse">
              {gifteeName}
            </h2>
          </div>

          {/* Celebration emoji */}
          <div className="text-4xl sm:text-6xl animate-bounce">
            🎉
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

