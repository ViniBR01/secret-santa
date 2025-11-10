"use client";

import { useState, forwardRef } from "react";
import { motion } from "framer-motion";
import { Gift, Sparkles } from "lucide-react";

interface MysterySelectorProps {
  optionCount: number;
  onSelect: (index: number) => void;
  disabled?: boolean;
  currentDrawerName: string;
}

const BOX_PATTERNS = [
  { color: "from-red-500 to-red-600", accent: "border-red-300" },
  { color: "from-green-500 to-green-600", accent: "border-green-300" },
  { color: "from-blue-500 to-blue-600", accent: "border-blue-300" },
  { color: "from-purple-500 to-purple-600", accent: "border-purple-300" },
  { color: "from-amber-500 to-amber-600", accent: "border-amber-300" },
];

export const MysterySelector = forwardRef<HTMLDivElement, MysterySelectorProps>(
  function MysterySelector(
    { optionCount, onSelect, disabled = false, currentDrawerName },
    ref
  ) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const handleBoxClick = (index: number) => {
      if (disabled || selectedIndex !== null) return;
      setSelectedIndex(index);
      // Small delay before triggering the actual selection
      setTimeout(() => onSelect(index), 300);
    };

    return (
      <div ref={ref} className="w-full space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 text-2xl sm:text-3xl font-bold text-primary"
        >
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse" />
          <span>Turno de {currentDrawerName}</span>
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse" />
        </motion.div>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Elige uno de los regalos misteriosos abajo
        </p>
        <p className="text-sm sm:text-base text-muted-foreground/70">
          {optionCount} {optionCount === 1 ? "opción disponible" : "opciones disponibles"}
        </p>
      </div>

      {/* Gift boxes grid */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 py-4">
        {Array.from({ length: optionCount }).map((_, index) => {
          const pattern = BOX_PATTERNS[index % BOX_PATTERNS.length];
          const isHovered = hoveredIndex === index;
          const isSelected = selectedIndex === index;

          return (
            <motion.button
              key={index}
              onClick={() => handleBoxClick(index)}
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
              disabled={disabled || selectedIndex !== null}
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{
                scale: isSelected ? 1.1 : 1,
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.1,
                duration: 0.3,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              whileHover={!isSelected ? { scale: 1.05, y: -5 } : {}}
              whileTap={!isSelected ? { scale: 0.95 } : {}}
              className={`relative group ${
                selectedIndex !== null && !isSelected ? "opacity-30" : ""
              }`}
            >
              {/* Glow effect on hover */}
              {isHovered && !isSelected && (
                <motion.div
                  className="absolute -inset-2 bg-gradient-to-r from-yellow-200 to-yellow-300 rounded-2xl blur-xl opacity-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                />
              )}

              {/* Selected pulse effect */}
              {isSelected && (
                <motion.div
                  className="absolute -inset-2 bg-gradient-to-r from-green-200 to-green-300 rounded-2xl blur-xl"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}

              {/* Gift box */}
              <div className="relative bg-white dark:bg-slate-800 rounded-xl p-6 sm:p-8 shadow-lg border-4 border-white dark:border-slate-700">
                {/* Decorative ribbon */}
                <div
                  className={`absolute inset-0 flex items-center justify-center pointer-events-none`}
                >
                  <div className="absolute w-full h-4 bg-gradient-to-r opacity-80 ${pattern.color}" />
                  <div className="absolute h-full w-4 bg-gradient-to-b opacity-80 ${pattern.color}" />
                </div>

                {/* Gift icon */}
                <motion.div
                  animate={
                    isHovered && !isSelected
                      ? {
                          rotate: [0, -10, 10, -10, 0],
                          transition: { duration: 0.5 },
                        }
                      : isSelected
                      ? {
                          rotate: 360,
                          scale: [1, 1.2, 1],
                          transition: { duration: 0.6 },
                        }
                      : {}
                  }
                  className="relative z-10"
                >
                  <Gift
                    className={`w-16 h-16 sm:w-20 sm:h-20 ${
                      isSelected ? "text-green-500" : "text-gray-600 dark:text-gray-300"
                    } transition-colors`}
                  />
                </motion.div>

                {/* Box number */}
                <div className="relative z-10 mt-2">
                  <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                    Regalo #{index + 1}
                  </span>
                </div>

                {/* Sparkle decorations */}
                {(isHovered || isSelected) && (
                  <>
                    <motion.div
                      className="absolute top-2 right-2"
                      animate={{
                        scale: [1, 1.5, 1],
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    </motion.div>
                    <motion.div
                      className="absolute bottom-2 left-2"
                      animate={{
                        scale: [1, 1.5, 1],
                        rotate: [360, 180, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 0.5,
                      }}
                    >
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    </motion.div>
                  </>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Hint text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: optionCount * 0.1 + 0.3 }}
        className="text-center text-sm text-muted-foreground/60"
      >
        Cada regalo contiene una de las personas disponibles. ¡Elige sabiamente! 🎁
      </motion.p>
    </div>
    );
  }
);

