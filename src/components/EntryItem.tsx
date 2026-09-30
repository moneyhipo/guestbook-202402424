"use client";

import { useState, useTransition } from "react";
import { deleteEntry, updateEntry } from "@/app/actions";
import LikeButton from "@/components/LikeButton";
import type { Entry } from "@/lib/db";

type Mode = "view" | "edit" | "delete";

function formatDate(v: string) {
  return new Date(v).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

export default function EntryItem({ entry }: { entry: Entry }) {
  const [mode, setMode] = useState<Mode>("view");
  const [message, setMessage] = useState(entry.message);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function reset(next: Mode) {
    setMode(next);
    setPassword("");
    setError("");
    setMessage(entry.message);
  }

  function submit() {
    setError("");
    startTransition(async () => {
      const res = mode === "edit" ? await updateEntry(entry.id, message, password) : await deleteEntry(entry.id, password);
      if (res.ok) reset("view");
      else setError(res.error ?? "요청이 거부되었습니다.");
    });
  }

  return (
    <li className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">{entry.name}</span>
        <span className="text-xs text-gray-500">
          {formatDate(entry.created_at)}
          {entry.updated_at && " (수정됨)"}
        </span>
      </div>

      {mode === "edit" ? (
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={3} className="input mt-2 w-full" />
      ) : (
        <p className="mt-2 whitespace-pre-wrap break-words text-gray-800">{entry.message}</p>
      )}

      {mode === "view" ? (
        <div className="mt-3 flex justify-end gap-2">
          <LikeButton entryId={entry.id} likes={entry.likes} />
          <button onClick={() => reset("edit")} className="btn-secondary">수정</button>
          <button onClick={() => reset("delete")} className="btn-danger">삭제</button>
        </div>
      ) : (
        <form
          className="mt-3 flex flex-wrap items-center justify-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {mode === "delete" && <span className="mr-auto text-sm text-gray-600">삭제하려면 비밀번호를 입력하세요.</span>}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required autoFocus className="input w-40" />
          <button type="submit" disabled={pending} className={mode === "edit" ? "btn-primary" : "btn-danger"}>
            {pending ? "처리 중..." : mode === "edit" ? "저장" : "삭제 확인"}
          </button>
          <button type="button" onClick={() => reset("view")} className="btn-secondary">취소</button>
        </form>
      )}

      {error && <p className="mt-2 text-right text-sm text-red-600" role="alert">{error}</p>}
    </li>
  );
}
