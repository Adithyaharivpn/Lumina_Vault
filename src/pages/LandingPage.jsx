import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  Code,
  Globe,
  Lock,
  Map,
  ShieldCheck,
  Target,
  Users,
  Clock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { EncryptedText } from "@/components/ui/encrypted-text";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-xl text-white">
              LuminaVault
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button
                variant="ghost"
                className="font-medium text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <BackgroundBeamsWithCollision className="min-h-screen flex flex-col items-center justify-center">
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 max-w-4xl mx-auto leading-[1.1]">
              Hunt the Key. <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-blue-400">
                <EncryptedText text="Unlock the Future." />
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              A fast-paced mission to find hidden secrets across the campus.
              Solve tricky ciphers, unlock technical nodes, and override the
              system to claim the prize.
            </p>
          </div>
        </BackgroundBeamsWithCollision>
      </section>
      {/* Rules Grid */}
      <section className="py-20 bg-slate-900 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Mission Protocols
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Strict adherence to guidelines is required for all participating
              units.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ProtocolCard
              icon={<Users className="w-6 h-6 text-indigo-400" />}
              title="Team Size"
              desc="Form a unit of 3-5 specialists to tackle the challenges effectively."
              value="3-5 Members"
            />
            <ProtocolCard
              icon={<Clock className="w-6 h-6 text-indigo-400" />}
              title="Duration"
              desc="A focused operational window to complete all objectives."
              value="2-4 Hours"
            />
            <ProtocolCard
              icon={<ShieldCheck className="w-6 h-6 text-indigo-400" />}
              title="Fair Play"
              desc="No outside assistance. Integrity is paramount to the mission."
              value="Strict Policy"
            />
          </div>
        </div>
      </section>

      {/* Challenges Section */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Active Challenges
              </h2>
              <p className="text-slate-400 max-w-xl">
                Locate. Decipher. Dominate.
                <br />
                Five unique nodes focusing on different technical domains.
              </p>
            </div>
            <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 shadow-sm text-sm text-slate-400 font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              Difficulty: Adaptive
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ChallengeCard
              icon={<Lock className="w-5 h-5 text-blue-400" />}
              title="Cryptography"
              desc="Decode secret messages using classical and modern cipher techniques."
            />
            <ChallengeCard
              icon={<Code className="w-5 h-5 text-indigo-400" />}
              title="Technical Logic"
              desc="Solve programming basics and logical flow puzzles."
            />
            <ChallengeCard
              icon={<Globe className="w-5 h-5 text-teal-400" />}
              title="Web Exploits"
              desc="Identify vulnerabilities and fix website structures."
            />
            <ChallengeCard
              icon={<Map className="w-5 h-5 text-emerald-400" />}
              title="Physical Hunt"
              desc="Navigate the campus to find hidden QR nodes."
            />
            <ChallengeCard
              icon={<Target className="w-5 h-5 text-rose-400" />}
              title="Pattern Matching"
              desc="Connect complex items and concepts under time pressure."
            />
            <ChallengeCard
              icon={<Brain className="w-5 h-5 text-violet-400" />}
              title="Digital Safety"
              desc="Cybersecurity awareness and defense protocols."
            />
          </div>
        </div>
      </section>
      {/* Footer (Simplified) */}
      <section className="py-8 border-t border-slate-800 bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-sm text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
            <p>© 2026 LuminaVault Event. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="hover:text-slate-300 cursor-pointer">
                Privacy Protocol
              </span>
              <span className="hover:text-slate-300 cursor-pointer">
                Terms of Service
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProtocolCard({ icon, title, desc, value }) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:shadow-md transition-shadow hover:border-indigo-500/30">
      <div className="w-12 h-12 bg-indigo-900/20 rounded-xl flex items-center justify-center mb-4 text-indigo-400">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-4 h-12">{desc}</p>
      <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300 bg-indigo-950/50 border border-indigo-900/50 w-fit px-3 py-1 rounded-full">
        {value}
      </div>
    </div>
  );
}

function ChallengeCard({ icon, title, desc }) {
  return (
    <div className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/10 transition-all cursor-default relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="w-4 h-4 text-indigo-400 -rotate-45" />
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
          {icon}
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
