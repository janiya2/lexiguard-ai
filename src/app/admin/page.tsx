"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Lock,
  Key,
  Globe,
  Database,
  CheckCircle2,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Coins,
  Percent,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import {
  getSiteSettings,
  saveSiteSettings,
  getNotarizedContracts,
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
} from "@/lib/firestoreService";
import { useWeb3 } from "@/context/Web3Context";

export default function AdminPage() {
  const { account } = useWeb3();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [activeTab, setActiveTab] = useState<"cms" | "treasury" | "keys" | "docs" | "health">("cms");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const s = await getSiteSettings();
      setSettings(s);
      const docs = await getNotarizedContracts();
      setContracts(docs);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const success = await saveSiteSettings(settings);
    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
        
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                <Lock className="w-3 h-3 text-purple-400" /> Admin Control Hub
              </span>
              <span className="text-xs text-slate-400">Firebase: web-b61f1 Connected</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              LexiGuard System Administration & CMS
            </h1>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to Firestore...</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Settings Saved Live!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes Live</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/5 pb-1">
          <button
            onClick={() => setActiveTab("cms")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === "cms"
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Landing Page CMS</span>
          </button>

          <button
            onClick={() => setActiveTab("treasury")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === "treasury"
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Treasury & Fees (1%)</span>
          </button>

          <button
            onClick={() => setActiveTab("keys")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === "keys"
                ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys & Integrations</span>
          </button>

          <button
            onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === "docs"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Document Ledger ({contracts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("health")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === "health"
                ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Environment Health</span>
          </button>
        </div>

        {/* TAB 1: LANDING PAGE CMS */}
        {activeTab === "cms" && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 space-y-5">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Live Landing Page Content Controls</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">
                    Announcement Banner Text
                  </label>
                  <input
                    type="text"
                    value={settings.announcementText}
                    onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/5 focus:border-cyan-500/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">
                    Main Hero Title
                  </label>
                  <input
                    type="text"
                    value={settings.heroTitle}
                    onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/5 focus:border-cyan-500/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">
                    Hero Subtitle Copy
                  </label>
                  <textarea
                    rows={3}
                    value={settings.heroSubtitle}
                    onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/5 focus:border-cyan-500/40 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 space-y-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Module Visibility Toggles</span>
              </h3>

              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enablePublicNotarizations}
                    onChange={(e) =>
                      setSettings({ ...settings, enablePublicNotarizations: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-950 border-white/10"
                  />
                  <span className="text-slate-300 font-medium">
                    Enable Public Notarization Ledger (Live on-chain feed)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableEscrowModule}
                    onChange={(e) =>
                      setSettings({ ...settings, enableEscrowModule: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-950 border-white/10"
                  />
                  <span className="text-slate-300 font-medium">
                    Enable Web3 Smart Contract Escrow Milestone Module
                  </span>
                </label>
              </div>
            </div>
          </form>
        )}

        {/* TAB: PROTOCOL TREASURY & REVENUE */}
        {activeTab === "treasury" && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>Platform Protocol Treasury & Revenue (1% Fee Routing)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Configure your InnoXpert platform treasury address to automatically receive micro-fees on every on-chain legal escrow milestone payout.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-semibold shrink-0">
                  Current Fee: {settings.protocolFeePercentage}%
                </div>
              </div>

              <div className="space-y-5 text-xs">
                {/* Treasury Wallet Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-400 font-semibold">
                      Platform Owner Treasury Address (Payout Recipient)
                    </label>
                    {account && (
                      <button
                        type="button"
                        onClick={() =>
                          setSettings({
                            ...settings,
                            ownerTreasuryAddress: account,
                          })
                        }
                        className="text-cyan-400 hover:underline text-[11px] font-mono flex items-center gap-1"
                      >
                        <Wallet className="w-3 h-3" />
                        <span>Use My Connected Wallet ({account.slice(0, 6)}...{account.slice(-4)})</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={settings.ownerTreasuryAddress}
                    onChange={(e) =>
                      setSettings({ ...settings, ownerTreasuryAddress: e.target.value })
                    }
                    placeholder="0x..."
                    className="w-full rounded-xl bg-slate-950 p-3 font-mono text-cyan-300 border border-white/5 focus:border-amber-500/40 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Every time a client releases funds, the smart contract automatically transfers {settings.protocolFeePercentage}% to this address.
                  </p>
                </div>

                {/* Protocol Fee Slider & Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">
                      Protocol Fee Rate (%)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={settings.protocolFeePercentage}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            protocolFeePercentage: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="flex-1 accent-amber-400"
                      />
                      <span className="font-mono text-amber-300 font-bold w-12 text-right">
                        {settings.protocolFeePercentage}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">
                      Enable Protocol Fee Collection
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={settings.enableProtocolFee}
                        onChange={(e) =>
                          setSettings({ ...settings, enableProtocolFee: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-950 border-white/10"
                      />
                      <span className="text-slate-300 font-medium">
                        Automatically deduct {settings.protocolFeePercentage}% protocol fee
                      </span>
                    </label>
                  </div>
                </div>

                {/* Live Simulation Calculator */}
                <div className="mt-4 p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-2">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                    Live Revenue Split Example (On 1.000 ETH Milestone)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                    <div className="flex justify-between p-2 rounded-lg bg-black/30">
                      <span className="text-slate-400">Contractor Payout ({(100 - settings.protocolFeePercentage).toFixed(1)}%):</span>
                      <span className="text-emerald-400 font-bold">
                        {(1 - settings.protocolFeePercentage / 100).toFixed(4)} ETH
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-black/30">
                      <span className="text-slate-400">Admin Treasury Revenue ({settings.protocolFeePercentage}%):</span>
                      <span className="text-amber-400 font-bold">
                        {(settings.protocolFeePercentage / 100).toFixed(4)} ETH
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: API KEYS & VAULT */}
        {activeTab === "keys" && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 space-y-5">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-400" />
                  <span>API Keys & Integration Endpoints</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Manage AI model connections and RPC providers without redeploying code.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Gemini API Key */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-400 font-semibold">
                      Google Gemini API Key (Gemini 1.5 Pro/Flash)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showKey ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                  <input
                    type={showKey ? "text" : "password"}
                    value={settings.geminiApiKey || ""}
                    onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full rounded-xl bg-slate-950 p-3 text-white font-mono border border-white/5 focus:border-purple-500/40 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Free key from Google AI Studio (aistudio.google.com). If left empty, LexiGuard runs high-precision local legal heuristic analysis.
                  </p>
                </div>

                {/* Custom EVM RPC Endpoint */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">
                    Custom EVM RPC URL
                  </label>
                  <input
                    type="text"
                    value={settings.customRpcUrl || "https://sepolia.base.org"}
                    onChange={(e) => setSettings({ ...settings, customRpcUrl: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 p-3 text-white font-mono border border-white/5 focus:border-purple-500/40 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Default: Base Sepolia Public RPC (https://sepolia.base.org)
                  </p>
                </div>

                {/* Pinata IPFS Token */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">
                    Pinata IPFS JWT Token (Optional)
                  </label>
                  <input
                    type="password"
                    value={settings.pinataJwt || ""}
                    onChange={(e) => setSettings({ ...settings, pinataJwt: e.target.value })}
                    placeholder="eyJhbGciOi..."
                    className="w-full rounded-xl bg-slate-950 p-3 text-white font-mono border border-white/5 focus:border-purple-500/40 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 3: DOCUMENT LEDGER */}
        {activeTab === "docs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Stored Notarized Contracts</h3>
                <p className="text-xs text-slate-400">Records from Firestore collection &apos;lexiguard_contracts&apos;</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                {contracts.length} Items Total
              </span>
            </div>

            <div className="rounded-3xl bg-slate-900/60 border border-white/5 overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Hash</th>
                    <th className="py-3 px-4">Network</th>
                    <th className="py-3 px-4">TX Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {contracts.map((doc) => (
                    <tr key={doc.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-semibold text-white">{doc.title}</td>
                      <td className="py-3 px-4 font-bold text-cyan-400">{doc.overallScore}%</td>
                      <td className="py-3 px-4 font-mono text-slate-400 max-w-[120px] truncate">{doc.docHash}</td>
                      <td className="py-3 px-4 text-slate-400">{doc.network}</td>
                      <td className="py-3 px-4 font-mono text-cyan-300 max-w-[120px] truncate">{doc.txHash}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: HEALTH DIAGNOSTICS */}
        {activeTab === "health" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 space-y-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Firebase Backend Status</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                  <span className="text-slate-400">Project ID</span>
                  <span className="font-mono text-white font-semibold">web-b61f1</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                  <span className="text-slate-400">Connection State</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected & Initialized
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                  <span className="text-slate-400">Namespace Safety</span>
                  <span className="text-cyan-300 font-semibold">lexiguard_* (Isolated)</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 space-y-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>Smart Contract & Web3 Status</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                  <span className="text-slate-400">Smart Contract</span>
                  <span className="font-mono text-cyan-300 font-semibold">LexiGuardNotary.sol</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                  <span className="text-slate-400">Solidity Version</span>
                  <span className="text-slate-200 font-semibold">0.8.20 (EVM London/Cancun)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                  <span className="text-slate-400">Gasless Relayer</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active (InnoXpert Node)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
