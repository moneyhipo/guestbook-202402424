"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { ensureSchema, getSql } from "@/lib/db";
import { LOCK_MS, MAX_FAILED_ATTEMPTS, checkAttempt, recordFailure, recordSuccess, type LockState } from "@/lib/lockout";

export type ActionResult = { ok: boolean; error?: string };

function str(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}

// 잠금 확인 → 비밀번호 비교 → 실패 시 잠금 상태 저장 (docs/adr/0001)
async function checkPassword(id: number, password: string): Promise<ActionResult> {
  const sql = getSql();
  const rows = (await sql`
    select password_hash, failed_attempts, locked_until from guestbook_entries where id = ${id}
  `) as { password_hash: string; failed_attempts: number; locked_until: string | null }[];
  if (rows.length === 0) return { ok: false, error: "존재하지 않는 글입니다." };

  const row = rows[0];
  const state: LockState = {
    failedAttempts: row.failed_attempts,
    lockedUntil: row.locked_until ? new Date(row.locked_until) : null,
  };
  const now = new Date();
  const attempt = checkAttempt(state, now);
  if (!attempt.allowed) {
    return { ok: false, error: `잠시 후 다시 시도하세요. (${Math.ceil(attempt.retryAfterMs / 1000)}초 남음)` };
  }

  if (await bcrypt.compare(password, row.password_hash)) return { ok: true };

  const failure = recordFailure(state, now);
  await sql`
    update guestbook_entries
    set failed_attempts = ${failure.state.failedAttempts}, locked_until = ${failure.state.lockedUntil}
    where id = ${id}
  `;
  if (failure.locked) {
    return { ok: false, error: `비밀번호를 ${MAX_FAILED_ATTEMPTS}회 틀려 ${LOCK_MS / 1000}초간 잠겼습니다.` };
  }
  return { ok: false, error: `비밀번호가 일치하지 않습니다. (남은 시도 ${failure.remainingAttempts}회)` };
}

export async function createEntry(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const name = str(formData.get("name"));
  const message = str(formData.get("message"));
  const password = str(formData.get("password"));

  if (!name || !message || !password) return { ok: false, error: "이름, 메시지, 비밀번호를 모두 입력하세요." };
  if (name.length > 50) return { ok: false, error: "이름은 50자 이하로 입력하세요." };
  if (message.length > 1000) return { ok: false, error: "메시지는 1000자 이하로 입력하세요." };
  if (password.length < 4) return { ok: false, error: "비밀번호는 4자 이상이어야 합니다." };

  await ensureSchema();
  const hash = await bcrypt.hash(password, 10);
  const sql = getSql();
  await sql`insert into guestbook_entries (name, message, password_hash) values (${name}, ${message}, ${hash})`;
  revalidatePath("/");
  return { ok: true };
}

export async function updateEntry(id: number, message: string, password: string): Promise<ActionResult> {
  message = message.trim();
  if (!message) return { ok: false, error: "메시지를 입력하세요." };
  if (message.length > 1000) return { ok: false, error: "메시지는 1000자 이하로 입력하세요." };
  if (!password) return { ok: false, error: "비밀번호를 입력하세요." };

  await ensureSchema();
  const check = await checkPassword(id, password);
  if (!check.ok) return check;

  const sql = getSql();
  const reset = recordSuccess();
  await sql`
    update guestbook_entries
    set message = ${message}, updated_at = now(),
        failed_attempts = ${reset.failedAttempts}, locked_until = ${reset.lockedUntil}
    where id = ${id}
  `;
  revalidatePath("/");
  return { ok: true };
}

export async function deleteEntry(id: number, password: string): Promise<ActionResult> {
  if (!password) return { ok: false, error: "비밀번호를 입력하세요." };

  await ensureSchema();
  const check = await checkPassword(id, password);
  if (!check.ok) return check;

  const sql = getSql();
  await sql`delete from guestbook_entries where id = ${id}`;
  revalidatePath("/");
  return { ok: true };
}

export type LikeResult = { ok: true; likes: number } | { ok: false; error: string };

// 좋아요 중복 방지는 브라우저가 담당 (docs/adr/0002)
export async function setLike(id: number, like: boolean): Promise<LikeResult> {
  await ensureSchema();
  const sql = getSql();
  const rows = (like
    ? await sql`update guestbook_entries set likes = likes + 1 where id = ${id} returning likes`
    : await sql`update guestbook_entries set likes = greatest(likes - 1, 0) where id = ${id} returning likes`) as {
    likes: number;
  }[];
  if (rows.length === 0) return { ok: false, error: "존재하지 않는 글입니다." };
  revalidatePath("/");
  return { ok: true, likes: rows[0].likes };
}
