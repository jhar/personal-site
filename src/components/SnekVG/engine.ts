// Snek-VG's rules, as a pure reducer. Everything lives on one grid of
// `size`-pixel cells: the snake, grubs and bonus grubs all sit on cell centres,
// so what you see is exactly what collides. Game.tsx draws it in SVG.

import { ColorSet, randomizeColorSet } from "./utils";

export const size = 12;

export type Direction = "up" | "down" | "left" | "right";

export interface Cell {
  x: number;
  y: number;
}

interface Part extends Cell {
  id: number;
}

export interface Bonus extends Part {
  value: number;
  nextMoveAt: number;
  // The way it's wandering; it keeps going that way for a while.
  heading: Direction;
}

// Bonus grubs are smaller the more they're worth: radius in cells, and how
// many cells around their centre count as touching them.
export const bonusRadius = (value: number) => 2.4 / value;
const bonusReach = (value: number) => (value <= 2 ? 1 : 0);

export type Tell = "blink" | "tint" | "twitch";

// Looks exactly like the regular grub it drops with, except that every few
// seconds it gives itself away for a moment.
export interface Sus extends Cell {
  tell: Tell | null;
  // The last tell shown, so the next one is a different kind.
  lastTell: Tell | null;
  // Game-clock times: when the current tell ends, and when the next begins.
  tellUntil: number;
  nextTellAt: number;
}

// Runs from the snake, but every move costs it energy; once it has none left
// it just sits there, worn out.
export interface Juke extends Cell {
  // Moves it has left in it, out of JUKE_ENERGY.
  energy: number;
  nextMoveAt: number;
}

export interface Popup extends Part {
  value: number;
  from: number;
  until: number;
}

export interface Game {
  started: boolean;
  paused: boolean;
  over: boolean;
  // Bumped on every restart.
  round: number;
  cols: number;
  rows: number;
  // Milliseconds per step at the start of a game; it shrinks as you eat.
  baseInterval: number;
  // Milliseconds of play so far (pauses don't count).
  clock: number;
  direction: Direction;
  // Turns waiting for their step, so two quick key presses both count.
  turns: Direction[];
  head: Cell;
  // Tail first, head last.
  body: Part[];
  nextId: number;
  // Segments grown beyond the first 3: sets the snake's length and the speed.
  // Regular, sus and juke grubs grow it by one; disco grubs don't; bonus grubs add
  // one in all, when the frenzy ends, if you caught any.
  eaten: number;
  score: number;
  grub: Cell | null;
  // Dropped next to a regular grub now and then. It's a choice: eat it for a
  // frenzy, or eat the regular grub and it disappears.
  disco: Cell | null;
  // Also dropped next to a regular grub now and then, never with a disco grub.
  // Eating it costs SUS_PENALTY points; eating the regular grub removes it.
  sus: Sus | null;
  // Also dropped next to a regular grub now and then, as the only extra. Worth
  // JUKE_POINTS if you catch it; eating the regular grub removes it.
  juke: Juke | null;
  frenzyUntil: number;
  // Whether this frenzy's bonus grubs have earned the end-of-frenzy segment.
  frenzyCaught: boolean;
  bonuses: Bonus[];
  nextBonusAt: number;
  popups: Popup[];
  colors: ColorSet;
}

export type Action =
  | { type: "resize"; cols: number; rows: number }
  | { type: "steps"; count: number }
  | { type: "turn"; direction: Direction }
  | { type: "start" }
  | { type: "togglePause" }
  | { type: "reset" };

// Speed: every GRUBS_PER_LEVEL grubs the step interval shrinks by 6%, until it
// reaches MIN_INTERVAL_RATIO of the starting interval at level MAX_LEVEL.
const GRUBS_PER_LEVEL = 5;
const SPEED_UP = 0.94;
// Level 1 is one notch slower than the game's original speed, and the top
// speed is still twice that original speed.
export const START_SLOWDOWN = 1 / SPEED_UP;
const MIN_INTERVAL_RATIO = 0.5 / START_SLOWDOWN;
export const MAX_LEVEL = Math.ceil(Math.log(MIN_INTERVAL_RATIO) / Math.log(SPEED_UP)) + 1;

// Deviant grubs (disco, sus, juke) drop next to a regular grub, at most one
// at a time. Each kind's chance per regular grub eaten starts at DEVIANT_BASE
// and rises with the score until it reaches DEVIANT_MAX: 24% for any of them
// at the start, 60% from a score of 60.
const DEVIANT_AFTER = 3; // regular grubs eaten before any can appear
const DEVIANT_BASE = 0.08;
const DEVIANT_PER_POINT = 0.002;
const DEVIANT_MAX = 0.2;
export const deviantChance = (score: number) =>
  Math.min(DEVIANT_MAX, DEVIANT_BASE + score * DEVIANT_PER_POINT);
export const SUS_PENALTY = 2;
export const JUKE_POINTS = 2;
export const JUKE_ENERGY = 60;
// It starts running once the snake's head is this close (in steps).
const JUKE_SIGHT = 7;
// Snake steps per juke move: a fresh juke is a bit quicker than the snake, so
// it can only be cornered; as it tires it slows, gently at first and then
// sharply, to a quarter of the snake's speed.
const JUKE_FRESH_PACE = 0.75;
const JUKE_TIRED_PACE = 4;
// How often it picks the best way out; otherwise it panics and picks any.
const JUKE_SMARTS = 0.9;
// The first tell comes a little sooner than the rest, which are 5-10s apart.
const SUS_FIRST_TELL_MS = [3000, 6000];
const SUS_TELL_GAP_MS = [5000, 10000];
const TELL_MS: Record<Tell, number> = { blink: 180, tint: 600, twitch: 320 };
const TELLS = Object.keys(TELL_MS) as Tell[];
export const FRENZY_MS = 10000;
const BONUS_FIRST = 3;
const BONUS_MAX = 5;
const BONUS_EVERY_MS = 1500;
const BONUS_WALK_MS = 250;
// Chance per move that a bonus grub picks a new heading.
const BONUS_TURN_CHANCE = 0.15;
const BONUS_MIN = 2;
const BONUS_MAX_VALUE = 5;

const DELTAS: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};
const DIRECTIONS = Object.keys(DELTAS) as Direction[];

const randomInt = (max: number) => Math.floor(Math.random() * max);

export function newGame(baseInterval: number, round = 0, cols = 0, rows = 0): Game {
  const game: Game = {
    started: false,
    paused: false,
    over: false,
    round,
    cols,
    rows,
    baseInterval,
    clock: 0,
    direction: "down",
    turns: [],
    head: { x: 1, y: 1 },
    body: [],
    nextId: 1,
    eaten: 0,
    score: 0,
    grub: null,
    disco: null,
    sus: null,
    juke: null,
    frenzyUntil: 0,
    frenzyCaught: false,
    bonuses: [],
    nextBonusAt: 0,
    popups: [],
    colors: randomizeColorSet(),
  };
  return { ...game, grub: freeCell(game) };
}

export const level = (game: Game) =>
  Math.min(MAX_LEVEL, Math.floor(game.eaten / GRUBS_PER_LEVEL) + 1);

export const stepInterval = (game: Game) =>
  game.baseInterval * Math.max(MIN_INTERVAL_RATIO, SPEED_UP ** (level(game) - 1));

export const inFrenzy = (game: Game) => game.clock < game.frenzyUntil;

export const running = (game: Game) => game.started && !game.paused && !game.over;

const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
// Bonus grubs are twice as wide, so they also cover the cells around them.
const touches = (bonus: Bonus, cell: Cell) => {
  const reach = bonusReach(bonus.value);
  return Math.abs(bonus.x - cell.x) <= reach && Math.abs(bonus.y - cell.y) <= reach;
};

function taken(game: Game, cell: Cell) {
  return same(cell, game.head) ||
    game.body.some(part => same(part, cell)) ||
    (game.grub !== null && same(game.grub, cell)) ||
    (game.disco !== null && same(game.disco, cell)) ||
    (game.sus !== null && same(game.sus, cell)) ||
    (game.juke !== null && same(game.juke, cell));
}

// A random empty cell, or null before the board has a size.
function freeCell(game: Game): Cell | null {
  if (game.cols < 1 || game.rows < 1) return null;
  let cell = { x: randomInt(game.cols), y: randomInt(game.rows) };
  for (let tries = 0; tries < 50 && taken(game, cell); tries++) {
    cell = { x: randomInt(game.cols), y: randomInt(game.rows) };
  }
  return cell;
}

const between = ([min, max]: number[]) => min + Math.random() * (max - min);

function tell(clock: number, sus: Sus): Sus {
  if (sus.tell && clock >= sus.tellUntil) {
    return { ...sus, tell: null, nextTellAt: clock + between(SUS_TELL_GAP_MS) };
  }
  if (!sus.tell && clock >= sus.nextTellAt) {
    const kinds = TELLS.filter(kind => kind !== sus.lastTell);
    const kind = kinds[randomInt(kinds.length)];
    return { ...sus, tell: kind, lastTell: kind, tellUntil: clock + TELL_MS[kind] };
  }
  return sus;
}

function newBonus(game: Game): Game {
  const cell = freeCell(game);
  if (!cell) return game;
  const bonus: Bonus = {
    ...cell,
    id: game.nextId,
    value: BONUS_MIN + randomInt(BONUS_MAX_VALUE - BONUS_MIN + 1),
    nextMoveAt: game.clock + BONUS_WALK_MS,
    heading: DIRECTIONS[randomInt(DIRECTIONS.length)],
  };
  return { ...game, nextId: game.nextId + 1, bonuses: [...game.bonuses, bonus] };
}

const inside = (game: Game, cell: Cell) =>
  cell.x >= 0 && cell.y >= 0 && cell.x < game.cols && cell.y < game.rows;

// Distance on the board, which wraps around at the edges (for the snake).
function gap(game: Game, a: Cell, b: Cell) {
  const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
  return Math.min(dx, game.cols - dx) + Math.min(dy, game.rows - dy);
}

// Bonus grubs wander: they mostly keep their heading, now and then pick a new
// one, and turn when they reach an edge. The one worth the most runs from the
// snake instead, though not perfectly.
function walk(game: Game, bonus: Bonus, flees: boolean): Bonus {
  if (game.clock < bonus.nextMoveAt) return bonus;
  const moves = DIRECTIONS
    .map(heading => ({ heading, cell: { x: bonus.x + DELTAS[heading].x, y: bonus.y + DELTAS[heading].y } }))
    .filter(move => inside(game, move.cell));
  let move = moves.find(m => m.heading === bonus.heading);
  if (flees && Math.random() < 0.8) {
    const far = (m: { cell: Cell }) => gap(game, m.cell, game.head);
    move = moves.reduce((best, m) => (far(m) > far(best) ? m : best), move ?? moves[0]);
  } else if (!move || Math.random() < BONUS_TURN_CHANCE) {
    move = moves[randomInt(moves.length)];
  }
  if (!move) return { ...bonus, nextMoveAt: game.clock + BONUS_WALK_MS };
  return { ...bonus, ...move.cell, heading: move.heading, nextMoveAt: game.clock + BONUS_WALK_MS };
}

// The juke grub keeps away from where the snake's head is and where it's
// about to be. It only spends energy when it actually moves.
function juke(game: Game, juke: Juke): Juke {
  if (juke.energy <= 0 || game.clock < juke.nextMoveAt) return juke;
  const ahead = { x: game.head.x + DELTAS[game.direction].x, y: game.head.y + DELTAS[game.direction].y };
  const danger = (cell: Cell) => Math.min(gap(game, cell, game.head), gap(game, cell, ahead));
  // Between equally safe cells, it heads the way that opens up the most room.
  const room = (cell: Cell) => {
    const dx = Math.abs(cell.x - game.head.x), dy = Math.abs(cell.y - game.head.y);
    return Math.min(dx, game.cols - dx) ** 2 + Math.min(dy, game.rows - dy) ** 2;
  };
  const better = (a: Cell, b: Cell) => danger(b) > danger(a) || (danger(b) === danger(a) && room(b) > room(a));
  // Resting (out of sight, or nowhere better to go) doesn't bank moves for later.
  const rest = { ...juke, nextMoveAt: game.clock };
  if (danger(juke) > JUKE_SIGHT) return rest;
  const moves = DIRECTIONS
    .map(d => ({ x: juke.x + DELTAS[d].x, y: juke.y + DELTAS[d].y }))
    .filter(cell => inside(game, cell) && !taken(game, cell));
  if (moves.length === 0) return rest;
  const best = moves.reduce((a, b) => (better(a, b) ? b : a));
  // Staying put is free; it only moves to get further away, unless it panics.
  const panic = Math.random() > JUKE_SMARTS;
  if (!panic && !better(juke, best)) return rest;
  const cell = panic ? moves[randomInt(moves.length)] : best;
  const energy = juke.energy - 1;
  const tired = 1 - energy / JUKE_ENERGY;
  const pace = JUKE_FRESH_PACE + (JUKE_TIRED_PACE - JUKE_FRESH_PACE) * tired ** 3;
  // Counted from when this move was due, so its pace holds between steps.
  return { ...cell, energy, nextMoveAt: juke.nextMoveAt + pace * stepInterval(game) };
}

function step(game: Game): Game {
  const [turn, ...turns] = game.turns;
  const direction = turn ?? game.direction;
  const d = DELTAS[direction];
  // Leaving one edge comes back in on the opposite one.
  const head = {
    x: (game.head.x + d.x + game.cols) % game.cols,
    y: (game.head.y + d.y + game.rows) % game.rows,
  };
  let next: Game = { ...game, direction, turns, clock: game.clock + stepInterval(game) };

  // The tail's last cell is vacated this step, so moving into it is fine.
  const length = 3 + game.eaten;
  const kept = game.body.length >= length ? game.body.slice(game.body.length - length + 1) : game.body;
  if (kept.some(part => same(part, head))) {
    return { ...next, over: true };
  }
  next = { ...next, head, body: [...kept, { ...head, id: next.nextId }], nextId: next.nextId + 1 };

  if (next.grub && same(next.grub, head)) {
    next = { ...next, eaten: next.eaten + 1, score: next.score + 1, colors: randomizeColorSet(), grub: null, disco: null, sus: null, juke: null };
    next = { ...next, grub: freeCell(next) };
    // Now and then a second grub drops too: disco, sus or juke, never two.
    const chance = deviantChance(next.score);
    const roll = Math.random();
    const cell = !inFrenzy(next) && next.eaten >= DEVIANT_AFTER && roll < 3 * chance
      ? freeCell(next)
      : null;
    if (cell && roll < chance) {
      next = { ...next, disco: cell };
    } else if (cell && roll < 2 * chance) {
      next = { ...next, juke: { ...cell, energy: JUKE_ENERGY, nextMoveAt: next.clock } };
    } else if (cell) {
      const nextTellAt = next.clock + between(SUS_FIRST_TELL_MS);
      next = { ...next, sus: { ...cell, tell: null, lastTell: null, tellUntil: 0, nextTellAt } };
    }
  }

  if (next.sus && same(next.sus, head)) {
    const { x, y } = next.sus;
    const popup = { id: next.nextId, x, y, value: -SUS_PENALTY, from: next.clock, until: next.clock + SUS_PENALTY * 1000 };
    next = {
      ...next,
      eaten: next.eaten + 1,
      score: Math.max(0, next.score - SUS_PENALTY),
      sus: null,
      nextId: next.nextId + 1,
      popups: [...next.popups, popup],
    };
  } else if (next.sus) {
    const sus = tell(next.clock, next.sus);
    if (sus !== next.sus) next = { ...next, sus };
  }

  if (next.juke && same(next.juke, head)) {
    const { x, y } = next.juke;
    const popup = { id: next.nextId, x, y, value: JUKE_POINTS, from: next.clock, until: next.clock + JUKE_POINTS * 1000 };
    next = {
      ...next,
      eaten: next.eaten + 1,
      score: next.score + JUKE_POINTS,
      juke: null,
      nextId: next.nextId + 1,
      popups: [...next.popups, popup],
    };
  } else if (next.juke) {
    next = { ...next, juke: juke(next, next.juke) };
  }

  if (next.disco && same(next.disco, head)) {
    next = {
      ...next,
      // Worth nothing itself: it only starts the frenzy.
      disco: null,
      frenzyCaught: false,
      frenzyUntil: next.clock + FRENZY_MS,
      nextBonusAt: next.clock + BONUS_EVERY_MS,
    };
    for (let i = 0; i < BONUS_FIRST; i++) next = newBonus(next);
  }

  if (inFrenzy(next)) {
    if (next.clock >= next.nextBonusAt) {
      next = { ...next, nextBonusAt: next.clock + BONUS_EVERY_MS };
      if (next.bonuses.length < BONUS_MAX) next = newBonus(next);
    }
    const caught = next.bonuses.filter(bonus => touches(bonus, head));
    if (caught.length > 0) {
      const clock = next.clock;
      next = {
        ...next,
        frenzyCaught: true,
        score: next.score + caught.reduce((sum, bonus) => sum + bonus.value, 0),
        bonuses: next.bonuses.filter(bonus => !caught.includes(bonus)),
        // "+3" stays up for about 3 seconds.
        popups: [
          ...next.popups,
          ...caught.map(({ id, x, y, value }) => ({ id, x, y, value, from: clock, until: clock + value * 1000 })),
        ],
      };
    }
    const walker = next;
    const top = Math.max(...next.bonuses.map(bonus => bonus.value));
    const runner = next.bonuses.find(bonus => bonus.value === top);
    next = { ...next, bonuses: next.bonuses.map(bonus => walk(walker, bonus, bonus === runner)) };
  } else if (next.bonuses.length > 0 || next.frenzyCaught) {
    // The frenzy is over.
    next = { ...next, bonuses: [], frenzyCaught: false, eaten: next.eaten + (next.frenzyCaught ? 1 : 0) };
  }

  if (next.popups.some(popup => popup.until <= next.clock)) {
    const clock = next.clock;
    next = { ...next, popups: next.popups.filter(popup => popup.until > clock) };
  }
  return next;
}

const clamp = <T extends Cell>(cell: T, cols: number, rows: number): T => ({
  ...cell,
  x: Math.min(cols - 1, cell.x),
  y: Math.min(rows - 1, cell.y),
});

export function reduce(game: Game, action: Action): Game {
  switch (action.type) {
    case "resize": {
      const { cols, rows } = action;
      if (cols < 1 || rows < 1 || (cols === game.cols && rows === game.rows)) return game;
      // Pull anything outside a smaller board back in.
      const next: Game = {
        ...game,
        cols,
        rows,
        head: clamp(game.head, cols, rows),
        grub: game.grub && clamp(game.grub, cols, rows),
        disco: game.disco && clamp(game.disco, cols, rows),
        sus: game.sus && clamp(game.sus, cols, rows),
        juke: game.juke && clamp(game.juke, cols, rows),
        bonuses: game.bonuses.map(bonus => clamp(bonus, cols, rows)),
      };
      return next.grub ? next : { ...next, grub: freeCell(next) };
    }
    case "steps": {
      if (!running(game) || game.cols < 1 || game.rows < 1) return game;
      let next = game;
      for (let i = 0; i < action.count && !next.over; i++) next = step(next);
      return next;
    }
    case "turn": {
      if (game.over) return game;
      const last = game.turns.at(-1) ?? game.direction;
      // No reversing into yourself, and at most two turns queued.
      const ok = action.direction !== last && action.direction !== OPPOSITE[last] && game.turns.length < 2;
      if (game.started && !ok) return game;
      return { ...game, started: true, turns: ok ? [...game.turns, action.direction] : game.turns };
    }
    case "start":
      return game.started ? game : { ...game, started: true };
    case "togglePause":
      return game.over ? game : { ...game, started: true, paused: !game.paused };
    case "reset":
      return { ...newGame(game.baseInterval, game.round + 1, game.cols, game.rows), started: game.started };
  }
}
