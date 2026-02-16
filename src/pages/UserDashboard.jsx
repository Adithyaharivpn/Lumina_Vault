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
  Loader2,
  X,
  QrCode,
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
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
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import WaitingScreen from "./WaitingScreen";

function LockedVault({ team, onSuccess }) {
  const [showInput, setShowInput] = useState(false);
  const [vaultInput, setVaultInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const _CORE_HASH = "R09MREVOV0FMTEJSRUFDSEVE";
  const decodedHash = atob(_CORE_HASH);

  useEffect(() => {
    console.clear();
    console.log(
      "%c SECURITY OVERRIDE CONSOLE",
      "color: #00ff41; font-size: 20px; font-weight: bold;",
    );
  }, []);

  const handleReveal = () => {
    setShowInput(true);
    console.log("UPLINK: Manual input field authorized.");
  };

  const checkKey = async () => {
    setLoading(true);
    setTimeout(async () => {
      if (vaultInput.trim().toUpperCase() === decodedHash) {
        setSuccess(true);
        console.log(
          "ALARM: Vault integrity compromised. Accessing main stage files...",
        );
        await onSuccess();
      } else {
        alert("INVALID KEY: Access denied. IP address logged.");
        setLoading(false);
      }
    }, 1500);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0d0d] text-center p-6 relative overflow-hidden font-mono text-gold-500">
        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,3px_100%] bg-repeat" />

        <div className="border-2 border-dashed border-yellow-400 p-8 animate-pulse text-yellow-400 z-20 bg-black/90 shadow-[0_0_50px_rgba(255,215,0,0.3)]">
          <h2 className="text-3xl font-black mb-4 uppercase tracking-widest">
            ACCESS GRANTED
          </h2>
          <p className="mb-2 text-lg">
            The Digital Vault is open. Claim your prize at the Main Stage!
          </p>
          <p className="text-sm opacity-80 font-mono">TOKEN: #LM-2026-VLT</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden text-[#00ff41]">
      {/* Scanlines Effect */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,3px_100%] bg-repeat" />

      <div className="border-2 border-[#00ff41] p-12 shadow-[0_0_20px_#00ff41] bg-[rgba(0,20,0,0.9)] z-20 max-w-2xl w-full text-center">
        <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-[5px] mb-8">
          SYSTEM: LOCKED
        </h1>
        <p className="text-gray-500 mb-8 font-bold">
          CRITICAL ERROR: Manual override button missing from DOM. Biometric
          verification failed.
        </p>

        <div className="mb-8 border border-green-900/50 p-4 bg-black/50 text-xs font-mono text-left opacity-70">
          <p className="text-green-400 mb-1">&gt;&gt; LATEST INTERCEPT:</p>
          <p className="text-white tracking-widest">[ GOLDENWALLBREACHED ]</p>
        </div>

        <button
          id="override-link"
          onClick={handleReveal}
          style={{
            display: showInput ? "none" : "none",
            backgroundColor: "#00ff41",
            color: "black",
            padding: "15px 30px",
            textDecoration: "none",
            fontWeight: "bold",
            cursor: "pointer",
            border: "none",
            marginTop: "20px",
            fontFamily: "monospace",
          }}
          className="hover:bg-white hover:shadow-[0_0_15px_#ffffff]"
        >
          INITIATE MANUAL OVERRIDE
        </button>

        {showInput && (
          <div className="mt-8 border-t border-[#333] pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="mb-4 font-bold tracking-widest">
              ENTER FINAL BREACH COORDINATES:
            </p>
            <input
              type="text"
              id="vault-input"
              value={vaultInput}
              onChange={(e) => setVaultInput(e.target.value)}
              placeholder="XXXXX-XXXXXXXXXXXXX"
              autoComplete="off"
              className="bg-black border border-[#00ff41] text-[#00ff41] p-3 w-full max-w-xs text-center text-xl outline-none mb-4 placeholder:text-green-900"
            />
            <br />
            <button
              onClick={checkKey}
              disabled={loading}
              className="bg-transparent text-[#00ff41] border border-[#00ff41] px-6 py-2 cursor-pointer transition-colors hover:bg-[#00ff41] hover:text-black font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? "AUTHENTICATING..." : "EXECUTE UPLINK"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [missionAlert, setMissionAlert] = useState(null);

  // Scanner State
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Boot Sequence State
  const [showBoot, setShowBoot] = useState(false);
  const [bootProgress, setBootProgress] = useState(0);

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
    const { data } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .single();
    if (data) setTeam(data);
  };

  const fetchNodes = async () => {
    const { data } = await supabase
      .from("nodes")
      .select("*")
      .order("id", { ascending: true });
    if (data) setNodes(data);
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from("teams")
      .select("*")
      .order("score", { ascending: false })
      .order("last_solved_at", { ascending: true });
    if (data) setLeaderboard(data);
  };

  // Timer
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

  // QR Scanner Logic
  useEffect(() => {
    if (showScanner && !scanResult) {
      const timer = setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false,
        );

        scanner.render(
          (decodedText) => {
            scanner.clear();
            setScanResult(decodedText);
            setTerminalInput(decodedText);
            setShowScanner(false);
            toast.success("DATA EXTRACTED", {
              description: "Sequence loaded into terminal.",
            });
          },
          () => {},
        );
        return () => scanner.clear().catch(console.error);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showScanner, scanResult]);

  // --- NARRATIVE & LOGIC ---

  const getSuccessMessage = (nodeId) => {
    switch (nodeId) {
      case 1:
        return ">> UPLINK ESTABLISHED. Coordinate secured.";
      case 2:
        return ">> SIGNAL LOCKED. Chromatic spectrum matched. Access granted.";
      case 3:
        return ">> GRID SYNCED. Digit acquired. Combining data fragments...";
      case 4:
        return ">> PASSWORD ACCEPTED. Directory 'Logic Gate' unzipped.";
      case 5:
        return ">> FIREWALL DESTROYED. Data Stream Decrypted: [ PASSWORD: GOLDENWALLBREACHED ]. Final Level Unlocked.";
      case 6:
        return ">> MASTER KEY ACCEPTED. THE VAULT IS OPEN. Report to Room 505.";
      default:
        return ">> ENCRYPTION BYPASSED. NODE SECURE. PROCEED TO NEXT COORDINATE.";
    }
  };

  const handleTerminalSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!team || !terminalInput.trim() || overrideProgress > 0) return;

    const currentNodeId = team.current_node;
    const input = terminalInput.trim().toUpperCase();
    let isCorrect = false;

    // --- SECURITY: Simple Base64 Obfuscation ---
    // Answers are encoded to prevent casual reading (inspect element).

    const verifyAnswer = (input, targetEncoded) => {
      const targets = Array.isArray(targetEncoded)
        ? targetEncoded
        : [targetEncoded];
      // Check if any target decodes to the input
      return targets.some((encoded) => {
        try {
          return atob(encoded) === input;
        } catch (e) {
          return false;
        }
      });
    };

    const answerMap = {
      1: ["NTA="], // "50"
      2: [
        "QkxVRQ==", // BLUE
        "UElOSw==", // PINK
        "R09MRA==", // GOLD
        "R1JBWQ==", // GRAY
        "Q1lBTg==", // CYAN
      ],
      3: ["Mg=="], // "2"
      4: ["SEFDS0Q="], // "HACKD"
      5: ["V0FMTEJSRUFDSEVE"], // "WALLBREACHED"
      6: ["R09MREVOV0FMTEJSRUFDSEVE"], // "GOLDENWALLBREACHED"
    };

    const targetEncoded = answerMap[currentNodeId];
    if (targetEncoded) {
      isCorrect = verifyAnswer(input, targetEncoded);
    } else {
      isCorrect = false;
    }

    if (isCorrect) {
      const nextNodeId = currentNodeId + 1;
      const isFinishingMove = currentNodeId >= 6;

      setMissionAlert(getSuccessMessage(currentNodeId));
      setOverrideProgress(100);
      setTerminalInput("");

      setTeam((prev) => ({
        ...prev,
        current_node: isFinishingMove ? prev.current_node : nextNodeId,
        score: (prev.score || 0) + 100,
        is_finished: isFinishingMove,
      }));

      setTimeout(() => setOverrideProgress(0), 2000);

      const updates = {
        current_node: isFinishingMove ? currentNodeId : nextNodeId,
        score: (team.score || 0) + 100,
        last_solved_at: new Date().toISOString(),
        is_finished: isFinishingMove,
      };

      const { error } = await supabase
        .from("teams")
        .update(updates)
        .eq("id", team.id);
      if (error) toast.error("Network Error - Sync Pending");
    } else {
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

  useEffect(() => {
    if (team?.start_time) {
      setShowBoot(true);
      setBootProgress(0);
      const progressTimer = setTimeout(() => setBootProgress(100), 100);
      const timer = setTimeout(() => setShowBoot(false), 2500);
      return () => {
        clearTimeout(timer);
        clearTimeout(progressTimer);
      };
    }
  }, [team?.start_time]);

  // -- RENDER HELPERS --
  const totalLevels = 6;
  const currentLevel = team?.is_finished
    ? totalLevels
    : (team?.current_node || 1) - 1;
  const globalProgress = Math.min(
    100,
    Math.round((currentLevel / totalLevels) * 100),
  );

  if (loading)
    return (
      <div className="bg-black min-h-screen text-[#00ff00] font-mono flex flex-col items-center justify-center p-10">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <span className="animate-pulse tracking-widest">CONNECTING...</span>
      </div>
    );

  if (team && !team.start_time) return <WaitingScreen />;

  if (team && team.current_node >= 6 && !team.is_finished) {
    return (
      <LockedVault
        team={team}
        onSuccess={() => {
          const finishGame = async () => {
            const updates = {
              is_finished: true,
              last_solved_at: new Date().toISOString(),
            };
            await supabase.from("teams").update(updates).eq("id", team.id);
            setTeam((prev) => ({ ...prev, is_finished: true }));
          };
          finishGame();
        }}
      />
    );
  }

  if (showBoot) {
    return (
      <div className="min-h-screen bg-black text-[#00ff00] font-mono flex flex-col items-center justify-center p-6 z-50 fixed inset-0 overflow-hidden">
        <div className="max-w-md w-full space-y-8 relative z-20">
          <div className="h-2 w-full bg-green-900/30 rounded-full overflow-hidden border border-green-900/50">
            <div
              className="h-full bg-green-500 shadow-[0_0_15px_#22c55e] transition-all duration-2400 ease-out"
              style={{ width: `${bootProgress}%` }}
            />
          </div>
          <div className="text-center animate-pulse text-xs tracking-widest">
            SYSTEM_BOOT_SEQUENCE_INITIATED...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#00ff00] font-mono overflow-x-hidden relative selection:bg-green-900/50">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 border-b border-green-900/50 backdrop-blur-sm p-4 flex justify-between items-center shadow-[0_0_15px_rgba(0,255,0,0.1)]">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 items-end h-5">
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={`w-1 bg-[#00ff00] transition-all duration-300 ${signalStrength >= bar ? "opacity-100" : "opacity-20"}`}
                style={{ height: `${bar * 25}%` }}
              />
            ))}
          </div>
          <span className="text-xs font-bold animate-pulse text-green-400">
            NET_UPLINK
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* SCANNER BUTTON in Header - ONLY FOR NODE 3 */}
          {team?.current_node === 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowScanner(true);
                setScanResult(null);
              }}
              className="text-[#00ff41] border border-[#00ff41] hover:bg-[#00ff41] hover:text-black h-8 w-8 p-0 rounded-full animate-pulse"
            >
              <QrCode className="w-4 h-4" />
            </Button>
          )}

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
            / 06
          </div>
        </div>
      </header>

      <main className="pt-24 pb-32 px-4 w-full max-w-md md:max-w-4xl mx-auto space-y-6 relative z-10 transition-all duration-300">
        <div className="flex flex-col md:flex-row gap-4 items-stretch h-auto md:h-[400px]">
          {/* Vertical Progress (Desktop) */}
          <div className="hidden md:flex w-12 flex-col items-center justify-between py-2 bg-black border border-green-900/30 rounded-full relative overflow-hidden">
            <div
              className="absolute inset-x-0 bottom-0 w-full bg-green-500/20"
              style={{ height: `${globalProgress}%` }}
            />
            <span className="absolute bottom-4 w-full text-center text-xs font-bold z-20 text-green-400">
              {globalProgress}%
            </span>
          </div>

          {/* Horizontal Progress (Mobile) */}
          <div className="flex md:hidden w-full h-10 items-center bg-black border border-green-900/50 rounded-full relative overflow-hidden mb-6 mt-6 shrink-0 shadow-[0_0_10px_rgba(0,255,0,0.1)]">
            <div
              className="absolute inset-y-0 left-0 h-full bg-green-600/30 transition-all duration-1000 ease-out z-0"
              style={{ width: `${globalProgress}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-green-400 z-10 drop-shadow-md">
              PROGRESS: {globalProgress}%
            </div>
          </div>

          {/* Nodes Grid - Filtered */}
          <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-hide">
            {nodes
              .filter((node) => node.id <= (team?.current_node || 1))
              .map((node) => {
                const status = getNodeStatus(node.id);
                return (
                  <Card
                    key={node.id}
                    className={`border-l-4 transition-all duration-300 backdrop-blur-md text-inherit ${status === "active" ? "border-[#00ff00] bg-green-950/10 shadow-[0_0_20px_rgba(0,255,0,0.1)] border-t-0 border-r-0 border-b-0" : "border-green-800/50 bg-black opacity-60 border-t-0 border-r-0 border-b-0"}`}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {status === "active" ? (
                            <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
                          ) : (
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
                          DECRYPTED
                        </span>
                      )}
                      {status === "active" && (
                        <div className="text-[10px] text-yellow-400 animate-pulse font-bold tracking-wider">
                          TARGET
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>

        {/* Level 4: Hidden Log Clue */}
        {/* Level 4: Hidden Log Clue */}
        {team?.current_node === 4 && (
          <div className="bg-black border border-green-900/50 p-4 font-mono text-[10px] md:text-sm text-green-400 h-48 md:h-64 overflow-y-auto w-full mb-6 shadow-inner tracking-tight md:tracking-normal">
            <div className="space-y-0.5 md:space-y-1">
              <p>[0.0012] Initializing CPU... OK</p>
              <p>[0.0015] Checking hypervisor status... None detected.</p>
              <p>[0.0022] Setting up interrupt controllers...</p>
              <p>[0.0045] Memory Check: 16GB Detected [DDR4 3200MHz]</p>
              <p>[0.0055] Checking PCI Express slots... 4 devices found.</p>
              <p>[0.0067] ACPI: Core revision 20220215</p>
              <p>[0.0089] WARN: Unexpected Byte at 0x48 (Sector_1)</p>
              <p>[0.0101] pci 0000:00:01.0: reg 0x10: [mem 0x0000-0x0fff]</p>
              <p>[0.0122] Loading Kernel Modules: [kvm, virtio, sound_core]</p>
              <p>[0.0135] vgaarb: setting as boot device</p>
              <p>[0.0155] eth0: Link up, 1000Mbps, full duplex</p>
              <p>[0.0177] SCSI subsystem initialized</p>
              <p>[0.0198] ERROR: Buffer Overflow at 0x41 (Stack_Pointer)</p>
              <p>[0.0211] usb 1-1: new high-speed USB device number 2</p>
              <p>[0.0241] mounting /dev/sda1 on /boot... OK</p>
              <p>
                [0.0255] EXT4-fs (sda1): re-mounted. Opts: errors=remount-ro
              </p>
              <p>[0.0289] Initializing Security Protocol: [SHA-256 Enabled]</p>
              <p>[0.0302] Adding 4194300k swap on /var/swap. Priority:-2</p>
              <p>[0.0334] CRITICAL: Packet Intercept at 0x43 (Port_80)</p>
              <p>[0.0355] random: crng init done</p>
              <p>[0.0381] systemd[1]: Starting Network Time Sync...</p>
              <p>[0.0401] systemd[1]: Detected architecture x86-64.</p>
              <p>[0.0422] systemd[1]: Reached target Network.</p>
              <p>[0.0444] Clocksource: tsc: mask: 0xffffffffffffffff</p>
              <p>[0.0467] WARN: Metadata mismatch at 0x4B (Offset_04)</p>
              <p>[0.0488] NET: Registered protocol family 10</p>
              <p>[0.0511] Cleaning up temporary files... [DONE]</p>
              <p>[0.0532] Scanning for logical volumes... 0 found.</p>
              <p>[0.0556] systemd[1]: Starting Rotate log files...</p>
              <p>[0.0577] audit: type=1400 audit(164491200.057:2): res=1</p>
              <p>[0.0598] ALERT: Intrusion detected at 0x44 (Node_Primary)</p>
              <p>
                [0.0622] systemd[1]: Finished Flush Journal to Persistent
                Storage.
              </p>
              <p className="animate-pulse">
                [0.0644] Core Dumped. System Halted.
              </p>
            </div>
          </div>
        )}

        {/* Interaction Panel */}
        <div
          className={`border bg-black/80 p-4 rounded-sm shadow-lg backdrop-blur-md transition-colors duration-300 ${errorMsg ? "border-red-500/50 shadow-red-900/20" : "border-[#00ff00]/30"}`}
        >
          <div className="flex items-center gap-2 mb-3 text-[#00ff00] border-b border-green-900/50 pb-2">
            <Terminal className="w-4 h-4" />
            <h3 className="text-sm font-bold tracking-wider">
              OVERRIDE_TERMINAL
            </h3>
          </div>
          <div className="space-y-4">
            {/* Scanner Trigger inline - ONLY FOR NODE 3 */}
            {team?.current_node === 3 && (
              <Button
                onClick={() => {
                  setShowScanner(true);
                  setScanResult(null);
                }}
                className="w-full bg-green-900/20 border border-green-700 text-green-400 hover:bg-green-800/30 h-8 text-xs font-mono tracking-widest mb-2 animate-pulse"
              >
                [ SCAN_PHYSICAL_ASSET ]
              </Button>
            )}

            <div className="relative">
              <span
                className={`absolute left-3 top-2.5 text-sm select-none ${errorMsg ? "text-red-500" : "text-green-600"}`}
              >
                root@signal:~#
              </span>
              <Input
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                className={`pl-32 bg-black border-green-800 focus-visible:ring-green-500 font-mono h-10 ${errorMsg ? "text-red-500 border-red-800 focus-visible:ring-red-500" : "text-[#00ff00] placeholder:text-green-900"}`}
                placeholder={errorMsg || "enter_code..."}
                autoComplete="off"
              />
            </div>
            <Button
              onClick={handleTerminalSubmit}
              disabled={!team || team.is_finished}
              className={`w-full text-black font-bold tracking-widest shadow-[0_0_15px_rgba(0,255,0,0.4)] transition-all active:scale-95 ${errorMsg ? "bg-red-600 hover:bg-red-500" : "bg-[#00ff00] hover:bg-green-500"}`}
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
            className="fixed right-4 bottom-6 z-40 rounded-full h-12 w-12 p-0 border-[#00ff00] bg-black text-[#00ff00] shadow-[0_0_20px_rgba(0,255,0,0.2)] hover:bg-green-900/20"
          >
            <Trophy className="w-5 h-5 text-yellow-400" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-[80vh] border-t-[#00ff00] bg-black/95 text-[#00ff00] p-0"
        >
          <SheetHeader className="p-6 border-b border-green-900/50">
            <SheetTitle className="text-[#00ff00] font-mono flex items-center gap-2">
              <Users className="w-4 h-4" /> GLOBAL_RANKINGS
            </SheetTitle>
          </SheetHeader>
          <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            {leaderboard.map((t, idx) => (
              <div
                key={t.id}
                className="flex justify-between border-b border-green-900/30 pb-2"
              >
                <span className="font-bold">
                  {idx + 1}. {t.team_name}
                </span>
                <span>{t.score || 0} PTS</span>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Scanner Overlay */}
      {showScanner && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-4">
          <Button
            variant="ghost"
            className="absolute top-4 right-4 text-green-500 hover:text-red-500 z-20"
            onClick={() => setShowScanner(false)}
          >
            <X className="w-8 h-8" />
          </Button>
          <div
            id="reader"
            className="w-full max-w-lg aspect-square bg-black border-2 border-green-500 rounded-lg overflow-hidden relative z-10"
          ></div>
          <div className="mt-4 text-green-500 font-mono animate-pulse">
            ALIGN QR CODE WITHIN SENSORS
          </div>
        </div>
      )}

      {/* Mission Update Modal */}
      {missionAlert && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-lg w-full border border-[#00ff00] bg-black shadow-[0_0_50px_rgba(0,255,0,0.3)] p-1">
            <div className="border border-green-900/50 p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-green-900/50 pb-4">
                <Terminal className="w-6 h-6 text-[#00ff00] animate-pulse" />
                <h2 className="text-xl font-black tracking-widest text-white">
                  MISSION_UPDATE
                </h2>
              </div>
              <div className="font-mono text-[#00ff00] text-sm leading-relaxed whitespace-pre-line">
                {missionAlert}
              </div>
              <div className="pt-4 flex justify-end">
                <Button
                  onClick={() => setMissionAlert(null)}
                  className="bg-[#00ff00] text-black hover:bg-green-500 font-bold tracking-widest"
                >
                  ACKNOWLEDGE
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Alerts */}
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
    </div>
  );
}
