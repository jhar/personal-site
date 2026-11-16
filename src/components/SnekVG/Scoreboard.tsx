"use client";

import { FormEvent, useEffect, useState } from "react";

export type InputMethod = "keyboard" | "touch";

interface Score {
  id: string;
  ts: string;
  initials: string;
  score: number;
  input: InputMethod;
  city: string;
  country: string;
}

// Keyboard and touch players each have their own top 10.
type Boards = Record<InputMethod, Score[]>;

const BOARD_SIZE = 10;
const METHODS: { method: InputMethod; label: string }[] = [
  { method: "keyboard", label: "Keyboard" },
  { method: "touch", label: "Touch" },
];

interface ScoreboardProps {
  score: number;
  // How the player steered: it picks which board the score goes on.
  getInput: () => InputMethod;
  // This game's one-time token, resolving to null if the API was unreachable.
  getToken: () => Promise<string | null> | null;
  accent: string;
  isMobile: boolean;
  onRestart: () => void;
}

// Anything but A-Z is dropped as you type; the API only accepts 1-3 of them.
export const cleanInitials = (value: string) =>
  value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);

function place({ city, country }: Score) {
  return [city, country].filter(Boolean).join(", ") || "—";
}

export default function Scoreboard({ score, getInput, getToken, accent, isMobile, onRestart }: ScoreboardProps) {
  const [input] = useState(getInput);
  const [boards, setBoards] = useState<Boards | null>(null);
  // The board on show; it starts on the player's own.
  const [shown, setShown] = useState<InputMethod>(input);
  const [loadFailed, setLoadFailed] = useState(false);
  const [initials, setInitials] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/snek/scores", { cache: "no-store" })
      .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((scores: Boards) => live && setBoards(scores))
      .catch(() => live && setLoadFailed(true));
    return () => {
      live = false;
    };
  }, []);

  const mine = boards?.[input] ?? null;
  const board = boards?.[shown] ?? null;
  const qualifies = mine !== null && savedId === null && score > 0 &&
    (mine.length < BOARD_SIZE || score > mine[BOARD_SIZE - 1].score);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!initials || saving) return;
    setSaving(true);
    setError(null);
    try {
      const gameToken = await getToken();
      if (!gameToken) throw new Error("The scoreboard is unavailable right now.");
      const res = await fetch("/api/snek/scores", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initials, score, input, token: gameToken }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ? `Couldn't save: ${body.error}.` : "Couldn't save your score.");
      setBoards(body.scores);
      setSavedId(body.id);
      setShown(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your score.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      data-scoreboard
      className="absolute bg-slate/85 inset-0 flex items-start justify-center overflow-y-auto"
    >
      <div className="flex flex-col items-center gap-3 text-center text-offwhite px-4 py-6 my-auto w-full max-w-md">
        <span className="font-bold text-2xl">Game Over</span>
        <span className="text-lg">Score: {score}</span>

        {qualifies && (
          <form onSubmit={submit} className="flex flex-col items-center gap-2">
            <label htmlFor="snek-initials" className="text-sm opacity-75">
{input === "touch" ? "Touch" : "Keyboard"} high score! Enter your initials
            </label>
            <div className="flex items-center gap-3">
              <input
                id="snek-initials"
                value={initials}
                onChange={e => setInitials(cleanInitials(e.target.value))}
                maxLength={3}
                pattern="[A-Z]{1,3}"
                autoFocus={!isMobile}
                autoComplete="off"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="done"
                placeholder="AAA"
                className="bg-transparent border-b-2 font-bold font-mono outline-none placeholder:text-offwhite/30 text-3xl text-center tracking-[0.3em] w-[5ch] pl-[0.3em]"
                style={{ borderColor: accent, caretColor: accent }}
              />
              <button
                type="submit"
                disabled={!initials || saving}
                className="border-2 font-bold px-3 py-1 rounded disabled:opacity-40 transition-colors"
                style={{ borderColor: accent, color: accent }}
              >
                {saving ? "…" : "Save"}
              </button>
            </div>
          </form>
        )}
        {error && <span className="text-sm" style={{ color: accent }}>{error}</span>}

        {board === null && !loadFailed && <span className="text-sm opacity-75">Loading scores…</span>}
        {loadFailed && <span className="text-sm opacity-75">Couldn&apos;t load the scoreboard.</span>}
        {boards !== null && (
          <div className="flex font-mono gap-4 text-sm tracking-widest uppercase" role="tablist" aria-label="High scores">
            {METHODS.map(({ method, label }) => (
              <button
                key={method}
                type="button"
                role="tab"
                aria-selected={shown === method}
                onClick={() => setShown(method)}
                className={`border-b-2 font-bold pb-0.5 ${shown === method ? "" : "border-transparent opacity-50 hover:opacity-100"}`}
                style={shown === method ? { borderColor: accent } : undefined}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {board !== null && board.length === 0 && (
          <span className="text-sm opacity-75">No {shown} scores yet.</span>
        )}
        {board !== null && board.length > 0 && (
          <table className="font-mono text-sm tabular-nums w-full">
            <caption className="sr-only">{shown === "touch" ? "Touch" : "Keyboard"} high scores</caption>
            <thead className="opacity-60 text-xs">
              <tr>
                <th className="font-normal pr-2 text-right">#</th>
                <th className="font-normal px-2 text-left">Who</th>
                <th className="font-normal px-2 text-right">Score</th>
                <th className="font-normal pl-2 text-left">From</th>
              </tr>
            </thead>
            <tbody>
              {board.map((s, i) => (
                <tr
                  key={s.id}
                  className={s.id === savedId ? "font-bold" : undefined}
                  style={s.id === savedId ? { color: accent } : undefined}
                >
                  <td className="pr-2 py-0.5 text-right">{i + 1}</td>
                  <td className="px-2 text-left tracking-widest">{s.initials}</td>
                  <td className="px-2 text-right">{s.score}</td>
                  <td className="max-w-[12rem] pl-2 text-left truncate" title={place(s)}>{place(s)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button
          type="button"
          onClick={onRestart}
          className="mt-2 text-sm underline underline-offset-4 opacity-75 hover:opacity-100"
        >
          Play again
        </button>
        {!isMobile && <span className="text-xs opacity-50">or press R</span>}
      </div>
    </div>
  );
}
