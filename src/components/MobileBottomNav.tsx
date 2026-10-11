"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ShieldCheck, Users, ScrollText, Wallet } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Auditor", href: "/auditor", icon: Sparkles },
    { label: "Vault", href: "/vault", icon: ShieldCheck },
    { label: "Contractors", href: "/contractors", icon: Users },
    { label: "History", href: "/history", icon: ScrollText },
    { label: "Wallet", href: "/wallet", icon: Wallet },
  ];

  return (
    <aside aria-label="Mobile Navigation" className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#060913]/95 backdrop-blur-2xl border-t border-white/10 px-2 py-2 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? "text-cyan-400 font-bold"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              <div
                className={`p-2 rounded-xl transition-all ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.35)] scale-105"
                    : "text-slate-400 hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
