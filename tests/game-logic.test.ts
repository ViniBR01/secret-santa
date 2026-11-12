import { describe, expect, it } from "vitest";
import { GameState } from "@/types";
import { canCompleteWith, getValidGiftees, initializeGame, prepareDrawOptions, updateGameStateAfterDraw } from "@/lib/game-logic";
import { adminForce } from "@/lib/turns";
import { GameError } from "@/lib/state-store";
import { familyConfig, getMemberById } from "@/lib/family-config";

function draw(s: GameState, gifteeId: string): GameState {
  const drawerId = familyConfig.drawOrder[s.currentDrawerIndex];
  return updateGameStateAfterDraw(s, { drawId: "t", drawerId, gifteeId, gifteeName: getMemberById(gifteeId)!.name });
}

describe("draw completability", () => {
  it("random viable choices always complete, and each turn stays fast", () => {
    for (let g = 0; g < 100; g++) {
      let s: GameState = { ...initializeGame(), gameLifecycle: "in_progress" };
      while (!s.isComplete) {
        const t = performance.now();
        const o = prepareDrawOptions(s);
        expect(performance.now() - t).toBeLessThan(500);
        expect(o?.viableGifteeIds.length).toBeGreaterThan(0);
        s = draw(s, o!.viableGifteeIds[Math.floor(Math.random() * o!.viableGifteeIds.length)]);
      }
    }
  });

  it("admin overrides can never paint the game into a corner", () => {
    let rejected = 0;
    for (let g = 0; g < 200; g++) {
      let s: GameState = { ...initializeGame(), gameLifecycle: "in_progress" };
      while (!s.isComplete) {
        const drawer = familyConfig.drawOrder[s.currentDrawerIndex];
        const valid = getValidGiftees(drawer, s.availableGiftees);
        const pickId = valid[Math.floor(Math.random() * valid.length)];
        try {
          s = adminForce(s, { gifteeId: pickId });
        } catch (e) {
          expect(e).toBeInstanceOf(GameError);
          expect(canCompleteWith(s, pickId)).toBe(false);
          rejected++;
          s = draw(s, prepareDrawOptions(s)!.viableGifteeIds[0]);
        }
      }
      expect(Object.keys(s.assignments)).toHaveLength(familyConfig.drawOrder.length);
    }
    // Sanity: the guard actually triggers sometimes with this family config
    expect(rejected).toBeGreaterThan(0);
  });
});
