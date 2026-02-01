import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Terminal, Activity, Radio, AlertTriangle, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function SpectatorDashboard() {
  const [teams, setTeams] = useState([]);
  const [logs, setLogs] = useState([]);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [nodes, setNodes] = useState([]);
  const [nodesCount, setNodesCount] = useState(5);
  const [breachAlert, setBreachAlert] = useState(null);
  const [winner, setWinner] = useState(null);
  const teamsRef = useRef([]);

  useEffect(() => {
    teamsRef.current = teams;
  }, [teams]);

  useEffect(() => {
    const init = async () => {
      const { data: nodesData } = await supabase
        .from("nodes")
        .select("*")
        .order("id", { ascending: true });

      if (nodesData) {
        setNodes(nodesData);
        setNodesCount(nodesData.length);
      }
      const { data } = await supabase.from("teams").select("*");
      if (data) {
        setTeams(data);
        setLogs([
          {
            msg: "COMMAND CENTER ONLINE",
            time: new Date().toLocaleTimeString(),
            type: "system",
          },
        ]);
        const existingWinner = data.find((t) => t.is_finished);
        if (existingWinner) setWinner(existingWinner);
      }
    };
    init();

    //Realtime Subscription
    const channel = supabase
      .channel("game_room")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "teams" },
        (payload) => {
          const oldTeamState = teamsRef.current.find(
            (t) => t.id === payload.new.id,
          );
          handleTeamUpdate(payload.new, oldTeamState);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "teams" },
        (payload) => {
          setTeams((prev) => [...prev, payload.new]);
          addLog(
            `NEW SIGNAL DETECTED: ${payload.new.team_name.toUpperCase()}`,
            "info",
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  //Logic & Event Handling
  const handleTeamUpdate = (newTeam, oldTeam) => {
    setTeams((prev) => prev.map((t) => (t.id === newTeam.id ? newTeam : t)));
    if (oldTeam && newTeam.current_node > oldTeam.current_node) {
      const nodeName =
        nodes[newTeam.current_node - 1]?.name || `NODE ${newTeam.current_node}`;
      setBreachAlert({
        teamName: newTeam.team_name,
        nodeName: nodeName,
      });
      setTimeout(() => setBreachAlert(null), 3000);

      addLog(
        `BREACH CONFIRMED: ${newTeam.team_name} >> ${nodeName}`,
        "success",
      );
    }
    else if (oldTeam && newTeam.is_finished && !oldTeam.is_finished) {
      setWinner(newTeam);
      addLog(`MISSION ACCOMPLISHED: ${newTeam.team_name}`, "win");
    }
  };

  const addLog = (msg, type = "info") => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLogs((prev) => [{ msg, time, type }, ...prev].slice(0, 10));
  };

  //Timer Sync
  const isPaused = teams.length > 0 && !!teams[0]?.paused_at;

  useEffect(() => {
    const calculateTime = () => {
      if (teams.length === 0 || !teams[0]?.start_time) return;
      const referenceTeam = teams[0];
      const startTime = new Date(referenceTeam.start_time).getTime();
      const durationSeconds = (referenceTeam.duration_minutes || 60) * 60;

      if (referenceTeam.paused_at) {
        const pauseTime = new Date(referenceTeam.paused_at).getTime();
        const elapsed = Math.floor((pauseTime - startTime) / 1000);
        setTimeLeft(Math.max(0, durationSeconds - elapsed));
      } else {
        const now = new Date().getTime();
        const elapsed = Math.floor((now - startTime) / 1000);
        setTimeLeft(Math.max(0, durationSeconds - elapsed));
      }
    };
    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [teams]);

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

  const stats = useMemo(() => {
    const totalBreaches = teams.reduce(
      (acc, t) => acc + (t.current_node || 0),
      0,
    );
    const sortedTeams = [...teams].sort(
      (a, b) => b.score - a.score || b.current_node - a.current_node,
    );
    const leader = sortedTeams[0];

    let leaderProgress = 0;
    if (leader) {
      if (leader.is_finished) {
        leaderProgress = nodesCount;
      } else {
        leaderProgress = Math.max(0, (leader.current_node || 1) - 1);
      }
    }

    return {
      totalBreaches,
      leaderName: leader ? leader.team_name : "N/A",
      activeCount: teams.length,
      completion: Math.round((leaderProgress / (nodesCount || 1)) * 100),
    };
  }, [teams, nodesCount]);

  const getDisplayNode = (team) => {
    if (team.is_finished) return nodesCount;
    return Math.max(0, (team.current_node || 1) - 1);
  };

  const teamsByNode = useMemo(() => {
    const map = {};
    teams.forEach((t) => {
      const node = getDisplayNode(t);
      if (!map[node]) map[node] = [];
      map[node].push(t);
    });
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => a.id.localeCompare(b.id));
    });
    return map;
  }, [teams, nodesCount]);

  const getTeamOffset = (team) => {
    const node = getDisplayNode(team);
    const group = teamsByNode[node] || [];
    const index = group.findIndex((t) => t.id === team.id);
    const yOffset = -(index * 25);
    return { y: yOffset };
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono overflow-hidden relative selection:bg-green-900/40">
      <div
        className="absolute inset-0 pointer-events-none z-50 mix-blend-overlay opacity-30 animate-[scan_4s_linear_infinite]"
        style={{
          background:
            "linear-gradient(to bottom, transparent 50%, rgba(0, 255, 0, 0.1) 51%, transparent 52%)",
          backgroundSize: "100% 10px",
        }}
      />
      <div className="absolute inset-0 pointer-events-none z-40 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-hard-light" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,50,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,50,0,0.1)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-80 pointer-events-none" />
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <div className="text-center relative">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  textShadow: [
                    "0 0 10px #0f0",
                    "0 0 30px #0f0",
                    "0 0 10px #0f0",
                  ],
                }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-8xl font-black text-green-400 tracking-widest mb-4 glitch-effect"
              >
                MISSION COMPLETE
              </motion.div>
              <div className="text-4xl text-white font-bold tracking-[0.5em] animate-pulse">
                WINNER: {winner.team_name}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {breachAlert && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-32 left-0 right-0 z-90 flex justify-center pointer-events-none"
          >
            <div className="bg-red-950/90 border-2 border-red-500 text-red-500 px-12 py-6 rounded-lg shadow-[0_0_50px_rgba(255,0,0,0.4)] backdrop-blur-xl flex flex-col items-center">
              <AlertTriangle className="w-12 h-12 mb-2 animate-bounce" />
              <h2 className="text-4xl font-black tracking-widest animate-pulse">
                BREACH DETECTED
              </h2>
              <div className="text-xl text-white font-bold mt-2 tracking-[0.2em]">
                {breachAlert.teamName} &gt;&gt; {breachAlert.nodeName}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-start z-10 border-b border-green-900/30 bg-black/50 backdrop-blur-sm">
        <div>
          <h1 className="text-4xl font-bold tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            WAR ROOM
          </h1>
          <div className="flex items-center gap-2 text-green-600 mt-2">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="text-sm tracking-widest">LIVE SATELLITE FEED</span>
          </div>
        </div>

        {/* Central Timer */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-4 flex flex-col items-center">
          <div
            className={`text-8xl font-black tabular-nums tracking-widest text-transparent bg-clip-text transition-colors duration-500 ${isPaused ? "bg-red-500 from-red-500 to-red-900" : "bg-linear-to-b from-white to-green-500"} drop-shadow-[0_0_30px_rgba(0,255,0,0.4)]`}
          >
            {formatTime(timeLeft)}
          </div>
          {isPaused ? (
            <div className="text-red-500 font-bold tracking-[0.5em] animate-pulse bg-red-950/50 px-4 py-1 rounded border border-red-900">
              SYSTEM_HALTED
            </div>
          ) : (
            <div className="text-center text-xs text-green-800 tracking-[0.5em] mt-2">
              To Detonation
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-xs text-green-800 tracking-widest mb-1">
            ACTIVE UNITS
          </div>
          <div className="text-3xl font-bold text-white">
            {teams.length.toString().padStart(2, "0")}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="absolute inset-0 flex flex-col pt-40 pb-10 px-10 z-0">
        <div className="flex-1 relative flex items-center justify-center">
          <div className="w-full h-1 bg-green-900/30 relative">
            <div className="absolute top-0 left-0 h-full bg-green-500/20 w-full animate-pulse" />

            {/* Node Markers */}
            {Array.from({ length: nodesCount + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
                style={{ left: `${(i / nodesCount) * 100}%` }}
              >
                <div className="absolute -top-12 text-[10px] text-green-700/70 font-bold whitespace-nowrap tracking-widest uppercase border border-green-900/30 px-2 py-1 rounded bg-black/60 backdrop-blur-sm">
                  {i === 0 ? "START" : nodes[i - 1]?.name || `NODE ${i}`}
                </div>
                <div className="w-4 h-4 bg-black border border-green-800 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(0,255,0,0.2)]">
                  <div className="w-1 h-1 bg-green-600 rounded-full" />
                </div>
              </div>
            ))}
            {teams.map((team) => {
              const displayNode = getDisplayNode(team);
              const percent = (displayNode / nodesCount) * 100;
              const clampedPercent = Math.min(100, Math.max(0, percent));
              const { y } = getTeamOffset(team);
              const rank =
                [...teams]
                  .sort(
                    (a, b) =>
                      (b.score || 0) - (a.score || 0) ||
                      (b.current_node || 0) - (a.current_node || 0),
                  )
                  .findIndex((t) => t.id === team.id) + 1;

              return (
                <motion.div
                  key={team.id}
                  layout
                  initial={{ left: "0%" }}
                  animate={{ left: `${clampedPercent}%`, y: y }}
                  transition={{ type: "spring", stiffness: 50, damping: 20 }} 
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 group hover:z-50"
                  style={{ y: y }} 
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-[0_0_15px_#fff] relative cursor-pointer hover:scale-125 transition-transform flex items-center justify-center">
                    <div className="absolute inset-0 bg-green-400 rounded-full opacity-50 animate-ping" />
                    <div className="w-1 h-1 bg-black rounded-full z-10" />
                  </div>

                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-green-400 bg-black/80 px-2 py-1 border border-green-900/50 rounded whitespace-nowrap shadow-lg flex flex-col items-center z-50">
                    <span>
                      <span className="text-yellow-500 mr-1">[#{rank}]</span>
                      {team.team_name}
                    </span>
                    <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-green-900/50 absolute -top-1" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="h-56 grid grid-cols-3 gap-6">
          <div className="col-span-1 border border-green-900/30 p-6 rounded-2xl bg-black/40 backdrop-blur-md shadow-[0_0_20px_rgba(0,50,0,0.3)] overflow-hidden flex flex-col">
            <h3 className="text-xs font-bold text-green-500 tracking-widest mb-4 flex items-center gap-2 uppercase opacity-80">
              <Trophy className="w-4 h-4 text-yellow-500" /> Squadron
              Leaderboard
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence>
                {[...teams]
                  .sort(
                    (a, b) =>
                      (b.score || 0) - (a.score || 0) ||
                      (b.current_node || 0) - (a.current_node || 0),
                  )
                  .slice(0, 5)
                  .map((t, i) => (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`flex justify-between items-center text-sm p-2 rounded ${i === 0 ? "bg-green-900/20 border border-green-500/30" : "border-b border-green-900/10"}`}
                    >
                      <span className="text-white font-bold flex items-center gap-3">
                        <span
                          className={`text-xs w-4 h-4 flex items-center justify-center rounded-full ${i === 0 ? "bg-yellow-500 text-black" : "bg-green-900 text-green-300"}`}
                        >
                          {i + 1}
                        </span>
                        {t.team_name}
                      </span>
                      <span className="text-green-400 font-mono font-bold">
                        {t.score}{" "}
                        <span className="text-[10px] opacity-50">PTS</span>
                      </span>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Live Mission Stats*/}
          <div className="col-span-1 border border-green-900/30 p-6 rounded-2xl bg-black/40 backdrop-blur-md shadow-[0_0_20px_rgba(0,50,0,0.3)] flex flex-col justify-between relative overflow-hidden group">
            {/* Decor elements */}
            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
              <Activity className="w-24 h-24 text-green-500" />
            </div>

            <h3 className="text-xs font-bold text-green-500 tracking-widest mb-4 uppercase opacity-80 z-10">
              Mission Telemetry
            </h3>

            <div className="grid grid-cols-2 gap-4 z-10">
              <div>
                <div className="text-[10px] text-green-700 uppercase tracking-wider">
                  Total Breaches
                </div>
                <div className="text-4xl font-black text-white">
                  {stats.totalBreaches}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-green-700 uppercase tracking-wider">
                  Lead Unit
                </div>
                <div className="text-xl font-bold text-green-300 truncate">
                  {stats.leaderName}
                </div>
              </div>
              <div className="col-span-2 mt-2">
                <div className="text-[10px] text-green-700 uppercase tracking-wider mb-1">
                  Mission Completion
                </div>
                <div className="h-2 bg-green-900/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.completion}%` }}
                    className="h-full bg-green-500 shadow-[0_0_10px_#0f0]"
                  />
                </div>
                <div className="text-right text-xs text-green-500 mt-1">
                  {stats.completion}%
                </div>
              </div>
            </div>
          </div>

          {/* Live System Events */}
          <div className="col-span-1 border border-green-900/30 p-6 rounded-2xl bg-black/40 backdrop-blur-md shadow-[0_0_20px_rgba(0,50,0,0.3)] relative overflow-hidden flex flex-col">
            <h3 className="text-xs font-bold text-green-500 tracking-widest mb-4 flex items-center gap-2 uppercase opacity-80">
              <Terminal className="w-4 h-4" /> System Events
            </h3>
            <div className="flex-1 overflow-hidden relative">
              <div className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col-reverse gap-2">
                <AnimatePresence>
                  {logs.map((log, i) => (
                    <motion.div
                      key={`${log.time}-${i}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`text-xs font-mono p-2 rounded border-l-2 ${
                        log.type === "win"
                          ? "bg-yellow-900/20 border-yellow-500 text-yellow-200"
                          : log.type === "success"
                            ? "bg-green-900/20 border-green-400 text-white"
                            : "border-green-800 text-green-600"
                      }`}
                    >
                      <span className="opacity-50 mr-2">[{log.time}]</span>
                      <span className="font-bold">{log.msg}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 50, 0, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 150, 0, 0.3);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
