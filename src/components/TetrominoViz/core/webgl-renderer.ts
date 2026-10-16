import { QUAD_STRIDE, type FrameStyle, type QuadList, type Renderer } from './renderer';

// GLSL ES 1.00 so the same shaders run on WebGL 1 and WebGL 2.
const VERTEX_SHADER = `
attribute vec2 a_center;
attribute vec2 a_local;
attribute vec4 a_color;
attribute vec4 a_params;
uniform vec2 u_resolution;
varying vec2 v_local;
varying vec4 v_color;
varying vec4 v_params;
void main() {
  vec2 p = (a_center + a_local) / u_resolution * 2.0 - 1.0;
  gl_Position = vec4(p.x, -p.y, 0.0, 1.0);
  v_local = a_local;
  v_color = a_color;
  v_params = a_params;
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform float u_dpr;
uniform float u_grain;
uniform float u_time;
varying vec2 v_local;
varying vec4 v_color;
varying vec4 v_params; // halfSize, radius, glowPx, glowAmt

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float hs = v_params.x;
  float d = sdRoundBox(v_local, vec2(hs), min(v_params.y, hs));
  float fill = clamp(0.5 - d * u_dpr, 0.0, 1.0);
  float glow = 0.0;
  if (v_params.z > 0.0) {
    float g = 1.0 - clamp(max(d, 0.0) / v_params.z, 0.0, 1.0);
    glow = v_params.w * g * g;
  }
  float a = v_color.a * (fill + (1.0 - fill) * glow);
  vec3 rgb = v_color.rgb;
  if (u_grain > 0.0) {
    float n = hash(floor(gl_FragCoord.xy) + fract(u_time) * 97.0) - 0.5;
    rgb = clamp(rgb + n * u_grain * 0.25, 0.0, 1.0);
  }
  gl_FragColor = vec4(rgb * a, a);
}
`;

// Per vertex: center(2) local(2) color(4) params(4)
const VERTEX_FLOATS = 12;
const CORNERS = [
  [-1, -1], [1, -1], [-1, 1],
  [-1, 1], [1, -1], [1, 1],
];

export class WebGLRenderer implements Renderer {
  readonly kind = 'webgl' as const;
  private gl: WebGLRenderingContext;
  private program!: WebGLProgram;
  private buffer!: WebGLBuffer;
  private vertices = new Float32Array(0);
  private uniforms!: Record<'resolution' | 'dpr' | 'grain' | 'time', WebGLUniformLocation | null>;
  private width = 1;
  private height = 1;
  private dpr = 1;

  private constructor(private canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
    this.gl = gl;
    this.init();
  }

  /** Returns null when WebGL is unavailable or the shaders fail to compile. */
  static create(canvas: HTMLCanvasElement): WebGLRenderer | null {
    const attrs: WebGLContextAttributes = { alpha: true, premultipliedAlpha: true, antialias: false };
    const gl =
      (canvas.getContext('webgl2', attrs) as WebGLRenderingContext | null) ??
      (canvas.getContext('webgl', attrs) as WebGLRenderingContext | null);
    if (!gl) return null;
    try {
      return new WebGLRenderer(canvas, gl);
    } catch (err) {
      console.warn('[tetromino-viz] WebGL init failed, falling back to Canvas 2D', err);
      return null;
    }
  }

  /** (Re)create GPU resources. Called again after a lost context is restored. */
  init(): void {
    const gl = this.gl;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader error');
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link error');
    this.program = program;
    this.buffer = gl.createBuffer()!;
    this.uniforms = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      dpr: gl.getUniformLocation(program, 'u_dpr'),
      grain: gl.getUniformLocation(program, 'u_grain'),
      time: gl.getUniformLocation(program, 'u_time'),
    };
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    const bytes = VERTEX_FLOATS * 4;
    const attr = (name: string, size: number, offset: number) => {
      const loc = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, bytes, offset * 4);
    };
    attr('a_center', 2, 0);
    attr('a_local', 2, 2);
    attr('a_color', 4, 4);
    attr('a_params', 4, 8);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
  }

  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    this.width = Math.max(1, cssWidth);
    this.height = Math.max(1, cssHeight);
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(cssWidth * dpr));
    this.canvas.height = Math.max(1, Math.round(cssHeight * dpr));
  }

  render(quads: QuadList, style: FrameStyle): void {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    const needed = quads.count * 6 * VERTEX_FLOATS;
    if (this.vertices.length < needed) this.vertices = new Float32Array(Math.max(needed, this.vertices.length * 2));
    const v = this.vertices;
    const q = quads.data;
    let o = 0;
    for (let i = 0; i < quads.count; i++) {
      const b = i * QUAD_STRIDE;
      const ext = q[b + 2] + q[b + 8] + 1;
      for (const [sx, sy] of CORNERS) {
        v[o++] = q[b];
        v[o++] = q[b + 1];
        v[o++] = sx * ext;
        v[o++] = sy * ext;
        v[o++] = q[b + 4];
        v[o++] = q[b + 5];
        v[o++] = q[b + 6];
        v[o++] = q[b + 7];
        v[o++] = q[b + 2];
        v[o++] = q[b + 3];
        v[o++] = q[b + 8];
        v[o++] = q[b + 9];
      }
    }
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    const [r, g, bl, a] = style.background;
    gl.clearColor(r * a, g * a, bl * a, a);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (quads.count === 0) return;
    gl.useProgram(this.program);
    gl.uniform2f(this.uniforms.resolution, this.width, this.height);
    gl.uniform1f(this.uniforms.dpr, this.dpr);
    gl.uniform1f(this.uniforms.grain, style.grain);
    gl.uniform1f(this.uniforms.time, style.time);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, v.subarray(0, o), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, quads.count * 6);
  }

  destroy(): void {
    const gl = this.gl;
    gl.deleteBuffer(this.buffer);
    gl.deleteProgram(this.program);
  }
}
