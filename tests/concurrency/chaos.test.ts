/**
 * Chaos tests: ~25 clients with mixed network quality, while people randomly
 * refresh, double-click, lose signal, lose HTTP responses and the admin
 * intervenes. After every scenario we check:
 *   - the server state always satisfied the game invariants (checked on every broadcast)
 *   - the game completes with a valid, rule-respecting assignment
 *   - every screen converges to the server state
 *   - no screen ever showed an older turn after a newer one
 *   - no screen replayed a reveal animation for the same draw twice
 */
import { afterEach, describe, expect, it } from "vitest";
import { NET, Scenario, Topology, mixedProfile, SimulatedBrowser } from "./harness";
import { everyoneJoins, playGame, waitFor } from "./players";
import { broadcastStates, checkCompletedGame, checkStateInvariants, regressions } from "./invariants";
import { familyConfig } from "@/lib/family-config";
import { sleep } from "./fake-pusher";

const SEEDS = (process.env.CHAOS_SEEDS ?? "101,202,303").split(",").map(Number);

const TOPOLOGIES: Record<string, { topology: Topology; withRedis: boolean }> = {
  "single server": { topology: { kind: "single" }, withRedis: false },
  "vercel serverless + redis": {
    topology: { kind: "serverless", maxInstances: 8, idleTimeoutMs: 800, coldStartMs: 20 },
    withRedis: true,
  },
};

let sc: Scenario;
afterEach(() => sc?.dispose());

function pick<T>(sc: Scenario, xs: T[]): T {
  return xs[Math.floor(sc.rng() * xs.length)];
}

/** Assert everything we care about once the dust has settled. */
async function assertCoherent(sc: Scenario, all: SimulatedBrowser[], log: string[]) {
  // Every state that was ever broadcast was internally consistent
  for (const st of broadcastStates(sc.hub.log)) {
    expect(checkStateInvariants(st), `broadcast v${st.version}`).toEqual([]);
  }
  const final = await sc.freshView();
  expect(checkCompletedGame(final), log.join("\n")).toEqual([]);

  // Give stragglers one safety-net resync, like the periodic poll would.
  await Promise.all(all.map((b) => b.state.resync()));
  await sc.settle();
  for (const b of all) {
    expect(b.state.version, `${b.name} out of date`).toBe(final!.version);
    expect(b.state.assignments, `${b.name} shows different results`).toEqual(final!.assignments);
    expect(regressions(b.indexHistory), `${b.name} went backwards`).toEqual([]);
    const reveals = b.revealsShown.map((r) => r.drawId);
    const dupes = reveals.filter((r, i) => reveals.indexOf(r) !== i);
    expect(dupes, `${b.name} replayed a reveal`).toEqual([]);
  }
}

describe.each(Object.entries(TOPOLOGIES))("chaos on %s", (_name, cfg) => {
  it.each(SEEDS)("seed %i: refreshes, double clicks, flaky phones, lost responses", async (seed) => {
    sc = new Scenario({ seed, ...cfg });
    const fam = await everyoneJoins(sc, {
      profile: () => ({ ...mixedProfile(sc.rng), responseLossRate: 0.05, reorderEvents: sc.rng() < 0.2 }),
      spreadMs: 400,
    });
    await fam.admin.state.startGame();
    await sc.settle();
    const players = [...fam.players.values()];

    const log = await playGame(sc, fam, {
      doubleClickRate: 0.3,
      between: async () => {
        const chaos: Promise<unknown>[] = [];
        // A few people refresh the page
        for (let i = 0; i < 3; i++) if (sc.rng() < 0.5) chaos.push(pick(sc, players).reload());
        // Someone's phone goes to sleep for a while
        if (sc.rng() < 0.4) pick(sc, players).channel.goOffline(100 + sc.rng() * 600);
        // Background heartbeats
        chaos.push(...players.filter(() => sc.rng() < 0.3).map((b) => b.state.sendHeartbeat()));
        // A non-drawer frantically clicks "start turn" from a stale screen
        if (sc.rng() < 0.3) chaos.push(pick(sc, players).state.prepareOptions());
        await Promise.all(chaos);
      },
      during: async () => {
        // While the drawer is choosing, someone refreshes and another clicks a box on a stale screen
        const chaos: Promise<unknown>[] = [];
        if (sc.rng() < 0.4) chaos.push(pick(sc, players).reload());
        if (sc.rng() < 0.3) {
          const intruder = pick(sc, players);
          chaos.push(intruder.state.makeSelection(0));
        }
        await Promise.all(chaos);
      },
    });
    await assertCoherent(sc, fam.all, log);
  });

  it.each(SEEDS)("seed %i: admin overrides & quick-draw racing with players", async (seed) => {
    sc = new Scenario({ seed: seed + 7, ...cfg });
    const fam = await everyoneJoins(sc, { profile: () => mixedProfile(sc.rng) });
    await fam.admin.state.startGame();
    await sc.settle();

    const log = await playGame(sc, fam, {
      doubleClickRate: 0.2,
      between: async (turn) => {
        // Sometimes the admin forces the result at the same moment the drawer starts their turn
        if (turn % 4 === 1) {
          const s = fam.admin.state;
          const drawerId = familyConfig.drawOrder[s.currentDrawerIndex];
          const candidate = s.availableGiftees.find(
            (g) => g !== drawerId && fam.players.get(drawerId)
          );
          const drawer = fam.players.get(drawerId);
          await Promise.all([
            candidate ? fam.admin.state.adminSetNextResult(candidate) : Promise.resolve(),
            drawer?.state.prepareOptions(),
          ]);
          await sc.settle();
        }
      },
    });

    // The admin hits "quick draw all" twice at the end in case anything is left
    await Promise.all([fam.admin.state.quickDrawAll(), fam.admin.state.quickDrawAll()]);
    await sc.settle();
    await assertCoherent(sc, fam.all, log);
  });

  it.each(SEEDS)("seed %i: reset mid-game while people are clicking", async (seed) => {
    sc = new Scenario({ seed: seed + 13, ...cfg });
    const fam = await everyoneJoins(sc, { profile: () => mixedProfile(sc.rng) });
    await fam.admin.state.startGame();
    await sc.settle();

    // Play a few turns
    let played = 0;
    await playGame(sc, fam, {
      between: async () => {
        if (++played === 6) {
          // Reset while the next drawer is clicking and others refresh
          const next = fam.players.get(familyConfig.drawOrder[fam.admin.state.currentDrawerIndex]);
          await Promise.all([
            fam.admin.state.resetGame(),
            next?.state.prepareOptions(),
            ...[...fam.players.values()].slice(0, 5).map((b) => b.reload()),
          ]);
          await sc.settle();
          throw new Error("stop");
        }
      },
    }).catch((e) => {
      if (e.message !== "stop") throw e;
    });

    const fresh = await sc.freshView();
    expect(fresh?.gameLifecycle, "reset must land on a fresh, not-started game").toBe("not_started");
    expect(fresh?.assignments).toEqual({});
    await sc.settle(200);
    for (const b of fam.all) {
      expect(b.state.gameId, `${b.name} still on old game`).toBe(fresh!.gameId);
    }

    // The new game can be played to completion
    await fam.admin.state.startGame();
    await sc.settle();
    const log = await playGame(sc, fam, { doubleClickRate: 0.2 });
    await assertCoherent(sc, fam.all, log);
  });
});

describe("edge cases", () => {
  it("everyone opens the page before anyone has created the game", async () => {
    sc = new Scenario({
      seed: 5,
      topology: { kind: "serverless", maxInstances: 8, coldStartMs: 30 },
      withRedis: true,
    });
    // 25 browsers + admin hit a completely empty deployment within ~50ms
    const fam = await everyoneJoins(sc, { profile: () => NET.lan, spreadMs: 50 });
    const ids = new Set(fam.all.map((b) => b.state.gameId));
    expect(ids.size, "multiple games were created").toBe(1);
  });

  it("a response lost after the draw committed does not cause a second draw on retry", async () => {
    sc = new Scenario({ seed: 6, topology: { kind: "single" } });
    const fam = await everyoneJoins(sc, { count: 4, profile: () => NET.wifi });
    await fam.admin.state.startGame();
    await sc.settle();
    const p0 = fam.players.get(familyConfig.drawOrder[0])!;
    await p0.state.prepareOptions();
    await sc.settle();

    // Lose every response from now on for this client, then they click again and again
    (p0.profile as { responseLossRate?: number }).responseLossRate = 1;
    const turn = p0.state.currentDrawerIndex;
    for (let i = 0; i < 3; i++) {
      await p0.fetch("/api/draw/select", {
        method: "POST",
        body: JSON.stringify({ gameId: p0.state.gameId, drawerIndex: turn, choiceIndex: i % 2 }),
      }).catch(() => undefined);
    }
    (p0.profile as { responseLossRate?: number }).responseLossRate = 0;
    await sc.settle();
    const s = await sc.freshView();
    expect(s?.currentDrawerIndex, "retries drew more than once").toBe(1);
    expect(checkStateInvariants(s)).toEqual([]);
  });

  it("a player who is offline for a whole turn and comes back sees everything", async () => {
    sc = new Scenario({ seed: 7, topology: { kind: "single" } });
    const fam = await everyoneJoins(sc, { count: 8, profile: () => NET.mobile4g });
    await fam.admin.state.startGame();
    await sc.settle();
    const ghost = fam.players.get(familyConfig.drawOrder[5])!;
    ghost.channel.goOffline(1500);
    for (let i = 0; i < 3; i++) {
      await fam.admin.state.prepareOptions();
      await sc.settle();
      await fam.admin.state.makeSelection(0);
      await sc.settle();
    }
    expect(await waitFor(() => ghost.state.currentDrawerIndex === 3, 3000)).toBe(true);
    expect(ghost.state.assignments).toEqual(fam.admin.state.assignments);
  });

  it("logout and log back in as someone else mid-game keeps the game intact", async () => {
    sc = new Scenario({ seed: 8, topology: { kind: "single" } });
    const fam = await everyoneJoins(sc, { count: 6, profile: () => NET.wifi });
    await fam.admin.state.startGame();
    await sc.settle();
    const before = await sc.freshView();
    const b = fam.players.get(familyConfig.drawOrder[2])!;
    await b.fetch("/api/session/logout", { method: "POST" });
    await b.open({ playerId: familyConfig.drawOrder[0] });
    await sc.settle();
    const after = await sc.freshView();
    expect(after?.version).toBe(before?.version);
    expect(after?.activePlayerSessions[familyConfig.drawOrder[2]]?.isOnline).toBe(false);
    // ...and now they can act as the drawer
    await b.state.prepareOptions();
    await sc.settle();
    expect((await sc.freshView())?.selectionPhase).toBe("selecting");
  });

  it("a non-drawer cannot act, even with a forged turn reference", async () => {
    sc = new Scenario({ seed: 9, topology: { kind: "single" } });
    const fam = await everyoneJoins(sc, { count: 4, profile: () => NET.lan });
    await fam.admin.state.startGame();
    await sc.settle();
    const notMe = fam.players.get(familyConfig.drawOrder[2])!;
    const res = await notMe.fetch("/api/draw/options", {
      method: "POST",
      body: JSON.stringify({ gameId: notMe.state.gameId, drawerIndex: 0 }),
    });
    expect(res.status).toBe(403);
    const res2 = await notMe.fetch("/api/draw", { method: "POST", body: "{}" });
    expect(res2.status).toBe(403);
    expect((await sc.freshView())?.version).toBe(notMe.state.version);
  });

  it("a stuck turn is never left locked if the drawer vanishes (admin can still finish it)", async () => {
    sc = new Scenario({ seed: 10, topology: { kind: "single" } });
    const fam = await everyoneJoins(sc, { count: 4, profile: () => NET.wifi });
    await fam.admin.state.startGame();
    await sc.settle();
    const p0 = fam.players.get(familyConfig.drawOrder[0])!;
    await p0.state.prepareOptions();
    await sc.settle();
    p0.channel.close(); // phone died while the boxes were open
    await sleep(50);
    // Admin picks a box on their behalf
    await fam.admin.state.makeSelection(0);
    await sc.settle();
    expect((await sc.freshView())?.currentDrawerIndex).toBe(1);
  });
});
