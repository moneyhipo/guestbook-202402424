"use client";

import { useEffect, useState, useTransition } from "react";
import { toggleLike } from "@/app/actions";

const STORAGE_KEY = "guestbook:liked";

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
}

export default function LikeButton({ entryId, likes }: { entryId: number; likes: number }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(likes);
  const [pending, startTransition] = useTransition();

  // 서버 렌더링과 어긋나지 않도록 마운트 후에 브라우저 기록을 읽음
  useEffect(() => {
    setLiked(readLikedIds().includes(entryId));
  }, [entryId]);

  useEffect(() => {
    setCount(likes);
  }, [likes]);

  function onClick() {
    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(c + (next ? 1 : -1), 0));
    startTransition(async () => {
      const res = await toggleLike(entryId, next);
      if (res.ok) {
        writeLiked(entryId, next);
        setCount(res.likes);
      } else {
        setLiked(!next);
        setCount(likes);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={liked}
      className={`mr-auto rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 ${
        liked ? "border-pink-300 bg-pink-50 text-pink-600" : "border-gray-300 bg-white hover:bg-gray-100"
      }`}
    >
      {liked ? "♥" : "♡"} 좋아요 {count}
    </button>
  );
}
