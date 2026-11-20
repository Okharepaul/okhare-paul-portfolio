"use client";

import { useEffect, useRef } from "react";
import { parseRgb, prefersReducedMotion } from "@/lib/motion";

/**
 * The dithered sphere behind the hero. Raw WebGL, one full-screen triangle:
 * a sphere whose surface is pushed around by 3D noise is ray-marched, lit
 * from its normal, then reduced to two colours with 8×8 ordered dithering.
 * It breathes, swells under the pointer and dissolves as the page scrolls.
 */

const VERTEX_SHADER = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;
uniform vec2 uCentre;
uniform float uRadius;
uniform float uCell;
uniform float uFade;
uniform vec3 uColor;

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = mix(hash(i), hash(i + vec3(1, 0, 0)), f.x);
  float b = mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x);
  float c = mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x);
  float d = mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x);
  return mix(mix(a, b, f.y), mix(c, d, f.y), f.z);
}

float fbm(vec3 p) {
  return 0.5 * noise(p) + 0.25 * noise(p * 2.03) + 0.125 * noise(p * 4.1);
}

// Signed distance to the sphere, its surface displaced by drifting noise.
float scene(vec3 p) {
  float breathe = 1.0 + 0.035 * sin(uTime * 0.8);
  return length(p) - breathe - 0.42 * (fbm(p * 1.5 + vec3(0.0, uTime * 0.12, uTime * 0.2)) - 0.45);
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.012, -0.012);
  return normalize(
    e.xyy * scene(p + e.xyy) + e.yyx * scene(p + e.yyx) + e.yxy * scene(p + e.yxy) + e.xxx * scene(p + e.xxx)
  );
}

// One cell of the 2x2 ordered-dither matrix: 0, 2 / 3, 1.
float quad(vec2 p) {
  vec2 b = mod(floor(p), 2.0);
  return 2.0 * b.x + 3.0 * b.y - 4.0 * b.x * b.y;
}

// 8x8 Bayer threshold, built from three levels of the 2x2 matrix.
float bayer8(vec2 p) {
  return (quad(p) * 16.0 + quad(p / 2.0) * 4.0 + quad(p / 4.0) + 0.5) / 64.0;
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 cell = floor(frag / uCell);
  vec2 centre = (cell + 0.5) * uCell;

  // A faint, even field: at this level the dither leaves a regular lattice of dots.
  float light = 0.07;

  vec2 q = (centre - uCentre) / uRadius;
  if (dot(q, q) < 3.2) {
    vec3 origin = vec3(q.x, -q.y, -3.0);
    vec3 dir = vec3(0.0, 0.0, 1.0);
    float travelled = 0.0;
    bool hit = false;
    for (int i = 0; i < 28; i++) {
      float d = scene(origin + dir * travelled);
      if (d < 0.004) { hit = true; break; }
      travelled += d * 0.85;
      if (travelled > 5.0) break;
    }
    if (hit) {
      vec3 n = normalAt(origin + dir * travelled);
      float diffuse = clamp(dot(n, normalize(vec3(-0.45, 0.65, -0.62))), 0.0, 1.0);
      float rim = pow(1.0 - clamp(-n.z, 0.0, 1.0), 3.0) * 0.25;
      light = 0.1 + diffuse * 0.95 + rim;
    } else {
      // Soft halo just outside the surface.
      light += 0.16 * (1.0 - smoothstep(1.0, 1.75, length(q)));
    }
  }

  // The pointer acts like a loupe: dots swell and brighten around it.
  float loupe = 1.0 - smoothstep(0.0, 170.0, distance(centre, uPointer));
  light += loupe * 0.55;

  // Dissolve as the hero scrolls away.
  light *= 1.0 - uFade;

  float on = step(bayer8(cell), light);
  vec2 inCell = abs(fract(frag / uCell) - 0.5);
  float size = mix(0.34, 0.92, clamp(light + loupe * 0.4, 0.0, 1.0)) * 0.5;
  float square = on * step(max(inCell.x, inCell.y), size);
  float alpha = square * (0.55 + 0.45 * clamp(light * 2.0, 0.0, 1.0));
  gl_FragColor = vec4(uColor * alpha, alpha);
}
`;

const CELL_PX = 9;
const DESKTOP_MIN_PX = 1024;
const OFFSCREEN = -9999;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

export function DitherHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const gl = canvas?.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!canvas || !host || !gl) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    // One triangle that covers the whole canvas.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name: string): WebGLUniformLocation | null => gl.getUniformLocation(program, name);
    const uRes = uniform("uRes");
    const uTime = uniform("uTime");
    const uPointer = uniform("uPointer");
    const uCentre = uniform("uCentre");
    const uRadius = uniform("uRadius");
    const uCell = uniform("uCell");
    const uFade = uniform("uFade");
    const uColor = uniform("uColor");

    const isStill = prefersReducedMotion();
    let frame = 0;
    let isVisible = true;
    let pointer = { x: OFFSCREEN, y: OFFSCREEN };
    let eased = { x: OFFSCREEN, y: OFFSCREEN };

    const readColor = (): void => {
      const [r, g, b] = parseRgb(getComputedStyle(canvas).color);
      gl.uniform3f(uColor, r, g, b);
    };

    const resize = (): void => {
      const { clientWidth: width, clientHeight: height } = host;
      if (width === 0 || height === 0) return;
      // Dots are blocky by design, so device-pixel resolution would be wasted work.
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uRes, width, height);
      gl.uniform1f(uCell, CELL_PX);
      const isDesktop = width >= DESKTOP_MIN_PX;
      // On phones the sphere sits in the band above the headline.
      gl.uniform2f(uCentre, width * (isDesktop ? 0.67 : 0.56), height * (isDesktop ? 0.4 : 0.19));
      gl.uniform1f(uRadius, isDesktop ? Math.min(height * 0.23, width * 0.14) : Math.min(width * 0.24, height * 0.13));
      readColor();
    };

    const draw = (now: number): void => {
      eased = { x: eased.x + (pointer.x - eased.x) * 0.12, y: eased.y + (pointer.y - eased.y) * 0.12 };
      gl.uniform1f(uTime, now / 1000);
      gl.uniform2f(uPointer, eased.x, eased.y);
      gl.uniform1f(uFade, Math.min(1, Math.max(0, window.scrollY / Math.max(1, host.clientHeight * 0.9))));
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number): void => {
      draw(now);
      frame = window.requestAnimationFrame(loop);
    };

    const start = (): void => {
      window.cancelAnimationFrame(frame);
      if (isStill || !isVisible || document.hidden) return;
      frame = window.requestAnimationFrame(loop);
    };

    const handleMove = (event: PointerEvent): void => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      if (eased.x === OFFSCREEN) eased = pointer;
    };

    const handleTheme = (): void => {
      readColor();
      if (isStill) draw(0);
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (isStill) draw(0);
    });
    resizeObserver.observe(host);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      start();
    });
    visibilityObserver.observe(canvas);
    const themeObserver = new MutationObserver(handleTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    resize();
    if (isStill) draw(0);
    start();
    window.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("visibilitychange", start);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("visibilitychange", start);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="block size-full text-paper" />;
}
