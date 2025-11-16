"use client";

import { useState, useMemo, forwardRef } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { GiftBox1, GiftBox2, GiftBox3, GiftBox4, GiftBox5, GiftBox6, GiftBox7, GiftBox8, GiftBox9, GiftBox10 } from "./GiftBoxIllustrations";

interface MysterySelectorProps {
  optionCount: number;
  onSelect: (index: number) => void;
  disabled?: boolean;
  currentDrawerName: string;
}

const BOX_PATTERNS = [
  { color: "from-red-500 to-red-600", accent: "border-red-300", primaryColor: "#ef4444", secondaryColor: "#dc2626" },
  { color: "from-green-500 to-green-600", accent: "border-green-300", primaryColor: "#22c55e", secondaryColor: "#16a34a" },
  { color: "from-blue-500 to-blue-600", accent: "border-blue-300", primaryColor: "#3b82f6", secondaryColor: "#2563eb" },
  { color: "from-purple-500 to-purple-600", accent: "border-purple-300", primaryColor: "#a855f7", secondaryColor: "#9333ea" },
  { color: "from-amber-500 to-amber-600", accent: "border-amber-300", primaryColor: "#f59e0b", secondaryColor: "#d97706" },
  { color: "from-pink-500 to-pink-600", accent: "border-pink-300", primaryColor: "#ec4899", secondaryColor: "#db2777" },
  { color: "from-cyan-500 to-cyan-600", accent: "border-cyan-300", primaryColor: "#06b6d4", secondaryColor: "#0891b2" },
  { color: "from-orange-500 to-orange-600", accent: "border-orange-300", primaryColor: "#f97316", secondaryColor: "#ea580c" },
  { color: "from-teal-500 to-teal-600", accent: "border-teal-300", primaryColor: "#14b8a6", secondaryColor: "#0d9488" },
  { color: "from-rose-500 to-rose-600", accent: "border-rose-300", primaryColor: "#f43f5e", secondaryColor: "#e11d48" },
];

const GIFT_BOX_COMPONENTS = [GiftBox1, GiftBox2, GiftBox3, GiftBox4, GiftBox5, GiftBox6, GiftBox7, GiftBox8, GiftBox9, GiftBox10];

export const MysterySelector = forwardRef<HTMLDivElement, MysterySelectorProps>(
  function MysterySelector(
    { optionCount, onSelect, disabled = false, currentDrawerName },
    ref
  ) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // Randomize the order of patterns and components for each render
    const randomizedIndices = useMemo(() => {
      // Create an array of indices [0, 1, 2, ..., 9]
      const indices = Array.from({ length: 10 }, (_, i) => i);
      
      // Fisher-Yates shuffle algorithm
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      
      return indices;
    }, [optionCount]); // Re-shuffle when optionCount changes

    const handleBoxClick = (index: number) => {
      if (disabled || selectedIndex !== null) return;
      setSelectedIndex(index);
      // Small delay before triggering the actual selection
      setTimeout(() => onSelect(index), 300);
    };

    return (
      <div ref={ref} className="w-full space-y-6 overflow-hidden">
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
          // Use randomized indices to select pattern and component
          const randomIndex = randomizedIndices[index % randomizedIndices.length];
          const pattern = BOX_PATTERNS[randomIndex];
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
                {/* Gift box illustration */}
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
                  {(() => {
                    const GiftBoxComponent = GIFT_BOX_COMPONENTS[randomIndex];
                    const isDarkMode = typeof window !== 'undefined' && 
                      document.documentElement.classList.contains('dark');
                    
                    return (
                      <GiftBoxComponent
                        className={`w-16 h-16 sm:w-20 sm:h-20 transition-all ${
                          isSelected ? "drop-shadow-lg" : ""
                        }`}
                        primaryColor={pattern.primaryColor}
                        secondaryColor={pattern.secondaryColor}
                        isDark={isDarkMode}
                      />
                    );
                  })()}
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

