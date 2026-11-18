"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import Board from "./Board";
import { useBoardSize, useGameLoop, useKeyboardControls, useTouchControls } from "./controls";
import Message from "./Message";
import Scoreboard, { InputMethod } from "./Scoreboard";
import {
  Cell,
  inFrenzy,
  level,
  MAX_LEVEL,
  newGame,
  reduce,
  running,
  size,
  START_SLOWDOWN,
  stepInterval,
} from "./engine";

const half = size / 2;

// Asks the API for a one-time token for a new game; scores are sent with it.
function newGameToken(): Promise<string | null> {
  return fetch("/api/snek/games", { method: "POST", cache: "no-store" })
    .then(res => (res.ok ? res.json() : null))
    .then(body => (typeof body?.token === "string" ? body.token : null))
    .catch(() => null);
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
    const original = Math.max(40, Math.round(40 * (800 / screenWidth)));
    return newGame(Math.round(original * START_SLOWDOWN));
  });
  // The board's pixel size; the grid is centred in it.
  const [board, setBoard] = useState({ width: 0, height: 0 });

  // How this game was steered, which picks its scoreboard; the player can't.
  // Any keyboard steering at all makes it a keyboard game, so swiping once
  // doesn't put a keyboard player on the touch board.
  const inputRef = useRef<InputMethod>(isMobile ? "touch" : "keyboard");
  const keyboardUsedRef = useRef(false);
  const tokenRef = useRef<Promise<string | null> | null>(null);

  const isRunning = running(game);
  const interval = stepInterval(game);
  const frenzy = inFrenzy(game);

  // A new token whenever a game starts: the first move, or any restart after it.
  useEffect(() => {
    if (!game.started) return;
    tokenRef.current = newGameToken();
    keyboardUsedRef.current = false;
    inputRef.current = isMobile ? "touch" : "keyboard";
  }, [game.started, game.round, isMobile]);

  useBoardSize(containerRef, dispatch, useCallback((width, height) => setBoard({ width, height }), []));
  useKeyboardControls(dispatch, () => {
    keyboardUsedRef.current = true;
    inputRef.current = "keyboard";
  });
  useTouchControls(wrapperRef, dispatch, () => {
    if (!keyboardUsedRef.current) inputRef.current = "touch";
  });
  useGameLoop(isRunning, interval, dispatch);

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
        <Board game={game} px={px} reducedMotion={reducedMotion} />
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
