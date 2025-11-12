"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Users, CheckCircle, Circle } from "lucide-react";
import { FamilyMember } from "@/types";
import Image from "next/image";

interface PoolDisplayProps {
  availableMembers: FamilyMember[];
  drawnMembers: FamilyMember[];
  compact?: boolean;
}

export function PoolDisplay({
  availableMembers,
  drawnMembers,
  compact = false,
}: PoolDisplayProps) {
  const totalMembers = availableMembers.length + drawnMembers.length;
  const progressPercentage = (drawnMembers.length / totalMembers) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${
        compact ? "p-3" : "p-4 sm:p-6"
      } space-y-4`}
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-primary`} />
          <h3 className={`${compact ? "text-sm" : "text-lg"} font-bold text-gray-800 dark:text-gray-200`}>
            Grupo de Jugadores
          </h3>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progreso</span>
            <span>
              {drawnMembers.length}/{totalMembers}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-green-500 to-green-600"
            />
          </div>
        </div>
      </div>

      {/* Available members */}
      {availableMembers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Circle className={`${compact ? "w-3 h-3" : "w-4 h-4"} text-blue-500`} />
            <h4 className={`${compact ? "text-xs" : "text-sm"} font-semibold text-gray-700 dark:text-gray-300`}>
              Aún Disponibles ({availableMembers.length})
            </h4>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
            <AnimatePresence mode="popLayout">
              {availableMembers.map((member) => (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{
                    opacity: 0,
                    x: 20,
                    transition: { duration: 0.2 },
                  }}
                  className={`flex items-center gap-2 ${
                    compact ? "py-1 px-2" : "py-1.5 px-3"
                  } bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800`}
                >
                  <Image
                    src={member.avatar}
                    alt={member.name}
                    width={32}
                    height={32}
                    className={`${compact ? "w-6 h-6" : "w-8 h-8"} rounded-full object-cover flex-shrink-0 border border-blue-300 dark:border-blue-700`}
                  />
                  <Circle className={`${compact ? "w-2 h-2" : "w-3 h-3"} text-blue-500 flex-shrink-0`} />
                  <span className={`${compact ? "text-xs" : "text-sm"} text-gray-700 dark:text-gray-300`}>
                    {member.name}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Drawn members */}
      {drawnMembers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className={`${compact ? "w-3 h-3" : "w-4 h-4"} text-green-500`} />
            <h4 className={`${compact ? "text-xs" : "text-sm"} font-semibold text-gray-700 dark:text-gray-300`}>
              Ya Sorteados ({drawnMembers.length})
            </h4>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
            <AnimatePresence mode="popLayout">
              {drawnMembers.map((member) => (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{
                    opacity: 0,
                    x: 20,
                    transition: { duration: 0.2 },
                  }}
                  className={`flex items-center gap-2 ${
                    compact ? "py-1 px-2" : "py-1.5 px-3"
                  } bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 opacity-70`}
                >
                  <Image
                    src={member.avatar}
                    alt={member.name}
                    width={32}
                    height={32}
                    className={`${compact ? "w-6 h-6" : "w-8 h-8"} rounded-full object-cover flex-shrink-0 border border-green-300 dark:border-green-700 grayscale`}
                  />
                  <CheckCircle className={`${compact ? "w-2 h-2" : "w-3 h-3"} text-green-500 flex-shrink-0`} />
                  <span className={`${compact ? "text-xs" : "text-sm"} text-gray-600 dark:text-gray-400 line-through`}>
                    {member.name}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty state */}
      {availableMembers.length === 0 && drawnMembers.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aún no hay jugadores</p>
        </div>
      )}
    </motion.div>
  );
}

