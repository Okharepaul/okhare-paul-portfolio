import { POINT_BLOCKED, POINT_DELIVERED, type Swarm } from "@/lib/swarm/engine";
import type { Rgb } from "@/lib/motion";

/**
 * Raw WebGL renderer for the swarm: one shader program, three draw calls
 * (lattice dots, route lines, markers). No three.js. The whole scene is a few
 * hundred vertices, rebuilt each frame.
 */

const VERTEX_SHADER = `
attribute vec2 aPos;
attribute float aSize;
attribute float aAlpha;
attribute float aKind;
uniform vec2 uRes;
uniform float uDpr;
uniform vec3 uDrones[16];
uniform vec2 uPointer;
varying float vAlpha;
varying float vKind;

void main() {
  float size = aSize;
  float alpha = aAlpha;

  // Lattice dots swell and brighten near a drone or the pointer.
  if (aKind < 0.5) {
    float glow = 0.0;
    for (int i = 0; i < 16; i++) {
      float d = distance(aPos, uDrones[i].xy);
      glow = max(glow, uDrones[i].z * (1.0 - smoothstep(0.0, 110.0, d)));
    }
    glow = max(glow, 0.85 * (1.0 - smoothstep(0.0, 140.0, distance(aPos, uPointer))));
    size += glow * 2.6;
    alpha += glow * 0.55;
  }

  vec2 clip = (aPos / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = size * uDpr;
  vAlpha = alpha;
  vKind = aKind;
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec3 uFg;
uniform vec3 uAccent;
varying float vAlpha;
varying float vKind;

void main() {
  vec3 color = uFg;

  if (vKind > 4.5 && vKind < 5.5) {
    // planned route line
  } else if (vKind > 5.5 && vKind < 6.5) {
    color = uAccent; // flown trail
  } else {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    vec2 a = abs(p);
    if (vKind < 0.5) {
      // lattice dot: full square
    } else if (vKind < 1.5) {
      if (max(a.x, a.y) < 0.52) discard; // waiting stop: hollow square
    } else if (vKind < 2.5) {
      // delivered stop: solid square
    } else if (vKind < 3.5) {
      color = uAccent;
      if (abs(a.x - a.y) > 0.2) discard; // blocked stop: cross
    } else if (vKind < 4.5) {
      color = uAccent;
      if (a.x + a.y > 1.0) discard; // drone: diamond
    } else {
      color = uAccent;
      float r = length(p);
      if (r > 1.0 || r < 0.84) discard; // drone pulse: ring
    }
  }

  gl_FragColor = vec4(color * vAlpha, vAlpha);
}
`;

const KIND_LATTICE = 0;
const KIND_WAITING = 1;
const KIND_DELIVERED = 2;
const KIND_BLOCKED = 3;
const KIND_DRONE = 4;
const KIND_ROUTE = 5;
const KIND_TRAIL = 6;
const KIND_RING = 7;

const STRIDE = 5;
const BYTES = Float32Array.BYTES_PER_ELEMENT;
const MAX_DRONES = 16;
const LATTICE_GAP = 28;
const RING_SECONDS = 1.6;
const OFFSCREEN = -9999;

export interface SwarmColors {
  fg: Rgb;
  accent: Rgb;
}

export interface SwarmRenderer {
  resize(width: number, height: number, dpr: number): void;
  setColors(colors: SwarmColors): void;
  setPointer(x: number, y: number): void;
  clearPointer(): void;
  draw(swarm: Swarm, time: number): void;
  dispose(): void;
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function buildLattice(width: number, height: number): Float32Array {
  const columns = Math.ceil(width / LATTICE_GAP) + 1;
  const rows = Math.ceil(height / LATTICE_GAP) + 1;
  const data = new Float32Array(columns * rows * STRIDE);
  let offset = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      data.set([column * LATTICE_GAP, row * LATTICE_GAP, 1.5, 0.16, KIND_LATTICE], offset);
      offset += STRIDE;
    }
  }
  return data;
}

/** Returns null when WebGL is unavailable; the caller simply shows nothing. */
export function createSwarmRenderer(canvas: HTMLCanvasElement, showLattice: boolean): SwarmRenderer | null {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const attributes = [
    { location: gl.getAttribLocation(program, "aPos"), size: 2, offset: 0 },
    { location: gl.getAttribLocation(program, "aSize"), size: 1, offset: 2 },
    { location: gl.getAttribLocation(program, "aAlpha"), size: 1, offset: 3 },
    { location: gl.getAttribLocation(program, "aKind"), size: 1, offset: 4 },
  ];
  const uniform = (name: string): WebGLUniformLocation | null => gl.getUniformLocation(program, name);
  const uRes = uniform("uRes");
  const uDpr = uniform("uDpr");
  const uDrones = uniform("uDrones");
  const uPointer = uniform("uPointer");
  const uFg = uniform("uFg");
  const uAccent = uniform("uAccent");

  const latticeBuffer = gl.createBuffer();
  const sceneBuffer = gl.createBuffer();
  let latticeCount = 0;
  let pointer: [number, number] = [OFFSCREEN, OFFSCREEN];
  const droneUniform = new Float32Array(MAX_DRONES * 3);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  const bind = (buffer: WebGLBuffer | null): void => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    attributes.forEach(({ location, size, offset }) => {
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, STRIDE * BYTES, offset * BYTES);
    });
  };

  return {
    resize(width, height, dpr): void {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, width, height);
      gl.uniform1f(uDpr, dpr);
      if (!showLattice) return;
      const lattice = buildLattice(width, height);
      latticeCount = lattice.length / STRIDE;
      gl.bindBuffer(gl.ARRAY_BUFFER, latticeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, lattice, gl.STATIC_DRAW);
    },

    setColors({ fg, accent }): void {
      gl.uniform3f(uFg, fg[0], fg[1], fg[2]);
      gl.uniform3f(uAccent, accent[0], accent[1], accent[2]);
    },

    setPointer(x, y): void {
      pointer = [x, y];
    },

    clearPointer(): void {
      pointer = [OFFSCREEN, OFFSCREEN];
    },

    draw(swarm, time): void {
      const lines: number[] = [];
      const markers: number[] = [];

      swarm.drones.forEach((drone) => {
        // Planned route: from the drone through every stop still waiting.
        let previous = { x: drone.x, y: drone.y };
        drone.route.forEach((index) => {
          const stop = swarm.points[index];
          lines.push(previous.x, previous.y, 0, 0.2, KIND_ROUTE, stop.x, stop.y, 0, 0.2, KIND_ROUTE);
          previous = stop;
        });

        // Flown trail, fading towards its tail.
        const { trail } = drone;
        for (let i = 1; i < trail.length; i += 1) {
          const from = (i - 1) / trail.length;
          const to = i / trail.length;
          lines.push(trail[i - 1].x, trail[i - 1].y, 0, from * 0.9, KIND_TRAIL, trail[i].x, trail[i].y, 0, to * 0.9, KIND_TRAIL);
        }
      });

      swarm.points.forEach((point) => {
        if (point.state === POINT_BLOCKED) markers.push(point.x, point.y, 11, 1, KIND_BLOCKED);
        else if (point.state === POINT_DELIVERED) markers.push(point.x, point.y, 4, 0.55, KIND_DELIVERED);
        else markers.push(point.x, point.y, 7, 0.9, KIND_WAITING);
      });

      droneUniform.fill(0);
      swarm.drones.slice(0, MAX_DRONES).forEach((drone, i) => {
        const phase = (time / RING_SECONDS + i * 0.37) % 1;
        markers.push(drone.x, drone.y, 10 + phase * 22, (1 - phase) * 0.8, KIND_RING);
        markers.push(drone.x, drone.y, 9, 1, KIND_DRONE);
        droneUniform.set([drone.x, drone.y, 1], i * 3);
      });

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform3fv(uDrones, droneUniform);
      gl.uniform2f(uPointer, pointer[0], pointer[1]);

      if (showLattice && latticeCount > 0) {
        bind(latticeBuffer);
        gl.drawArrays(gl.POINTS, 0, latticeCount);
      }

      const lineCount = lines.length / STRIDE;
      const scene = new Float32Array(lines.length + markers.length);
      scene.set(lines, 0);
      scene.set(markers, lines.length);
      bind(sceneBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, scene, gl.DYNAMIC_DRAW);
      if (lineCount > 0) gl.drawArrays(gl.LINES, 0, lineCount);
      gl.drawArrays(gl.POINTS, lineCount, markers.length / STRIDE);
    },

    dispose(): void {
      gl.deleteBuffer(latticeBuffer);
      gl.deleteBuffer(sceneBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    },
  };
}
