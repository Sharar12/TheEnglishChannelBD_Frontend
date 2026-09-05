"use client";

import React, { useEffect, useRef } from "react";

type Bounds = {
  width: number;
  height: number;
};

class SoftOrb {
  baseX: number;
  baseY: number;
  radius: number;
  driftX: number;
  driftY: number;
  phase: number;
  speed: number;
  opacity: number;

  constructor(baseX: number, baseY: number, radius: number, opacity: number, driftX: number, driftY: number, speed: number) {
    this.baseX = baseX;
    this.baseY = baseY;
    this.radius = radius;
    this.opacity = opacity;
    this.driftX = driftX;
    this.driftY = driftY;
    this.phase = Math.random() * Math.PI * 2;
    this.speed = speed;
  }

  draw(ctx: CanvasRenderingContext2D, time: number) {
    const x = this.baseX + Math.sin(time * this.speed + this.phase) * this.driftX;
    const y = this.baseY + Math.cos(time * this.speed * 0.85 + this.phase) * this.driftY;

    const glow = ctx.createRadialGradient(x, y, 0, x, y, this.radius);
    glow.addColorStop(0, `rgba(255, 255, 255, ${this.opacity * 0.95})`);
    glow.addColorStop(0.22, `rgba(255, 237, 213, ${this.opacity * 0.75})`);
    glow.addColorStop(0.5, `rgba(249, 115, 22, ${this.opacity * 0.35})`);
    glow.addColorStop(1, "rgba(249, 115, 22, 0)");

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

class AmbientDust {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
  alphaBase: number;
  pulseSpeed: number;
  phase: number;

  constructor(bounds: Bounds) {
    this.phase = Math.random() * Math.PI * 2;
    this.pulseSpeed = 0.4 + Math.random() * 0.6;
    this.alphaBase = 0.06 + Math.random() * 0.12;

    this.spawn(bounds);
  }

  spawn(bounds: Bounds) {
    this.x = Math.random() * bounds.width;
    this.y = Math.random() * bounds.height;
    this.size = (0.8 + Math.random() * 2.2) * 0.5;
    this.vx = (Math.random() - 0.5) * 0.0225;
    this.vy = (Math.random() - 0.5) * 0.015;
    this.alpha = this.alphaBase;
  }

  update(bounds: Bounds, time: number) {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -40) this.x = bounds.width + 40;
    if (this.x > bounds.width + 40) this.x = -40;
    if (this.y < -40) this.y = bounds.height + 40;
    if (this.y > bounds.height + 40) this.y = -40;

    this.alpha = this.alphaBase + Math.sin(time * this.pulseSpeed + this.phase) * 0.05;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
    g.addColorStop(0, `rgba(255,255,255,${this.alpha})`);
    g.addColorStop(0.45, `rgba(255, 237, 213, ${this.alpha * 0.8})`);
    g.addColorStop(1, "rgba(249,115,22,0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

class WaveDot {
  x: number;
  y: number;
  baseY: number;
  size: number;
  speed: number;
  amplitude: number;
  frequency: number;
  phase: number;
  opacity: number;
  lane: number;

  constructor(index: number, total: number, lane: number, bounds: Bounds) {
    const laneY = [0.34, 0.5, 0.66][lane] ?? 0.5;
    const speed = [0.42, 0.28, 0.18][lane] ?? 0.25;
    const amp = [110, 76, 48][lane] ?? 70;
    const freq = [0.0044, 0.0052, 0.0062][lane] ?? 0.005;

    this.lane = lane;
    this.x = (index / total) * bounds.width + Math.random() * 70;
    this.baseY = bounds.height * laneY + (Math.random() - 0.5) * 24;
    this.size = ([1.45, 1.15, 0.95][lane] + Math.random() * 1.15) * 0.5;
    this.speed = (speed + Math.random() * 0.2) * 0.125;
    this.amplitude = amp + Math.random() * 14;
    this.frequency = freq + Math.random() * 0.001;
    this.phase = Math.random() * Math.PI * 2;
    this.opacity = [0.72, 0.46, 0.28][lane] * (0.65 + Math.random() * 0.45);
    this.y = this.baseY;
  }

  update(bounds: Bounds, time: number) {
    this.x += this.speed;
    if (this.x > bounds.width + 60) this.x = -60;

    const waveA = Math.sin(this.x * this.frequency + time * 1.15 + this.phase) * this.amplitude;
    const waveB = Math.cos(this.x * this.frequency * 1.7 + time * 1.85 + this.phase * 0.7) * (this.amplitude * 0.18);
    const waveC = Math.sin(time * 0.55 + this.phase) * 6;

    this.y = this.baseY + waveA + waveB + waveC;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const halo = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 16);
    halo.addColorStop(0, `rgba(255,255,255,${this.opacity * 0.95})`);
    halo.addColorStop(0.18, `rgba(255, 237, 213, ${this.opacity * 0.8})`);
    halo.addColorStop(0.42, `rgba(249, 115, 22, ${this.opacity * 0.55})`);
    halo.addColorStop(1, "rgba(249,115,22,0)");

    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 3.5, 0, Math.PI * 2);
    ctx.fill();

    const core = ctx.createRadialGradient(
      this.x - this.size * 0.15,
      this.y - this.size * 0.15,
      0,
      this.x,
      this.y,
      this.size * 3.2
    );
    core.addColorStop(0, "rgba(255,255,255,0.98)");
    core.addColorStop(0.28, "rgba(255,249,242,0.96)");
    core.addColorStop(0.55, "rgba(255, 214, 174, 0.92)");
    core.addColorStop(1, "rgba(249,115,22,0)");

    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.75, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let waves: WaveDot[] = [];
    let dust: AmbientDust[] = [];
    let orbs: SoftOrb[] = [];
    let reducedMotion = false;

    const createScene = () => {
      const laneConfig = [150, 120, 92];
      waves = [];

      laneConfig.forEach((count, lane) => {
        for (let i = 0; i < count; i++) {
          waves.push(new WaveDot(i, count, lane, { width, height }));
        }
      });

      dust = Array.from({ length: 160 }, () => new AmbientDust({ width, height }));

      orbs = [
        new SoftOrb(width * 0.5, height * 0.18, Math.max(width, height) * 0.09, 0.22, 18, 12, 0.02),
        new SoftOrb(width * 0.18, height * 0.82, Math.max(width, height) * 0.07, 0.18, 14, 8, 0.0125),
        new SoftOrb(width * 0.84, height * 0.42, Math.max(width, height) * 0.06, 0.16, 10, 16, 0.015),
      ];
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      createScene();
    };

    const drawBackdrop = () => {
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#fff7ed");
      bg.addColorStop(0.18, "#ffffff");
      bg.addColorStop(0.52, "#fffaf6");
      bg.addColorStop(1, "#ffffff");

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const topGlow = ctx.createRadialGradient(width * 0.5, height * 0.1, 0, width * 0.5, height * 0.1, width * 0.65);
      topGlow.addColorStop(0, "rgba(255,255,255,0.9)");
      topGlow.addColorStop(0.35, "rgba(255,237,213,0.36)");
      topGlow.addColorStop(0.7, "rgba(249,115,22,0.12)");
      topGlow.addColorStop(1, "rgba(249,115,22,0)");

      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, width, height);

      const lowerGlow = ctx.createRadialGradient(width * 0.5, height * 1.02, 0, width * 0.5, height * 1.02, width * 0.7);
      lowerGlow.addColorStop(0, "rgba(249,115,22,0.12)");
      lowerGlow.addColorStop(0.45, "rgba(255,237,213,0.08)");
      lowerGlow.addColorStop(1, "rgba(255,255,255,0)");

      ctx.fillStyle = lowerGlow;
      ctx.fillRect(0, 0, width, height);
    };

    const drawEdgeVignette = () => {
      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.42,
        Math.min(width, height) * 0.2,
        width * 0.5,
        height * 0.42,
        Math.max(width, height) * 0.88
      );
      vignette.addColorStop(0, "rgba(255,255,255,0)");
      vignette.addColorStop(0.72, "rgba(255,247,237,0.06)");
      vignette.addColorStop(1, "rgba(249,115,22,0.08)");

      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
    };

    const render = (timeMs: number) => {
      const time = timeMs * 0.001;

      drawBackdrop();

      ctx.globalCompositeOperation = "lighter";

      orbs.forEach((orb) => orb.draw(ctx, time));

      dust.forEach((particle) => {
        particle.update({ width, height }, time);
        particle.draw(ctx);
      });

      waves.forEach((dot) => {
        dot.update({ width, height }, time);
        dot.draw(ctx);
      });

      drawEdgeVignette();

      if (!reducedMotion) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    resize();

    if (!reducedMotion) {
      frameId = window.requestAnimationFrame(render);
    } else {
      render(0);
    }

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 -z-10 h-full w-full pointer-events-none"
      style={{
        background: "#ffffff",
      }}
    />
  );
}