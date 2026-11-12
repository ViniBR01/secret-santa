/**
 * Admin "finish the draw" and "reset" buttons, under concurrency.
 */
import { afterEach, describe, expect, it } from "vitest";
import { NET, Scenario, Topology } from "./harness";
import { everyoneJoins } from "./players";
import { broadcastStates, checkCompletedGame, checkStateInvariants } from "./invariants";
import { familyConfig } from "@/lib/family-config";

const TOPOLOGIES: [string, { topology: Topology; withRedis: boolean }][] = [
  ["single server", { topology: { kind: "single" }, withRedis: false }],
  [
    "vercel serverless + redis",
    { topology: { kind: "serverless", maxInstances: 8, idleTimeoutMs: 800, coldStartMs: 20 }, withRedis: true },
  ],
];

let sc: Scenario;
afterEach(() => sc?.dispose());

describe.each(TOPOLOGIES)("admin actions on %s", (_name, cfg) => {
  it("'draw all remaining' finishes the whole draw in one atomic step", async () => {
    sc = new Scenario({ seed: 501, ...cfg });
    const fam = await everyoneJoins(sc, { profile: () => NET.mobile4g });
    await fam.admin.state.startGame();
    await sc.settle();

    // Play two normal turns first
    for (let i = 0; i < 2; i++) {
      await fam.admin.state.prepareOptions();
      await sc.settle();
      await fam.admin.state.makeSelection(0);
      await sc.settle();
    }
    const before = sc.hub.log.length;

    await fam.admin.state.quickDrawAll();
    await sc.settle(200);

    const final = await sc.freshView();
    expect(checkCompletedGame(final)).toEqual([]);
    // The two turns played by hand are preserved
    const firstTwo = familyConfig.drawOrder.slice(0, 2);
    for (const d of firstTwo) expect(final!.assignments[d]).toBe(fam.admin.state.assignments[d]);
    // Exactly ONE state change was broadcast for the whole bulk finish
    const bulk = broadcastStates(sc.hub.log.slice(before));
    expect(bulk).toHaveLength(1);
    expect(bulk[0].isComplete).toBe(true);
    // Everyone sees the final results, and nobody gets 22 reveal animations
    for (const b of fam.all) {
      expect(b.state.isComplete, b.name).toBe(true);
      expect(b.state.assignments, b.name).toEqual(final!.assignments);
      expect(b.revealsShown.length, `${b.name} reveal animations`).toBeLessThanOrEqual(2);
    }
  });

  it("works while a turn is open (boxes showing) and races safely with the drawer's click", async () => {
    sc = new Scenario({ seed: 502, ...cfg });
    const fam = await everyoneJoins(sc, { count: 6, profile: () => NET.badMobile });
    await fam.admin.state.startGame();
    await sc.settle();
    const p0 = fam.players.get(familyConfig.drawOrder[0])!;
    await p0.state.prepareOptions();
    await sc.settle();

    // Drawer picks a box at the same moment the admin finishes everything
    await Promise.all([p0.state.makeSelection(0), fam.admin.state.quickDrawAll()]);
    await sc.settle(300);

    const final = await sc.freshView();
    expect(checkCompletedGame(final)).toEqual([]);
    for (const st of broadcastStates(sc.hub.log)) expect(checkStateInvariants(st)).toEqual([]);
    for (const b of fam.all) expect(b.state.assignments, b.name).toEqual(final!.assignments);
  });

  it("double-clicking 'draw all' (or retrying after a timeout) is harmless", async () => {
    sc = new Scenario({ seed: 503, ...cfg });
    const fam = await everyoneJoins(sc, { count: 4, profile: () => NET.wifi });
    await fam.admin.state.startGame();
    await sc.settle();

    const a = fam.admin;
    // Raw requests, bypassing the client-side double-click guard
    const send = () =>
      a.fetch("/api/admin/draw-all", { method: "POST", body: JSON.stringify({ gameId: a.state.gameId }) });
    const results = await Promise.all([send(), send(), send()]);
    await sc.settle();
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);

    const final = await sc.freshView();
    expect(checkCompletedGame(final)).toEqual([]);
    // Only one completed result was ever announced
    const completed = new Set(
      broadcastStates(sc.hub.log).filter((s) => s.isComplete).map((s) => JSON.stringify(s.assignments))
    );
    expect(completed.size).toBe(1);
  });

  it("players cannot use 'draw all'", async () => {
    sc = new Scenario({ seed: 504, ...cfg });
    const fam = await everyoneJoins(sc, { count: 3, profile: () => NET.lan });
    await fam.admin.state.startGame();
    await sc.settle();
    const p = fam.players.get(familyConfig.drawOrder[0])!;
    const res = await p.fetch("/api/admin/draw-all", { method: "POST", body: "{}" });
    expect(res.status).toBe(403);
    expect((await sc.freshView())?.currentDrawerIndex).toBe(0);
  });

  it("a stale admin tab from before a reset cannot 'draw all' on the new game", async () => {
    sc = new Scenario({ seed: 505, ...cfg });
    const fam = await everyoneJoins(sc, { count: 4, profile: () => NET.lan });
    await fam.admin.state.startGame();
    await sc.settle();
    const oldGameId = fam.admin.state.gameId;
    await fam.admin.state.resetGame();
    await sc.settle();
    await fam.admin.state.startGame();
    await sc.settle();

    const res = await fam.admin.fetch("/api/admin/draw-all", {
      method: "POST",
      body: JSON.stringify({ gameId: oldGameId }),
    });
    expect(res.status).toBe(409);
    expect((await sc.freshView())?.currentDrawerIndex).toBe(0);
  });

  it("reset after finishing gives everyone a fresh game that can be played again", async () => {
    sc = new Scenario({ seed: 506, ...cfg });
    const fam = await everyoneJoins(sc, { count: 6, profile: () => NET.mobile4g });
    await fam.admin.state.startGame();
    await sc.settle();
    await fam.admin.state.quickDrawAll();
    await sc.settle();
    expect((await sc.freshView())?.isComplete).toBe(true);

    await fam.admin.state.resetGame();
    await sc.settle(300);
    const fresh = await sc.freshView();
    expect(fresh?.gameLifecycle).toBe("not_started");
    expect(fresh?.assignments).toEqual({});
    for (const b of fam.all) {
      expect(b.state.gameId, b.name).toBe(fresh!.gameId);
      expect(b.state.isComplete, b.name).toBe(false);
    }

    await fam.admin.state.startGame();
    await sc.settle();
    await fam.admin.state.quickDrawAll();
    await sc.settle();
    expect(checkCompletedGame(await sc.freshView())).toEqual([]);
  });
});
