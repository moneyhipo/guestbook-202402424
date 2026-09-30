"use client";

import { useOptimistic, useSyncExternalStore, useTransition } from "react";
import { setLike } from "@/app/actions";

// 어떤 글에 좋아요를 눌렀는지는 브라우저만 기억한다 (docs/adr/0002)
const STORAGE_KEY = "guestbook:liked";
const CHANGE_EVENT = "guestbook:liked-change";

function readLikedIds(): number[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "number") : [];
  } catch {
    return [];
  }
}

function writeLiked(id: number, liked: boolean) {
  try {
    const ids = new Set(readLikedIds());
    if (liked) ids.add(id);
    else ids.delete(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // 저장소를 쓸 수 없는 환경(시크릿 창 제한 등)에서는 기억하지 않음
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export default function LikeButton({ entryId, likeCount }: { entryId: number; likeCount: number }) {
  const storedLiked = useSyncExternalStore(
    subscribe,
    () => readLikedIds().includes(entryId),
    () => false,
  );
  // 요청 중에만 예상 값을 보여주고, 끝나면 서버가 준 좋아요 수와 브라우저 기록으로 돌아간다
  const [optimistic, setOptimistic] = useOptimistic({ liked: storedLiked, likeCount });
  const [pending, startTransition] = useTransition();

  function onClick() {
    const next = !optimistic.liked;
    startTransition(async () => {
      setOptimistic({ liked: next, likeCount: Math.max(optimistic.likeCount + (next ? 1 : -1), 0) });
      const res = await setLike(entryId, next);
      if (res.ok) writeLiked(entryId, next);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={optimistic.liked}
      className={`mr-auto rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 ${
        optimistic.liked ? "border-pink-300 bg-pink-50 text-pink-600" : "border-gray-300 bg-white hover:bg-gray-100"
      }`}
    >
      {optimistic.liked ? "♥" : "♡"} 좋아요 {optimistic.likeCount}
    </button>
  );
}
