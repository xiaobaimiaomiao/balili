"use client";

import { useEffect, useRef } from "react";

type Petal = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  rotSpeed: number;
  opacity: number;
  life: number;
  color: string;
  shape: number;
};

const COLORS = ["#ffb7c5", "#ffc8dd", "#ffd6e0", "#ffafcc", "#f8ad9d", "#f4978e", "#f08080"];

export default function SakuraCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const petalsRef = useRef<Petal[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, lastX: 0, lastY: 0, lastSpawn: 0 });
  const ripplesRef = useRef<Array<{ x: number; y: number; r: number; max: number; alpha: number }>>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawnPetal = (x: number, y: number, burst = false) => {
      const count = burst ? 14 : 1;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = burst ? 1.5 + Math.random() * 2.5 : 0.3 + Math.random() * 0.8;
        petalsRef.current.push({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (burst ? 2 : 0.5),
          size: 6 + Math.random() * 10,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.1,
          opacity: 0.7 + Math.random() * 0.3,
          life: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          shape: Math.random(),
        });
      }
      if (petalsRef.current.length > 300) {
        petalsRef.current.splice(0, petalsRef.current.length - 300);
      }
    };

    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.opacity * p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      if (p.shape > 0.5) {
        const s = p.size / 2;
        ctx.moveTo(0, -s);
        ctx.bezierCurveTo(s, -s, s, s, 0, s);
        ctx.bezierCurveTo(-s, s, -s, -s, 0, -s);
      } else {
        const s = p.size / 2;
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(s * 0.8, 0, 0, s);
        ctx.quadraticCurveTo(-s * 0.8, 0, 0, -s);
      }
      ctx.fill();
      ctx.restore();
    };

    const onMove = (e: MouseEvent) => {
      mouseRef.current.lastX = mouseRef.current.x;
      mouseRef.current.lastY = mouseRef.current.y;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      const now = performance.now();
      if (now - mouseRef.current.lastSpawn > 16) {
        spawnPetal(e.clientX, e.clientY, false);
        mouseRef.current.lastSpawn = now;
      }
    };

    const onClick = (e: MouseEvent) => {
      spawnPetal(e.clientX, e.clientY, true);
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        r: 0,
        max: 60 + Math.random() * 30,
        alpha: 0.6,
      });
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      mouseRef.current.x = t.clientX;
      mouseRef.current.y = t.clientY;
      spawnPetal(t.clientX, t.clientY, false);
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      spawnPetal(t.clientX, t.clientY, true);
      ripplesRef.current.push({
        x: t.clientX,
        y: t.clientY,
        r: 0,
        max: 70,
        alpha: 0.6,
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("click", onClick);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gravity = 0.04;
      const drag = 0.985;
      petalsRef.current = petalsRef.current.filter((p) => p.life > 0);
      for (const p of petalsRef.current) {
        p.vy += gravity;
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        p.life -= 0.0035;
        drawPetal(p);
      }
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.r += 1.5;
        r.alpha -= 0.012;
        if (r.alpha <= 0) {
          ripplesRef.current.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = r.alpha;
        ctx.strokeStyle = "#ff8fab";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ width: "100vw", height: "100vh" }}
      aria-hidden
    />
  );
}
