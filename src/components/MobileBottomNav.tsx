"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShieldCheck, Sparkles, ScrollText, Wallet } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/", icon: Home, isSpecial: false },
    { label: "Vault", href: "/vault", icon: ShieldCheck, isSpecial: false },
    { label: "AI Audit", href: "/auditor", icon: Sparkles, isSpecial: true },
    { label: "History", href: "/history", icon: ScrollText, isSpecial: false },
    { label: "Wallet", href: "/wallet", icon: Wallet, isSpecial: false },
  ];

  return (
    <aside
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#060913]/95 backdrop-blur-2xl border-t border-white/10 px-2 pt-1.5 pb-2.5 shadow-[0_-10px_35px_rgba(0,0,0,0.8)]"
    >
      <div className="grid grid-cols-5 items-end max-w-md mx-auto relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          // SPECIAL ELEVATED CENTER BUTTON (AI Auditor)
          if (item.isSpecial) {
            return (
              <div key={item.href} className="relative -mt-6 flex flex-col items-center justify-center">
                <Link
                  href={item.href}
                  className="relative group flex items-center justify-center"
                  aria-label="Flagship AI Legal Auditor"
                >
                  {/* Ambient Glow Aura */}
                  <div
                    className={`absolute inset-0 rounded-full blur-md transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500 opacity-90 scale-125 animate-pulse"
                        : "bg-cyan-500/50 opacity-60 group-hover:opacity-100 group-hover:scale-110"
                    }`}
                  />

                  {/* Pulsing Energy Ring */}
                  <div className="absolute -inset-1 rounded-full border border-cyan-400/40 animate-ping opacity-35 pointer-events-none" />

                  {/* Elevated Floating Orb Button */}
                  <div
                    className={`relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full transition-all duration-200 group-hover:scale-105 group-active:scale-95 border-2 shadow-[0_0_25px_rgba(6,182,212,0.65)] ${
                      isActive
                        ? "bg-gradient-to-tr from-cyan-400 via-blue-600 to-purple-600 border-white text-white shadow-[0_0_30px_rgba(6,182,212,0.8)]"
                        : "bg-gradient-to-tr from-cyan-600 via-slate-900 to-purple-800 border-cyan-400/80 text-cyan-200"
                    }`}
                  >
                    <Icon className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-transform group-hover:rotate-12" />
                  </div>
                </Link>

                <span
                  className={`text-[10px] mt-1 font-bold tracking-tight transition-colors ${
                    isActive ? "text-cyan-300 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" : "text-slate-400 group-hover:text-cyan-300"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          }

          // REGULAR DOCK BUTTONS (Home, Vault, History, Wallet)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all ${
                isActive
                  ? "text-cyan-300 font-bold"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.35)] scale-105"
                    : "text-slate-400 hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
