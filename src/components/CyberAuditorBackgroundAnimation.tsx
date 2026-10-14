"use client";

import React, { useEffect, useRef } from "react";

export default function CyberAuditorBackgroundAnimation() {
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

    // Laser scanner beam position
    let scanY = 0;
    const scanSpeed = 1.1;

    // Legal verification node targets
    interface AuditNode {
      x: number;
      y: number;
      radius: number;
      label: string;
      color: string;
      highlightAlpha: number;
    }

    const auditLabels = [
      "CLAUSE::INDEMNITY",
      "LIABILITY::CAP",
      "GOV_LAW::DELAWARE",
      "FRE_902::PASS",
      "DGCL::COMPLIANT",
      "HASH::KECCAK256",
      "EVM::BASE_L2",
      "AI_REDLINE::ACTIVE",
    ];

    const nodes: AuditNode[] = [];
    const nodeCount = 20;
    const colors = ["#06b6d4", "#10b981", "#a855f7", "#38bdf8"];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1.5,
        label: auditLabels[i % auditLabels.length],
        color: colors[i % colors.length],
        highlightAlpha: 0,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Update Scanner Beam
      scanY += scanSpeed;
      if (scanY > height) scanY = 0;

      // Draw Scanner Beam Line
      const beamGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      beamGrad.addColorStop(0, "rgba(6, 182, 212, 0)");
      beamGrad.addColorStop(0.5, "rgba(6, 182, 212, 0.22)");
      beamGrad.addColorStop(1, "rgba(6, 182, 212, 0)");

      ctx.fillStyle = beamGrad;
      ctx.fillRect(0, scanY - 30, width, 60);

      // Bright scanning laser beam edge
      ctx.beginPath();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 1;
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.stroke();

      // 2. Render Audit Nodes & Connections
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Check if scanner passed near node
        const distToScan = Math.abs(node.y - scanY);
        if (distToScan < 25) {
          node.highlightAlpha = 1.0;
        } else {
          node.highlightAlpha = Math.max(0, node.highlightAlpha - 0.015);
        }

        // Draw connections to nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.08 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = 0.25 + node.highlightAlpha * 0.75;
        if (node.highlightAlpha > 0.2) {
          ctx.shadowColor = node.color;
          ctx.shadowBlur = 8;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;

        // Draw micro label on pulse
        if (node.highlightAlpha > 0.3) {
          ctx.font = "8px monospace";
          ctx.fillStyle = node.color;
          ctx.globalAlpha = node.highlightAlpha * 0.85;
          ctx.fillText(node.label, node.x + 8, node.y + 3);
          ctx.globalAlpha = 1.0;
        }
      }

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
      className="absolute inset-0 w-full h-full pointer-events-none opacity-40 mix-blend-screen"
    />
  );
}
