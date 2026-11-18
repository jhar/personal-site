// Everything drawn inside the game's SVG: the frenzy background, grubs, the
// snake and the score popups. Game.tsx owns the state and passes it in.

import Skull from "./Skull";
import { Bonus, bonusRadius, Cell, Game, inFrenzy, Juke, Popup, size, Sus } from "./engine";

const half = size / 2;

// Colours the disco grub, bonus grubs and the frenzy background cycle through.
const hues = (saturation: number, lightness: number) =>
  [0, 60, 120, 180, 240, 300, 360].map(h => `hsl(${h}, ${saturation}%, ${lightness}%)`).join(";");
const DISCO_COLORS = hues(100, 65);
const FRENZY_COLORS = hues(55, 20);

// A grub colour nudged around the wheel: one of the sus grub's tells.
const tint = (color: string) =>
  color.replace(/hsl\((\d+)/, (_, hue) => `hsl(${(Number(hue) + 60) % 360}`);

// How the sus grub is drawn while it gives itself away. Otherwise it is drawn
// exactly like the regular grub.
function susLook(sus: Sus, color: string) {
  switch (sus.tell) {
    case "blink": return { opacity: 0 };
    case "tint": return { fill: tint(color) };
    case "twitch": return { transform: "translate(4 -3)" };
    default: return {};
  }
}

type Px = (cell: Cell) => { cx: number; cy: number };

interface Props {
  game: Game;
  // Cell -> pixel centre.
  px: Px;
  reducedMotion: boolean;
}

// The regular grub and the sus grub, drawn in board order, so the markup
// doesn't say which one is sus.
function Grubs({ game, px }: Props) {
  return [game.grub, game.sus]
    .filter(cell => cell !== null)
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .map(cell => (
      <circle
        {...px(cell)}
        fill={game.colors.grub}
        key={`${cell.x},${cell.y}`}
        r={half}
        data-snek="grub"
        {...(cell === game.sus ? susLook(game.sus, game.colors.grub) : {})}
      />
    ));
}

// Drawn like a regular grub; worn out, it naps.
function JukeGrub({ juke, color, px }: { juke: Juke; color: string; px: Px }) {
  const { cx, cy } = px(juke);
  return (
    <g data-snek="juke">
      <circle cx={cx} cy={cy} r={half} fill={color} />
      {juke.energy <= 0 && (
        <text x={cx + half} y={cy - half} fill={color} fontSize={12} fontWeight="bold">z</text>
      )}
    </g>
  );
}

function DiscoGrub({ disco, color, px, reducedMotion }: { disco: Cell; color: string; px: Px; reducedMotion: boolean }) {
  return (
    <circle {...px(disco)} fill={color} r={half} data-snek="disco">
      <animate attributeName="fill" values={DISCO_COLORS} dur={reducedMotion ? "3s" : "0.6s"} repeatCount="indefinite" />
      {!reducedMotion && (
        <animate attributeName="r" values={`${half};${half * 1.5};${half}`} dur="0.6s" repeatCount="indefinite" />
      )}
    </circle>
  );
}

function BonusGrub({ bonus, color, px, reducedMotion }: { bonus: Bonus; color: string; px: Px; reducedMotion: boolean }) {
  return (
    <circle {...px(bonus)} fill={color} r={size * bonusRadius(bonus.value)} data-snek="bonus">
      <animate attributeName="fill" values={DISCO_COLORS} dur={reducedMotion ? "4s" : "1.2s"} repeatCount="indefinite" />
    </circle>
  );
}

function ScorePopup({ popup, clock, px }: { popup: Popup; clock: number; px: Px }) {
  const { cx, cy } = px(popup);
  // Drifts up and fades out over its last half second.
  const age = (clock - popup.from) / (popup.until - popup.from);
  const opacity = Math.min(1, (popup.until - clock) / 500);
  // Eating the sus grub leaves a skull and crossbones for 2 seconds.
  if (popup.value < 0) return <Skull x={cx} y={cy} opacity={opacity} />;
  return (
    <text
      x={cx}
      y={cy - size - age * size * 2}
      fill="#fff"
      fontSize={22}
      fontWeight="bold"
      opacity={opacity}
      paintOrder="stroke"
      stroke="rgba(0, 0, 0, 0.6)"
      strokeWidth={3}
      textAnchor="middle"
    >
      +{popup.value}
    </text>
  );
}

export default function Board(props: Props) {
  const { game, px, reducedMotion } = props;
  const color = game.colors.grub;
  return (
    <>
      {inFrenzy(game) && !reducedMotion && (
        <rect width="100%" height="100%" fill={game.colors.bg}>
          <animate attributeName="fill" values={FRENZY_COLORS} dur="2.4s" repeatCount="indefinite" />
        </rect>
      )}
      <Grubs {...props} />
      {game.juke && <JukeGrub juke={game.juke} color={color} px={px} />}
      {game.disco && <DiscoGrub disco={game.disco} color={color} px={px} reducedMotion={reducedMotion} />}
      {game.bonuses.map(bonus => (
        <BonusGrub key={bonus.id} bonus={bonus} color={color} px={px} reducedMotion={reducedMotion} />
      ))}
      {game.body.map(p => <circle {...px(p)} fill={game.colors.body} key={p.id} r={half} />)}
      {game.popups.map(popup => <ScorePopup key={popup.id} popup={popup} clock={game.clock} px={px} />)}
    </>
  );
}
