/**
 * Builds the web copies of each project's thumbnail and screen recording.
 *
 *   node scripts/build-project-media.mjs ["<folder holding the originals>"]
 *
 * Reads the originals (default: Downloads/Project Thumbnails and Videos) and
 * writes three files per project into public/projects:
 *   <slug>.webp          thumbnail, 1600px wide
 *   <slug>.mp4           the whole recording, 1080p
 *   <slug>-preview.mp4   a small copy that starts after the site's loading
 *                        screen, for the hover previews and for phones
 * Recordings are expected to be 16:9; any other shape is fitted inside 16:9
 * with bars, never stretched. Needs ffmpeg on the PATH and Node 20.11 or later. To add a project: put its files in a folder there,
 * add a line to MEDIA, run this, then set thumb / video / preview on the entry
 * in src/content/projects.ts.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const DEFAULT_SOURCE = join(homedir(), "Downloads", "Project Thumbnails and Videos");
const OUTPUT = resolve(import.meta.dirname, "..", "public", "projects");

const THUMB_WIDTH = 1600;
const THUMB_QUALITY = 82;
const PREVIEW_FPS = 30;
/** Smaller than this and an encode has produced nothing usable (e.g. a start time past the end). */
const MIN_BYTES = 10_000;

/** Fit inside the frame and pad the rest, so a recording that is not 16:9 is never stretched. */
function fit(width, height) {
  return `scale=${width}:${height}:force_original_aspect_ratio=decrease:out_range=tv:flags=lanczos,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;
}

/** `previewStart`: seconds into the recording where the loading screen has gone and the page is up. */
const MEDIA = [
  { slug: "datum", folder: "Datum", thumb: "datum-thumbnail@2x.png", video: "datum-showcase.mp4", previewStart: 3.6 },
  { slug: "gilmore", folder: "Gilmore", thumb: "gilmore-thumbnail@2x.png", video: "gilmore-showcase.mp4", previewStart: 3 },
  { slug: "jerrie-bones", folder: "Jerrie Bones", thumb: "jerrie-bones-thumbnail@2x.png", video: "jerrie-bones-showcase-cursor.mp4", previewStart: 3.2 },
  { slug: "mary-and-paul", folder: "Mary & Paul", thumb: "mary-and-paul-thumbnail@2x.png", video: "mary-and-paul-showcase-20s.mp4", previewStart: 4.5 },
  { slug: "nova-adeyemi", folder: "Nova Adeyemi", thumb: "nova-adeyemi-thumbnail.png", video: "nova-adeyemi-showcase-20s-cursor-1080p60.mp4", previewStart: 4 },
  { slug: "obsiryn", folder: "Obsiryn", thumb: "obsiryn-thumbnail@2x.png", video: "obsiryn-showcase-cursor.mp4", previewStart: 4.3 },
  { slug: "pod", folder: "Pod App", thumb: "pod-app-thumbnail@2x.png", video: "pod-app-showcase.mp4", previewStart: 3.2 },
  { slug: "pod-website", folder: "Pod Website", thumb: "pod-thumbnail-3840x2160.png", video: "pod-showcase-20s-cursor-1080p60.mp4", previewStart: 4.2 },
];

/** H.264 in the widely supported 4:2:0 limited-range form, with the index at the front so it streams. */
const H264 = ["-an", "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-pix_fmt", "yuv420p", "-color_range", "tv", "-movflags", "+faststart"];

function ffmpeg(args) {
  const result = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
  if (result.error) throw new Error(`Could not run ffmpeg: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`ffmpeg failed (exit ${result.status}) on: ${args.join(" ")}`);
}

function kilobytes(path) {
  return `${Math.round(statSync(path).size / 1024)} KB`;
}

function build(source, { slug, folder, thumb, video, previewStart }) {
  const thumbIn = join(source, folder, thumb);
  const videoIn = join(source, folder, video);
  for (const path of [thumbIn, videoIn]) {
    if (!existsSync(path)) throw new Error(`Missing original: ${path}`);
  }

  const thumbOut = join(OUTPUT, `${slug}.webp`);
  const videoOut = join(OUTPUT, `${slug}.mp4`);
  const previewOut = join(OUTPUT, `${slug}-preview.mp4`);

  ffmpeg(["-i", thumbIn, "-vf", `scale=${THUMB_WIDTH}:-2:flags=lanczos`, "-c:v", "libwebp", "-quality", String(THUMB_QUALITY), thumbOut]);
  ffmpeg([
    "-i", videoIn,
    "-vf", `${fit(1920, 1080)},format=yuv420p`,
    ...H264, "-crf", "25", "-maxrate", "4500k", "-bufsize", "9000k",
    videoOut,
  ]);
  ffmpeg([
    "-ss", String(previewStart), "-i", videoIn,
    "-vf", `fps=${PREVIEW_FPS},${fit(960, 540)},format=yuv420p`,
    ...H264, "-crf", "27", "-g", String(PREVIEW_FPS * 2),
    previewOut,
  ]);
  for (const path of [thumbOut, videoOut, previewOut]) {
    if (statSync(path).size < MIN_BYTES) throw new Error(`Encode came out empty: ${path}`);
  }

  process.stdout.write(`${slug}: thumbnail ${kilobytes(thumbOut)}, video ${kilobytes(videoOut)}, preview ${kilobytes(previewOut)}\n`);
}

const source = resolve(process.argv[2] ?? DEFAULT_SOURCE);
if (!existsSync(source)) {
  process.stderr.write(`Originals folder not found: ${source}\n`);
  process.exit(1);
}
mkdirSync(OUTPUT, { recursive: true });

try {
  for (const entry of MEDIA) build(source, entry);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
