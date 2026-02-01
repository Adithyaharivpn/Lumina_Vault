import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Terminal, AlertTriangle, ArrowRight } from "lucide-react";
import { EncryptedText } from "@/components/ui/encrypted-text";

export default function Login() {
  const [unitId, setUnitId] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedTeamId = localStorage.getItem("team_id");
    if (storedTeamId) {
      navigate("/user");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!unitId.trim() || !accessCode.trim()) {
      setError("ERROR: CREDENTIALS REQUIRED.");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .ilike("team_name", unitId)
      .eq("access_code", accessCode)
      .maybeSingle();

    if (data) {
      localStorage.setItem("team_id", data.id);
      localStorage.setItem("team_name", data.team_name);
      navigate("/user");
    } else {
      setError("ACCESS DENIED: INVALID UNIT_ID OR CODE.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col items-center justify-center p-6 selection:bg-green-900/50">
      <div className="crt-effect" />

      <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
          <div className="inline-block p-4 border border-green-500/30 rounded-full bg-green-950/20 mb-4 animate-pulse">
            <Terminal className="w-12 h-12 text-green-400" />
          </div>
          <h1
            className="text-3xl font-bold tracking-widest glitch"
            data-text="LUMINA_VAULT"
          >
            <EncryptedText text="LUMINA_VAULT" />
          </h1>
          <div className="text-xs text-green-800 tracking-[0.2em] h-4">
            <EncryptedText text="INITIALIZING UPLINK... STANDBY_" />
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6 mt-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-green-700 ml-1">
                ENTER UNIT_ID (TEAM NAME)
              </label>
              <div className="relative">
                <Input
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="bg-black border-2 border-green-800 focus-visible:ring-green-500 h-12 text-lg text-center tracking-wider py-6 uppercase placeholder:text-green-900/50"
                  placeholder="TEAM_NAME"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-green-700 ml-1">
                ACCESS CODE
              </label>
              <div className="relative">
                <Input
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="bg-black border-2 border-green-800 focus-visible:ring-green-500 h-12 text-lg text-center tracking-wider py-6 placeholder:text-green-900/50"
                  placeholder="••••••"
                  type="password"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 justify-center animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold tracking-wide">{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-green-600 hover:bg-green-500 text-black font-bold text-lg tracking-widest shadow-[0_0_20px_rgba(0,255,0,0.4)] transition-all active:scale-95 group"
          >
            {loading ? (
              "ESTABLISHING CONNECTION..."
            ) : (
              <span className="flex items-center gap-2">
                CONNECT{" "}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
        </form>

        <div className="text-center pt-8">
          <p className="text-[10px] text-green-900">
            SECURE TERMINAL ACCESS V4.0.1
            <br />
            UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED
          </p>
        </div>
      </div>
    </div>
  );
}
