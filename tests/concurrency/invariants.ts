import { familyConfig } from "@/lib/family-config";
import { isValidDraw } from "@/lib/game-logic";
import type { GameState } from "@/types";

/**
 * Properties that must hold for ANY game state the server ever hands out.
 * Returns a list of human-readable violations (empty = coherent).
 */
export function checkStateInvariants(s: GameState | null | undefined): string[] {
  if (!s) return ["state is null"];
  const v: string[] = [];
  const order = familyConfig.drawOrder;
  const entries = Object.entries(s.assignments);

  // 1. Exactly the first `currentDrawerIndex` drawers have an assignment
  if (entries.length !== s.currentDrawerIndex) {
    v.push(`assignments=${entries.length} but currentDrawerIndex=${s.currentDrawerIndex}`);
  }
  for (const [drawer] of entries) {
    const idx = order.indexOf(drawer);
    if (idx < 0 || idx >= s.currentDrawerIndex) v.push(`out-of-turn assignment for ${drawer}`);
  }

  // 2. Nobody is gifted twice
  const giftees = entries.map(([, g]) => g);
  const dupes = giftees.filter((g, i) => giftees.indexOf(g) !== i);
  if (dupes.length) v.push(`gifted twice: ${[...new Set(dupes)].join(", ")}`);

  // 3. Game rules
  for (const [d, g] of entries) {
    if (!isValidDraw(d, g)) v.push(`invalid draw ${d} -> ${g}`);
  }

  // 4. availableGiftees is exactly "everyone not yet gifted"
  const expectedAvail = familyConfig.members.map((m) => m.id).filter((id) => !giftees.includes(id));
  const avail = [...s.availableGiftees].sort();
  if (JSON.stringify(avail) !== JSON.stringify([...expectedAvail].sort())) {
    v.push(`availableGiftees out of sync (${avail.length} vs expected ${expectedAvail.length})`);
  }

  // 5. Completion flags agree
  const done = s.currentDrawerIndex >= order.length;
  if (s.isComplete !== done) v.push(`isComplete=${s.isComplete} but index=${s.currentDrawerIndex}`);
  if (done && s.gameLifecycle !== "completed") v.push(`complete but lifecycle=${s.gameLifecycle}`);

  // 6. Options only exist while selecting, and are all still available
  if (s.selectionPhase === "selecting") {
    if (!s.currentOptions.length) v.push("selecting with no options");
    for (const o of s.currentOptions) {
      if (!s.availableGiftees.includes(o)) v.push(`option ${o} already gifted`);
    }
  }
  return v;
}

/** A completed game must be a full, valid derangement respecting clics. */
export function checkCompletedGame(s: GameState | null | undefined): string[] {
  const v = checkStateInvariants(s);
  if (!s) return v;
  if (!s.isComplete) v.push(`game not complete (index ${s.currentDrawerIndex})`);
  if (Object.keys(s.assignments).length !== familyConfig.drawOrder.length) {
    v.push(`only ${Object.keys(s.assignments).length} assignments`);
  }
  return v;
}

/** The turn index a client displays must never go backwards within one game. */
export function regressions(history: { gameId: string; idx: number }[]): string[] {
  const out: string[] = [];
  for (let i = 1; i < history.length; i++) {
    const [a, b] = [history[i - 1], history[i]];
    if (a.gameId === b.gameId && b.idx < a.idx) out.push(`${a.idx} -> ${b.idx}`);
  }
  return out;
}

/**
 * Every game state that was broadcast, regardless of event name
 * (old code used several event types, new code uses one).
 */
export function broadcastStates(log: { event: string; data: any }[]): GameState[] {
  return log
    .map((e) => (e.data?.newGameState ?? (e.data?.assignments ? e.data : null)) as GameState | null)
    .filter((s): s is GameState => !!s);
}
