import { useEffect, useRef, useState } from "preact/hooks";

const size = 12;
const half = size/2;
const speed = 40;

type Direction = "up" | "down" | "left" | "right";

interface Part {
  t?: number;
  x: number;
  y: number;
}

export default function SnekVG() {
  const containerRef = useRef<SVGSVGElement | null>(null);
  const loopRef = useRef<number | undefined>(undefined);

  const [time, setTime] = useState(0);
  const [score, setScore] = useState(0);
  const [direction, setDirection] = useState<Direction>("down");
  const [grubX, setGrubX] = useState<number | null>(null);
  const [grubY, setGrubY] = useState<number | null>(null);
  const [xOff, setXOff] = useState(1);
  const [yOff, setYOff] = useState(1);
  const [body, setBody] = useState<Part[]>([]);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [colorSet, setColorSet] = useState<ColorSet>(randomColorSet());

  function reset() {
    setTime(0);
    setScore(0);
    setDirection("down");
    setGrubX(null);
    setGrubY(null);
    setXOff(1);
    setYOff(1);
    setBody([]);
    setPaused(false);
    setGameOver(false);
    setColorSet(randomColorSet());
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
              setColorSet(randomColorSet());
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
      setGrubX(randomize(width) + half);
      setGrubY(randomize(height) + half);
    }
  }

  useEffect(() => newGrub(), []);

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
      loopRef.current = setInterval(loopFn, speed);
    }

    return () => {
      if (loopRef.current) {
        clearInterval(loopRef.current);
      }
    }
  }, [gameOver, paused, time, xOff, yOff]);

  return (
    <div class="absolute top-32 left-0 right-0 bottom-11">
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
          Controls: WASD, Press P to pause, Press R to restart.
        </span>
      </div>
      {(paused && !gameOver) && <Message text="Pause" />}
      {gameOver && <Message text="Game Over" />}
    </div>

  );
}

interface MessageProps {
  text: string;
}

function Message({ text }: MessageProps) {
  return (
    <div class="absolute bg-slate bg-opacity-60 inset-0 flex items-center justify-center">
      <span class="font-bold text-2xl text-offwhite">{text}</span>
    </div>
  )
}

const randomize = (max: number) => Math.floor(Math.random() * Math.floor(max - 8));

interface ColorSet {
  bg: string;
  body: string;
  grub: string;
}

function randomColorSet(): ColorSet {
  const angle = Math.random() * 2 * Math.PI;
  const r1 = Math.round(128 + 127 * Math.sin(angle));
  const g1 = Math.round(128 + 127 * Math.sin(angle + 2 * Math.PI / 3));
  const b1 = Math.round(128 + 127 * Math.sin(angle + 4 * Math.PI / 3));

  const angle2 = angle + Math.PI / 4;
  const r2 = Math.round(128 + 127 * Math.sin(angle2));
  const g2 = Math.round(128 + 127 * Math.sin(angle2 + 2 * Math.PI / 3));
  const b2 = Math.round(128 + 127 * Math.sin(angle2 + 4 * Math.PI / 3));

  const angle3 = angle + Math.PI / 2;
  const r3 = Math.round(128 + 127 * Math.sin(angle3));
  const g3 = Math.round(128 + 127 * Math.sin(angle3 + 2 * Math.PI / 3));
  const b3 = Math.round(128 + 127 * Math.sin(angle3 + 4 * Math.PI / 3));

  return {
    bg: `rgb(${r3}, ${g3}, ${b3})`,
    body: `rgb(${r2}, ${g2}, ${b2})`,
    grub: `rgb(${r1}, ${g1}, ${b1})`,
  };
}
