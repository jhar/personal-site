import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";

export default function LocalTime({ ts }: { ts: string }) {
  const display = useSignal(ts);

  useEffect(() => {
    display.value = new Date(ts).toLocaleString();
  }, [ts]);

  return <span>{display.value}</span>;
}
