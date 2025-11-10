"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { X, User } from "lucide-react";
import { FamilyMember } from "@/types";

interface AdminSetNextResultProps {
  currentDrawerName: string;
  availableMembers: FamilyMember[];
  onSelect: (gifteeId: string) => void;
  onCancel: () => void;
}

export function AdminSetNextResult({
  currentDrawerName,
  availableMembers,
  onSelect,
  onCancel,
}: AdminSetNextResultProps) {
  const [selectedGifteeId, setSelectedGifteeId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedGifteeId !== null) {
      onSelect(selectedGifteeId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-w-2xl w-full p-6 space-y-6 bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">
              Establecer Resultado para {currentDrawerName}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Selecciona manualmente a quién le tocará {currentDrawerName}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Available members */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {availableMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedGifteeId(member.id)}
              className={`w-full rounded-lg border-2 transition-all flex items-center gap-3 p-4 text-left ${
                selectedGifteeId === member.id
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                  : "border-border hover:border-purple-300"
              }`}
            >
              <User className={`w-6 h-6 flex-shrink-0 ${
                selectedGifteeId === member.id ? "text-purple-600" : "text-muted-foreground"
              }`} />
              <div className="flex-1">
                <span className="text-lg font-semibold">{member.name}</span>
                <p className="text-xs text-muted-foreground">ID: {member.id}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Warning */}
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <p className="text-sm text-orange-700 dark:text-orange-300">
            ⚠️ <span className="font-semibold">Anulación de Admin:</span> Esto asignará directamente a{" "}
            {selectedGifteeId && availableMembers.find(m => m.id === selectedGifteeId) ? (
              <span className="font-bold">
                {availableMembers.find(m => m.id === selectedGifteeId)?.name}
              </span>
            ) : (
              "la persona seleccionada"
            )}{" "}
            a <span className="font-bold">{currentDrawerName}</span> sin usar las cajas misteriosas.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedGifteeId === null}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Confirmar Asignación
          </Button>
        </div>
      </Card>
    </div>
  );
}

