import { useEffect, useRef, useState } from "preact/hooks";
import Message from "./Message.tsx";
import { ColorSet, randomizeColorSet, randomizeGrubPosition } from "./utils.ts";

const size = 12;
const half = size/2;

type Direction = "up" | "down" | "left" | "right";

interface Part {
  t?: number;
  x: number;
  y: number;
}

export default function SnekVG() {
  const containerRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const loopRef = useRef<number | undefined>(undefined);

  const [time, setTime] = useState(0);
  const [score, setScore] = useState(0);
  const [direction, setDirection] = useState<Direction>("down");
  const [grubX, setGrubX] = useState<number>(-size);
  const [grubY, setGrubY] = useState<number>(-size);
  const [xOff, setXOff] = useState(1);
  const [yOff, setYOff] = useState(1);
  const [body, setBody] = useState<Part[]>([]);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [snakeHiss, setSnakeHiss] = useState<HTMLAudioElement | null>(null);
  const [colorSet, setColorSet] = useState<ColorSet>(randomizeColorSet());
  const [gameSpeed, setGameSpeed] = useState(40);

  function reset() {
    setTime(0);
    setScore(0);
    setDirection("down");
    setGrubX(-size);
    setGrubY(-size);
    setXOff(1);
    setYOff(1);
    setBody([]);
    setPaused(false);
    setGameOver(false);
    setColorSet(randomizeColorSet());
    newGrub();
  }

  // isGrub = false means checking head collisions w/ body
  function collisionDetection(a: Part, b: Part, isGrub: boolean) {
    const offset = isGrub ? size : half;
    if (a.x > (b.x - offset)) {
      if (a.x < (b.x + offset)) {
        if (a.y > (b.y - offset)) {
          if (a.y < (b.y + offset)) {
            if (isGrub) {
              setScore(prev => prev + 1);
              setColorSet(randomizeColorSet());
              newGrub();
            } else {
              if (a.x < 0 || a.y < 0) {
                return;
              }
              setGameOver(true);
            }
          }
        }
      }
    }
  }

  function newGrub() {
    const svg = containerRef.current;
    if (svg) {
      const { width, height } = svg.getBoundingClientRect();
      setGrubX(randomizeGrubPosition(width) + half);
      setGrubY(randomizeGrubPosition(height) + half);
    }
  }

  useEffect(() => {
    const mobile = globalThis.matchMedia("(pointer: coarse)").matches;
    setIsMobile(mobile);
    setSnakeHiss(new Audio('/snake_hiss.mp3'));

    // Scale speed to screen width: smaller screen = slower tick interval
    const screenWidth = globalThis.innerWidth || 800;
    const computed = Math.max(40, Math.round(40 * (800 / screenWidth)));
    setGameSpeed(computed);

    newGrub();

    const svg = wrapperRef.current;
    if (svg) {
      let startX = 0, startY = 0;
      let lastTapTime = 0;
      let longPressTimer: ReturnType<typeof setTimeout> | undefined;
      let longPressTriggered = false;

      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        longPressTriggered = false;
        longPressTimer = setTimeout(() => {
          longPressTriggered = true;
          reset();
        }, 600);
      };

      const handleTouchEnd = (e: TouchEvent) => {
        clearTimeout(longPressTimer);
        if (longPressTriggered) return;

        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;

        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
          // Tap — check for double tap
          const now = Date.now();
          if (now - lastTapTime < 300) {
            setPaused(p => !p);
            lastTapTime = 0;
          } else {
            lastTapTime = now;
          }
        } else {
          // Swipe
          if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) setDirection(prev => prev !== "left" ? "right" : prev);
            else setDirection(prev => prev !== "right" ? "left" : prev);
          } else {
            if (dy > 0) setDirection(prev => prev !== "up" ? "down" : prev);
            else setDirection(prev => prev !== "down" ? "up" : prev);
          }
        }
      };

      svg.addEventListener("touchstart", handleTouchStart, { passive: false });
      svg.addEventListener("touchend", handleTouchEnd);

      return () => {
        svg.removeEventListener("touchstart", handleTouchStart);
        svg.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, []);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case "w": return (direction !== "down") && setDirection("up");
        case "a": return (direction !== "right") && setDirection("left");
        case "s": return (direction !== "up") && setDirection("down");
        case "d": return (direction !== "left") && setDirection("right");
        case "p": return setPaused(prev => !prev);
        case "r": return reset();
        default: return null;
      }
    }

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [direction]);

  useEffect(() => {
    const svg = containerRef.current;
    if (svg) {
      const { width, height } = svg.getBoundingClientRect();
      const x = xOff * size;
      const y = yOff * size;
      if (x > width) setXOff(0);
      if (x < -size) setXOff(Math.floor(width/size));
      if (y > height) setYOff(0);
      if (y < -size) setYOff(Math.floor(height/size));
    }
  }, [containerRef, xOff, yOff]);

  useEffect(() => {
    function loopFn() {
      setTime(prev => prev + 1);

      if (direction === "down") {
        setYOff(prev => prev + 1);
      } else if (direction === "up") {
        setYOff(prev => prev - 1);
      } else if (direction === "right") {
        setXOff(prev => prev + 1);
      } else if (direction === "left") {
        setXOff(prev => prev - 1);
      }

      setBody(prevBody => {
        const head = { t: time, x: xOff * size, y: yOff * size };
        collisionDetection(head, { x: grubX as number, y: grubY as number }, true);
        prevBody.forEach((part) => collisionDetection(head, part, false));

        const newBody = [...prevBody, head];
        return newBody.length > (3 + score) ? newBody.slice(1) : newBody;
      })
    }

    if (gameOver || paused) {
      clearInterval(loopRef.current);
    } else {
      loopRef.current = setInterval(loopFn, gameSpeed);
    }

    return () => {
      if (loopRef.current) {
        clearInterval(loopRef.current);
      }
    }
  }, [gameOver, paused, time, xOff, yOff, gameSpeed]);

  useEffect(() => {
    if (gameOver) snakeHiss?.play();
  }, [gameOver]);

  return (
    <div ref={wrapperRef} class="absolute top-32 left-0 right-0 bottom-11">
      <div class="mx-auto w-full">
        <span class="block font-bold dark:text-white p-1 text-center text-xl">
          Snek-VG -- Score: {score}
        </span>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        ref={containerRef}
        style={`width: 100%; height: 90%; background-color: ${colorSet.bg}`}
        tabIndex={0}
      >
        <circle cx={`${grubX}`} cy={`${grubY}`} fill={colorSet.grub} r={half} />
        {body.map(p => <circle cx={`${p.x}`} cy={`${p.y}`} fill={colorSet.body} key={`${p.t}`} r={half}/>)}
      </svg>
      <div class="mx-auto w-full">
        <span class="block dark:text-white p-1 text-center text-md">
          {isMobile
            ? "Swipe to steer · Double-tap to pause · Hold to restart"
            : "Controls: WASD, Press P to pause, Press R to restart."}
        </span>
      </div>
      {(paused && !gameOver) && <Message text="Pause" />}
      {gameOver && <Message text="Game Over" />}
    </div>
  );
}
