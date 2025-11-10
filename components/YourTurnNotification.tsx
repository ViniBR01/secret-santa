"use client";

import { motion } from "framer-motion";
import { Gift, Sparkles, Star } from "lucide-react";

interface YourTurnNotificationProps {
  playerName: string;
}

export function YourTurnNotification({ playerName }: YourTurnNotificationProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      className="relative"
    >
      <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl shadow-2xl p-8 border-4 border-white dark:border-slate-800 relative overflow-hidden">
        {/* Background sparkles */}
        <div className="absolute inset-0 overflow-hidden">
          <Sparkles className="absolute top-4 left-4 w-6 h-6 text-white/50 animate-pulse" />
          <Star className="absolute top-8 right-8 w-8 h-8 text-white/40 animate-spin" style={{ animationDuration: "3s" }} />
          <Sparkles className="absolute bottom-6 left-12 w-5 h-5 text-white/30 animate-pulse" style={{ animationDelay: "0.5s" }} />
          <Star className="absolute bottom-4 right-6 w-6 h-6 text-white/50 animate-spin" style={{ animationDuration: "4s" }} />
        </div>

        <div className="relative z-10 text-center space-y-4">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1, 1.1, 1],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 2,
            }}
            className="flex justify-center"
          >
            <Gift className="w-20 h-20 text-white drop-shadow-lg" />
          </motion.div>

          <div className="space-y-2">
            <motion.h2
              animate={{ scale: [1, 1.05, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg"
            >
              ¡Es Tu Turno!
            </motion.h2>
            <p className="text-xl md:text-2xl text-white/90 font-medium">
              ¡{playerName}, elige tu regalo misterioso! 🎁
            </p>
          </div>

          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-sm text-white/80 pt-2"
          >
            Selecciona una de las cajas de regalo abajo ⬇️
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

