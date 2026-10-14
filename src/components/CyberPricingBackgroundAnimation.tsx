"use client";

import React, { useEffect, useRef } from "react";

interface Props {
  intensity?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  shape: "circle" | "diamond" | "token";
  pulse: number;
  pulseSpeed: number;
}

export default function CyberPricingBackgroundAnimation({ intensity = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 800);

    // Responsive particle count: fewer on mobile to conserve battery and CPU
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 18 : 36;

    const colors = [
      "rgba(34, 211, 238, 0.7)",   // Cyan
      "rgba(168, 85, 247, 0.7)",  // Purple
      "rgba(96, 165, 250, 0.7)",  // Blue
      "rgba(251, 191, 36, 0.7)",  // Gold token glow
    ];

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6 * intensity,
        vy: (Math.random() - 0.5) * 0.6 * intensity,
        radius: Math.random() * 2.5 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: i % 3 === 0 ? "diamond" : i % 3 === 1 ? "token" : "circle",
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02,
      });
    }

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle background ambient shimmer grid
      ctx.strokeStyle = "rgba(56, 189, 248, 0.025)";
      ctx.lineWidth = 1;
      const gridSize = isMobile ? 80 : 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Update & Draw Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Gentle mouse interaction (slight repulsion)
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          p.x -= (dx / dist) * 1.5;
          p.y -= (dy / dist) * 1.5;
        }

        const currentRadius = p.radius + Math.sin(p.pulse) * 0.8;

        // Draw particle based on shape
        ctx.save();
        ctx.translate(p.x, p.y);

        if (p.shape === "diamond") {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(0, -currentRadius * 1.5);
          ctx.lineTo(currentRadius * 1.5, 0);
          ctx.lineTo(0, currentRadius * 1.5);
          ctx.lineTo(-currentRadius * 1.5, 0);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === "token") {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, currentRadius * 1.4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = p.color;
          ctx.fillRect(-0.8, -currentRadius * 0.8, 1.6, currentRadius * 1.6);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(0.5, currentRadius), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Connect nearby particles with luminous cyber lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const lineDx = p.x - p2.x;
          const lineDy = p.y - p2.y;
          const lineDist = Math.sqrt(lineDx * lineDx + lineDy * lineDy);
          const maxConnectDist = isMobile ? 85 : 120;

          if (lineDist < maxConnectDist) {
            const alpha = (1 - lineDist / maxConnectDist) * 0.18;
            ctx.strokeStyle = `rgba(147, 197, 253, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 w-full h-full"
      style={{ opacity: 0.9 }}
    />
  );
}
