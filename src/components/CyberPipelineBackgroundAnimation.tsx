"use client";

import React, { useEffect, useRef } from "react";

export default function CyberPipelineBackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Cryptographic hash snippets that drift gently
    const hashTokens = [
      "SHA-256: 0x8f2a...c91e",
      "keccak256: 0xd4e5...b721",
      "BASE-L2::BLOCK#14890",
      "FRE 902(13): VALID",
      "DGCL §224::AUDITED",
      "ZERO-KNOWLEDGE: 100%",
      "EVM::GAS_SPONSORED",
      "DGCL: COMPLIANT",
    ];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      text?: string;
    }

    const particles: Particle[] = [];
    const particleCount = 28;
    const colors = ["#06b6d4", "#a855f7", "#10b981", "#38bdf8"];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.2,
        text: i % 4 === 0 ? hashTokens[(i / 4) % hashTokens.length] : undefined,
      });
    }

    // Bus lines (horizontal cryptographic data channels)
    const busLineYs = [height * 0.2, height * 0.45, height * 0.7, height * 0.88];
    const dataPackets = busLineYs.map((y, idx) => ({
      y,
      x: (width / busLineYs.length) * idx,
      speed: 1.2 + Math.random() * 0.8,
      color: colors[idx % colors.length],
      length: 50 + Math.random() * 40,
    }));

    let step = 0;

    const render = () => {
      step++;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw glowing data bus lines
      busLineYs.forEach((y, idx) => {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
        ctx.lineWidth = 1;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // Draw data packet moving along line
        const packet = dataPackets[idx];
        packet.x += packet.speed;
        if (packet.x > width + 100) packet.x = -100;

        const grad = ctx.createLinearGradient(packet.x - packet.length, packet.y, packet.x, packet.y);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.8, packet.color);
        grad.addColorStop(1, "#ffffff");

        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = packet.color;
        ctx.shadowBlur = 8;
        ctx.moveTo(packet.x - packet.length, packet.y);
        ctx.lineTo(packet.x, packet.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // 2. Draw connected lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.12 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // 3. Draw particles & drifting cryptographic labels
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Glowing particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;

        // Micro hash token label
        if (p.text) {
          ctx.font = "9px monospace";
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * 0.75;
          ctx.fillText(p.text, p.x + 8, p.y + 3);
          ctx.globalAlpha = 1.0;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-45 mix-blend-screen"
    />
  );
}
