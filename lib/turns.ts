/**
 * Pure state transitions for the game. Every route goes through these inside
 * `transact()`, so the rules are always checked against the *server's* latest
 * state, never against a copy sent by a browser.
 */
import { GameState, SessionData, DrawResult } from "@/types";
import { familyConfig, getMemberById } from "./family-config";
import { canCompleteWith, executeDraw, isValidDraw, prepareDrawOptions, updateGameStateAfterDraw } from "./game-logic";
import { GameError } from "./state-store";

/**
 * What the client believes the current turn is. Used to make retries and
 * double-clicks idempotent, and to reject actions taken on a stale screen.
 */
export interface TurnRef {
  gameId?: string;
  drawerIndex?: number;
}

export function currentDrawerId(s: GameState) {
  return familyConfig.drawOrder[s.currentDrawerIndex];
}

function assertInGame(s: GameState, ref: TurnRef) {
  if (ref.gameId && ref.gameId !== s.gameId) {
    throw new GameError("The game was reset. Reloading…", 409, s);
  }
  if (s.gameLifecycle === "not_started") throw new GameError("The game hasn't started yet", 409, s);
  if (s.isComplete) throw new GameError("Game is already complete", 409, s);
}

function assertMayAct(s: GameState, session: SessionData) {
  if (session.role !== "admin" && session.playerId !== currentDrawerId(s)) {
    throw new GameError("Forbidden: Not your turn", 403, s);
  }
}

function makeDrawId(s: GameState, drawerId: string) {
  // Deterministic per game+turn: every replay of the same draw has the same id.
  return `${s.gameId}:${s.currentDrawerIndex}:${drawerId}`;
}

/** "Start my turn": reveal the mystery boxes. Idempotent for the same turn. */
export function openTurn(s: GameState, session: SessionData, ref: TurnRef): GameState {
  assertInGame(s, ref);
  if (ref.drawerIndex !== undefined && ref.drawerIndex !== s.currentDrawerIndex) {
    throw new GameError("That turn is already over", 409, s);
  }
  assertMayAct(s, session);
  if (s.selectionPhase === "selecting") return s; // double click / retry: already open
  if (s.selectionPhase !== "waiting") throw new GameError("Turn is already in progress", 409, s);

  const options = prepareDrawOptions(s);
  if (!options || options.viableGifteeIds.length === 0) {
    throw new GameError("No valid options available", 400, s);
  }
  return {
    ...s,
    selectionPhase: "selecting",
    currentOptions: options.viableGifteeIds,
    selectedIndex: null,
    turnLocked: true,
  };
}

/** Commit a draw for the current drawer (shared by select / admin override / quick draw). */
function commitDraw(s: GameState, gifteeId: string, selectedIndex: number | null): GameState {
  const drawerId = currentDrawerId(s);
  const giftee = getMemberById(gifteeId);
  if (!drawerId || !giftee) throw new GameError("Invalid selection", 400, s);
  if (!s.availableGiftees.includes(gifteeId)) {
    throw new GameError("Selected person has already been drawn", 409, s);
  }
  if (!isValidDraw(drawerId, gifteeId)) {
    throw new GameError("Invalid selection: Cannot draw yourself or someone in your own clic", 400, s);
  }
  const draw: DrawResult = {
    drawId: makeDrawId(s, drawerId),
    drawerId,
    gifteeId,
    gifteeName: giftee.name,
  };
  const next = updateGameStateAfterDraw(s, draw);
  return { ...next, selectedIndex, turnLocked: false };
}

/** Pick a mystery box. A retry of an already-committed pick returns the state unchanged. */
export function selectBox(s: GameState, session: SessionData, ref: TurnRef & { choiceIndex: number }): GameState {
  if (ref.gameId && ref.gameId !== s.gameId) throw new GameError("The game was reset. Reloading…", 409, s);
  // Idempotent retry: the response was lost but our pick already went through.
  if (ref.drawerIndex !== undefined && ref.drawerIndex === s.currentDrawerIndex - 1 && s.lastDraw) {
    if (session.role === "admin" || s.lastDraw.drawerId === session.playerId) return s;
  }
  assertInGame(s, ref);
  if (ref.drawerIndex !== undefined && ref.drawerIndex !== s.currentDrawerIndex) {
    throw new GameError("That turn is already over", 409, s);
  }
  assertMayAct(s, session);
  if (s.selectionPhase !== "selecting") throw new GameError("Not in selection phase", 409, s);
  const { choiceIndex } = ref;
  if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= s.currentOptions.length) {
    throw new GameError("Invalid selection", 400, s);
  }
  return commitDraw(s, s.currentOptions[choiceIndex], choiceIndex);
}

/** Admin forces the current drawer's result. */
export function adminForce(s: GameState, ref: TurnRef & { gifteeId: string }): GameState {
  assertInGame(s, ref);
  if (ref.drawerIndex !== undefined && ref.drawerIndex !== s.currentDrawerIndex) {
    throw new GameError("That turn is already over", 409, s);
  }
  if (s.selectionPhase !== "waiting") {
    throw new GameError("Can only set next result when waiting for turn to start", 409, s);
  }
  if (
    s.availableGiftees.includes(ref.gifteeId) &&
    isValidDraw(currentDrawerId(s), ref.gifteeId) &&
    !canCompleteWith(s, ref.gifteeId)
  ) {
    throw new GameError(
      "Esa asignación haría imposible completar el sorteo para los demás. Elige otra persona.",
      400,
      s
    );
  }
  return commitDraw(s, ref.gifteeId, null);
}

/** Random draw for the current drawer (legacy /api/draw and admin quick-draw). */
export function randomDraw(s: GameState, ref: TurnRef): GameState {
  assertInGame(s, ref);
  if (ref.drawerIndex !== undefined && ref.drawerIndex !== s.currentDrawerIndex) {
    throw new GameError("That turn is already over", 409, s);
  }
  if (s.selectionPhase === "revealing") throw new GameError("Turn is already in progress", 409, s);
  const result = executeDraw(s);
  if (!result) throw new GameError("No valid options available", 400, s);
  return commitDraw(s, result.gifteeId, null);
}

export function startGame(s: GameState): GameState {
  if (s.gameLifecycle === "in_progress") return s; // idempotent
  if (s.gameLifecycle !== "not_started") throw new GameError("Game has already been completed", 409, s);
  return { ...s, gameLifecycle: "in_progress" };
}
