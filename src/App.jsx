import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Zap,
  Users,
  Wallet,
  Coffee,
  Brain,
  Pause,
  Play,
  X,
  HelpCircle,
  Radio,
  Rocket,
  Trash2,
  SlidersHorizontal,
  Check,
  Terminal,
  FlaskConical,
  RefreshCw,
  Megaphone,
  Send,
  ChevronRight,
  Trophy,
  Volume2,
  VolumeX,
  ShieldCheck,
  Command,
  BriefcaseBusiness,
  CircleDollarSign,
  RotateCcw,
  Clock,
  Eye,
  MoreHorizontal,
  ListChecks,
  ChevronDown,
  LockKeyhole,
} from "lucide-react";
import {
  createGame,
  stepGame,
  act,
  ACTIONS,
  UPGRADES,
  getEconomy,
} from "./game.js";
import { readSave, writeSave, readFlag } from "./storage.js";
import { nextReadyAgent, feedbackInfo } from "./workbench.js";

const money = (value) => "$" + Math.floor(value).toLocaleString();
const count = (value) => Math.floor(value).toLocaleString();
const compact = (value) =>
  value >= 10000 ? (value / 1000).toFixed(1) + "k" : count(value);
const browserStorage = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();
const colors = [
  "mint",
  "peach",
  "violet",
  "sky",
  "yellow",
  "pink",
  "mint",
  "peach",
];
const modeIcons = {
  polish: Sparkles,
  validate: FlaskConical,
  pivot: RefreshCw,
  hype: Megaphone,
  custom: Terminal,
};
const statusText = {
  working: "Cooking",
  review: "Ready to review",
  idle: "Ready for a task",
};

function Meter({ label, value, kind = "", hint }) {
  return (
    <div className={"meter " + kind}>
      <div>
        <span>{label}</span>
        <strong>
          {Math.round(value)}
          <small>/100</small>
        </strong>
      </div>
      <div className="meter-track">
        <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      {hint && <small>{hint}</small>}
    </div>
  );
}

function Modal({ title, eyebrow, children, onClose, className = "" }) {
  const dialog = useRef(null);
  useEffect(() => {
    const prior = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = dialog.current;
    el?.focus();
    const onKey = (event) => {
      if (event.key === "Escape" && onClose) onClose();
      if (event.key === "Tab") {
        const items = [
          ...el.querySelectorAll(
            'button:not(:disabled), input, textarea, select, [tabindex="0"]',
          ),
        ];
        if (!items.length) return event.preventDefault();
        const first = items[0],
          last = items[items.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === el)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last || document.activeElement === el)
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      prior?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <section
        ref={dialog}
        className={"modal " + className}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        {onClose && (
          <button
            className="icon-button modal-close"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        )}
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}

function AgentCard({ agent, index, selected, onClick }) {
  return (
    <button
      className={`agent-card ${colors[index]} ${selected ? "selected" : ""}`}
      data-agent-id={agent.id}
      data-status={agent.status}
      onClick={onClick}
      aria-pressed={selected}
    >
      <div className="agent-card-top">
        <span className="bot-avatar">
          <Bot size={31} strokeWidth={1.7} />
        </span>
        <span className={"status-pill " + agent.status}>
          {agent.status === "working" && <span className="pulse-dot" />}
          {statusText[agent.status]}
        </span>
      </div>
      <div className="agent-name">
        <h3>{agent.name}</h3>
        <span>#{String(index + 1).padStart(2, "0")}</span>
      </div>
      <p className="persona">{agent.persona}</p>
      <div className="agent-task">
        {agent.idea?.title || "No thoughts. Head empty."}
      </div>
      <div className="agent-bottom">
        {agent.status === "working" ? (
          <>
            <div className="agent-progress">
              <i style={{ width: `${agent.progress}%` }} />
            </div>
            <span className="agent-eta">
              {Math.ceil(agent.duration * (1 - agent.progress / 100))}s left
            </span>
          </>
        ) : agent.status === "review" ? (
          <>
            <span>Review idea</span>
            <ArrowUpRight size={18} />
          </>
        ) : (
          <>
            <span>Start next idea</span>
            <Plus size={18} />
          </>
        )}
      </div>
      {selected && (
        <span className="selected-tab">
          Selected <Check size={12} />
        </span>
      )}
    </button>
  );
}

function FeedItem({ item }) {
  const positive = item.followersDelta > 0;
  return (
    <article className="feed-item">
      <div
        className={
          "feed-avatar " +
          (item.kind === "income" && item.handle !== "@you" ? "sponsor" : "")
        }
      >
        {item.kind === "income" && item.handle !== "@you" ? (
          <CircleDollarSign size={18} />
        ) : (
          (item.handle || "x").replace("@", "").slice(0, 1).toUpperCase()
        )}
      </div>
      <div className="feed-content">
        <div className="feed-author">
          <strong>{item.handle || "@buildinpublic"}</strong>
          <span>day {Math.floor((item.time || 0) / 60) + 1}</span>
        </div>
        <p>{item.text}</p>
        <div className="feed-reaction">
          {item.followersDelta !== 0 &&
            Number.isFinite(item.followersDelta) && (
              <span className={positive ? "positive" : "negative"}>
                <Users size={12} />
                {positive ? "+" : ""}
                {count(item.followersDelta)}
              </span>
            )}
          {item.cashDelta > 0 && (
            <span className="positive">+{money(item.cashDelta)}</span>
          )}
          <span className="feed-kind">
            {item.handle === "@you" && ["success", "danger"].includes(item.kind)
              ? "Just shipped"
              : item.kind === "income" && item.handle !== "@you"
                ? "Paid partnership"
                : "The timeline"}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [game, setGame] = useState(() => readSave(browserStorage, createGame));
  const [modal, setModal] = useState(null);
  const [tab, setTab] = useState("all");
  const [view, setView] = useState("workbench");
  const [drafts, setDrafts] = useState({});
  const [autoSwitch, setAutoSwitch] = useState(() =>
    readFlag(browserStorage, "slop-valley-auto-switch"),
  );
  const [readyNotice, setReadyNotice] = useState(null);
  const [tone, setTone] = useState("honest");
  const [category, setCategory] = useState("tools");
  const [muted, setMuted] = useState(true);
  const [saved, setSaved] = useState(true);
  const [showTip, setShowTip] = useState(
    () => !readFlag(browserStorage, "slop-valley-tip"),
  );
  const [hidden, setHidden] = useState(document.hidden);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const audio = useRef(null);
  const shopRef = useRef(null);
  const agentRail = useRef(null);
  const previousStatuses = useRef({});
  const previousSelected = useRef(null);
  const workbench = useRef(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const economy = getEconomy(game);
  const selected =
    game.agents.find((agent) => agent.id === game.selectedAgentId) ||
    game.agents[0];
  const idea = selected?.idea;
  const draftKey = idea?.id || selected.id;
  const instruction = drafts[draftKey] || "";
  const setInstruction = (value) =>
    setDrafts((current) => ({ ...current, [draftKey]: value }));
  const nextReady = nextReadyAgent(game, selected.id);
  const customInfo = feedbackInfo(game, "custom");
  const reviewCount = game.agents.filter(
    (agent) => agent.status === "review",
  ).length;
  const workingCount = game.agents.filter(
    (agent) => agent.status === "working",
  ).length;
  const filteredAgents =
    tab === "review"
      ? game.agents.filter((agent) => agent.status === "review")
      : game.agents;
  const blocked = Boolean(modal || game.event || hidden);
  const resultKey = game.lastResult ? JSON.stringify(game.lastResult) : "";

  function chime() {
    if (muted) return;
    try {
      audio.current ||= new (window.AudioContext ||
        window.webkitAudioContext)();
      const ctx = audio.current;
      ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(620, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.start();
      osc.stop(ctx.currentTime + 0.17);
    } catch {
      /* sound is optional */
    }
  }
  function dispatch(action) {
    const completing = ["iterate", "ship", "trash", "start"].includes(
      action.type,
    );
    if (
      action.type === "spawn" ||
      (action.type === "select" &&
        gameRef.current.agents.find((agent) => agent.id === action.id)
          ?.status !== "review") ||
      (completing &&
        !(autoSwitch && nextReadyAgent(gameRef.current, action.id)))
    )
      setTab("all");
    setGame((current) => {
      let next = act(current, action);
      if (
        autoSwitch &&
        ["iterate", "ship", "trash", "start"].includes(action.type) &&
        next !== current
      ) {
        const candidate = nextReadyAgent(next, action.id);
        if (candidate) next = act(next, { type: "select", id: candidate.id });
      }
      return next;
    });
    chime();
  }
  function goNextReady() {
    const agent = nextReadyAgent(
      gameRef.current,
      gameRef.current.selectedAgentId,
    );
    if (agent) {
      dispatch({ type: "select", id: agent.id });
      setView("workbench");
      setReadyNotice(null);
    }
  }
  function openShip() {
    setTone("honest");
    setModal("ship");
  }
  function navigate(viewName) {
    setView(viewName);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  useEffect(() => {
    const handler = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const handleResize = () =>
      setKeyboardOpen(
        window.innerHeight - viewport.height > 150 &&
          ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName),
      );
    viewport.addEventListener("resize", handleResize);
    return () => viewport.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    if (blocked || game.paused) return;
    const timer = setInterval(
      () => setGame((current) => stepGame(current, 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [blocked, game.paused]);
  useEffect(() => {
    setSaved(writeSave(browserStorage, game));
  }, [game]);
  useEffect(() => {
    const onKey = (e) => {
      if (
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(e.target.tagName) ||
        modal ||
        game.event ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        dispatch({ type: "pause" });
      }
      if (e.key >= "1" && e.key <= "8") {
        const agent = gameRef.current.agents[Number(e.key) - 1];
        if (agent) dispatch({ type: "select", id: agent.id });
      }
      if (e.key.toLowerCase() === "n") goNextReady();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal, game.event, muted]);
  useEffect(() => {
    const rail = agentRail.current;
    const card = rail?.querySelector(`[data-agent-id="${selected.id}"]`);
    if (rail && card) {
      const start =
        card.getBoundingClientRect().left -
        rail.getBoundingClientRect().left +
        rail.scrollLeft;
      if (
        start < rail.scrollLeft ||
        start + card.offsetWidth > rail.scrollLeft + rail.clientWidth
      ) {
        rail.scrollTo({
          left: Math.max(0, start - (rail.clientWidth - card.offsetWidth) / 2),
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        });
      }
    }
    if (
      previousSelected.current &&
      previousSelected.current !== selected.id &&
      workbench.current &&
      window.matchMedia("(max-width: 760px)").matches
    ) {
      const topbar = document.querySelector(".topbar");
      const team = document.querySelector(".agents-section");
      const offset =
        (topbar?.offsetHeight || 0) +
        (team && getComputedStyle(team).position === "sticky"
          ? team.offsetHeight
          : 0) +
        12;
      const rect = workbench.current.getBoundingClientRect();
      if (rect.top < offset || rect.top > window.innerHeight * 0.75)
        window.scrollTo({
          top: Math.max(0, window.scrollY + rect.top - offset),
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        });
    }
    previousSelected.current = selected.id;
  }, [selected.id, tab, view]);
  useEffect(() => {
    const finished = game.agents.filter(
      (agent) =>
        agent.status === "review" &&
        previousStatuses.current[agent.id] === "working",
    );
    if (finished.length) {
      setReadyNotice({
        id: finished[0].id,
        text:
          finished.length > 1
            ? `${finished.length} agents finished. Your move.`
            : `${finished[0].name} is ready.`,
      });
      chime();
    }
    previousStatuses.current = Object.fromEntries(
      game.agents.map((agent) => [agent.id, agent.status]),
    );
  }, [game.agents]);
  useEffect(() => {
    if (!readyNotice) return;
    const timer = setTimeout(() => setReadyNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [readyNotice]);
  useEffect(() => {
    if (!game.lastResult || modal || game.event) return;
    const timer = setTimeout(
      () =>
        setGame((current) =>
          JSON.stringify(current.lastResult) === resultKey
            ? act(current, { type: "dismissResult" })
            : current,
        ),
      6500,
    );
    return () => clearTimeout(timer);
  }, [resultKey, modal, game.event]);

  function iterate(mode) {
    if (
      feedbackInfo(game, mode).disabled ||
      selected.status !== "review" ||
      (mode === "custom" && !instruction.trim())
    )
      return;
    dispatch({
      type: "iterate",
      id: selected.id,
      mode,
      ...(mode === "custom" ? { instruction } : {}),
    });
    if (mode === "custom") setInstruction("");
  }
  const rank =
    game.followers >= 10000
      ? "Chief agent officer"
      : game.followers >= 2500
        ? "Thought leader (derogatory)"
        : game.followers >= 500
          ? "Professional prompter"
          : "Indie hacker, allegedly";

  return (
    <div
      className={`app-shell view-${view} ${view === "workbench" ? "has-action-dock" : ""} ${keyboardOpen ? "keyboard-open" : ""}`}
    >
      <aside className="sidebar" inert={modal || game.event ? true : undefined}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setView("workbench");
          }}
        >
          <span className="brand-mark">
            <Bot size={28} />
          </span>
          <span>
            slop
            <span className="brand-second">
              valley<span className="brand-period">.</span>
            </span>
          </span>
        </a>
        <div className="sidebar-caption">The agentic engineer simulator</div>
        <nav aria-label="Main navigation">
          <button
            className={view === "workbench" ? "nav-item active" : "nav-item"}
            onClick={() => setView("workbench")}
          >
            <Command size={19} />
            Mission control
            <ChevronRight size={15} />
          </button>
          <button
            className={view === "history" ? "nav-item active" : "nav-item"}
            onClick={() => setView("history")}
          >
            <Rocket size={19} />
            Launch history<span className="nav-count">{game.shipped}</span>
          </button>
          <button className="nav-item" onClick={() => setModal("upgrades")}>
            <Zap size={19} />
            The upgrade trap
          </button>
        </nav>
        <div className="sidebar-goal">
          <Trophy size={23} />
          <span>Your extremely normal goal</span>
          <h3>
            Become too big
            <br />
            to fact-check.
          </h3>
          <div className="goal-progress">
            <i style={{ width: `${Math.min(100, game.followers / 100)}%` }} />
          </div>
          <p>{compact(game.followers)} / 10k followers</p>
          <p className="goal-hits">{game.hits} / 3 breakout launches</p>
          {game.won && (
            <strong className="goal-win">You made it. Somehow.</strong>
          )}
        </div>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setModal("help")}>
            <HelpCircle size={18} />
            How to be a visionary
          </button>
          <button className="nav-item" onClick={() => setModal("reset")}>
            <RotateCcw size={17} />
            New career
          </button>
          <div className="founder">
            <div className="founder-avatar">
              you<span>●</span>
            </div>
            <div>
              <strong>You, the human</strong>
              <small>{rank}</small>
            </div>
          </div>
        </div>
      </aside>

      <div
        className="main-shell"
        inert={modal || game.event ? true : undefined}
      >
        <header className="topbar">
          <div className="day-chip">
            <span className="day-dot" />
            <span>Day {game.day || Math.floor(game.elapsed / 60) + 1}</span>
            <small>of the grind</small>
          </div>
          <div className="resource-group">
            <div className="resource">
              <span className="resource-icon cash">
                <Wallet size={19} />
              </span>
              <div>
                <span>Runway</span>
                <strong>{money(game.cash)}</strong>
              </div>
              <small className="income">
                +{money(economy.incomePerDay || 0)}/day
              </small>
            </div>
            <div className="resource">
              <span className="resource-icon audience">
                <Users size={19} />
              </span>
              <div>
                <span>X followers</span>
                <strong>{count(game.followers)}</strong>
              </div>
            </div>
            <div className="resource attention-resource">
              <span className="resource-icon attention">
                <Brain size={19} />
              </span>
              <div>
                <span>Your attention</span>
                <strong>
                  {Math.round(game.attention)}
                  <small>%</small>
                </strong>
              </div>
              <div className="mini-meter">
                <i
                  style={{
                    height: `${game.attention}%`,
                    background: game.attention < 25 ? "#ff8d9a" : "#a39bfa",
                  }}
                />
              </div>
            </div>
          </div>
          <div className="topbar-actions">
            <button
              className="icon-button"
              aria-label={muted ? "Enable sound" : "Mute sound"}
              onClick={() => setMuted(!muted)}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              className="icon-button help-mobile"
              aria-label={
                game.paused ? "Resume simulation" : "Pause simulation"
              }
              aria-pressed={game.paused}
              onClick={() => dispatch({ type: "pause" })}
            >
              {game.paused ? <Play size={18} /> : <Pause size={18} />}
            </button>
          </div>
        </header>

        <main>
          <div className="page-heading">
            <div>
              <div className="heading-kicker">
                <span className="live-pill">
                  <span />
                  {workingCount > 0
                    ? "Questionable productivity"
                    : "A rare moment of peace"}
                </span>
              </div>
              <h1>
                {view === "history"
                  ? "Receipts of the grind."
                  : "Mission control."}
              </h1>
              <p>
                {view === "history"
                  ? "Every launch, every ratio, every suspiciously generous sponsor."
                  : "Your agents are cooking. Whether it’s edible is your problem."}
              </p>
            </div>
            <div className="time-controls">
              <span>Simulation</span>
              <div>
                <button
                  className="pause-button"
                  onClick={() => dispatch({ type: "pause" })}
                  aria-label={
                    game.paused ? "Resume simulation" : "Pause simulation"
                  }
                >
                  {game.paused ? <Play size={16} /> : <Pause size={16} />}
                </button>
                {[1, 2, 3].map((speed) => (
                  <button
                    key={speed}
                    className={game.speed === speed ? "speed active" : "speed"}
                    onClick={() => dispatch({ type: "speed", value: speed })}
                    aria-pressed={game.speed === speed}
                  >
                    {speed}×
                  </button>
                ))}
              </div>
            </div>
          </div>

          {game.paused && (
            <div className="pause-banner">
              <Pause size={16} />
              Paused. Ready when your brain is.
              <button onClick={() => dispatch({ type: "pause" })}>
                Resume <Play size={13} />
              </button>
            </div>
          )}
          {showTip && view === "workbench" && (
            <div className="tip-banner">
              <span className="tip-icon">
                <Sparkles size={19} />
              </span>
              <p>
                <strong>Review. Refine. Risk it.</strong> Pick a ready agent.
                Improve the idea, then ship it to grow your audience.
              </p>
              <button
                onClick={() => {
                  setShowTip(false);
                  try {
                    window.localStorage.setItem("slop-valley-tip", "1");
                  } catch {
                    /* optional */
                  }
                }}
                aria-label="Dismiss introduction"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {view === "workbench" ? (
            <>
              <section className="agents-section" aria-label="Agent team">
                <div className="section-header">
                  <div className="tabs">
                    <button
                      className={tab === "all" ? "tab active" : "tab"}
                      onClick={() => setTab("all")}
                    >
                      Your agents <span>{game.agents.length}</span>
                    </button>
                    <button
                      className={tab === "review" ? "tab active" : "tab"}
                      onClick={() => setTab("review")}
                    >
                      Needs review{" "}
                      <span className={reviewCount ? "review-count" : ""}>
                        {reviewCount}
                      </span>
                    </button>
                  </div>
                  <span className="parallel-count">
                    <Radio size={14} />
                    {workingCount} cooking
                  </span>
                </div>
                <div className="agent-grid" ref={agentRail}>
                  {filteredAgents.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      index={game.agents.indexOf(agent)}
                      selected={selected?.id === agent.id}
                      onClick={() => dispatch({ type: "select", id: agent.id })}
                    />
                  ))}
                  {tab === "review" && !filteredAgents.length && (
                    <div className="empty-agents">
                      <Check size={24} />
                      <strong>Inbox zero. Suspicious.</strong>
                      <span>Your agents will need you again shortly.</span>
                    </div>
                  )}
                  {tab === "all" && game.agents.length < economy.maxAgents && (
                    <button
                      className="hire-card"
                      onClick={() => dispatch({ type: "spawn" })}
                      disabled={game.cash < economy.spawnCost}
                    >
                      <span className="hire-icon">
                        <Plus size={24} />
                      </span>
                      <strong>One more agent</strong>
                      <span>What could possibly go wrong?</span>
                      <b>
                        {money(economy.spawnCost)} <ArrowUpRight size={14} />
                      </b>
                      <small>
                        {game.cash < economy.spawnCost
                          ? `Need ${money(economy.spawnCost - game.cash)} more`
                          : `${game.agents.length} / ${economy.maxAgents} agent seats`}
                      </small>
                    </button>
                  )}
                </div>
              </section>

              <div className="queue-toolbar">
                <div className="queue-summary">
                  <ListChecks size={18} />
                  <strong>{reviewCount} ready</strong>
                  <span>
                    {workingCount} cooking ·{" "}
                    {
                      game.agents.filter((agent) => agent.status === "idle")
                        .length
                    }{" "}
                    idle
                  </span>
                </div>
                <label className="auto-switch-label">
                  <input
                    type="checkbox"
                    checked={autoSwitch}
                    onChange={(e) => {
                      setAutoSwitch(e.target.checked);
                      try {
                        browserStorage?.setItem(
                          "slop-valley-auto-switch",
                          e.target.checked ? "1" : "0",
                        );
                      } catch {
                        /* Optional preference. */
                      }
                    }}
                  />
                  Auto-switch after feedback
                </label>
                <button
                  className="next-review-button desktop-next"
                  aria-label="Next ready agent"
                  disabled={!nextReady}
                  onClick={goNextReady}
                >
                  <span>
                    {nextReady
                      ? "Next ready"
                      : selected.status === "review"
                        ? "No other reviews"
                        : "All caught up"}
                  </span>
                  <ArrowRight size={17} />
                </button>
              </div>

              {readyNotice &&
                game.agents.some(
                  (agent) =>
                    agent.id === readyNotice.id && agent.status === "review",
                ) && (
                  <button
                    className="ready-notice"
                    onClick={() => {
                      dispatch({ type: "select", id: readyNotice.id });
                      setReadyNotice(null);
                    }}
                  >
                    <Check size={16} />
                    <span>{readyNotice.text}</span>
                    <strong>Review</strong>
                    <ArrowRight size={16} />
                  </button>
                )}

              <div className="work-layout">
                <div className="work-column">
                  <section
                    className="review-panel"
                    aria-label="Idea workbench"
                    ref={workbench}
                  >
                    <div className="panel-title">
                      <div>
                        <span className="panel-icon">
                          <SlidersHorizontal size={18} />
                        </span>
                        <h2>The human bottleneck</h2>
                      </div>
                      <span className="small-label">
                        {selected?.status === "review"
                          ? "Your judgment is required"
                          : selected?.status === "working"
                            ? "Agent at work"
                            : "Fresh context, fresh delusions"}
                      </span>
                    </div>
                    {selected?.status === "idle" ? (
                      <div className="idle-view">
                        <span
                          className={
                            "large-bot " + colors[game.agents.indexOf(selected)]
                          }
                        >
                          <Bot size={44} />
                        </span>
                        <h3>{selected.name} needs a purpose.</h3>
                        <p>
                          Preferably something with a business model. Let’s not
                          get carried away.
                        </p>
                        <label htmlFor="category">
                          Send the agent down a rabbit hole
                        </label>
                        <select
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="tools">
                            Developer tools — fix a real annoyance
                          </option>
                          <option value="consumer">
                            Consumer apps — the next big thing, again
                          </option>
                          <option value="content">
                            Content — thought leadership on demand
                          </option>
                          <option value="chaos">
                            Chaos mode — let the model cook
                          </option>
                        </select>
                        <button
                          className="primary-button"
                          onClick={() =>
                            dispatch({
                              type: "start",
                              id: selected.id,
                              category,
                            })
                          }
                          disabled={game.cash < economy.startCost}
                        >
                          <Play size={16} />
                          Start a new idea{" "}
                          <span>{money(economy.startCost)}</span>
                        </button>
                        {game.cash < economy.startCost && (
                          <p className="action-blocked">
                            Need {money(economy.startCost - game.cash)} more. A
                            freelance gig can cover it.
                          </p>
                        )}
                      </div>
                    ) : (
                      idea && (
                        <>
                          <div className="idea-topline">
                            <span className="idea-category">
                              <span />
                              {idea.category || "Questionable innovation"}
                            </span>
                            <span className="iteration">
                              v{(idea.iteration || 0) + 1}.0 <span>•</span> by{" "}
                              {selected.name}
                            </span>
                          </div>
                          <div className="idea-heading">
                            <h3>{idea.title}</h3>
                            <span className="idea-stamp">
                              {idea.quality >= 70
                                ? "Actually useful?!"
                                : idea.quality >= 45
                                  ? "There’s a there there"
                                  : "Certified slop"}
                            </span>
                          </div>
                          <p className="idea-description">{idea.description}</p>
                          <div className="idea-metrics">
                            <Meter
                              label="Actual usefulness"
                              value={idea.quality}
                              kind="quality"
                            />
                            <Meter
                              label="Originality"
                              value={idea.novelty}
                              kind="novelty"
                            />
                            <Meter
                              label="Hype potential"
                              value={idea.hype}
                              kind="hype"
                            />
                          </div>
                          <div
                            className={`decision-summary ${idea.quality >= 70 && idea.potential >= 60 ? "promising" : ""}`}
                          >
                            {idea.quality >= 70 && idea.potential >= 60 ? (
                              <Rocket size={17} />
                            ) : (
                              <FlaskConical size={17} />
                            )}
                            <span>
                              <strong>
                                {idea.quality < 55
                                  ? "Fix the product before the pitch."
                                  : idea.potential < 50
                                    ? "Find a customer before a cofounder."
                                    : idea.quality >= 70
                                      ? "Worth an honest launch."
                                      : "Promising. One more polish could help."}
                              </strong>
                              <small>
                                {game.attention < 30
                                  ? "Low attention hurts launch odds. A break will help."
                                  : `Market fit ${Math.round(idea.potential)}/100 · ${idea.iteration || 0} revisions · no guarantees, naturally.`}
                              </small>
                            </span>
                          </div>
                          <details className="review-details" key={idea.id}>
                            <summary>
                              Agent notes &amp; market read{" "}
                              <ChevronDown size={16} />
                            </summary>
                            <div className="agent-output">
                              <div>
                                <Terminal size={15} />
                                <strong>{selected.name} says</strong>
                                <span>
                                  {selected.status === "working"
                                    ? "streaming questionable thoughts"
                                    : "output complete"}
                                </span>
                              </div>
                              <p>
                                “
                                {selected.log ||
                                  idea.notes?.at(-1) ||
                                  "I have completed the task. Please do not inspect the implementation."}
                                ”
                              </p>
                              {idea.notes?.map((note, index) => (
                                <p className="review-note" key={index}>
                                  {note}
                                </p>
                              ))}
                              {idea.lastInstruction && (
                                <small>
                                  Your feedback: {idea.lastInstruction}
                                </small>
                              )}
                            </div>
                            <div className="market-hint">
                              <Eye size={16} />
                              <span>
                                <strong>
                                  Market opportunity:{" "}
                                  {idea.potential >= 70
                                    ? "a real opening"
                                    : idea.potential >= 40
                                      ? "somebody might want this"
                                      : "a solution looking for a problem"}
                                  .
                                </strong>{" "}
                                {idea.potential >= 70
                                  ? "The audience is interested. Give them something that works."
                                  : "Polish helps execution. A pivot can change the market."}
                              </span>
                            </div>
                          </details>
                          {selected.status === "working" ? (
                            <div className="working-view">
                              <div className="working-heading">
                                <span className="spinner" />
                                <strong>
                                  Agent is{" "}
                                  {idea.iteration
                                    ? "incorporating your very specific feedback"
                                    : "turning tokens into a business model"}
                                  …
                                </strong>
                                <span>{Math.round(selected.progress)}%</span>
                              </div>
                              <div className="work-progress">
                                <i style={{ width: `${selected.progress}%` }} />
                              </div>
                              <p>
                                {Math.ceil(
                                  selected.duration *
                                    (1 - selected.progress / 100),
                                )}{" "}
                                simulation seconds left.{" "}
                                {nextReady
                                  ? `${nextReady.name} is ready for you.`
                                  : "Your other agents are on it. Allegedly."}
                              </p>
                              {nextReady && (
                                <button
                                  className="secondary-button"
                                  onClick={goNextReady}
                                >
                                  Review {nextReady.name}
                                  <ArrowRight size={16} />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="iteration-controls">
                              <div className="control-heading">
                                <h4>Give it some direction</h4>
                                <span>Or say “make it better.” Again.</span>
                              </div>
                              <div className="quick-actions">
                                {["polish", "validate", "pivot", "hype"].map(
                                  (mode) => {
                                    const descriptor = ACTIONS[mode];
                                    const Icon = modeIcons[mode];
                                    const info = feedbackInfo(game, mode);
                                    return (
                                      <button
                                        key={mode}
                                        className="quick-action"
                                        aria-describedby={`action-${mode}-reason`}
                                        disabled={info.disabled}
                                        onClick={() => iterate(mode)}
                                      >
                                        <Icon size={19} />
                                        <strong>{descriptor.label}</strong>
                                        <span className="action-description">
                                          {info.effect}
                                        </span>
                                        <span className="action-cost">
                                          {money(info.cost)} · {info.attention}{" "}
                                          attention · {info.seconds}s
                                        </span>
                                        <span
                                          id={`action-${mode}-reason`}
                                          className={
                                            info.disabled
                                              ? "action-blocked"
                                              : "sr-only"
                                          }
                                        >
                                          {info.disabled && (
                                            <LockKeyhole size={12} />
                                          )}
                                          {info.reason || "Available now"}
                                        </span>
                                      </button>
                                    );
                                  },
                                )}
                              </div>
                              <form
                                className="custom-prompt"
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  if (instruction.trim()) iterate("custom");
                                }}
                              >
                                <Terminal size={17} />
                                <input
                                  aria-label="Custom agent feedback"
                                  aria-describedby="custom-feedback-hint"
                                  value={instruction}
                                  maxLength={240}
                                  onChange={(e) =>
                                    setInstruction(e.target.value)
                                  }
                                  placeholder="Try “fix bugs and simplify…”"
                                />
                                <button
                                  aria-label="Send custom feedback"
                                  aria-describedby="custom-feedback-hint"
                                  disabled={
                                    !instruction.trim() || customInfo.disabled
                                  }
                                >
                                  <Send size={18} />
                                  <span>Send</span>
                                </button>
                              </form>
                              <div
                                className="custom-hint"
                                id="custom-feedback-hint"
                              >
                                {customInfo.disabled
                                  ? customInfo.reason
                                  : `${money(customInfo.cost)} · ${customInfo.attention} attention · ${customInfo.seconds}s. ${instruction.trim() ? "Draft kept when you switch agents." : "Type your feedback to enable Send."}`}
                              </div>
                              <button
                                className="trash-button mobile-only inline-bin"
                                onClick={() =>
                                  dispatch({ type: "trash", id: selected.id })
                                }
                              >
                                <Trash2 size={16} />
                                Bin the slop <span>+5 attention</span>
                              </button>
                              <div className="ship-row">
                                <button
                                  className="trash-button"
                                  onClick={() =>
                                    dispatch({ type: "trash", id: selected.id })
                                  }
                                >
                                  <Trash2 size={16} />
                                  Bin the slop
                                </button>
                                <button
                                  className="ship-button"
                                  onClick={openShip}
                                >
                                  <Rocket size={18} />
                                  Ship it to X <ArrowUpRight size={18} />
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )
                    )}
                  </section>
                  <div className="founder-tools">
                    <div>
                      <Coffee size={23} />
                      <span>
                        <strong>You are also a resource.</strong>
                        <small>
                          {game.attention < 30
                            ? "Your attention is low. The slop is starting to look good."
                            : "The agents don’t need sleep. Unfortunately, you do."}
                        </small>
                      </span>
                    </div>
                    <button
                      disabled={economy.humanCooldown > 0}
                      onClick={() => dispatch({ type: "break" })}
                    >
                      {economy.humanCooldown > 0
                        ? "Rest in " + Math.ceil(economy.humanCooldown) + "s"
                        : "Touch grass"}{" "}
                      <span>+48 attention · 30s</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
                <aside className="timeline-panel">
                  <div className="timeline-title">
                    <div>
                      <span className="x-logo">𝕏</span>
                      <h2>The timeline</h2>
                    </div>
                    <span className="simulated-tag">Simulated</span>
                  </div>
                  <div className="timeline-subtitle">
                    A public performance of productivity.
                  </div>
                  <div className="feed-list">
                    {game.feed.length ? (
                      game.feed
                        .slice(0, 7)
                        .map((item) => <FeedItem key={item.id} item={item} />)
                    ) : (
                      <div className="feed-empty">
                        <Megaphone size={28} />
                        <p>
                          The timeline is quiet.
                          <br />
                          This is your chance to ruin that.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="timeline-footer">
                    <ShieldCheck size={13} />
                    No real posts. Real secondhand embarrassment.
                  </div>
                </aside>
              </div>

              <section className="bottom-grid" ref={shopRef}>
                <div className="upgrade-preview">
                  <div className="upgrade-icon">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3>Scale the chaos.</h3>
                    <p>Better models. Bigger context. Same you.</p>
                  </div>
                  <button onClick={() => setModal("upgrades")}>
                    Browse upgrades <ArrowRight size={16} />
                  </button>
                </div>
                <div className="freelance-card">
                  <BriefcaseBusiness size={23} />
                  <div>
                    <h3>Runway looking short?</h3>
                    <p>A client needs their button moved 3px.</p>
                  </div>
                  <button
                    disabled={economy.humanCooldown > 0}
                    onClick={() => dispatch({ type: "grant" })}
                  >
                    {economy.humanCooldown > 0
                      ? `Available in ${Math.ceil(economy.humanCooldown)}s`
                      : "Freelance"}{" "}
                    <span>+ $150 · 45s</span>
                  </button>
                </div>
              </section>
            </>
          ) : (
            <section className="history-panel">
              <div className="history-stats">
                <div>
                  <Rocket size={22} />
                  <strong>{game.shipped}</strong>
                  <span>Ideas shipped</span>
                </div>
                <div>
                  <Trophy size={22} />
                  <strong>{game.hits}</strong>
                  <span>Breakout launches</span>
                </div>
                <div>
                  <Trash2 size={22} />
                  <strong>{game.trashed}</strong>
                  <span>Slop responsibly recycled</span>
                </div>
              </div>
              {game.achievements.length > 0 && (
                <div
                  className="achievement-list"
                  aria-label="Career achievements"
                >
                  {game.achievements.map((badge) => (
                    <span key={badge}>
                      <Trophy size={15} />
                      {badge}
                    </span>
                  ))}
                </div>
              )}
              <h2>The public record</h2>
              {game.feed.length ? (
                game.feed.map((item) => <FeedItem key={item.id} item={item} />)
              ) : (
                <p>
                  Your first launch is still ahead of you. Go make something
                  questionably useful.
                </p>
              )}
              <button
                className="primary-button"
                onClick={() => setView("workbench")}
              >
                <Command size={16} />
                Back to mission control
              </button>
            </section>
          )}

          <footer className="footer">
            <span>
              <span className={"save-dot " + (saved ? "" : "unsaved")} />
              {saved
                ? "Career saved in this browser"
                : "Autosave unavailable in this browser"}
            </span>
            <span>
              All agents are fictional. The management overhead isn’t.
            </span>
            <button onClick={() => setModal("help")}>
              How to play <HelpCircle size={13} />
            </button>
          </footer>
        </main>
      </div>

      {view === "workbench" && (
        <div
          className="mobile-action-dock"
          inert={modal || game.event ? true : undefined}
        >
          <button
            className="next-review-button"
            aria-label="Next ready agent"
            disabled={!nextReady}
            onClick={goNextReady}
          >
            <ListChecks size={18} />
            <span>
              {nextReady
                ? "Next ready"
                : selected.status === "review"
                  ? "No other reviews"
                  : "All caught up"}
            </span>
            {nextReady && (
              <b>
                {
                  game.agents.filter(
                    (agent) =>
                      agent.status === "review" && agent.id !== selected.id,
                  ).length
                }
              </b>
            )}
          </button>
          {selected.status === "review" ? (
            <button className="ship-button" onClick={openShip}>
              <Rocket size={18} />
              Ship it to X
            </button>
          ) : selected.status === "idle" ? (
            <button
              className="primary-button"
              disabled={game.cash < economy.startCost}
              onClick={() =>
                dispatch({ type: "start", id: selected.id, category })
              }
            >
              <Play size={17} />
              {game.cash < economy.startCost
                ? `Need ${money(economy.startCost - game.cash)} more`
                : `New idea · ${money(economy.startCost)}`}
            </button>
          ) : (
            <div className="dock-working">
              <span className="spinner" />
              <span>
                Cooking
                <strong>
                  {Math.ceil(selected.duration * (1 - selected.progress / 100))}
                  s left
                </strong>
              </span>
            </div>
          )}
        </div>
      )}
      <nav
        className="mobile-nav"
        aria-label="Mobile navigation"
        inert={modal || game.event ? true : undefined}
      >
        <button
          aria-label="Workbench"
          aria-current={view === "workbench" ? "page" : undefined}
          onClick={() => navigate("workbench")}
        >
          <Command size={20} />
          <span>Workbench</span>
          {reviewCount > 0 && <b>{reviewCount}</b>}
        </button>
        <button
          aria-current={view === "history" ? "page" : undefined}
          onClick={() => navigate("history")}
        >
          <Radio size={20} />
          <span>Timeline</span>
        </button>
        <button onClick={() => setModal("upgrades")}>
          <Zap size={20} />
          <span>Upgrades</span>
        </button>
        <button onClick={() => setModal("more")}>
          <MoreHorizontal size={21} />
          <span>More</span>
        </button>
      </nav>

      {game.lastResult && !modal && !game.event && (
        <div className={"result-toast " + game.lastResult.kind} role="status">
          <span className="result-icon">
            {game.lastResult.kind === "error" ? (
              <HelpCircle size={22} />
            ) : (
              <Sparkles size={22} />
            )}
          </span>
          <div>
            <strong>{game.lastResult.title}</strong>
            <p>{game.lastResult.text}</p>
          </div>
          <button
            aria-label="Dismiss result"
            onClick={() => dispatch({ type: "dismissResult" })}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {modal === "ship" && idea && (
        <Modal
          title="Time to build in public."
          eyebrow="The launch ritual"
          onClose={() => setModal(null)}
        >
          <p className="modal-description">
            One post. An unreasonable amount of self-worth. How are we
            announcing <strong>{idea.title}</strong>?
          </p>
          <div className="tone-options">
            {[
              {
                id: "honest",
                title: "The honest demo",
                text: "Show what works. Quality earns trust; less spectacle.",
                icon: ShieldCheck,
              },
              {
                id: "hype",
                title: "The “I built this in 2 hours”",
                text: "More reach. More backlash if the product is slop.",
                icon: Megaphone,
              },
              {
                id: "unhinged",
                title: "The unhinged founder arc",
                text: "Maximum volatility. Could go viral. Could get ratioed.",
                icon: Zap,
              },
            ].map((option) => (
              <button
                key={option.id}
                className={tone === option.id ? "tone selected" : "tone"}
                onClick={() => setTone(option.id)}
                aria-pressed={tone === option.id}
              >
                <option.icon size={22} />
                <span>
                  <strong>{option.title}</strong>
                  <small>{option.text}</small>
                </span>
                <span className="radio-indicator">
                  {tone === option.id && <span />}
                </span>
              </button>
            ))}
          </div>
          <div className="post-preview">
            <div>
              <span className="founder-avatar">you</span>
              <strong>
                You, the human <small>@definitely_a_founder</small>
              </strong>
              <span className="x-logo">𝕏</span>
            </div>
            <p>
              {tone === "honest"
                ? `Made ${idea.title}. It solves a small problem. Would love your feedback.`
                : tone === "hype"
                  ? `I built ${idea.title} with AI in 2 hours. Entire industries are about to change. A thread 🧵`
                  : `I replaced an entire department with ${idea.title}. If you’re still writing code, you’re already obsolete. (We're hiring.)`}
            </p>
          </div>
          <p className="modal-footnote">
            This posts inside the game. Outcomes depend on the idea, your
            attention, your launch style, and luck.
          </p>
          <button
            className="ship-button full-width"
            onClick={() => {
              dispatch({ type: "ship", id: selected.id, tone });
              setModal(null);
            }}
          >
            Post to the simulated timeline <Send size={17} />
          </button>
        </Modal>
      )}

      {modal === "upgrades" && (
        <Modal
          title="Spend money to make money.*"
          eyebrow="The upgrade trap"
          onClose={() => setModal(null)}
        >
          <p className="modal-description">
            *Results may include spending more money.
          </p>
          <div className="shop-balance">
            <Wallet size={19} />
            Available runway<strong>{money(game.cash)}</strong>
          </div>
          {["model", "context"].map((key) => {
            const upgrade = UPGRADES[key];
            const level = game.upgrades[key];
            return (
              <div className="upgrade-row" key={key}>
                <span className={"upgrade-product " + key}>
                  {key === "model" ? (
                    <Brain size={29} />
                  ) : (
                    <Terminal size={29} />
                  )}
                </span>
                <div>
                  <h3>{upgrade.label}</h3>
                  <p>{upgrade.description}</p>
                  <span className="upgrade-level">
                    Level {level} / {upgrade.maxLevel}
                  </span>
                </div>
                <button
                  className="primary-button"
                  aria-label={`Upgrade ${upgrade.label}`}
                  disabled={
                    level >= upgrade.maxLevel ||
                    game.cash < economy.upgradeCosts[key]
                  }
                  onClick={() => dispatch({ type: "upgrade", key })}
                >
                  {level >= upgrade.maxLevel
                    ? "Maxed out"
                    : game.cash < economy.upgradeCosts[key]
                      ? `Need ${money(economy.upgradeCosts[key] - game.cash)} more`
                      : `Upgrade ${money(economy.upgradeCosts[key])}`}
                  {level < upgrade.maxLevel && <Plus size={14} />}
                </button>
              </div>
            );
          })}
          <div className="upgrade-row">
            <span className="upgrade-product seats">
              <Bot size={29} />
            </span>
            <div>
              <h3>Another agent seat</h3>
              <p>Parallelize your ambition and your mistakes.</p>
              <span className="upgrade-level">
                {game.agents.length} / {economy.maxAgents} seats occupied
              </span>
            </div>
            <button
              className="primary-button"
              disabled={
                game.agents.length >= economy.maxAgents ||
                game.cash < economy.spawnCost
              }
              onClick={() => dispatch({ type: "spawn" })}
            >
              {game.agents.length >= economy.maxAgents
                ? "Full house"
                : game.cash < economy.spawnCost
                  ? `Need ${money(economy.spawnCost - game.cash)} more`
                  : `Hire ${money(economy.spawnCost)}`}
              <Plus size={14} />
            </button>
          </div>
          <p className="modal-footnote">
            Sponsorship income grows with your audience. Each game day lasts 60
            simulation seconds.
          </p>
        </Modal>
      )}

      {modal === "more" && (
        <Modal
          title="The human settings."
          eyebrow="Management, but make it manageable"
          onClose={() => setModal(null)}
        >
          <div className="mobile-goal">
            <Trophy size={26} />
            <div>
              <strong>{compact(game.followers)} / 10k followers</strong>
              <p>
                {game.hits} / 3 breakout launches. Become too big to fact-check.
              </p>
            </div>
          </div>
          <div className="more-actions">
            <button onClick={() => setModal("help")}>
              <HelpCircle size={20} />
              <span>How to play</span>
              <ChevronRight size={17} />
            </button>
            <button onClick={() => setMuted(!muted)}>
              {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              <span>{muted ? "Enable sound" : "Mute sound"}</span>
              <span>{muted ? "Off" : "On"}</span>
            </button>
            <button onClick={() => setModal("reset")}>
              <RotateCcw size={20} />
              <span>New career</span>
              <ChevronRight size={17} />
            </button>
          </div>
          <p className="modal-footnote">
            {saved
              ? "Your career saves automatically in this browser."
              : "Storage is blocked in this browser. Your career will not persist after closing."}{" "}
            Dark mode. Lighter responsibilities sold separately.
          </p>
        </Modal>
      )}

      {modal === "help" && (
        <Modal
          title="Congrats. You’re management."
          eyebrow="A field guide to the grind"
          onClose={() => setModal(null)}
        >
          <div className="help-steps">
            <div>
              <Bot />
              <span>
                <strong>Delegate the ambition.</strong>
                <p>
                  Agents generate ideas in parallel. Select a colorful agent
                  card to see what it’s doing. More seats mean more shots at a
                  hit. Next ready jumps to an agent waiting for a review. Enable
                  auto-switch to move to the next review after giving feedback,
                  shipping, or binning an idea. Your draft prompts stay with
                  each idea while you switch.
                </p>
              </span>
            </div>
            <div>
              <Brain />
              <span>
                <strong>Supply the missing brain cell.</strong>
                <p>
                  Inspect usefulness, originality, and hype. Polish improves
                  execution; validate catches slop; pivot changes the
                  opportunity; hype buys reach. Custom feedback recognizes words
                  like “test”, “simple”, “pivot”, and “viral”.
                </p>
              </span>
            </div>
            <div>
              <Rocket />
              <span>
                <strong>Ship. Get celebrated. Or ratioed.</strong>
                <p>
                  Launch on the simulated X feed. Good ideas can win followers
                  and revenue. Bad launches cost reputation. Honest demos are
                  safer; founder meltdowns are volatile.
                </p>
              </span>
            </div>
            <div>
              <Zap />
              <span>
                <strong>Reinvest in the bit.</strong>
                <p>
                  Followers attract daily sponsorships. Upgrade models and
                  context or hire up to eight agents. Reach 10,000 followers and
                  three breakout launches to win, then keep playing.
                </p>
              </span>
            </div>
            <div>
              <Coffee />
              <span>
                <strong>Remember the human.</strong>
                <p>
                  Feedback and launches spend your attention. It recovers slowly
                  while agents work. Touch grass to recover it. Freelance to
                  refill cash if you’re broke. Both advance game time, so agents
                  keep working. They share a short cooldown; resume the
                  simulation to recover.
                </p>
              </span>
            </div>
          </div>
          <div className="keyboard-tips">
            <span>
              <kbd>Space</kbd> Pause / resume
            </span>
            <span>
              <kbd>1</kbd>–<kbd>8</kbd> Select agent
            </span>
            <span>
              <kbd>N</kbd> Next ready
            </span>
          </div>
          <p className="modal-footnote">
            Autosaved locally. Reopening the game starts paused. Time also
            pauses while a dialog is open or the tab is hidden. No real AI
            calls, bills, or social posts.
          </p>
          <button
            className="primary-button full-width"
            onClick={() => setModal(null)}
          >
            I am wildly qualified for this <ArrowRight size={16} />
          </button>
        </Modal>
      )}

      {modal === "reset" && (
        <Modal
          title="Have you tried a new career?"
          eyebrow="The hard reset"
          onClose={() => setModal(null)}
        >
          <p className="modal-description">
            This resets your agents, followers, cash, and launch history in this
            browser. Your current career cannot be recovered.
          </p>
          <div className="reset-actions">
            <button className="secondary-button" onClick={() => setModal(null)}>
              Keep the dream alive
            </button>
            <button
              className="danger-button"
              onClick={() => {
                setGame(createGame());
                setView("workbench");
                setTab("all");
                setDrafts({});
                setReadyNotice(null);
                setModal(null);
              }}
            >
              Start fresh
            </button>
          </div>
        </Modal>
      )}

      {game.event && (
        <Modal
          title={game.event.title}
          eyebrow="The ecosystem has entered the chat"
          className="event-modal"
        >
          <div className="event-symbol">
            <Radio size={35} />
          </div>
          <p className="modal-description">{game.event.description}</p>
          <div className="event-options">
            {game.event.options.map((option) => (
              <button
                key={option.id}
                onClick={() => dispatch({ type: "event", option: option.id })}
              >
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
                <ArrowUpRight size={19} />
              </button>
            ))}
          </div>
          <p className="modal-footnote">
            The simulation is paused while you make this extremely strategic
            decision.
          </p>
        </Modal>
      )}
    </div>
  );
}
