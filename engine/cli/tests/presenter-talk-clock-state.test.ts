import assert from "node:assert/strict";
import { test } from "node:test";
import { adjustClock, elapsedMs, formatClock, formatPace, INITIAL_CLOCK, pauseClock, paceAgainstTargets, readClock, startClock, writeClock } from "../../preview-app/src/presenter/talk-clock-state.ts";

const memory = () => { const data = new Map<string, string>(); return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) }; };

test("start, pause and resume accumulate elapsed time", () => {
  const running = startClock(INITIAL_CLOCK, 1000);
  assert.equal(elapsedMs(running, 4000), 3000);
  const paused = pauseClock(running, 4000);
  assert.equal(elapsedMs(paused, 99000), 3000);
  assert.equal(elapsedMs(startClock(paused, 10000), 12000), 5000);
});

test("adjust clamps at zero and keeps running state", () => {
  const running = startClock(INITIAL_CLOCK, 0);
  assert.equal(elapsedMs(adjustClock(running, 5 * 60000, 1000), 1000), 301000);
  assert.equal(elapsedMs(adjustClock(running, -60000, 1000), 1000), 0);
  assert.equal(adjustClock(INITIAL_CLOCK, 60000, 0).running, false);
});

test("a rehydrated running clock keeps counting and adjust survives the round trip", () => {
  const storage = memory();
  writeClock(storage, "d", adjustClock(startClock(INITIAL_CLOCK, 1000), 5 * 60000, 2000));
  const restored = readClock(storage, "d");
  assert.equal(elapsedMs(restored, 12000), 5 * 60000 + 11000);
  assert.deepEqual(readClock(memory(), "d"), INITIAL_CLOCK);
  storage.setItem("aideck.present.clock--bad", "{nope");
  assert.deepEqual(readClock(storage, "bad"), INITIAL_CLOCK);
});

test("pace compares elapsed against targets of earlier slides and flags untimed ones", () => {
  const pace = paceAgainstTargets([60, undefined, 120, 30], 3, 200000);
  assert.deepEqual(pace, { deltaSeconds: 20, untimed: 1 });
  assert.equal(formatPace(20), "0:20 behind");
  assert.equal(formatPace(-75), "1:15 ahead");
  assert.equal(formatPace(0), "on pace");
  assert.equal(formatClock(725000), "12:05");
});
