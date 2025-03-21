import { useEffect, useRef, useState } from "preact/hooks";

export default function SnekVG() {
  const containerRef = useRef<SVGSVGElement | null>(null);

  const [time, setTime] = useState(0);
  const [score, setScore] = useState(0);
  const [direction, setDirection] = useState("down");
  const [grubX, setGrubX] = useState<number | null>(null);
  const [grubY, setGrubY] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  function newGrub() {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      console.info('rect:');
      console.info(rect);
      const x = randomize(rect.width);
      setGrubX(x + 4);
      const y = randomize(rect.height);
      setGrubY(y + 4);
    }
 }


  useEffect(() => {
    console.log('SnekVG.useEffect()');
    newGrub()
  }, []);

  return (
    <div class="absolute top-32 left-0 right-0 bottom-11">
      <div class="mx-auto w-full">
        <span class="block dark:text-white p-1 text-center text-xl">
          Snek-VG -- Score: {score}
        </span>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        ref={containerRef}
        style="width: 100%; height: 90%; background-color: red"
      >
        <circle cx={`${grubX}`} cy={`${grubY}`} fill="black" r="4" />
      </svg>
      <div class="mx-auto w-full">
        <span class="block dark:text-white p-1 text-center text-md">
          Controls: WASD, Press P to pause.
        </span>
      </div>
    </div>

  );
}

const randomize = (max: number) => Math.floor(Math.random() * Math.floor(max - 8));
