// Hooks that feed the reducer: the board's size, keyboard and touch input, and
// the step loop.

import { RefObject, useEffect, useRef } from "react";
import { Action, Direction, size } from "./engine";

type Dispatch = (action: Action) => void;

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

// At most this many steps are run per animation frame; a slow frame drops the rest.
const MAX_STEPS_PER_FRAME = 4;

// Typing initials on the scoreboard must not steer, pause or restart the game.
function inScoreboard(target: EventTarget | null) {
  return target instanceof Element && target.closest("[data-scoreboard]") !== null;
}

// The newest callback, for effects that subscribe once.
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

// Measures the SVG, reports its pixel size and gives the reducer a grid that fits.
export function useBoardSize(svgRef: RefObject<SVGSVGElement | null>, dispatch: Dispatch, onSize: (width: number, height: number) => void) {
  const onSizeRef = useLatest(onSize);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const measure = () => {
      const { width, height } = svg.getBoundingClientRect();
      onSizeRef.current(width, height);
      dispatch({ type: "resize", cols: Math.floor(width / size), rows: Math.floor(height / size) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, [svgRef, dispatch, onSizeRef]);
}

// WASD or arrows steer, P pauses, R restarts. onSteer runs on every steering key.
export function useKeyboardControls(dispatch: Dispatch, onSteer: () => void) {
  const onSteerRef = useLatest(onSteer);
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (inScoreboard(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const direction = KEYS[key];
      if (direction) {
        // Arrow keys would scroll the page.
        event.preventDefault();
        onSteerRef.current();
        dispatch({ type: "turn", direction });
      } else if (key === "p") {
        dispatch({ type: "togglePause" });
      } else if (key === "r") {
        dispatch({ type: "reset" });
      }
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [dispatch, onSteerRef]);
}

// Swipe to steer, tap to start, double-tap to pause, hold to restart. onSwipe
// runs on every swipe.
export function useTouchControls(wrapperRef: RefObject<HTMLElement | null>, dispatch: Dispatch, onSwipe: () => void) {
  const onSwipeRef = useLatest(onSwipe);
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
        onSwipeRef.current();
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
  }, [wrapperRef, dispatch, onSwipeRef]);
}

// The loop: every animation frame, run however many steps the time since the
// last frame covers. It restarts whenever the step interval changes.
export function useGameLoop(isRunning: boolean, interval: number, dispatch: Dispatch) {
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
  }, [isRunning, interval, dispatch]);
}
