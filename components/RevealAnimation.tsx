"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Sparkles, PartyPopper } from "lucide-react";
import Image from "next/image";

interface RevealAnimationProps {
  gifteeName: string;
  drawerName: string;
  gifteeAvatar?: string;
  drawerAvatar?: string;
  onComplete?: () => void;
}

// Confetti particle component
function ConfettiParticle({ delay }: { delay: number }) {
  const colors = ["#ef4444", "#10b981", "#3b82f6", "#f59e0b", "#a855f7"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const startX = Math.random() * 100;
  const endX = startX + (Math.random() - 0.5) * 50;
  const rotation = Math.random() * 360;

  return (
    <motion.div
      initial={{
        x: `${startX}vw`,
        y: -20,
        opacity: 1,
        rotate: 0,
        scale: 1,
      }}
      animate={{
        x: `${endX}vw`,
        y: "110vh",
        opacity: [1, 1, 0],
        rotate: rotation,
        scale: [1, 1.2, 0.8],
      }}
      transition={{
        duration: 2 + Math.random(),
        delay,
        ease: "easeIn",
      }}
      style={{
        position: "fixed",
        width: "10px",
        height: "10px",
        backgroundColor: color,
        zIndex: 100,
      }}
      className="rounded-sm"
    />
  );
}

export function RevealAnimation({ gifteeName, drawerName, gifteeAvatar, drawerAvatar, onComplete }: RevealAnimationProps) {
  const [phase, setPhase] = useState<"suspense" | "opening" | "reveal">("suspense");
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Phase 1: Suspense buildup (1.5s)
    const suspenseTimer = setTimeout(() => {
      setPhase("opening");
    }, 1500);

    // Phase 2: Box opening (1s)
    const openingTimer = setTimeout(() => {
      setPhase("reveal");
      setShowConfetti(true);
    }, 2500);

    // Phase 3: Display reveal and confetti (3s)
    const completeTimer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 5500);

    return () => {
      clearTimeout(suspenseTimer);
      clearTimeout(openingTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <ConfettiParticle key={i} delay={i * 0.02} />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "suspense" && (
          <motion.div
            key="suspense"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-full max-w-md bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
              <CardContent className="p-8 sm:p-12 text-center space-y-6">
                <motion.div
                  animate={{
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Gift className="w-24 h-24 sm:w-32 sm:h-32 text-purple-600 dark:text-purple-400 mx-auto" />
                </motion.div>

                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="space-y-2"
                >
                  <p className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-300">
                    Abriendo regalo misterioso...
                  </p>
                  <div className="flex justify-center gap-2">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                        className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full"
                      />
                    ))}
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "opening" && (
          <motion.div
            key="opening"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-full max-w-md bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
              <CardContent className="p-8 sm:p-12 text-center space-y-6">
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1.1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <PartyPopper className="w-24 h-24 sm:w-32 sm:h-32 text-orange-600 dark:text-orange-400 mx-auto" />
                </motion.div>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400"
                >
                  Revelando...
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "reveal" && (
          <motion.div
            key="reveal"
            initial={{ scale: 0.7, opacity: 0, rotateY: 90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{
              duration: 0.5,
              type: "spring",
              stiffness: 200,
            }}
          >
            <Card className="w-full max-w-md bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 border-4 border-green-300 dark:border-green-700 shadow-2xl">
              <CardContent className="p-8 sm:p-12 text-center space-y-6">
                {/* Sparkle decorations */}
                <div className="relative">
                  <motion.div
                    className="absolute -top-4 -left-4"
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <Sparkles className="w-8 h-8 text-yellow-500" />
                  </motion.div>
                  <motion.div
                    className="absolute -top-4 -right-4"
                    animate={{
                      rotate: [360, 0],
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <Sparkles className="w-8 h-8 text-yellow-500" />
                  </motion.div>

                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                    }}
                  >
                    <Gift className="w-20 h-20 sm:w-24 sm:h-24 text-green-600 dark:text-green-400 mx-auto" />
                  </motion.div>
                </div>

                {/* Avatar display */}
                {(drawerAvatar || gifteeAvatar) && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-center gap-4"
                  >
                    {drawerAvatar && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="relative"
                      >
                        <Image
                          src={drawerAvatar}
                          alt={drawerName}
                          width={96}
                          height={96}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-green-300 dark:border-green-700 shadow-lg"
                        />
                      </motion.div>
                    )}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="text-3xl sm:text-4xl"
                    >
                      →
                    </motion.div>
                    {gifteeAvatar && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4, type: "spring" }}
                        className="relative"
                      >
                        <Image
                          src={gifteeAvatar}
                          alt={gifteeName}
                          width={96}
                          height={96}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-emerald-300 dark:border-emerald-700 shadow-lg"
                        />
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Reveal text */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3"
                >
                  <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-gray-800 dark:text-gray-200">{drawerName}</span>{" "}
                    le dará un regalo a...
                  </p>

                  <motion.h2
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: 0.4,
                      type: "spring",
                      stiffness: 200,
                    }}
                    className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent"
                  >
                    {gifteeName}
                  </motion.h2>
                </motion.div>

                {/* Celebration emojis */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                  className="flex justify-center gap-4 text-4xl sm:text-5xl"
                >
                  <motion.span
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                    }}
                  >
                    🎉
                  </motion.span>
                  <motion.span
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: 0.2,
                    }}
                  >
                    🎁
                  </motion.span>
                  <motion.span
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: 0.4,
                    }}
                  >
                    🎊
                  </motion.span>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

