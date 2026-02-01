import React from "react";
import { Loader2, Radio, ShieldAlert } from "lucide-react";

export default function WaitingScreen() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-green-500 font-mono p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,50,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,50,0,0.1)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-80 pointer-events-none" />

      <div
        className="absolute inset-0 pointer-events-none z-50 mix-blend-overlay opacity-10 animate-[scan_4s_linear_infinite]"
        style={{
          background:
            "linear-gradient(to bottom, transparent 50%, rgba(0, 255, 0, 0.1) 51%, transparent 52%)",
          backgroundSize: "100% 4px",
        }}
      />

      <div className="z-10 flex flex-col items-center text-center space-y-8 max-w-md w-full border border-green-900/30 p-8 rounded-lg bg-black/50 backdrop-blur-md shadow-[0_0_30px_rgba(0,50,0,0.3)]">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse" />
          <Loader2 className="w-16 h-16 animate-spin text-green-500 relative z-10" />
        </div>

        <div className="space-y-2">
          <h1
            className="text-2xl font-bold tracking-[0.2em] text-white glitch"
            data-text="SYSTEM_STANDBY"
          >
            SYSTEM_STANDBY
          </h1>
          <div className="h-px w-24 bg-green-800 mx-auto" />
          <p className="text-sm text-green-700 font-bold tracking-widest uppercase animate-pulse">
            Waiting for Admin Uplink
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-green-950/20 border border-green-900/50 p-3 rounded flex flex-col items-center gap-2">
            <Radio className="w-5 h-5 text-green-600" />
            <span className="text-[10px] text-green-800 uppercase">
              Signal Status
            </span>
            <span className="text-xs font-bold text-green-400">
              CONNECTING...
            </span>
          </div>
          <div className="bg-green-950/20 border border-green-900/50 p-3 rounded flex flex-col items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-green-600" />
            <span className="text-[10px] text-green-800 uppercase">
              Security
            </span>
            <span className="text-xs font-bold text-green-400">LOCKED</span>
          </div>
        </div>

        <div className="text-[10px] text-green-900/60 max-w-xs mt-8">
          // PROTOCOL: DO NOT CLOSE THIS TERMINAL. <br />
          // MISSION DATA WILL AUTO-LOAD UPON ACTIVATION.
        </div>
      </div>
    </div>
  );
}
