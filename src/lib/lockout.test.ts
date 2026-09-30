import { describe, expect, test } from "vitest";
import { UNLOCKED, checkAttempt, recordFailure, type LockState } from "@/lib/lockout";

const t0 = new Date("2026-09-30T06:00:00Z");
const after = (ms: number) => new Date(t0.getTime() + ms);

function failTimes(n: number, now = t0): LockState {
  let state = UNLOCKED;
  for (let i = 0; i < n; i++) state = recordFailure(state, now).state;
  return state;
}

describe("비밀번호 연속 실패 잠금 정책", () => {
  test("실패 기록이 없으면 시도할 수 있다", () => {
    expect(checkAttempt(UNLOCKED, t0)).toEqual({ allowed: true });
  });

  test("틀릴 때마다 남은 시도 횟수가 줄어든다", () => {
    expect(recordFailure(UNLOCKED, t0)).toMatchObject({ locked: false, remainingAttempts: 4 });
    expect(recordFailure(failTimes(3), t0)).toMatchObject({ locked: false, remainingAttempts: 1 });
  });

  test("4번 틀려도 아직 잠기지 않는다", () => {
    expect(checkAttempt(failTimes(4), t0)).toEqual({ allowed: true });
  });

  test("5번째 실패에서 잠긴다", () => {
    expect(recordFailure(failTimes(4), t0).locked).toBe(true);
  });

  test("잠긴 동안에는 시도가 거부되고 남은 시간을 알려준다", () => {
    const locked = failTimes(5);
    expect(checkAttempt(locked, after(2000))).toEqual({ allowed: false, retryAfterMs: 3000 });
  });

  test("잠금은 5초 뒤에 풀린다", () => {
    const locked = failTimes(5);
    expect(checkAttempt(locked, after(4999)).allowed).toBe(false);
    expect(checkAttempt(locked, after(5000))).toEqual({ allowed: true });
  });

  test("잠금이 풀리면 다시 5번의 기회가 생긴다", () => {
    const unlockedAgain = failTimes(5);
    expect(recordFailure(unlockedAgain, after(5000))).toMatchObject({ locked: false, remainingAttempts: 4 });
  });

  test("성공하면 연속 실패가 초기화된다", () => {
    // 성공 시 상태는 UNLOCKED로 되돌린다: 이후 첫 실패는 다시 남은 시도 4회
    expect(checkAttempt(UNLOCKED, t0)).toEqual({ allowed: true });
    expect(recordFailure(UNLOCKED, t0).remainingAttempts).toBe(4);
  });
});
