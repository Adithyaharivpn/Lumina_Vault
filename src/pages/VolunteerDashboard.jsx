import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Radio,
  Shield,
  Users,
  ArrowBigRight,
  BellRing,
  UserCheck,
} from "lucide-react";

export default function VolunteerDashboard() {
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return sessionStorage.getItem("volunteer_auth") === "true";
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  // State
  const [nodes, setNodes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedNode, setSelectedNode] = useState("1"); // Default to Node 1
  const [loading, setLoading] = useState(true);

  // Actions State
  const [selectedTeamForAdvance, setSelectedTeamForAdvance] = useState(null);
  const [isAdvanceDialogOpen, setIsAdvanceDialogOpen] = useState(false);
  const [callSent, setCallSent] = useState(false);

  // Channel
  const [channel, setChannel] = useState(null);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(3600);

  const handleAuth = (e) => {
    e.preventDefault();
    if (passwordInput === "volunteer") {
      setIsAuthorized(true);
      sessionStorage.setItem("volunteer_auth", "true");
    } else {
      setAuthError("ACCESS DENIED");
      setTimeout(() => setAuthError(""), 2000);
    }
  };

  // 1. Init Data & Subscription
  useEffect(() => {
    if (!isAuthorized) return; // Add check to not run data fetching if not authorized

    fetchNodes();
    fetchTeams();

    const newChannel = supabase
      .channel("game_room")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        () => {
          fetchTeams(); // Refresh on any team update
        },
      )
      .subscribe();

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [isAuthorized]); // Add dependency

  // Timer Logic (Synced with first available team or global)
  useEffect(() => {
    if (!isAuthorized) return;

    const calculateTime = () => {
      // Use the first team as the "Master Clock" reference since all are synced
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
  }, [teams, isAuthorized]);

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

  // 2. Data Fetchers
  const fetchNodes = async () => {
    const { data } = await supabase.from("nodes").select("*").order("id");
    if (data) setNodes(data);
  };

  const fetchTeams = async () => {
    const { data } = await supabase
      .from("teams")
      .select("*")
      .order("last_solved_at", { ascending: true });
    if (data) {
      setTeams(data);
      setLoading(false);
    }
  };

  // 3. Computed
  // Filter teams currently at the selected node
  const activeTeams = teams.filter(
    (t) => t.current_node === Number(selectedNode) && !t.is_finished,
  );

  // 4. Actions
  const handleManualAdvance = async () => {
    if (!selectedTeamForAdvance) return;

    const nextNodeId = selectedTeamForAdvance.current_node + 1;
    const isFinished = nextNodeId > nodes.length;

    const { error } = await supabase
      .from("teams")
      .update({
        current_node: isFinished
          ? selectedTeamForAdvance.current_node
          : nextNodeId,
        score: (selectedTeamForAdvance.score || 0) + 100,
        last_solved_at: new Date().toISOString(),
        is_finished: isFinished,
      })
      .eq("id", selectedTeamForAdvance.id);

    if (!error) {
      // Log the action
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "system_alert",
          payload: {
            message: `[MANUAL OVERRIDE] Team ${selectedTeamForAdvance.team_name} advanced by Volunteer at Node ${selectedNode}.`,
          },
        });
      }

      setIsAdvanceDialogOpen(false);
      setSelectedTeamForAdvance(null);
    }
  };

  const handleCallAdmin = async () => {
    if (!channel) return;

    const nodeName =
      nodes.find((n) => n.id === Number(selectedNode))?.node_name ||
      `Node ${selectedNode}`;

    const resp = await channel.send({
      type: "broadcast",
      event: "system_alert",
      payload: {
        message: `[VOLUNTEER REQUEST] Assistance needed at ${nodeName}.`,
      },
    });

    console.log("Broadcast send result:", resp);

    if (resp !== "ok") {
      alert("Network Error: Could not notify admin.");
      return;
    }

    setCallSent(true);
    setTimeout(() => setCallSent(false), 3000);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 font-mono text-blue-500">
        <div className="border border-blue-900/50 bg-black p-8 max-w-sm w-full shadow-[0_0_30px_rgba(0,100,255,0.1)]">
          <div className="flex flex-col items-center mb-6 gap-2">
            <Shield className="w-12 h-12 text-blue-600 mb-2" />
            <h1 className="text-xl font-bold tracking-widest text-blue-100">
              VOLUNTEER ACCESS
            </h1>
            <p className="text-xs text-blue-800">ENTER STATION CODE</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              className="w-full bg-black border-2 border-blue-900 text-blue-400 text-center tracking-widest font-bold h-12 rounded focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
            />
            {authError && (
              <p className="text-red-500 text-xs text-center font-bold animate-pulse">
                {authError}
              </p>
            )}
            <Button className="w-full bg-blue-900/30 border border-blue-700 hover:bg-blue-800 text-blue-400 font-bold tracking-widest">
              AUTHENTICATE
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-blue-400 font-mono p-4 selection:bg-blue-900/40">
      {/* Header */}
      <header className="mb-8 border-b border-blue-900/50 pb-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-900/20 rounded border border-blue-800">
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-widest text-blue-100 flex items-center gap-4">
              STATION_CONTROL
              <span className="text-blue-500 font-mono text-xl border border-blue-500/30 px-2 py-1 rounded bg-blue-950/50">
                {formatTime(timeLeft)}
              </span>
            </h1>
            <p className="text-xs text-blue-800 uppercase tracking-[0.3em]">
              Volunteer Access Terminal
            </p>
          </div>
        </div>

        {/* Node Selector */}
        <div className="w-full md:w-64">
          <label className="text-xs font-bold text-blue-700 mb-1 block">
            SELECT ACTIVE STATION
          </label>
          <Select value={selectedNode} onValueChange={setSelectedNode}>
            <SelectTrigger className="bg-blue-950/30 border-blue-800 text-blue-200 font-bold h-12">
              <SelectValue placeholder="Select Node..." />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-blue-800 text-blue-300">
              {nodes.map((node) => (
                <SelectItem key={node.id} value={String(node.id)}>
                  NODE {String(node.id).padStart(2, "0")}: {node.node_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Controls & Stats */}
        <div className="space-y-6">
          <Card className="bg-blue-950/10 border-blue-900/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-blue-300 flex items-center gap-2">
                <Radio className="w-4 h-4" /> STATION STATUS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-6 border border-blue-900/30 rounded bg-blue-950/20">
                <div className="text-4xl font-bold text-blue-100 mb-1">
                  {activeTeams.length}
                </div>
                <div className="text-xs text-blue-500 tracking-widest uppercase">
                  Teams Present
                </div>
              </div>

              <Button
                onClick={handleCallAdmin}
                disabled={callSent}
                className={`w-full font-bold tracking-wider py-6 transition-all ${
                  callSent
                    ? "bg-green-900/40 text-green-400 border border-green-700"
                    : "bg-blue-900/20 border border-blue-600/50 text-blue-400 hover:bg-blue-900/40"
                }`}
              >
                <BellRing
                  className={`w-4 h-4 mr-2 ${callSent ? "animate-bounce" : ""}`}
                />
                {callSent ? "ADMIN NOTIFIED" : "CALL ADMIN"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Team List */}
        <div className="lg:col-span-2">
          <Card className="bg-transparent border-none shadow-none">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-bold text-blue-200 flex items-center gap-2">
                <Users className="w-5 h-5" /> TEAMS AT STATION
              </CardTitle>
              <CardDescription className="text-blue-800">
                Manage teams currently attempting this node.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {loading ? (
                <p className="text-blue-900 animate-pulse">Scanning...</p>
              ) : activeTeams.length === 0 ? (
                <div className="text-center p-12 border border-dashed border-blue-900/30 rounded text-blue-900">
                  NO TEAMS DETECTED AT THIS COORDINATE
                </div>
              ) : (
                <div className="grid gap-3">
                  {activeTeams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between p-4 bg-blue-950/10 border border-blue-900/30 rounded hover:border-blue-700/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="text-xl font-bold text-blue-300">
                          {team.team_name}
                        </div>
                        <div className="text-xs text-blue-600 font-mono">
                          ID: {team.access_code || team.id.slice(0, 8)} | Score:{" "}
                          {team.score}
                        </div>
                      </div>

                      <Dialog
                        open={
                          isAdvanceDialogOpen &&
                          selectedTeamForAdvance?.id === team.id
                        }
                        onOpenChange={(open) =>
                          !open && setIsAdvanceDialogOpen(false)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedTeamForAdvance(team);
                              setIsAdvanceDialogOpen(true);
                            }}
                            className="border-blue-800 hover:bg-blue-900 text-blue-400 font-bold"
                          >
                            MANUAL ADVANCE{" "}
                            <ArrowBigRight className="w-4 h-4 ml-1" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-neutral-950 border-blue-800 text-blue-200">
                          <DialogHeader>
                            <DialogTitle>CONFIRM MANUAL OVERRIDE</DialogTitle>
                            <DialogDescription className="text-blue-600">
                              By advancing <strong>{team.team_name}</strong>{" "}
                              manually, you certify that they have completed the
                              task but are unable to submit via their terminal.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="ghost"
                              onClick={() => setIsAdvanceDialogOpen(false)}
                              className="text-blue-500 hover:bg-blue-900/20"
                            >
                              CANCEL
                            </Button>
                            <Button
                              onClick={handleManualAdvance}
                              className="bg-blue-700 hover:bg-blue-600 text-white font-bold"
                            >
                              CONFIRM ADVANCE
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
