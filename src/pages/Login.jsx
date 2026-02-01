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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30">
      <div className="max-w-md w-full bg-slate-900/50 p-8 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-sm">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex p-3 bg-indigo-950/50 rounded-xl border border-indigo-900/50 mb-4">
            <div className="w-8 h-8 flex items-center justify-center text-indigo-400 font-bold text-xl">
              LV
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-slate-400">
            Team Authentication
          </h1>
          <p className="text-sm text-slate-500">
            Enter your Unit ID and Access Code to proceed.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">
                Unit ID (Team Name)
              </label>
              <Input
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white focus-visible:ring-indigo-500 h-11"
                placeholder="Ex. ALPHA_SQUAD"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">
                Access Code
              </label>
              <Input
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white focus-visible:ring-indigo-500 h-11"
                placeholder="••••••"
                type="password"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 justify-center bg-red-950/20 p-2 rounded-lg border border-red-900/50">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium">{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all"
          >
            {loading ? (
              "Authenticating..."
            ) : (
              <span className="flex items-center gap-2">
                Access System
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
