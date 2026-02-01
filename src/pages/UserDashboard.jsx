import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Zap,
  CheckCircle,
  Terminal,
  AlertTriangle,
  Trophy,
  Users,
  LogOut,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { supabase } from "@/lib/supabaseClient";
import WaitingScreen from "./WaitingScreen";

export default function UserDashboard() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(3600);
  const [signalStrength, setSignalStrength] = useState(3);
  const [overrideProgress, setOverrideProgress] = useState(0);
  const [terminalInput, setTerminalInput] = useState("");
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [team, setTeam] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
 
  useEffect(() => {
    if (!team?.id) return;
    const updatePresence = async () => {
      await supabase
        .from("teams")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", team.id);
    };
    updatePresence(); 
    const interval = setInterval(updatePresence, 30000); 
    return () => clearInterval(interval);
  }, [team?.id]);

  useEffect(() => {
    const initGame = async () => {
      const storedTeamId = localStorage.getItem("team_id");

      if (!storedTeamId || storedTeamId === "undefined") {
        localStorage.clear();
        navigate("/login");
        return;
      }

      await Promise.all([
        fetchTeamData(storedTeamId),
        fetchNodes(),
        fetchLeaderboard(),
      ]);
      setLoading(false);
    };

    initGame();
    const channel = supabase
      .channel("game_room")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        (payload) => {
          fetchLeaderboard();
          const myId = localStorage.getItem("team_id");
          if (payload.new && payload.new.id === myId) {
            setTeam(payload.new);
          }
        },
      )
      .on("broadcast", { event: "system_alert" }, ({ payload }) => {
        setAlertMsg(payload.message);
        setTimeout(() => setAlertMsg(""), 5000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("team_id");
    localStorage.removeItem("team_name");
    navigate("/login");
  };

  // Helpers
  const fetchTeamData = async (teamId) => {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .single();
    if (data) setTeam(data);
  };

  const fetchNodes = async () => {
    const { data, error } = await supabase
      .from("nodes")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching nodes:", error);
    } else {
      console.log("Nodes fetched:", data?.length, data);
      if (data) setNodes(data);
    }
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from("teams")
      .select("*")
      .order("current_node", { ascending: false })
      .order("last_solved_at", { ascending: true });
    if (data) setLeaderboard(data);
  };

  //Timer 
  useEffect(() => {
    const calculateTime = () => {
      if (!team?.start_time) return;

      const startTime = new Date(team.start_time).getTime();
      const durationSeconds = (team.duration_minutes || 60) * 60;

      if (team.paused_at) {
        const pauseTime = new Date(team.paused_at).getTime();
        const elapsed = Math.floor((pauseTime - startTime) / 1000);
        const remaining = Math.max(0, durationSeconds - elapsed);
        setTimeLeft(remaining);
      } else {
        const now = new Date().getTime();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = Math.max(0, durationSeconds - elapsed);
        setTimeLeft(remaining);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [team]); 

  useEffect(() => {
    const sig = setInterval(
      () => setSignalStrength(Math.floor(Math.random() * 4) + 1),
      2000,
    );
    return () => clearInterval(sig);
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  //Game Logic
  const handleTerminalSubmit = async (e) => {
    e.preventDefault();
    if (!team || terminalInput.trim() === "" || overrideProgress > 0) return;

    setErrorMsg("");
    const currentNode = nodes.find((n) => n.id === team.current_node);

    if (!currentNode) {
      console.error("Node not found for team.current_node:", team.current_node);
      setErrorMsg("NODE_ERROR");
      return;
    }

    console.log(
      `Attempting Override - Input: "${terminalInput}" | Target: "${currentNode.correct_key}" | NodeID: ${currentNode.id}`,
    );

    if (
      currentNode.correct_key &&
      terminalInput.trim().toUpperCase() ===
        currentNode.correct_key.toUpperCase()
    ) {
      const nextNodeId = team.current_node + 1;
      const isFinished = nextNodeId > nodes.length;

      const updates = {
        current_node: isFinished ? team.current_node : nextNodeId,
        score: (team.score || 0) + 100,
        last_solved_at: new Date().toISOString(),
        is_finished: isFinished,
      };

      const { error } = await supabase
        .from("teams")
        .update(updates)
        .eq("id", team.id);

      if (error) {
        console.error("Supabase update error:", error);
        setErrorMsg("UPLINK_ERROR");
      } else {
        setOverrideProgress(100);
        setTerminalInput("");
        setTimeout(() => setOverrideProgress(0), 2000);
      }
    } else {
      console.log("Incorrect key entered.");
      setErrorMsg("ACCESS_DENIED");
      setTimeout(() => setErrorMsg(""), 2000);
    }
  };

  const getNodeStatus = (nodeId) => {
    if (!team) return "locked";
    if (team.is_finished) return "completed";
    if (nodeId < team.current_node) return "completed";
    if (nodeId === team.current_node) return "active";
    return "locked";
  };

  const totalLevels = nodes.length || 5;
  const currentLevel = team?.is_finished
    ? totalLevels
    : (team?.current_node || 1) - 1;
  const globalProgress = Math.round((currentLevel / totalLevels) * 100);

  if (loading)
    return (
      <div className="bg-black min-h-screen text-green-500 font-mono p-10">
        INITIALIZING UPLINK...
      </div>
    );

  if (team && !team.start_time) {
    return <WaitingScreen />;
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono overflow-x-hidden relative selection:bg-green-900/50">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 border-b border-green-900/50 backdrop-blur-sm p-4 flex justify-between items-center shadow-[0_0_15px_rgba(0,255,0,0.1)]">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 items-end h-5">
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={`w-1 bg-green-500 transition-all duration-300 ${signalStrength >= bar ? "opacity-100" : "opacity-20"}`}
                style={{ height: `${bar * 25}%` }}
              />
            ))}
          </div>

          <span className="text-xs font-bold animate-pulse text-green-400">
            NET_UPLINK
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-6 text-[10px] text-green-800 hover:text-red-500 hover:bg-red-950/20 px-1 border border-transparent hover:border-red-900/50"
          >
            <LogOut className="w-3 h-3 mr-1" /> DISCONNECT
          </Button>

          <div
            className="text-xl font-bold tracking-widest text-red-500 glitch text-right"
            data-text={formatTime(timeLeft)}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-green-700">TARGET</div>
          <div className="text-sm font-bold">
            NODE{" "}
            {team?.current_node
              ? String(team.current_node).padStart(2, "0")
              : "--"}{" "}
            / 05
          </div>
        </div>
      </header>

      <main className="pt-24 pb-32 px-4 max-w-md mx-auto space-y-6 relative z-10">
        <div className="flex gap-4 items-stretch h-[400px]">
          <div className="w-12 flex flex-col items-center justify-between py-2 bg-black border border-green-900/30 rounded-full relative overflow-hidden group">
            <div
              className={`absolute inset-x-0 bottom-0 w-full transition-all duration-1000 ease-out bg-green-500/20`}
              style={{ height: `${globalProgress}%` }}
            />
            <div
              className={`absolute inset-x-0 bottom-0 w-full transition-all duration-200 ease-out bg-green-500 mix-blend-overlay`}
              style={{
                height: `${overrideProgress}%`,
                opacity: overrideProgress > 0 ? 1 : 0,
              }}
            />
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-4 h-px bg-green-900/50 z-10" />
            ))}
            <span className="absolute top-2 w-full text-center text-[10px] font-bold z-20 mix-blend-difference rotate-90 origin-center translate-y-8">
              PROGRESS
            </span>
            <span className="absolute bottom-4 w-full text-center text-xs font-bold z-20 text-green-400">
              {globalProgress}%
            </span>
          </div>

          {/* Nodes Grid */}
          <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-hide">
            {nodes.length === 0 && (
              <div className="text-xs text-green-900">
                Scanning network topology...
              </div>
            )}

            {nodes.map((node) => {
              const status = getNodeStatus(node.id);
              return (
                <Card
                  key={node.id}
                  className={`
                      border-l-4 transition-all duration-300 backdrop-blur-md text-inherit
                      ${
                        status === "active"
                          ? "border-green-500 bg-green-950/10 shadow-[0_0_20px_rgba(0,255,0,0.1)] border-t-0 border-r-0 border-b-0"
                          : status === "completed"
                            ? "border-green-800/50 bg-black opacity-60 border-t-0 border-r-0 border-b-0"
                            : "border-red-900/40 bg-red-950/20 opacity-80 border-t-0 border-r-0 border-b-0"
                      }
                    `}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {status === "locked" && (
                          <Lock className="w-3 h-3 text-red-500" />
                        )}
                        {status === "active" && (
                          <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
                        )}
                        {status === "completed" && (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        )}
                        <span
                          className={`text-sm font-bold ${status === "completed" ? "line-through text-green-700" : ""}`}
                        >
                          {node.node_name ||
                            `NODE ${String(node.id).padStart(2, "0")}`}
                        </span>
                      </div>
                      <div className="text-xs text-green-600/80 uppercase">
                        {node.location_hint || "Unknown"}
                      </div>
                    </div>

                    {status === "completed" && (
                      <span className="text-[10px] bg-green-900/30 text-green-400 px-1 py-0.5 border border-green-500/30 rounded">
                        STABLE
                      </span>
                    )}
                    {status === "active" && (
                      <div className="text-[10px] text-yellow-400 animate-pulse font-bold tracking-wider">
                        Intercepting...
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Interaction Panel */}
        <div
          className={`border bg-black/80 p-4 rounded-sm shadow-lg backdrop-blur-md transition-colors duration-300 ${errorMsg ? "border-red-500/50 shadow-red-900/20" : "border-green-500/30"}`}
        >
          <div className="flex items-center gap-2 mb-3 text-green-400 border-b border-green-900/50 pb-2">
            <Terminal className="w-4 h-4" />
            <h3 className="text-sm font-bold tracking-wider">
              OVERRIDE_TERMINAL
            </h3>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <span
                className={`absolute left-3 top-2.5 text-sm select-none ${errorMsg ? "text-red-500" : "text-green-600"}`}
              >
                root@signal:~#
              </span>
              <Input
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                className={`pl-32 bg-black border-green-800 focus-visible:ring-green-500 font-mono h-10 ${errorMsg ? "text-red-500 border-red-800 focus-visible:ring-red-500" : "text-green-400 placeholder:text-green-900"}`}
                placeholder={errorMsg || "enter_code..."}
              />
            </div>
            <Button
              onClick={handleTerminalSubmit}
              disabled={!team || team.is_finished}
              className={`w-full text-black font-bold tracking-widest shadow-[0_0_15px_rgba(0,255,0,0.4)] transition-all active:scale-95 ${errorMsg ? "bg-red-600 hover:bg-red-500" : "bg-green-600 hover:bg-green-500"}`}
            >
              {errorMsg ? "ERROR // RETRY" : "EXECUTE OVERRIDE"}
            </Button>
          </div>
        </div>
      </main>

      {/* Leaderboard Sheet */}
      <Sheet open={isLeaderboardOpen} onOpenChange={setIsLeaderboardOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="fixed right-4 bottom-6 z-40 rounded-full h-12 w-12 p-0 border-green-500 bg-black text-green-500 shadow-[0_0_20px_rgba(0,255,0,0.2)] hover:bg-green-900/20"
          >
            <Trophy className="w-5 h-5 text-yellow-400" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-[80vh] border-t-green-500 bg-black/95 text-green-500 p-0"
        >
          <SheetHeader className="p-6 border-b border-green-900/50">
            <SheetTitle className="text-green-500 font-mono flex items-center gap-2">
              <Users className="w-4 h-4" /> GLOBAL_RANKINGS
            </SheetTitle>
            <SheetDescription className="text-green-800 font-mono text-xs">
              REAL-TIME UPLINK ESTABLISHED
            </SheetDescription>
          </SheetHeader>
          <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            {leaderboard.length === 0 ? (
              <div className="text-center text-green-800 text-sm">
                Waiting for uplink...
              </div>
            ) : (
              leaderboard.map((t, idx) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between p-3 border ${t.id === team?.id ? "border-green-500 bg-green-900/20" : "border-green-900/30"} rounded-sm`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-bold text-lg ${idx === 0 ? "text-yellow-400" : "text-green-700"}`}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="flex flex-col">
                      <span
                        className={`font-bold text-sm ${t.id === team?.id ? "text-white" : "text-green-400"}`}
                      >
                        {t.team_name}
                      </span>
                      <span className="text-[10px] text-green-800">
                        UPLINK_ID: {t.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold">
                      {t.score || 0} PTS
                    </div>
                    <div className="text-[10px] text-green-700">
                      NODE {t.current_node}/5
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Floating System Alerts */}
      {alertMsg && (
        <div className="fixed left-4 bottom-20 z-50 w-[90%] md:w-auto animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3 bg-red-950/90 text-red-400 px-4 py-3 border border-red-500 rounded shadow-[0_0_30px_rgba(255,0,0,0.3)] backdrop-blur-md">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-red-600 uppercase">
                System Broadcast
              </span>
              <span className="text-sm font-bold font-mono">{alertMsg}</span>
            </div>
          </div>
        </div>
      )}

      {!alertMsg && signalStrength < 2 && (
        <div className="fixed left-4 bottom-6 z-30">
          <div className="flex items-center gap-2 text-xs text-red-500 bg-black/80 px-3 py-1 border border-red-900/50 rounded-full animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span>SIGNAL_UNSTABLE</span>
          </div>
        </div>
      )}
    </div>
  );
}
