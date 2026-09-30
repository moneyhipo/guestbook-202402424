// 비밀번호 연속 실패 잠금 정책 (DB와 무관한 순수 로직, docs/adr/0001)
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MS = 5_000;

export type LockState = { failedAttempts: number; lockedUntil: Date | null };

export const UNLOCKED: LockState = { failedAttempts: 0, lockedUntil: null };

export type AttemptCheck = { allowed: true } | { allowed: false; retryAfterMs: number };

export function checkAttempt(state: LockState, now: Date): AttemptCheck {
  const remaining = state.lockedUntil ? state.lockedUntil.getTime() - now.getTime() : 0;
  return remaining > 0 ? { allowed: false, retryAfterMs: remaining } : { allowed: true };
}

export type FailureResult = { state: LockState; locked: boolean; remainingAttempts: number };

// 잠금이 걸리면 실패 횟수는 0부터 다시 센다
export function recordFailure(state: LockState, now: Date): FailureResult {
  const failedAttempts = state.failedAttempts + 1;
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    return {
      state: { failedAttempts: 0, lockedUntil: new Date(now.getTime() + LOCK_MS) },
      locked: true,
      remainingAttempts: 0,
    };
  }
  return {
    state: { failedAttempts, lockedUntil: state.lockedUntil },
    locked: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - failedAttempts,
  };
}

// 비밀번호가 맞으면 연속 실패와 잠금을 모두 지운다
export function recordSuccess(): LockState {
  return UNLOCKED;
}
