import React from "react";
import { Loader2, Radio, ShieldAlert } from "lucide-react";

export default function WaitingScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30">
      <div className="max-w-md w-full bg-slate-900/50 p-12 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-sm flex flex-col items-center text-center space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
          <Loader2 className="w-16 h-16 animate-spin text-indigo-500 relative z-10" />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            System Standby
          </h1>
          <p className="text-slate-400 text-sm">
            The mission will commence shortly. Please wait for the administrator
            to initiate the sequence.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400" />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Signal
            </span>
            <span className="text-sm font-bold text-white animate-pulse">
              AWAITING
            </span>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Protocol
            </span>
            <span className="text-sm font-bold text-white">LOCKED</span>
          </div>
        </div>

        <div className="text-xs text-slate-600">
          Do not close this window. Redirect will occur automatically.
        </div>
      </div>
    </div>
  );
}
