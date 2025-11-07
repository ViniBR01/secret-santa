"use client";

import { motion } from "framer-motion";
import { Sparkles, Stars, Gift } from "lucide-react";

interface NarrativePromptProps {
  currentDrawerName: string;
  phase: "announcement" | "selecting" | "revealing";
  drawerOrder?: number;
  totalDrawers?: number;
}

export function NarrativePrompt({
  currentDrawerName,
  phase,
  drawerOrder,
  totalDrawers,
}: NarrativePromptProps) {
  if (phase === "announcement") {
    return (
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: -50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
        }}
        className="relative"
      >
        {/* Sparkle decorations */}
        <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6">
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Stars className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-400" fill="currentColor" />
          </motion.div>
        </div>
        <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6">
          <motion.div
            animate={{
              rotate: [360, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Stars className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-400" fill="currentColor" />
          </motion.div>
        </div>

        {/* Main announcement card */}
        <div className="bg-gradient-to-br from-red-50 via-white to-green-50 dark:from-red-950/50 dark:via-slate-900 dark:to-green-950/50 rounded-2xl p-6 sm:p-10 shadow-2xl border-4 border-red-200 dark:border-red-800">
          <div className="space-y-4 text-center">
            {/* Progress indicator */}
            {drawerOrder !== undefined && totalDrawers !== undefined && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
              >
                <Gift className="w-4 h-4" />
                <span>
                  Draw {drawerOrder} of {totalDrawers}
                </span>
              </motion.div>
            )}

            {/* Main message */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.3,
                type: "spring",
                stiffness: 150,
              }}
              className="space-y-2"
            >
              <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-700 dark:text-gray-300">
                Get ready...
              </p>
              <motion.h2
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="text-3xl sm:text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-600 via-green-600 to-red-600 bg-clip-text text-transparent"
              >
                {currentDrawerName}&apos;s Turn!
              </motion.h2>
            </motion.div>

            {/* Decorative elements */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center items-center gap-3 pt-2"
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                </motion.div>
              ))}
            </motion.div>

            {/* Call to action */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-base sm:text-lg text-muted-foreground pt-2"
            >
              🎄 Choose your mystery gift below 🎁
            </motion.p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (phase === "selecting") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center space-y-2 py-4"
      >
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          className="inline-block"
        >
          <Gift className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
        </motion.div>
        <p className="text-lg sm:text-xl font-semibold">
          {currentDrawerName} is choosing...
        </p>
      </motion.div>
    );
  }

  if (phase === "revealing") {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-3 py-6"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
          }}
        >
          <Gift className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto" />
        </motion.div>
        <motion.p
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
          className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400"
        >
          Opening the mystery gift...
        </motion.p>
      </motion.div>
    );
  }

  return null;
}

