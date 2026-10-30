'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  DARK_THEME,
  DEFAULT_OPTIONS,
  DEFAULT_THEME,
  TetrominoVisualizer,
  type PlacementInfo,
  type Theme,
  type VisualizerOptions,
} from './core/visualizer';
import { DEFAULT_PIECE_COLORS, PIECE_TYPES, type PieceType } from './core/tetrominoes';

export interface TetrominoVizProps extends Partial<VisualizerOptions> {
  className?: string;
  /** Applied to the wrapper, which fills its parent by default. Size the parent. */
  style?: CSSProperties;
  /** Accessible label for the canvas. */
  label?: string;
  /** The caption along the bottom: placement number, total and piece. */
  showInfo?: boolean;
  /** The settings panel in the top-right corner. */
  showControls?: boolean;
  /** Start with the settings panel folded to its title bar. */
  controlsCollapsed?: boolean;
}

type ThemePreset = 'props' | 'dekalog' | 'dark';

/**
 * Client-only wrapper around TetrominoVisualizer. Every visualizer option is a
 * prop and updates live; the ref exposes the instance (randomize, clear, play,
 * pause, next, ...). Pass `showInfo={false} showControls={false}` for just the
 * animation.
 */
export const TetrominoViz = forwardRef<TetrominoVisualizer | null, TetrominoVizProps>(function TetrominoViz(
  {
    className,
    style,
    label = 'Tetromino placements inside a polyomino',
    showInfo = true,
    showControls = true,
    controlsCollapsed = false,
    ...props
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viz, setViz] = useState<TetrominoVisualizer | null>(null);
  // Settings changed from the panel win over props until the panel is reset.
  const [overrides, setOverrides] = useState<Partial<VisualizerOptions>>({});
  const [preset, setPreset] = useState<ThemePreset>('props');
  const [info, setInfo] = useState<{ text: string; piece?: PieceType }>({ text: '' });
  const [playing, setPlaying] = useState(props.autoplay ?? true);

  const theme: Partial<Theme> | undefined =
    preset === 'dekalog' ? DEFAULT_THEME : preset === 'dark' ? DARK_THEME : props.theme;
  const options: Partial<VisualizerOptions> = { ...props, ...overrides, theme };
  const colors = { ...DEFAULT_PIECE_COLORS, ...options.colors };

  const callbacks = useRef(props);
  const wrapped: Partial<VisualizerOptions> = {
    ...options,
    onPlacementChange: (p: PlacementInfo) => {
      setInfo({ text: `${p.index + 1} / ${p.total}`, piece: p.placement.piece });
      callbacks.current.onPlacementChange?.(p);
    },
    onShapeChange: (s) => {
      setInfo({ text: s.placements ? `— / ${s.placements}` : 'no tetromino fits' });
      callbacks.current.onShapeChange?.(s);
    },
  };
  const optionsRef = useRef(wrapped);
  // Runs before the effects below, so they always see this render's options.
  useLayoutEffect(() => {
    callbacks.current = props;
    optionsRef.current = wrapped;
  });

  useImperativeHandle(ref, () => viz as TetrominoVisualizer, [viz]);

  useEffect(() => {
    // Effects only run in the browser, so the core never touches window during SSR.
    const instance = new TetrominoVisualizer(canvasRef.current!, optionsRef.current);
    setViz(instance);
    return () => {
      instance.destroy();
      setViz(null);
    };
    // `renderer` can only be chosen at creation time.
  }, [props.renderer]);

  useEffect(() => {
    viz?.setOptions(optionsRef.current);
  });

  const set = (o: Partial<VisualizerOptions>) => setOverrides((prev) => ({ ...prev, ...o }));
  const value = <K extends keyof VisualizerOptions>(k: K) => (options[k] ?? DEFAULT_OPTIONS[k]) as VisualizerOptions[K];

  return (
    <div
      className={`tviz ${className ?? ''}`}
      style={{ position: 'relative', width: '100%', height: '100%', ...PRESET_VARS[preset], ...style }}
    >
      <style>{CSS}</style>
      <canvas ref={canvasRef} role="img" aria-label={label} style={{ display: 'block', width: '100%', height: '100%' }} />

      {showInfo && (
        <div className="tviz-caption" aria-live="off">
          <span>{info.text}</span>
          {info.piece && (
            <>
              <span className="tviz-sep">·</span>
              <span style={{ color: colors[info.piece] }}>{info.piece}</span>
            </>
          )}
        </div>
      )}

      {showControls && viz && (
        <details className="tviz-panel" open={!controlsCollapsed}>
          <summary>Controls</summary>
          <div className="tviz-buttons">
            <button type="button" onClick={() => viz.randomize()}>Random shape</button>
            <button
              type="button"
              onClick={() => {
                const init = value('initialShape');
                if (init === 'random') viz.randomize();
                else viz.setShape(init);
              }}
            >
              Reset shape
            </button>
            <button type="button" onClick={() => viz.clear()}>Clear</button>
            <button
              type="button"
              onClick={() => {
                if (viz.isPlaying()) viz.pause();
                else viz.play();
                setPlaying(viz.isPlaying());
              }}
            >
              {playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" aria-label="Previous placement" onClick={() => viz.previous()}>‹</button>
            <button type="button" aria-label="Next placement" onClick={() => viz.next()}>›</button>
          </div>
          <p className="tviz-hint">Click or drag on the grid to draw and erase cells.</p>

          <Group title="Transition">
            <Select label="Effect" value={value('effect')} onChange={(v) => set({ effect: v as VisualizerOptions['effect'] })}
              options={[['fade', 'Fade'], ['pop', 'Pop'], ['sweep', 'Sweep'], ['flash', 'Flash'], ['none', 'None']]} />
            <Select label="Easing" value={value('easing')} onChange={(v) => set({ easing: v as VisualizerOptions['easing'] })}
              options={[['easeInOut', 'Ease in-out'], ['easeOut', 'Ease out'], ['easeIn', 'Ease in'], ['backOut', 'Back out'], ['linear', 'Linear']]} />
            <Range label="Enter" unit="ms" min={0} max={2000} step={10} value={value('enterMs')} onChange={(v) => set({ enterMs: v })} />
            <Range label="Hold" unit="ms" min={0} max={4000} step={10} value={value('holdMs')} onChange={(v) => set({ holdMs: v })} />
            <Range label="Exit / trail" unit="ms" min={0} max={4000} step={10} value={value('exitMs')} onChange={(v) => set({ exitMs: v })} />
            <Range label="Speed" min={0.05} max={4} step={0.01} value={value('speed')} onChange={(v) => set({ speed: v })} />
            <Range label="Pop scale" min={0} max={0.5} step={0.01} value={value('popScale')} onChange={(v) => set({ popScale: v })} />
            <Range label="Glow" min={0} max={1} step={0.01} value={value('glow')} onChange={(v) => set({ glow: v })} />
          </Group>

          <Group title="Sequence">
            <Select label="Order" value={value('order')} onChange={(v) => set({ order: v as VisualizerOptions['order'] })}
              options={[['shuffle', 'Shuffle'], ['interleave', 'Interleave pieces'], ['sequential', 'By piece']]} />
            <Select label="After a full pass" value={value('onCycleEnd')} onChange={(v) => set({ onCycleEnd: v as VisualizerOptions['onCycleEnd'] })}
              options={[['loop', 'Loop'], ['regenerate', 'New random shape']]} />
            <Range label="Random size" min={0.03} max={0.9} step={0.01} value={value('randomFill')} onChange={(v) => set({ randomFill: v })} />
            <Range label="Compactness" min={0} max={1} step={0.01} value={value('compactness')} onChange={(v) => set({ compactness: v })} />
          </Group>

          <Group title="Grid">
            <Range label="Shape size" min={0} max={1} step={0.01} value={value('shapeScale')} onChange={(v) => set({ shapeScale: v })} />
            <Range label="Cell size (shape size 0)" unit="px" min={8} max={120} step={1} value={value('cellSize')} onChange={(v) => set({ cellSize: v })} />
            <Range label="Gap" min={0} max={0.4} step={0.005} value={value('gap')} onChange={(v) => set({ gap: v })} />
            <Range label="Corner radius" min={0} max={1} step={0.01} value={value('cornerRadius')} onChange={(v) => set({ cornerRadius: v })} />
            <Range label="Grain" min={0} max={1} step={0.01} value={value('grain')} onChange={(v) => set({ grain: v })} />
            <Select label="Theme" value={preset} onChange={(v) => setPreset(v as ThemePreset)}
              options={[
                ['props', props.theme ? 'Page theme' : 'Dekalog (cream)'],
                ...(props.theme ? [['dekalog', 'Dekalog (cream)'] as [string, string]] : []),
                ['dark', 'Dark'],
              ]} />
          </Group>

          <Group title="Piece colours">
            <div className="tviz-swatches">
              {PIECE_TYPES.map((p) => (
                <label key={p}>
                  <input type="color" aria-label={`${p} colour`} value={toHex(colors[p])}
                    onChange={(e) => set({ colors: { ...colors, [p]: e.target.value } })} />
                  {p}
                </label>
              ))}
            </div>
          </Group>

          <div className="tviz-buttons">
            <button type="button" onClick={() => { setOverrides({}); setPreset('props'); }}>Reset settings</button>
          </div>
          <p className="tviz-hint">{viz.rendererKind === 'webgl' ? 'WebGL' : 'Canvas 2D'}</p>
        </details>
      )}
    </div>
  );
});

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}

function Range(p: { label: string; unit?: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <label>
      {p.label}
      <output>{p.value}{p.unit ? ` ${p.unit}` : ''}</output>
      <input type="range" min={p.min} max={p.max} step={p.step} value={p.value} onChange={(e) => p.onChange(Number(e.target.value))} />
    </label>
  );
}

function Select(p: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <label>
      {p.label}
      <select value={p.value} onChange={(e) => p.onChange(e.target.value)}>
        {p.options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  );
}

// Overlay colours for the built-in presets; `props` leaves them to the page's --tviz-* variables.
const PRESET_VARS: Record<ThemePreset, CSSProperties> = {
  props: {},
  dekalog: { '--tviz-ink': '#55554f', '--tviz-bg': '#f8f9e3', '--tviz-panel': 'rgba(248, 249, 227, .94)' } as CSSProperties,
  dark: { '--tviz-ink': '#c9c9c0', '--tviz-bg': '#101114', '--tviz-panel': 'rgba(16, 17, 20, .92)' } as CSSProperties,
};

/** <input type="color"> only takes #rrggbb. */
function toHex(c: string): string {
  return /^#[0-9a-f]{6}$/i.test(c) ? c : /^#[0-9a-f]{3}$/i.test(c) ? `#${[...c.slice(1)].map((x) => x + x).join('')}` : '#000000';
}

// Scoped by the tviz- prefix. Colours come from currentColor and two custom
// properties so the overlay follows whatever page it sits on.
const CSS = `
.tviz { color: var(--tviz-ink, #55554f); }
.tviz-caption {
  position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%);
  letter-spacing: .35em; text-transform: uppercase; font-size: 12px; font-weight: 700;
  font-family: var(--tviz-font, inherit); white-space: nowrap; pointer-events: none;
  background: var(--tviz-bg, transparent); padding: 4px 10px; font-variant-numeric: tabular-nums;
}
.tviz-sep { margin: 0 .4em; }
.tviz-panel {
  position: absolute; top: 8px; right: 8px; width: min(290px, calc(100% - 16px));
  max-height: calc(100% - 16px); overflow: auto; z-index: 1;
  background: var(--tviz-panel, rgba(248, 249, 227, .94)); border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
  font: 12px/1.4 ui-sans-serif, system-ui, sans-serif; padding: 0 12px;
}
.tviz-panel summary {
  cursor: pointer; padding: 8px 0; letter-spacing: .25em; text-transform: uppercase; font-weight: 700; list-style: none;
}
.tviz-panel summary::-webkit-details-marker { display: none; }
.tviz-panel[open] { padding-bottom: 12px; }
.tviz-panel fieldset { border: 0; border-top: 1px solid color-mix(in srgb, currentColor 25%, transparent); margin: 10px 0 0; padding: 8px 0 0; }
.tviz-panel legend { letter-spacing: .2em; text-transform: uppercase; font-size: 10px; font-weight: 700; padding-right: 6px; }
.tviz-panel label { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 2px 8px; margin: 6px 0; }
.tviz-panel label input[type=range], .tviz-panel label select { grid-column: 1 / -1; width: 100%; }
.tviz-panel output { opacity: .7; font-variant-numeric: tabular-nums; }
.tviz-panel button, .tviz-panel select {
  font: inherit; color: inherit; background: transparent; cursor: pointer;
  border: 1px solid color-mix(in srgb, currentColor 30%, transparent); padding: 5px 8px;
}
.tviz-panel select option { color: #222; }
.tviz-panel button:hover { border-color: currentColor; }
.tviz-buttons { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.tviz-hint { opacity: .7; margin: 8px 0 0; }
.tviz-swatches { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.tviz-swatches label { display: flex; flex-direction: column; align-items: center; margin: 0; font-weight: 700; }
.tviz-swatches input { width: 100%; height: 26px; padding: 0; border: 1px solid color-mix(in srgb, currentColor 25%, transparent); background: none; }
`;

export default TetrominoViz;
export type { TetrominoVisualizer, VisualizerOptions };
