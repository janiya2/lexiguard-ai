"use client";

import React, { useEffect, useRef } from "react";

interface CyberHeroBackgroundAnimationProps {
  styleType?: "blockchain-nodes" | "cyber-stream" | "ambient-glow";
  className?: string;
}

interface NodePoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  glowColor: string;
  pulseSpeed: number;
  pulsePhase: number;
}

interface DataPacket {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: string;
}

interface CryptoTag {
  text: string;
  x: number;
  y: number;
  vy: number;
  opacity: number;
  maxOpacity: number;
  color: string;
}

export default function CyberHeroBackgroundAnimation({
  styleType = "blockchain-nodes",
  className = "",
}: CyberHeroBackgroundAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Track mouse for gentle interactive tethering
    let mouseX = -1000;
    let mouseY = -1000;
    let isMouseActive = false;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isMouseActive = true;
    };

    const handleMouseLeave = () => {
      isMouseActive = false;
      mouseX = -1000;
      mouseY = -1000;
    };

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      initNodes();
    };

    window.addEventListener("resize", handleResize);
    canvas.parentElement?.addEventListener("mousemove", handleMouseMove);
    canvas.parentElement?.addEventListener("mouseleave", handleMouseLeave);

    // Color palette
    const colors = [
      { fill: "#06b6d4", glow: "rgba(6, 182, 212, 0.6)" }, // Cyan
      { fill: "#a855f7", glow: "rgba(168, 85, 247, 0.6)" }, // Violet
      { fill: "#38bdf8", glow: "rgba(56, 189, 248, 0.5)" }, // Sky Blue
      { fill: "#10b981", glow: "rgba(16, 185, 129, 0.6)" }, // Emerald
    ];

    const cryptoLabels = [
      "0x8fa92300bcf4...",
      "SHA-256: 0xe26f0c...",
      "keccak256() VERIFIED",
      "Base Sepolia #84532",
      "BLI LEGAL PROTOCOL",
      "SMART ESCROW: 1% FEE",
      "CLAUSE INTEGRITY: 100%",
      "EVM BLOCK NOTARY",
    ];

    let nodes: NodePoint[] = [];
    let packets: DataPacket[] = [];
    let tags: CryptoTag[] = [];

    const initNodes = () => {
      nodes = [];
      packets = [];
      tags = [];

      // Scale density according to screen size
      const nodeCount = Math.floor(Math.min(width * height / 18000, 50));

      for (let i = 0; i < nodeCount; i++) {
        const c = colors[Math.floor(Math.random() * colors.length)];
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 2 + 1.5,
          color: c.fill,
          glowColor: c.glow,
          pulseSpeed: Math.random() * 0.03 + 0.015,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }

      // Initialize floating crypto strings
      for (let i = 0; i < 7; i++) {
        tags.push({
          text: cryptoLabels[i % cryptoLabels.length],
          x: Math.random() * (width - 150) + 20,
          y: Math.random() * height,
          vy: -(Math.random() * 0.25 + 0.15),
          opacity: Math.random() * 0.4 + 0.1,
          maxOpacity: Math.random() * 0.35 + 0.2,
          color: Math.random() > 0.5 ? "#22d3ee" : "#c084fc",
        });
      }
    };

    initNodes();

    // Spawning electric packets travelling on connected links
    const spawnPacket = () => {
      if (nodes.length < 2) return;
      const from = Math.floor(Math.random() * nodes.length);
      // Find closest neighbor
      let closest = -1;
      let minDist = 160;
      for (let j = 0; j < nodes.length; j++) {
        if (from === j) continue;
        const dx = nodes[from].x - nodes[j].x;
        const dy = nodes[from].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closest = j;
        }
      }
      if (closest !== -1) {
        packets.push({
          fromNode: from,
          toNode: closest,
          progress: 0,
          speed: Math.random() * 0.015 + 0.01,
          color: nodes[from].color,
        });
      }
    };

    let packetTimer = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Periodically trigger packets
      packetTimer++;
      if (packetTimer > 50 && packets.length < 12) {
        spawnPacket();
        packetTimer = 0;
      }

      // 1. Draw connecting mesh lines between nearby nodes
      const maxDistance = 150;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.22;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }

        // Connect to mouse if active and within proximity
        if (isMouseActive) {
          const mdx = nodes[i].x - mouseX;
          const mdy = nodes[i].y - mouseY;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mDist < 170) {
            const mAlpha = (1 - mDist / 170) * 0.45;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(168, 85, 247, ${mAlpha})`;
            ctx.lineWidth = 1;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();
          }
        }
      }

      // 2. Draw active data packets traversing along edges
      for (let p = packets.length - 1; p >= 0; p--) {
        const pkt = packets[p];
        const n1 = nodes[pkt.fromNode];
        const n2 = nodes[pkt.toNode];

        if (!n1 || !n2) {
          packets.splice(p, 1);
          continue;
        }

        pkt.progress += pkt.speed;
        if (pkt.progress >= 1) {
          packets.splice(p, 1);
          continue;
        }

        const px = n1.x + (n2.x - n1.x) * pkt.progress;
        const py = n1.y + (n2.y - n1.y) * pkt.progress;

        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = pkt.color;
        ctx.shadowColor = pkt.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow
      }

      // 3. Draw nodes with pulsing halos
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Physics update
        node.x += node.vx;
        node.y += node.vy;

        // Bounce gently at boundaries
        if (node.x < 10 || node.x > width - 10) node.vx *= -1;
        if (node.y < 10 || node.y > height - 10) node.vy *= -1;

        node.pulsePhase += node.pulseSpeed;
        const pulse = Math.sin(node.pulsePhase) * 0.5 + 0.5;

        // Outer glow aura
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + pulse * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = node.glowColor;
        ctx.fill();

        // Solid core
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 4. Draw floating cryptographic strings / metadata labels
      ctx.font = "9px 'Courier New', monospace";
      for (let t = 0; t < tags.length; t++) {
        const tag = tags[t];
        tag.y += tag.vy;

        // Wrap around when drifting off top
        if (tag.y < -20) {
          tag.y = height + 20;
          tag.x = Math.random() * (width - 150) + 20;
          tag.text = cryptoLabels[Math.floor(Math.random() * cryptoLabels.length)];
        }

        ctx.fillStyle = tag.color;
        ctx.globalAlpha = tag.opacity;
        ctx.fillText(tag.text, tag.x, tag.y);
      }
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      canvas.parentElement?.removeEventListener("mousemove", handleMouseMove);
      canvas.parentElement?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [styleType]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-10 opacity-70 transition-opacity duration-1000 ${className}`}
    />
  );
}
