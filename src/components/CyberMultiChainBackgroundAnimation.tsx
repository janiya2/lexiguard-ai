"use client";

import React, { useEffect, useRef } from "react";

interface Props {
  className?: string;
  intensity?: number;
  showOrbits?: boolean;
}

interface HubNode {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  name: string;
  color: string;
  glow: string;
  radius: number;
  pulsePhase: number;
  symbol: string;
}

interface Packet {
  fromIndex: number;
  toIndex: number;
  progress: number;
  speed: number;
  color: string;
  size: number;
}

export default function CyberMultiChainBackgroundAnimation({
  className = "",
  intensity = 1,
  showOrbits = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 800);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || 800;
      initHubs();
    };

    window.addEventListener("resize", handleResize);

    // Chain Hub definitions
    const chainDefs = [
      { name: "BASE", color: "#0052FF", glow: "rgba(0, 82, 255, 0.4)", symbol: "🔵" },
      { name: "ETHEREUM", color: "#627EEA", glow: "rgba(98, 126, 234, 0.4)", symbol: "⬡" },
      { name: "ARBITRUM", color: "#28A0F0", glow: "rgba(40, 160, 240, 0.4)", symbol: "◈" },
      { name: "POLYGON", color: "#8247E5", glow: "rgba(130, 71, 229, 0.4)", symbol: "⬢" },
      { name: "SOLANA", color: "#14F195", glow: "rgba(20, 241, 149, 0.4)", symbol: "◎" },
    ];

    let hubs: HubNode[] = [];
    let packets: Packet[] = [];

    function initHubs() {
      const centerX = width / 2;
      const centerY = height / 2;
      const radiusX = Math.min(width * 0.4, 460);
      const radiusY = Math.min(height * 0.35, 240);

      hubs = chainDefs.map((def, i) => {
        const angle = (i / chainDefs.length) * Math.PI * 2 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radiusX;
        const y = centerY + Math.sin(angle) * radiusY;

        return {
          x,
          y,
          targetX: x,
          targetY: y,
          name: def.name,
          color: def.color,
          glow: def.glow,
          radius: 20,
          pulsePhase: Math.random() * Math.PI * 2,
          symbol: def.symbol,
        };
      });

      // Initialize packets
      packets = [];
      const packetCount = Math.floor(14 * intensity);
      for (let i = 0; i < packetCount; i++) {
        const fromIndex = Math.floor(Math.random() * hubs.length);
        let toIndex = Math.floor(Math.random() * hubs.length);
        while (toIndex === fromIndex) {
          toIndex = Math.floor(Math.random() * hubs.length);
        }

        packets.push({
          fromIndex,
          toIndex,
          progress: Math.random(),
          speed: 0.003 + Math.random() * 0.004,
          color: hubs[fromIndex].color,
          size: 2.5 + Math.random() * 2,
        });
      }
    }

    initHubs();

    // Mouse movement interactive warp
    let mouseX = -1000;
    let mouseY = -1000;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    window.addEventListener("mousemove", handleMouseMove);

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle cyber perspective grid lines in background
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update Hub positions slightly with gentle floating oscillation
      hubs.forEach((hub, i) => {
        hub.pulsePhase += 0.03;
        const driftX = Math.cos(time * 0.5 + i) * 6;
        const driftY = Math.sin(time * 0.7 + i) * 6;

        // Slight mouse repulsion
        const dx = hub.targetX + driftX - mouseX;
        const dy = hub.targetY + driftY - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          const force = (180 - dist) / 180;
          hub.x = hub.targetX + driftX + (dx / dist) * force * 24;
          hub.y = hub.targetY + driftY + (dy / dist) * force * 24;
        } else {
          hub.x = hub.targetX + driftX;
          hub.y = hub.targetY + driftY;
        }
      });

      // Draw Interconnecting Cryptographic Channels
      for (let i = 0; i < hubs.length; i++) {
        for (let j = i + 1; j < hubs.length; j++) {
          const h1 = hubs[i];
          const h2 = hubs[j];

          const grad = ctx.createLinearGradient(h1.x, h1.y, h2.x, h2.y);
          grad.addColorStop(0, h1.glow);
          grad.addColorStop(1, h2.glow);

          ctx.beginPath();
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 6]);
          ctx.moveTo(h1.x, h1.y);
          ctx.lineTo(h2.x, h2.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Central cryptographic vault anchor
      const centerX = width / 2;
      const centerY = height / 2;
      ctx.save();
      const vaultRadius = 45 + Math.sin(time) * 4;
      const vaultGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, vaultRadius);
      vaultGrad.addColorStop(0, "rgba(6, 182, 212, 0.25)");
      vaultGrad.addColorStop(0.5, "rgba(139, 92, 246, 0.1)");
      vaultGrad.addColorStop(1, "transparent");

      ctx.fillStyle = vaultGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, vaultRadius, 0, Math.PI * 2);
      ctx.fill();

      // Rotating central ring
      ctx.strokeStyle = "rgba(6, 182, 212, 0.3)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 55, time * 0.5, time * 0.5 + Math.PI * 1.5);
      ctx.stroke();

      ctx.strokeStyle = "rgba(168, 85, 247, 0.25)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 68, -time * 0.4, -time * 0.4 + Math.PI);
      ctx.stroke();
      ctx.restore();

      // Draw Packets moving between hubs
      packets.forEach((pkt) => {
        pkt.progress += pkt.speed;
        if (pkt.progress >= 1) {
          pkt.progress = 0;
          pkt.fromIndex = pkt.toIndex;
          let nextTo = Math.floor(Math.random() * hubs.length);
          while (nextTo === pkt.fromIndex) {
            nextTo = Math.floor(Math.random() * hubs.length);
          }
          pkt.toIndex = nextTo;
          pkt.color = hubs[pkt.fromIndex].color;
        }

        const h1 = hubs[pkt.fromIndex];
        const h2 = hubs[pkt.toIndex];
        if (!h1 || !h2) return;

        const px = h1.x + (h2.x - h1.x) * pkt.progress;
        const py = h1.y + (h2.y - h1.y) * pkt.progress;

        // Packet glow
        ctx.save();
        ctx.fillStyle = pkt.color;
        ctx.shadowColor = pkt.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py, pkt.size, 0, Math.PI * 2);
        ctx.fill();

        // Small tail
        const tailX = h1.x + (h2.x - h1.x) * Math.max(0, pkt.progress - 0.04);
        const tailY = h1.y + (h2.y - h1.y) * Math.max(0, pkt.progress - 0.04);
        ctx.strokeStyle = pkt.color;
        ctx.lineWidth = pkt.size * 0.6;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        ctx.restore();
      });

      // Draw Chain Hubs
      hubs.forEach((hub) => {
        const pulse = Math.sin(hub.pulsePhase) * 4;
        const currentRadius = hub.radius + pulse;

        // Ambient glow
        ctx.save();
        const radGrad = ctx.createRadialGradient(hub.x, hub.y, 4, hub.x, hub.y, currentRadius * 2);
        radGrad.addColorStop(0, hub.glow);
        radGrad.addColorStop(1, "transparent");
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, currentRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Outer ring
        if (showOrbits) {
          ctx.strokeStyle = hub.color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(hub.x, hub.y, currentRadius + 8, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Inner solid node
        ctx.fillStyle = "#020617";
        ctx.strokeStyle = hub.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Chain Name text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(hub.name, hub.x, hub.y + currentRadius + 18);

        // Chain status beacon
        ctx.fillStyle = "#10B981";
        ctx.beginPath();
        ctx.arc(hub.x, hub.y + currentRadius + 28, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [intensity, showOrbits]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none w-full h-full ${className}`}
      style={{ opacity: 0.85 }}
    />
  );
}
