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

  // isGrub = false means checking head collisions w/ body
  function collisionDetection(a: Part, b: Part, isGrub: boolean) {
    const offset = isGrub ? size : half;
    if (a.x > (b.x - offset)) {
      if (a.x < (b.x + offset)) {
        if (a.y > (b.y - offset)) {
          if (a.y < (b.y + offset)) {
            if (isGrub) {
              setScore(prev => prev + 1);
              newGrub();
            } else {
              setGameOver(true);
            }
          }
        }
      }
    }
  }

  function newGrub() {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setGrubX(randomize(width) + half);
      setGrubY(randomize(height) + half);
    }
  }

  useEffect(() => {
    newGrub();
  }, []);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case "w":
          if (direction !== "down") {
            setDirection("up");
          }
  
          return;
  
        case "a":
          if (direction !== "right") {
            setDirection("left");
          }
  
          return;
  
        case "s":
          if (direction !== "up") {
            setDirection("down");
          }
  
          return;
  
        case "d":
          if (direction !== "left") {
            setDirection("right");
          }
  
          return;
  
        case "p":
          return setPaused(prev => !prev);
  
        default:
          return null;
      }
    }

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [direction]);


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
        style="width: 100%; height: 90%; background-color: red"
        tabIndex={0}
      >
        <circle cx={`${grubX}`} cy={`${grubY}`} fill="black" r={half} />
        {body.map(p => <circle cx={`${p.x}`} cy={`${p.y}`} fill="blue" key={`${p.t}`} r={half}/>)}
      </svg>
      <div class="mx-auto w-full">
        <span class="block dark:text-white p-1 text-center text-md">
          Controls: WASD, Press P to pause.
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
