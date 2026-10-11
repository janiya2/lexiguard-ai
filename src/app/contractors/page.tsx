"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  UserCheck,
  Briefcase,
  ShieldCheck,
  Star,
  ExternalLink,
  Wallet,
  Save,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Code2,
  Sparkles,
} from "lucide-react";
import { useWeb3 } from "@/context/Web3Context";
import {
  getContractorProfiles,
  saveContractorProfile,
  ContractorProfile,
  DEFAULT_CONTRACTORS,
} from "@/lib/firestoreService";

export default function ContractorsPage() {
  const { account } = useWeb3();

  const [contractors, setContractors] = useState<ContractorProfile[]>(DEFAULT_CONTRACTORS);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Profile Editor Form State
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [bio, setBio] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [hourlyRate, setHourlyRate] = useState("0.025");
  const [portfolio, setPortfolio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getContractorProfiles();
      setContractors(data);

      // Pre-fill profile if current wallet matches
      if (account) {
        const found = data.find(
          (c) => c.walletAddress.toLowerCase() === account.toLowerCase()
        );
        if (found) {
          setFullName(found.fullName);
          setCompanyName(found.companyName);
          setRoleTitle(found.roleTitle);
          setBio(found.bio);
          setSkillsText(found.skills.join(", "));
          setHourlyRate(found.hourlyRateEth || "0.025");
          setPortfolio(found.githubOrPortfolio || "");
        } else if (account.toLowerCase().includes("7f2b")) {
          // Pre-fill Janitha's profile for the connected demo relayer
          setFullName("Janitha Dilshan");
          setCompanyName("InnoXpert Studio");
          setRoleTitle("Lead Full-Stack Web3 & AI Solutions Architect");
          setBio("Specializing in low-latency AI agents, EVM smart contracts, Next.js full-stack systems, and secure escrow architectures.");
          setSkillsText("Solidity, Next.js, AI Agents, EVM Escrow, TypeScript");
          setHourlyRate("0.025");
          setPortfolio("https://innoxpert.com");
        }
      }
    }
    load();
  }, [account]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    setIsSaving(true);
    setSaveSuccess(false);

    const skillsArray = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const newProfile: ContractorProfile = {
      walletAddress: account,
      fullName: fullName || "Web3 Engineer",
      companyName: companyName || "InnoXpert Studio",
      roleTitle: roleTitle || "Solutions Architect",
      bio: bio || "Verified Web3 Legal & Smart Contract Builder",
      skills: skillsArray.length > 0 ? skillsArray : ["Solidity", "Web3", "Next.js"],
      hourlyRateEth: hourlyRate,
      reputationScore: 99,
      verifiedOnChain: true,
      githubOrPortfolio: portfolio,
    };

    const success = await saveContractorProfile(newProfile);
    setIsSaving(false);

    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      const updated = await getContractorProfiles();
      setContractors(updated);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Web3 Verified Contractor Directory</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white">
            Contractor Profiles & On-Chain Payout Registry
          </h1>
          <p className="text-slate-400 text-sm">
            Clients can discover verified legal tech developers and freelancers, view their verified payout wallet addresses, and instantiate automated smart contract escrows.
          </p>
        </div>

        {/* PROFILE EDITOR & DIRECTORY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* PROFILE EDITOR FORM (For Contractors) */}
          <div className="lg:col-span-5 rounded-3xl bg-slate-900/80 border border-cyan-500/20 p-6 sm:p-7 backdrop-blur-xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-base">
                  {account ? "Your Contractor Profile" : "Create Contractor Profile"}
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                {account ? "Wallet Connected" : "Connect Wallet"}
              </span>
            </div>

            {!account ? (
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-white/5 text-center space-y-3">
                <Wallet className="w-8 h-8 text-cyan-400 mx-auto opacity-70" />
                <p className="text-xs text-slate-300">
                  Connect your MetaMask or Gasless Relayer wallet from the header to create and manage your on-chain contractor profile.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                {saveSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Profile saved to Blockchain & Firestore!</span>
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Janitha Dilshan"
                    required
                    className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/5 focus:border-cyan-500/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Company / Studio Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. InnoXpert Studio"
                    className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/5 focus:border-cyan-500/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Professional Role / Title
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. Lead Solutions Architect"
                    required
                    className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/5 focus:border-cyan-500/40 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Rate (ETH / Milestone)
                    </label>
                    <input
                      type="text"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="0.025"
                      className="w-full rounded-xl bg-slate-950 p-2.5 font-mono text-cyan-300 font-bold border border-white/5 focus:border-cyan-500/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Portfolio / Website
                    </label>
                    <input
                      type="text"
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      placeholder="https://innoxpert.com"
                      className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/5 focus:border-cyan-500/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Core Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    placeholder="Solidity, Next.js, AI Agents, Python"
                    className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/5 focus:border-cyan-500/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Professional Bio & Deliverable Scope
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your legal engineering or technical services..."
                    className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/5 focus:border-cyan-500/40 focus:outline-none resize-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-white/5 font-mono text-[11px] text-slate-400">
                  <span className="text-slate-500">Payout Wallet: </span>
                  <span className="text-cyan-300 break-all">{account}</span>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Publishing Profile..." : "Publish Contractor Profile"}</span>
                </button>
              </form>
            )}
          </div>

          {/* VERIFIED CONTRACTOR DIRECTORY CARDS */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Verified Legal Tech Contractors ({contractors.length})
              </h3>
              <span className="text-xs text-slate-400">Ready for Escrow Lock</span>
            </div>

            <div className="space-y-4">
              {contractors.map((c) => (
                <div
                  key={c.walletAddress}
                  className="rounded-3xl bg-slate-900/60 border border-white/5 p-6 hover:border-cyan-500/30 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">
                          {c.fullName}
                        </h4>
                        {c.verifiedOnChain && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-cyan-300 font-semibold mt-0.5">
                        {c.roleTitle} {c.companyName && `· ${c.companyName}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                        {c.hourlyRateEth} ETH / Milestone
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {c.bio}
                  </p>

                  {/* Skills Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {c.skills?.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-950 text-slate-300 border border-white/5"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Wallet & Hire Action */}
                  <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span className="text-slate-500">Payout Address:</span>
                      <span className="text-cyan-300">
                        {c.walletAddress.slice(0, 6)}...{c.walletAddress.slice(-4)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(c.walletAddress)}
                        className="hover:text-white transition-colors"
                        title="Copy Address"
                      >
                        {copiedAddress === c.walletAddress ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <Link
                      href="/vault"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-all shadow-sm"
                    >
                      <span>Create Escrow</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
