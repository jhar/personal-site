import { useEffect } from "preact/hooks";

export default function SnakeLoader() {
  useEffect(() => {
    console.log("useEffect()");
    const script = document.createElement("script");
    script.src = "/snake.js";
    document.body.appendChild(script);
  }, []);

  return (
    <div id="target-container" class="bg-lightblue h-full m-0 w-full">
      <div></div>
    </div>
  );
}
