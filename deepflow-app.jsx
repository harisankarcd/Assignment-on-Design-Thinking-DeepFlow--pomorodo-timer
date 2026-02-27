import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// STORAGE LAYER (persistent across sessions)
// ============================================================
const storage = {
  get: (key) => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
};

// ============================================================
// UTILITIES
// ============================================================
const pad = (n) => String(n).padStart(2, "0");

const formatTime = (secs) => `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`;

const today = () => new Date().toISOString().split("T")[0];

const getWeekDates = () => {
  const dates = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ============================================================
// AUDIO (web audio API beep)
// ============================================================
const playBeep = (type = "complete") => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const freqs = type === "complete" ? [523, 659, 784] : [523, 440];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  } catch {}
};

// ============================================================
// ICONS (inline SVG components)
// ============================================================
const Icon = ({ d, size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const Icons = {
  Play: () => <Icon d="M5 3l14 9-14 9V3z" />,
  Pause: () => <Icon d="M6 4h4v16H6zM14 4h4v16h-4z" />,
  Reset: () => <Icon d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />,
  Skip: () => <Icon d="M5 4l10 8-10 8V4zM19 5v14" />,
  Plus: () => <Icon d="M12 5v14M5 12h14" />,
  X: () => <Icon d="M18 6 6 18M6 6l12 12" />,
  Check: () => <Icon d="M20 6 9 17l-5-5" />,
  Tag: () => <Icon d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />,
  Flame: () => <Icon d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />,
  Clock: () => <Icon d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2" />,
  Target: () => <Icon d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
  Slack: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
    </svg>
  ),
  Chart: () => <Icon d="M18 20V10M12 20V4M6 20v-6" />,
  Zap: () => <Icon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  Coffee: () => <Icon d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />,
  Moon: () => <Icon d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  Trash: () => <Icon d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
  Minus: () => <Icon d="M5 12h14" />,
  User: () => <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
  Bell: () => <Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />,
};

// ============================================================
// CIRCULAR PROGRESS COMPONENT
// ============================================================
const CircularProgress = ({ progress, size = 280, mode }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const colors = {
    focus: { stroke: "#e85d04", glow: "#e85d04", text: "#ff6b1a" },
    shortBreak: { stroke: "#06b6d4", glow: "#06b6d4", text: "#22d3ee" },
    longBreak: { stroke: "#8b5cf6", glow: "#8b5cf6", text: "#a78bfa" },
  };
  const c = colors[mode] || colors.focus;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute" style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={c.stroke} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          filter="url(#glow)"
          style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.5s ease" }}
        />
      </svg>
    </div>
  );
};

// ============================================================
// TASK PANEL
// ============================================================
const TaskPanel = ({ tasks, onAdd, onComplete, onDelete, currentTask, onSetCurrent }) => {
  const [input, setInput] = useState("");
  const [tag, setTag] = useState("");

  const handleAdd = () => {
    if (!input.trim()) return;
    onAdd({ title: input.trim(), tag: tag.trim() || "general" });
    setInput("");
    setTag("");
  };

  const tagColors = {
    general: "bg-zinc-700 text-zinc-300",
    dev: "bg-blue-900/60 text-blue-300",
    design: "bg-purple-900/60 text-purple-300",
    review: "bg-amber-900/60 text-amber-300",
    meeting: "bg-rose-900/60 text-rose-300",
    docs: "bg-green-900/60 text-green-300",
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a task..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/8 transition-all"
        />
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-orange-500/50 transition-all"
        >
          <option value="">tag</option>
          {["dev", "design", "review", "meeting", "docs"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          className="bg-orange-500/90 hover:bg-orange-500 text-white rounded-xl px-4 py-2.5 transition-all hover:scale-105 active:scale-95"
        >
          <Icons.Plus />
        </button>
      </div>

      <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
        {tasks.length === 0 && (
          <p className="text-center text-zinc-600 text-sm py-4">No tasks yet. Add one above ↑</p>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onSetCurrent(task.id)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all border ${
              currentTask === task.id
                ? "bg-orange-500/10 border-orange-500/30"
                : task.completed
                ? "bg-white/2 border-white/5 opacity-50"
                : "bg-white/4 border-white/8 hover:bg-white/6"
            }`}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                task.completed
                  ? "bg-green-500 border-green-500"
                  : "border-zinc-600 hover:border-green-500"
              }`}
            >
              {task.completed && <Icons.Check />}
            </button>
            <span className={`flex-1 text-sm ${task.completed ? "line-through text-zinc-600" : "text-zinc-200"}`}>
              {task.title}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${tagColors[task.tag] || tagColors.general}`}>
              {task.tag}
            </span>
            {task.pomodoroCount > 0 && (
              <span className="text-xs text-orange-400 font-mono">🍅×{task.pomodoroCount}</span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="text-zinc-600 hover:text-red-400 transition-colors"
            >
              <Icons.Trash />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// STATS DASHBOARD
// ============================================================
const StatsDashboard = ({ sessions, tasks }) => {
  const todayStr = today();
  const weekDates = getWeekDates();

  const todaySessions = sessions.filter((s) => s.date === todayStr && s.type === "focus" && s.completed);
  const totalFocusToday = todaySessions.length * 25;
  const completedTasks = tasks.filter((t) => t.completed).length;

  // Weekly chart data
  const weeklyData = weekDates.map((date) => ({
    date,
    label: DAY_LABELS[new Date(date + "T00:00:00").getDay()],
    count: sessions.filter((s) => s.date === date && s.type === "focus" && s.completed).length,
  }));
  const maxCount = Math.max(...weeklyData.map((d) => d.count), 1);

  // Streak calculation
  const streak = (() => {
    let count = 0;
    const d = new Date();
    while (true) {
      const ds = d.toISOString().split("T")[0];
      const hasSessions = sessions.some((s) => s.date === ds && s.type === "focus" && s.completed);
      if (!hasSessions) break;
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  const dailyGoal = 8;
  const goalProgress = Math.min((todaySessions.length / dailyGoal) * 100, 100);
  const distractions = sessions.filter((s) => s.date === todayStr && s.interrupted).length;

  const StatCard = ({ icon, label, value, sub, color = "orange" }) => {
    const colors = {
      orange: "from-orange-500/20 to-orange-500/5 border-orange-500/20 text-orange-400",
      cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400",
      purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-400",
      rose: "from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-400",
      green: "from-green-500/20 to-green-500/5 border-green-500/20 text-green-400",
      amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400",
    };
    return (
      <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-4 flex flex-col gap-2`}>
        <div className={`${colors[color].split(" ").pop()}`}>{icon}</div>
        <div>
          <div className="text-2xl font-bold text-white font-mono">{value}</div>
          <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
          {sub && <div className="text-xs text-zinc-600 mt-1">{sub}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={<Icons.Clock />} label="Focus time today" value={`${totalFocusToday}m`} color="orange" />
        <StatCard icon={<Icons.Zap />} label="Pomodoros done" value={todaySessions.length} sub="today" color="amber" />
        <StatCard icon={<Icons.Flame />} label="Day streak" value={streak} sub={streak === 1 ? "day" : "days"} color="rose" />
        <StatCard icon={<Icons.Check />} label="Tasks complete" value={completedTasks} color="green" />
        <StatCard icon={<Icons.Target />} label="Daily goal" value={`${Math.round(goalProgress)}%`} sub={`${todaySessions.length}/${dailyGoal} sessions`} color="cyan" />
        <StatCard icon={<Icons.Bell />} label="Distractions" value={distractions} sub="today" color="purple" />
      </div>

      {/* Weekly chart */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Icons.Chart />
          <h3 className="text-sm font-semibold text-zinc-300">Weekly Focus</h3>
        </div>
        <div className="flex items-end gap-2 h-24">
          {weeklyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
                <div
                  className={`w-full rounded-t-sm transition-all duration-500 ${
                    d.date === todayStr ? "bg-orange-500" : "bg-white/15"
                  }`}
                  style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? "4px" : "2px" }}
                />
              </div>
              <span className={`text-xs ${d.date === todayStr ? "text-orange-400 font-bold" : "text-zinc-600"}`}>
                {d.label}
              </span>
              {d.count > 0 && (
                <span className="text-xs text-zinc-500 font-mono">{d.count}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Daily goal progress bar */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-zinc-400">Daily Goal Progress</span>
          <span className="text-sm font-mono text-orange-400">{todaySessions.length} / {dailyGoal}</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-700"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
        <p className="text-xs text-zinc-600 mt-2">
          {dailyGoal - todaySessions.length > 0
            ? `${dailyGoal - todaySessions.length} more sessions to reach your daily goal`
            : "🎉 Daily goal achieved!"}
        </p>
      </div>
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================
export default function DeepFlow() {
  // Timer state
  const [mode, setMode] = useState("focus"); // focus | shortBreak | longBreak
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [currentSessionStart, setCurrentSessionStart] = useState(null);

  // App state
  const [activeTab, setActiveTab] = useState("timer"); // timer | tasks | stats
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [slackStatus, setSlackStatus] = useState("available");
  const [distractionCount, setDistractionCount] = useState(0);
  const [showDistractionModal, setShowDistractionModal] = useState(false);

  const timerRef = useRef(null);
  const modeRef = useRef(mode);
  const timeLeftRef = useRef(timeLeft);

  modeRef.current = mode;
  timeLeftRef.current = timeLeft;

  const DURATIONS = { focus: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
  const MODE_LABELS = { focus: "Focus", shortBreak: "Short Break", longBreak: "Long Break" };

  // Load persisted data on mount
  useEffect(() => {
    const savedTasks = storage.get("deepflow_tasks") || [];
    const savedSessions = storage.get("deepflow_sessions") || [];
    setTasks(savedTasks);
    setSessions(savedSessions);
  }, []);

  // Save tasks
  useEffect(() => {
    storage.set("deepflow_tasks", tasks);
  }, [tasks]);

  // Save sessions
  useEffect(() => {
    storage.set("deepflow_sessions", sessions);
  }, [sessions]);

  // Update page title
  useEffect(() => {
    if (running) {
      document.title = `${formatTime(timeLeft)} - ${MODE_LABELS[mode]} | DeepFlow`;
    } else {
      document.title = "DeepFlow – Smart Pomodoro";
    }
  }, [timeLeft, running, mode]);

  // Timer logic
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running, mode]);

  const handleTimerComplete = useCallback(() => {
    const currentMode = modeRef.current;
    playBeep("complete");
    setRunning(false);

    const newSession = {
      id: Date.now(),
      type: currentMode,
      date: today(),
      completedAt: new Date().toISOString(),
      completed: true,
      taskId: currentTask,
      interrupted: false,
      duration: DURATIONS[currentMode] / 60,
    };

    setSessions((prev) => [...prev, newSession]);

    if (currentMode === "focus") {
      setSessionCount((prev) => {
        const newCount = prev + 1;
        // Update task pomodoro count
        if (currentTask) {
          setTasks((tasks) =>
            tasks.map((t) =>
              t.id === currentTask ? { ...t, pomodoroCount: (t.pomodoroCount || 0) + 1 } : t
            )
          );
        }
        // Auto-transition to break
        if (newCount % 4 === 0) {
          setMode("longBreak");
          setTimeLeft(DURATIONS.longBreak);
          setSlackStatus("break");
        } else {
          setMode("shortBreak");
          setTimeLeft(DURATIONS.shortBreak);
          setSlackStatus("break");
        }
        return newCount;
      });
    } else {
      setMode("focus");
      setTimeLeft(DURATIONS.focus);
      setSlackStatus("available");
    }
  }, [currentTask]);

  const handleStart = () => {
    if (!running) {
      setCurrentSessionStart(Date.now());
      setSlackStatus(mode === "focus" ? "deepWork" : "break");
    }
    setRunning(!running);
  };

  const handleReset = () => {
    if (running) {
      // Count as interrupted distraction
      setDistractionCount((d) => d + 1);
      const interruptedSession = {
        id: Date.now(),
        type: mode,
        date: today(),
        completedAt: new Date().toISOString(),
        completed: false,
        interrupted: true,
        taskId: currentTask,
        duration: (DURATIONS[mode] - timeLeft) / 60,
      };
      setSessions((prev) => [...prev, interruptedSession]);
    }
    setRunning(false);
    setTimeLeft(DURATIONS[mode]);
    setSlackStatus("available");
  };

  const handleSkip = () => {
    handleReset();
    if (mode === "focus") {
      setMode("shortBreak");
      setTimeLeft(DURATIONS.shortBreak);
    } else {
      setMode("focus");
      setTimeLeft(DURATIONS.focus);
    }
  };

  const switchMode = (newMode) => {
    if (running) handleReset();
    setMode(newMode);
    setTimeLeft(DURATIONS[newMode]);
  };

  const progress = 1 - timeLeft / DURATIONS[mode];

  const slackBadge = {
    deepWork: { label: "🔴 In Deep Work – Back in 25 mins", color: "text-red-400 bg-red-500/10 border-red-500/20" },
    break: { label: "🟡 On Break", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    available: { label: "🟢 Available", color: "text-green-400 bg-green-500/10 border-green-500/20" },
  };


  const todaySessions = sessions.filter((s) => s.date === today() && s.type === "focus" && s.completed);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-10 transition-all duration-1000"
          style={{
            background: mode === "focus" ? "#e85d04" : mode === "shortBreak" ? "#06b6d4" : "#8b5cf6",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-5 bg-purple-500" />
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-5 bg-blue-500" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-400 rounded-lg flex items-center justify-center text-sm">
              🍅
            </div>
            <span className="font-bold tracking-tight">
              Deep<span className="text-orange-400">Flow</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`text-xs px-3 py-1.5 rounded-full border font-medium ${slackBadge[slackStatus].color}`}>
              <span className="hidden sm:inline">{slackBadge[slackStatus].label}</span>
              <span className="sm:hidden">{slackStatus === "deepWork" ? "🔴 Deep Work" : slackStatus === "break" ? "🟡 Break" : "🟢 Available"}</span>
            </div>
          </div>
        </header>

        {/* Welcome + streak */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">
              Let's focus 🎯
            </h1>
            <p className="text-sm text-zinc-500">
              {todaySessions.length} Pomodoros completed today
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
            <Icons.Flame />
            <span className="text-rose-400 text-sm font-bold">
              {(() => {
                let count = 0;
                const d = new Date();
                while (true) {
                  const ds = d.toISOString().split("T")[0];
                  const has = sessions.some((s) => s.date === ds && s.type === "focus" && s.completed);
                  if (!has) break;
                  count++;
                  d.setDate(d.getDate() - 1);
                }
                return count;
              })()}
            </span>
            <span className="text-zinc-500 text-xs">streak</span>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 bg-white/4 rounded-2xl p-1 mb-6 border border-white/8">
          {[
            { id: "timer", label: "Timer", icon: <Icons.Clock /> },
            { id: "tasks", label: "Tasks", icon: <Icons.Check /> },
            { id: "stats", label: "Stats", icon: <Icons.Chart /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white/8 text-white shadow"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TIMER TAB */}
        {activeTab === "timer" && (
          <div className="flex flex-col items-center gap-6">
            {/* Mode selector */}
            <div className="flex gap-1.5 bg-white/4 rounded-xl p-1 border border-white/8 w-full">
              {[
                { id: "focus", label: "Focus", icon: <Icons.Zap /> },
                { id: "shortBreak", label: "Short Break", icon: <Icons.Coffee /> },
                { id: "longBreak", label: "Long Break", icon: <Icons.Moon /> },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => switchMode(m.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    mode === m.id
                      ? m.id === "focus"
                        ? "bg-orange-500 text-white"
                        : m.id === "shortBreak"
                        ? "bg-cyan-500 text-white"
                        : "bg-purple-500 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {m.icon}
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Timer circle */}
            <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
              <CircularProgress progress={progress} size={280} mode={mode} />
              <div className="absolute flex flex-col items-center">
                <span
                  className="text-6xl font-bold font-mono tracking-tight tabular-nums"
                  style={{
                    color: mode === "focus" ? "#ff6b1a" : mode === "shortBreak" ? "#22d3ee" : "#a78bfa",
                    textShadow: `0 0 40px ${mode === "focus" ? "#e85d0440" : mode === "shortBreak" ? "#06b6d440" : "#8b5cf640"}`,
                  }}
                >
                  {formatTime(timeLeft)}
                </span>
                <span className="text-zinc-500 text-sm mt-1">
                  {MODE_LABELS[mode]}
                </span>
                {running && (
                  <div className="flex gap-1 mt-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full bg-orange-500"
                        style={{
                          animation: "pulse 1.2s ease-in-out infinite",
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Session indicators */}
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    (sessionCount % 4) >= i
                      ? "bg-orange-500 shadow-lg shadow-orange-500/50"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleReset}
                className="w-12 h-12 rounded-full bg-white/6 border border-white/10 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all hover:scale-105 active:scale-95"
                title="Reset"
              >
                <Icons.Reset />
              </button>
              <button
                onClick={handleStart}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-2xl ${
                  mode === "focus"
                    ? "bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-500/40"
                    : mode === "shortBreak"
                    ? "bg-gradient-to-br from-cyan-500 to-blue-500 shadow-cyan-500/40"
                    : "bg-gradient-to-br from-purple-500 to-violet-500 shadow-purple-500/40"
                }`}
              >
                {running ? <Icons.Pause /> : <Icons.Play />}
              </button>
              <button
                onClick={handleSkip}
                className="w-12 h-12 rounded-full bg-white/6 border border-white/10 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all hover:scale-105 active:scale-95"
                title="Skip"
              >
                <Icons.Skip />
              </button>
            </div>

            {/* Current task indicator */}
            {currentTask && tasks.find((t) => t.id === currentTask) && (
              <div className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-sm text-zinc-300 flex-1 truncate">
                  {tasks.find((t) => t.id === currentTask)?.title}
                </span>
                <button
                  onClick={() => setCurrentTask(null)}
                  className="text-zinc-600 hover:text-zinc-400"
                >
                  <Icons.X />
                </button>
              </div>
            )}

            {/* Distraction button */}
            {running && mode === "focus" && (
              <button
                onClick={() => {
                  setDistractionCount((d) => d + 1);
                  sessions.length >= 0 && setSessions((prev) => {
                    const last = [...prev];
                    return last;
                  });
                  // Flash feedback
                  const btn = document.getElementById("distraction-btn");
                  if (btn) { btn.classList.add("scale-90"); setTimeout(() => btn.classList.remove("scale-90"), 150); }
                }}
                id="distraction-btn"
                className="text-xs text-zinc-600 hover:text-zinc-400 underline transition-all"
              >
                + Log distraction ({distractionCount} today)
              </button>
            )}
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === "tasks" && (
          <TaskPanel
            tasks={tasks}
            currentTask={currentTask}
            onSetCurrent={setCurrentTask}
            onAdd={(task) => setTasks((prev) => [
              { ...task, id: Date.now(), completed: false, pomodoroCount: 0, createdAt: new Date().toISOString() },
              ...prev,
            ])}
            onComplete={(id) => setTasks((prev) =>
              prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t)
            )}
            onDelete={(id) => setTasks((prev) => prev.filter((t) => t.id !== id))}
          />
        )}

        {/* STATS TAB */}
        {activeTab === "stats" && (
          <StatsDashboard sessions={sessions} tasks={tasks} />
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-zinc-700">
          DeepFlow v1.0 · {todaySessions.length * 25}min focused today
        </footer>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        * { font-family: 'SF Pro Display', 'System UI', -apple-system, sans-serif; }
      `}</style>
    </div>
  );
}
