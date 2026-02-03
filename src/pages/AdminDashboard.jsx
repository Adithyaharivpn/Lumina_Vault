import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Send,
  Users,
  Terminal,
  Lock,
  Shield,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem("admin_authenticated") === "true";
  });
  const [authInput, setAuthInput] = useState("");
  const [authError, setAuthError] = useState(false);

  // Restored State
  const [teams, setTeams] = useState([]);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [isSystemPaused, setIsSystemPaused] = useState(false);
  const [systemLog, setSystemLog] = useState([]);
  const [isNukeOpen, setIsNukeOpen] = useState(false);
  const [gameDuration, setGameDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isManageTeamOpen, setIsManageTeamOpen] = useState(false);

  // Timer Logic
  useEffect(() => {
    const calculateTime = () => {
      if (teams.length === 0 || !teams[0].start_time) return;

      const referenceTeam = teams[0];
      const startTime = new Date(referenceTeam.start_time).getTime();
      const durationSeconds = (referenceTeam.duration_minutes || 60) * 60;

      // Check if paused
      if (referenceTeam.paused_at) {
        const pauseTime = new Date(referenceTeam.paused_at).getTime();
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
  }, [teams]);

  // Calculate Online Count
  const onlineCount = teams.filter((t) => {
    if (!t.last_seen_at) return false;
    const lastSeen = new Date(t.last_seen_at).getTime();
    const now = new Date().getTime();
    return now - lastSeen < 60000; // Active in last 60s
  }).length;

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

  // Channel Reference
  const [channel, setChannel] = useState(null);

  // Fetch initial data & Subs
  useEffect(() => {
    if (!isAdmin) return;

    fetchTeams();
    fetchLogs();

    const newChannel = supabase
      .channel("game_room")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        (payload) => {
          fetchTeams();
          if (
            payload.eventType === "UPDATE" &&
            payload.new.score > payload.old.score
          ) {
            addLog(
              `Team ${payload.new.team_name} intercepted Node ${payload.new.current_node - 1}`,
            );
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "system_logs" },
        (payload) => {
          setSystemLog((prev) => [
            `[${new Date(payload.new.created_at).toLocaleTimeString("en-US", { hour12: false })}] ${payload.new.message}`,
            ...prev,
          ]);
        },
      )
      .on("broadcast", { event: "system_alert" }, (event) => {
        console.log("RECEIVED EXT ALERT:", event);
        if (event.payload && event.payload.message) {
          const msg = event.payload.message;
          addLog(msg);
          toast.error(msg, {
            duration: 8000,
            className:
              "bg-red-950 border border-red-500 text-red-400 font-bold",
          });
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Admin connected to game_room");
        }
      });

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [isAdmin]);

  const fetchTeams = async () => {
    const { data } = await supabase
      .from("teams")
      .select("*")
      .order("id", { ascending: true });
    if (data) setTeams(data);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("system_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      const formatted = data.map((log) => {
        const time = new Date(log.created_at).toLocaleTimeString("en-US", {
          hour12: false,
        });
        return `[${time}] ${log.message}`;
      });
      setSystemLog(formatted);
    }
  };

  const addLog = async (msg) => {
    await supabase.from("system_logs").insert({
      message: msg,
      type: "info",
    });
  };

  const handleAuth = (e) => {
    e.preventDefault();
    if (authInput === "admin" || authInput === "override") {
      sessionStorage.setItem("admin_authenticated", "true");
      setIsAdmin(true);
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 2000);
    }
  };

  // Actions
  const handleBroadcast = async () => {
    if (!broadcastMsg.trim() || !channel) return;

    const status = await channel.send({
      type: "broadcast",
      event: "system_alert",
      payload: { message: broadcastMsg },
    });

    if (status === "ok") {
      addLog(`BROADCAST SENT: "${broadcastMsg}"`);
      setBroadcastMsg("");
    } else {
      addLog(`ERROR SENDING BROADCAST`);
    }
  };

  const handleStartTimer = async () => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("teams")
      .update({
        start_time: now,
        duration_minutes: gameDuration,
      })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (!error) {
      addLog(`GAME STARTED: ${gameDuration} MIN TIMER ACTIVATED.`);
    } else {
      addLog(`TIMER ERROR: ${error.message}`);
    }
  };

  const handleTimerReset = async () => {
    const { error } = await supabase
      .from("teams")
      .update({
        start_time: null,
        paused_at: null,
      })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (!error) {
      addLog("TIMER RESET: GAME MOVED TO STANDBY PHASE.");
      setTimeLeft(gameDuration * 60);
    } else {
      addLog(`TIMER RESET ERROR: ${error.message}`);
    }
  };

  const handlePauseToggle = async () => {
    const newState = !isSystemPaused;
    setIsSystemPaused(newState);
    const now = new Date().toISOString();

    if (newState) {
      await supabase
        .from("teams")
        .update({ paused_at: now })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      addLog("SYSTEM PAUSED (Server-Side)");
    } else {
      const { data: allTeams } = await supabase
        .from("teams")
        .select("id, start_time, paused_at");

      if (allTeams) {
        const updates = allTeams
          .map((t) => {
            if (!t.paused_at) return null;

            const pauseTime = new Date(t.paused_at).getTime();
            const resumeTime = new Date(now).getTime();
            const duration = resumeTime - pauseTime; // ms to shift

            const oldStart = new Date(t.start_time).getTime();
            const newStart = new Date(oldStart + duration).toISOString();

            return {
              id: t.id,
              start_time: newStart,
              paused_at: null,
            };
          })
          .filter(Boolean);
        for (const update of updates) {
          await supabase.from("teams").update(update).eq("id", update.id);
        }

        addLog("SYSTEM RESUMED. Timers adjusted.");
      }
    }
  };

  const handleTimeAdjustment = async (minutes) => {
    if (teams.length === 0) return;
    const currentDuration = teams[0].duration_minutes || 60;
    const newDuration = Math.max(1, currentDuration + minutes); // Min 1 minute

    const { error } = await supabase
      .from("teams")
      .update({ duration_minutes: newDuration })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (!error) {
      addLog(
        `TIME ADJUSTED: ${minutes > 0 ? "+" : ""}${minutes} MIN (Total: ${newDuration}m)`,
      );
    } else {
      addLog(`ADJUST ERROR: ${error.message}`);
    }
  };

  const handleIncrement = async (team) => {
    // Hard limit to 6 nodes
    if ((team.current_node || 0) >= 6) return;

    const { error } = await supabase
      .from("teams")
      .update({
        current_node: (team.current_node || 0) + 1,
        score: (team.score || 0) + 100,
        is_finished: false,
      })
      .eq("id", team.id);

    if (!error) {
      addLog(
        `ADMIN: Promoted Team ${team.team_name} to Node ${team.current_node + 1}`,
      );
      toast.success(`Promoted ${team.team_name}`);
      fetchTeams();
      setIsManageTeamOpen(false);
    } else {
      addLog(`PROMOTE ERROR: ${error.message}`);
      toast.error("Failed to promote team");
    }
  };

  const handleDowngrade = async (team) => {
    // Allow downgrade if node > 1 OR score > 0 (to fix score glitches)
    if (team.current_node <= 1 && (team.score || 0) <= 0) return;

    const { error } = await supabase
      .from("teams")
      .update({
        current_node: Math.max(1, team.current_node - 1),
        score: Math.max(0, (team.score || 0) - 100),
        is_finished: false,
      })
      .eq("id", team.id);

    if (!error) {
      addLog(
        `ADMIN: Downgraded Team ${team.team_name} to Node ${team.current_node - 1}`,
      );
      toast.success(`Downgraded ${team.team_name}`);
      fetchTeams();
      setIsManageTeamOpen(false);
    } else {
      addLog(`DOWNGRADE ERROR: ${error.message}`);
      toast.error("Failed to downgrade team");
    }
  };

  const handleNukeReset = async () => {
    const { error } = await supabase
      .from("teams")
      .update({
        current_node: 1,
        score: 0,
        is_finished: false,
        last_solved_at: null,
      })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (!error) {
      addLog("WARNING: GLOBAL RESET EXECUTED. ALL TEAMS REVERTED TO NODE 01.");
      setIsNukeOpen(false);
      fetchTeams();
    } else {
      addLog(`RESET FAILED: ${error.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 font-mono text-amber-500">
        <div className="border border-amber-900/50 bg-black p-8 max-w-sm w-full shadow-[0_0_30px_rgba(255,191,0,0.1)]">
          <div className="flex flex-col items-center mb-6 gap-2">
            <Lock className="w-12 h-12 text-amber-600 mb-2" />
            <h1 className="text-xl font-bold tracking-widest text-amber-100">
              RESTRICTED ACCESS
            </h1>
            <p className="text-xs text-amber-800">
              ENTER COMMAND OVERRIDE CODE
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <Input
              type="password"
              className="bg-black border-amber-800 text-amber-400 text-center tracking-widest font-bold"
              placeholder="••••••••"
              value={authInput}
              onChange={(e) => setAuthInput(e.target.value)}
              autoFocus
            />
            {authError && (
              <p className="text-red-500 text-xs text-center font-bold">
                ACCESS DENIED
              </p>
            )}
            <Button className="w-full bg-amber-900/30 border border-amber-700 hover:bg-amber-800 text-amber-400 font-bold tracking-widest">
              AUTHENTICATE
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-amber-400 font-mono p-4 selection:bg-amber-900/40">
      <header className="mb-8 border-b border-amber-900/50 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-900/20 rounded border border-amber-800">
            <Shield className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-widest text-amber-100 flex items-center gap-4">
              ADMIN_CONSOLE
              <span className="text-amber-500 font-mono text-xl border border-amber-500/30 px-2 py-1 rounded bg-amber-950/50">
                {formatTime(timeLeft)}
              </span>
            </h1>
            <p className="text-xs text-amber-800 uppercase tracking-[0.3em]">
              Central Command Interface
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-green-900/20 rounded border border-green-800 text-green-500 font-mono text-xs font-bold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {onlineCount} ONLINE
          </div>
          <div className="px-3 py-1 bg-amber-900/20 rounded text-xs text-amber-600 font-mono">
            V.1.0.4-STABLE
          </div>
          <div className="px-3 py-1 bg-amber-900/20 rounded border border-amber-800">
            <span className="text-xs font-bold">
              {isSystemPaused ? "SYSTEM PAUSED" : "SYSTEM ACTIVE"}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-amber-900/30 bg-black/40 rounded p-4">
            <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-amber-400">
              <Users className="w-4 h-4" /> TEAM_STATUS_MONITOR
            </h2>
            <Table>
              <TableHeader>
                <TableRow className="border-amber-900/50 hover:bg-transparent">
                  <TableHead className="text-amber-700">Team Name</TableHead>
                  <TableHead className="text-amber-700">Access Code</TableHead>
                  <TableHead className="text-amber-700">Members</TableHead>
                  <TableHead className="text-amber-700">Node</TableHead>
                  <TableHead className="text-amber-700">Score</TableHead>
                  <TableHead className="text-amber-700 text-right">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow
                    key={team.id}
                    className="border-amber-900/20 hover:bg-amber-900/10"
                  >
                    <TableCell className="font-bold">
                      {team.team_name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {team.access_code}
                    </TableCell>
                    <TableCell
                      className="text-xs text-amber-600 max-w-[150px] truncate"
                      title={team.members}
                    >
                      {team.members || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>0{team.current_node}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-amber-500 hover:bg-amber-900/30"
                          onClick={() => {
                            setSelectedTeam(team);
                            setIsManageTeamOpen(true);
                          }}
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{team.score}</TableCell>
                    <TableCell className="text-right">
                      {team.is_finished ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/30 text-green-500 border border-green-800">
                          COMPLETED
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded textxs font-medium bg-amber-900/30 text-amber-500 border border-amber-800">
                          ACTIVE
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-6">
          {/* Controls */}
          <div className="border border-amber-900/30 bg-black/40 rounded p-4 space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2 text-amber-400">
              <Radio className="w-4 h-4" /> GLOBAL_COMMANDS
            </h2>

            {/* Broadcast */}
            <div className="space-y-2">
              <label className="text-xs text-amber-700">Broadcast Alert</label>
              <div className="flex gap-2">
                <Input
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  placeholder="Type message..."
                  className="bg-black border-amber-900 focus-visible:ring-amber-500 h-8 text-xs"
                />
                <Button
                  size="sm"
                  onClick={handleBroadcast}
                  className="bg-amber-700 hover:bg-amber-600 h-8"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="h-px bg-amber-900/30 my-4" />

            {/* Pause System */}
            <div className="flex items-center justify-between bg-amber-900/20 p-3 rounded border border-amber-800/50">
              <span className="text-sm font-bold text-amber-500 tracking-wider">
                PAUSE SYSTEM TIMERS
              </span>
              <Switch
                checked={isSystemPaused}
                onCheckedChange={handlePauseToggle}
                className="data-[state=checked]:bg-amber-600 bg-amber-950 border border-amber-800"
              />
            </div>

            <div className="h-px bg-amber-900/30 my-4" />

            {/* Start Timer */}
            <div className="mb-4 space-y-2">
              <label className="text-xs text-amber-700 font-bold">
                GAME DURATION (MINUTES)
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={gameDuration}
                  onChange={(e) => setGameDuration(Number(e.target.value))}
                  className="bg-black border-amber-800 text-amber-400 w-20 text-center font-mono"
                />
                <Button
                  onClick={handleStartTimer}
                  className="flex-1 bg-amber-900/30 border border-amber-700 hover:bg-amber-800 text-amber-400 font-bold tracking-widest"
                >
                  <Play className="w-4 h-4 mr-2" /> BEGIN COUNTDOWN
                </Button>
                <Button
                  onClick={handleTimerReset}
                  className="bg-red-900/20 border border-red-800 text-red-500 hover:bg-red-900/40"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="h-px bg-amber-900/30 my-4" />

            {/* Time Adjust */}
            <div className="space-y-2">
              <label className="text-xs text-amber-700 font-bold">
                ADJUST REMAINING TIME
              </label>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  size="sm"
                  onClick={() => handleTimeAdjustment(1)}
                  className="bg-green-900/20 border border-green-800 text-green-500 hover:bg-green-900/40"
                >
                  +1 M
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleTimeAdjustment(5)}
                  className="bg-green-900/20 border border-green-800 text-green-500 hover:bg-green-900/40"
                >
                  +5 M
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleTimeAdjustment(-1)}
                  className="bg-red-900/20 border border-red-800 text-red-500 hover:bg-red-900/40"
                >
                  -1 M
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleTimeAdjustment(-5)}
                  className="bg-red-900/20 border border-red-800 text-red-500 hover:bg-red-900/40"
                >
                  -5 M
                </Button>
              </div>
            </div>

            {/* NUKE BUTTON */}
            <Dialog open={isNukeOpen} onOpenChange={setIsNukeOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full bg-red-900/50 border border-red-700 hover:bg-red-900 text-red-400 font-bold tracking-widest"
                >
                  <AlertCircle className="w-4 h-4 mr-2" /> NUKE PROGRESS
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black border-red-700 text-red-500">
                <DialogHeader>
                  <DialogTitle>CONFIRM PROTOCOL RESET</DialogTitle>
                  <DialogDescription className="text-red-700">
                    Are you sure? This will wipe all team progress and revert
                    everyone to Node 01. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setIsNukeOpen(false)}
                    className="hover:bg-red-950/30 text-red-700"
                  >
                    CANCEL
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleNukeReset}
                    className="bg-red-600 hover:bg-red-500 text-black font-bold"
                  >
                    CONFIRM RESET
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Manage Team Dialog */}
            <Dialog open={isManageTeamOpen} onOpenChange={setIsManageTeamOpen}>
              <DialogContent className="bg-black border-amber-700 text-amber-500">
                <DialogHeader>
                  <DialogTitle className="tracking-widest flex items-center gap-2">
                    <Settings className="w-4 h-4" /> MANAGE TEAM CLEARANCE
                  </DialogTitle>
                  <DialogDescription className="text-amber-800">
                    Manually adjust node level for:{" "}
                    <span className="text-amber-400 font-bold">
                      {selectedTeam?.team_name}
                    </span>
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                  <div className="flex justify-between items-center bg-amber-900/10 p-4 border border-amber-900/30 rounded">
                    <div className="text-center">
                      <div className="text-xs text-amber-700 uppercase">
                        Current Node
                      </div>
                      <div className="text-2xl font-bold font-mono text-amber-400">
                        0{selectedTeam?.current_node}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-amber-700 uppercase">
                        Score
                      </div>
                      <div className="text-2xl font-bold font-mono text-amber-400">
                        {selectedTeam?.score}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-24 bg-red-900/10 border-red-900/50 hover:bg-red-900/30 text-red-500 flex flex-col gap-2"
                      onClick={() => handleDowngrade(selectedTeam)}
                      disabled={
                        selectedTeam?.current_node <= 1 &&
                        (selectedTeam?.score || 0) <= 0
                      }
                    >
                      <ChevronDown className="w-8 h-8" />
                      <span className="font-bold">DEMOTE (-1)</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-24 bg-green-900/10 border-green-900/50 hover:bg-green-900/30 text-green-500 flex flex-col gap-2"
                      onClick={() => handleIncrement(selectedTeam)}
                      disabled={selectedTeam?.current_node >= 6}
                    >
                      <ChevronUp className="w-8 h-8" />
                      <span className="font-bold">PROMOTE (+1)</span>
                    </Button>
                  </div>

                  <p className="text-[10px] text-center text-amber-800 font-mono">
                    WARNING: Downgrading will reduce score by 100pts instantly.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* System Log */}
          <div className="border border-amber-900/30 bg-black/40 rounded p-4 h-[300px] flex flex-col">
            <h2 className="text-sm font-bold mb-2 flex items-center gap-2 text-amber-400">
              <Terminal className="w-4 h-4" /> SYSTEM_LOG
            </h2>
            <div className="flex-1 overflow-y-auto text-xs space-y-2 font-mono p-3 bg-black border border-amber-900/30 rounded shadow-inner">
              {systemLog.length === 0 && (
                <span className="text-amber-700 italic">
                  System initialized. Listening for events...
                </span>
              )}
              {systemLog.map((log, i) => (
                <div
                  key={i}
                  className={`p-2 rounded border-l-2 ${log.includes("VOLUNTEER") ? "bg-red-950/20 border-red-500 text-red-400 font-bold" : "bg-amber-950/10 border-amber-600/50 text-amber-400"}`}
                >
                  <span className="opacity-70 mr-2">{log.split("]")[0]}]</span>
                  <span>{log.split("]").slice(1).join("]")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
