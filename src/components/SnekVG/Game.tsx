"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Message from "./Message";
import Scoreboard, { InputMethod } from "./Scoreboard";
import Skull from "./Skull";
import {
  Cell,
  Direction,
  inFrenzy,
  level,
  MAX_LEVEL,
  newGame,
  reduce,
  running,
  size,
  stepInterval,
  Sus,
} from "./engine";

const half = size / 2;
// At most this many steps are run per animation frame; a slow frame drops the rest.
const MAX_STEPS_PER_FRAME = 4;

const KEYS: Record<string, Direction> = {
  w: "up",
  a: "left",
  s: "down",
  d: "right",
  ArrowUp: "up",
  ArrowLeft: "left",
  ArrowDown: "down",
  ArrowRight: "right",
};

// Colours the disco grub, bonus grubs and the frenzy background cycle through.
const hues = (saturation: number, lightness: number) =>
  [0, 60, 120, 180, 240, 300, 360].map(h => `hsl(${h}, ${saturation}%, ${lightness}%)`).join(";");
const DISCO_COLORS = hues(100, 65);
const FRENZY_COLORS = hues(55, 20);

// A grub colour nudged around the wheel: one of the sus grub's tells.
const tint = (color: string) =>
  color.replace(/hsl\((\d+)/, (_, hue) => `hsl(${(Number(hue) + 35) % 360}`);

// How the sus grub is drawn while it gives itself away. Otherwise it is drawn
// exactly like the regular grub.
function susLook(sus: Sus, color: string) {
  switch (sus.tell) {
    case "blink": return { opacity: 0 };
    case "tint": return { fill: tint(color) };
    case "twitch": return { transform: "translate(3 -2)" };
    default: return {};
  }
}

// Asks the API for a one-time token for a new game; scores are sent with it.
function newGameToken(): Promise<string | null> {
  return fetch("/api/snek/games", { method: "POST", cache: "no-store" })
    .then(res => (res.ok ? res.json() : null))
    .then(body => (typeof body?.token === "string" ? body.token : null))
    .catch(() => null);
}

// Typing initials on the scoreboard must not steer, pause or restart the game.
function inScoreboard(target: EventTarget | null) {
  return target instanceof Element && target.closest("[data-scoreboard]") !== null;
}

export default function SnekVG() {
  const containerRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Client-only component (see index.tsx), so the browser APIs are available here.
  const [isMobile] = useState(() => globalThis.matchMedia("(pointer: coarse)").matches);
  const [reducedMotion] = useState(() => globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [snakeHiss] = useState(() => new Audio('/snake_hiss.mp3'));
  const [game, dispatch] = useReducer(reduce, undefined, () => {
    // Scale the starting speed to screen width: smaller screen = slower steps.
    const screenWidth = globalThis.innerWidth || 800;
    return newGame(Math.max(40, Math.round(40 * (800 / screenWidth))));
  });
  // The board's pixel size; the grid is centred in it.
  const [board, setBoard] = useState({ width: 0, height: 0 });

  // How the player steered last: it picks the keyboard or touch scoreboard.
  const inputRef = useRef<InputMethod>(isMobile ? "touch" : "keyboard");
  const tokenRef = useRef<Promise<string | null> | null>(null);

  const isRunning = running(game);
  const interval = stepInterval(game);
  const frenzy = inFrenzy(game);

  // A new token whenever a game starts: the first move, or any restart after it.
  useEffect(() => {
    if (game.started) tokenRef.current = newGameToken();
  }, [game.started, game.round]);

  useEffect(() => {
    const svg = containerRef.current;
    if (!svg) return;
    const measure = () => {
      const { width, height } = svg.getBoundingClientRect();
      setBoard({ width, height });
      dispatch({ type: "resize", cols: Math.floor(width / size), rows: Math.floor(height / size) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    let startX = 0, startY = 0;
    let lastTapTime = 0;
    let longPressTimer: ReturnType<typeof setTimeout> | undefined;
    let longPressTriggered = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (inScoreboard(e.target)) return;
      e.preventDefault();
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      longPressTriggered = false;
      longPressTimer = setTimeout(() => {
        longPressTriggered = true;
        dispatch({ type: "reset" });
      }, 600);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (inScoreboard(e.target)) return;
      clearTimeout(longPressTimer);
      if (longPressTriggered) return;

      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;

      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
        // Tap — check for double tap
        const now = Date.now();
        if (now - lastTapTime < 300) {
          dispatch({ type: "togglePause" });
          lastTapTime = 0;
        } else {
          dispatch({ type: "start" });
          lastTapTime = now;
        }
      } else {
        // Swipe
        inputRef.current = "touch";
        const direction: Direction = Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? "right" : "left")
          : (dy > 0 ? "down" : "up");
        dispatch({ type: "turn", direction });
      }
    };

    wrapper.addEventListener("touchstart", handleTouchStart, { passive: false });
    wrapper.addEventListener("touchend", handleTouchEnd);

    return () => {
      clearTimeout(longPressTimer);
      wrapper.removeEventListener("touchstart", handleTouchStart);
      wrapper.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (inScoreboard(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const direction = KEYS[key];
      if (direction) {
        // Arrow keys would scroll the page.
        event.preventDefault();
        inputRef.current = "keyboard";
        dispatch({ type: "turn", direction });
      } else if (key === "p") {
        dispatch({ type: "togglePause" });
      } else if (key === "r") {
        dispatch({ type: "reset" });
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  // The loop: every animation frame, run however many steps the time since the
  // last frame covers. It restarts whenever the step interval changes.
  useEffect(() => {
    if (!isRunning) return;
    let frame = 0;
    let last = performance.now();
    let owed = 0;
    const tick = (now: number) => {
      // A background tab or a long stall counts as one short frame.
      owed += Math.min(now - last, 100);
      last = now;
      const count = Math.min(MAX_STEPS_PER_FRAME, Math.floor(owed / interval));
      if (count > 0) {
        owed = count === MAX_STEPS_PER_FRAME ? 0 : owed - count * interval;
        dispatch({ type: "steps", count });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isRunning, interval]);

  useEffect(() => {
    if (game.over) snakeHiss?.play().catch(() => {});
  }, [game.over, snakeHiss]);

  // Cell -> pixel centre, with the grid centred in the board.
  const left = (board.width - game.cols * size) / 2 + half;
  const top = (board.height - game.rows * size) / 2 + half;
  const px = (cell: Cell) => ({ cx: left + cell.x * size, cy: top + cell.y * size });

  const controls = isMobile
    ? "Swipe to steer · Double-tap to pause · Hold to restart"
    : "WASD or arrows to move · P to pause · R to restart";
  const warning = "Heads up: eating a blinking disco grub makes the colors flash for a while.";

  return (
    <div ref={wrapperRef} className="absolute top-32 left-0 right-0 bottom-11">
      <div className="mx-auto w-full">
        <span className="block font-bold text-ink-strong p-1 text-center text-xl">
          Snek-VG -- Score: {game.score} · Speed: {level(game)}{level(game) === MAX_LEVEL ? " (max)" : ""}
          {frenzy && " · FRENZY!"}
        </span>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        ref={containerRef}
        style={{ width: "100%", height: "90%", backgroundColor: game.colors.bg }}
        tabIndex={0}
      >
        {frenzy && !reducedMotion && (
          <rect width="100%" height="100%" fill={game.colors.bg}>
            <animate attributeName="fill" values={FRENZY_COLORS} dur="2.4s" repeatCount="indefinite" />
          </rect>
        )}
        {/* Drawn in board order, so the markup doesn't say which one is sus. */}
        {[game.grub, game.sus]
          .filter(cell => cell !== null)
          .sort((a, b) => a.x - b.x || a.y - b.y)
          .map(cell => (
            <circle
              {...px(cell)}
              fill={game.colors.grub}
              key={`${cell.x},${cell.y}`}
              r={half}
              data-snek="grub"
              {...(cell === game.sus ? susLook(game.sus, game.colors.grub) : {})}
            />
          ))}
        {game.disco && (
          <circle {...px(game.disco)} fill={game.colors.grub} r={half} data-snek="disco">
            <animate attributeName="fill" values={DISCO_COLORS} dur={reducedMotion ? "3s" : "0.6s"} repeatCount="indefinite" />
            {!reducedMotion && (
              <animate attributeName="r" values={`${half};${half * 1.5};${half}`} dur="0.6s" repeatCount="indefinite" />
            )}
          </circle>
        )}
        {game.bonuses.map(bonus => (
          <circle {...px(bonus)} fill={game.colors.grub} key={bonus.id} r={size} data-snek="bonus">
            <animate attributeName="fill" values={DISCO_COLORS} dur={reducedMotion ? "4s" : "1.2s"} repeatCount="indefinite" />
          </circle>
        ))}
        {game.body.map(p => <circle {...px(p)} fill={game.colors.body} key={p.id} r={half} />)}
        {game.popups.map(popup => {
          const { cx, cy } = px(popup);
          // Drifts up and fades out over its last half second.
          const age = (game.clock - popup.from) / (popup.until - popup.from);
          const opacity = Math.min(1, (popup.until - game.clock) / 500);
          // Eating the sus grub leaves a skull and crossbones for 2 seconds.
          if (popup.value < 0) return <Skull key={popup.id} x={cx} y={cy} opacity={opacity} />;
          return (
            <text
              key={popup.id}
              x={cx}
              y={cy - size - age * size * 2}
              fill="#fff"
              fontSize={22}
              fontWeight="bold"
              opacity={opacity}
              paintOrder="stroke"
              stroke="rgba(0, 0, 0, 0.6)"
              strokeWidth={3}
              textAnchor="middle"
            >
              +{popup.value}
            </text>
          );
        })}
      </svg>
      {!game.started && !game.over && <Message text="Controls" subtext={controls} note={warning} />}
      {game.started && game.paused && !game.over && <Message text="Pause" subtext={controls} />}
      {game.over && <Scoreboard
        key={game.round}
        score={game.score}
        getInput={() => inputRef.current}
        getToken={() => tokenRef.current}
        accent={game.colors.grub}
        isMobile={isMobile}
        onRestart={() => dispatch({ type: "reset" })}
      />}
    </div>
  );
}
