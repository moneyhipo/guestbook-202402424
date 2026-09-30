"use client";

import { useEffect, useRef } from "react";

// 개발자 이름을 누르면 열리는 숨은 공룡 점프 게임 (캔버스로 직접 그림)
const W = 600;
const H = 150;
const GROUND = 130;
const GRAVITY = 0.6;
const JUMP = -10.5;

type Cactus = { x: number; w: number; h: number };

export default function DinoGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let dinoY = GROUND;
    let vy = 0;
    let cacti: Cactus[] = [];
    let speed = 5;
    let score = 0;
    let best = 0;
    let nextSpawn = 60;
    let over = false;
    let frame = 0;
    let raf = 0;

    const reset = () => {
      dinoY = GROUND;
      vy = 0;
      cacti = [];
      speed = 5;
      score = 0;
      nextSpawn = 60;
      over = false;
    };

    const jump = () => {
      if (over) return reset();
      if (dinoY >= GROUND) vy = JUMP;
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      } else if (e.code === "Escape") {
        onClose();
      }
    };

    const drawDino = (y: number) => {
      ctx.fillStyle = "#535353";
      ctx.fillRect(40, y - 40, 20, 26); // 몸
      ctx.fillRect(50, y - 50, 22, 14); // 머리
      ctx.fillStyle = "#fff";
      ctx.fillRect(64, y - 47, 3, 3); // 눈
      ctx.fillStyle = "#535353";
      ctx.fillRect(34, y - 34, 6, 6); // 꼬리
      const step = over || y < GROUND ? 0 : Math.floor(frame / 6) % 2;
      ctx.fillRect(44, y - 14, 5, step ? 14 : 8); // 다리
      ctx.fillRect(53, y - 14, 5, step ? 8 : 14);
    };

    const loop = () => {
      frame++;
      if (!over) {
        vy += GRAVITY;
        dinoY = Math.min(dinoY + vy, GROUND);
        if (--nextSpawn <= 0) {
          cacti.push({ x: W, w: 10 + Math.random() * 14, h: 22 + Math.random() * 20 });
          nextSpawn = 50 + Math.random() * 60;
        }
        cacti.forEach((c) => (c.x -= speed));
        cacti = cacti.filter((c) => c.x + c.w > 0);
        score += 0.15;
        speed = 5 + score / 100;
        // 충돌 판정 (공룡 몸통 박스)
        over = cacti.some((c) => c.x < 68 && c.x + c.w > 38 && dinoY > GROUND - c.h + 4);
        if (over) best = Math.max(best, Math.floor(score));
      }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#535353";
      ctx.fillRect(0, GROUND, W, 1);
      cacti.forEach((c) => ctx.fillRect(c.x, GROUND - c.h, c.w, c.h));
      drawDino(dinoY);
      ctx.font = "14px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`HI ${String(best).padStart(5, "0")}  ${String(Math.floor(score)).padStart(5, "0")}`, W - 10, 20);
      if (over) {
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER - 스페이스 / 탭으로 다시 시작", W / 2, 70);
      }
      raf = requestAnimationFrame(loop);
    };

    canvas.addEventListener("pointerdown", jump);
    window.addEventListener("keydown", onKey);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", jump);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
        <span>🦖 숨은 게임 발견! 스페이스·↑·탭으로 점프</span>
        <button type="button" onClick={onClose} className="btn-secondary">닫기</button>
      </div>
      <canvas ref={canvasRef} width={W} height={H} className="w-full touch-none select-none" />
    </div>
  );
}
