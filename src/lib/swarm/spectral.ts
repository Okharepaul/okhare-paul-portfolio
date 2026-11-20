/**
 * Spectral clustering, small enough to run in the browser at page load.
 * Same recipe as the dissertation: build a similarity graph over the delivery
 * points, take the bottom eigenvectors of its normalised Laplacian, then run
 * k-means in that embedding. Sized for n ≤ ~96 points.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export type Rng = () => number;

/** Small seeded PRNG so every visitor sees the same city for a given seed. */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Eigen {
  values: number[];
  /** vectors[i] is the eigenvector paired with values[i]. */
  vectors: number[][];
}

const JACOBI_MAX_SWEEPS = 60;
const JACOBI_TOLERANCE = 1e-12;

/** Cyclic Jacobi eigenvalue algorithm for a real symmetric matrix. */
export function jacobiEigen(matrix: readonly (readonly number[])[]): Eigen {
  const n = matrix.length;
  const a = matrix.map((row) => [...row]);
  const v: number[][] = a.map((_, i) => a.map((__, j) => (i === j ? 1 : 0)));

  for (let sweep = 0; sweep < JACOBI_MAX_SWEEPS; sweep += 1) {
    let off = 0;
    for (let p = 0; p < n; p += 1) {
      for (let q = p + 1; q < n; q += 1) off += a[p][q] * a[p][q];
    }
    if (off < JACOBI_TOLERANCE) break;

    for (let p = 0; p < n; p += 1) {
      for (let q = p + 1; q < n; q += 1) {
        if (Math.abs(a[p][q]) < 1e-15) continue;
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        const apq = a[p][q];

        a[p][p] -= t * apq;
        a[q][q] += t * apq;
        a[p][q] = 0;
        a[q][p] = 0;

        for (let k = 0; k < n; k += 1) {
          if (k !== p && k !== q) {
            const akp = a[k][p];
            const akq = a[k][q];
            a[k][p] = c * akp - s * akq;
            a[p][k] = a[k][p];
            a[k][q] = s * akp + c * akq;
            a[q][k] = a[k][q];
          }
          const vkp = v[k][p];
          const vkq = v[k][q];
          v[k][p] = c * vkp - s * vkq;
          v[k][q] = s * vkp + c * vkq;
        }
      }
    }
  }

  return {
    values: a.map((row, i) => row[i]),
    vectors: a.map((_, column) => v.map((row) => row[column])),
  };
}

function squaredDistance(a: readonly number[], b: readonly number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += (a[i] - b[i]) ** 2;
  return sum;
}

const KMEANS_MAX_ITERATIONS = 50;

/** k-means with k-means++ seeding. Returns one label per row. */
export function kmeans(rows: readonly (readonly number[])[], k: number, rng: Rng): number[] {
  const n = rows.length;
  if (n === 0) return [];
  const clusters = Math.max(1, Math.min(k, n));

  const centres: number[][] = [[...rows[Math.floor(rng() * n)]]];
  while (centres.length < clusters) {
    const weights = rows.map((row) => Math.min(...centres.map((centre) => squaredDistance(row, centre))));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let pick = rng() * total;
    let chosen = n - 1;
    for (let i = 0; i < n; i += 1) {
      pick -= weights[i];
      if (pick <= 0) {
        chosen = i;
        break;
      }
    }
    centres.push([...rows[chosen]]);
  }

  let labels = new Array<number>(n).fill(-1);
  for (let iteration = 0; iteration < KMEANS_MAX_ITERATIONS; iteration += 1) {
    const next = rows.map((row) => {
      let best = 0;
      let bestDistance = Infinity;
      centres.forEach((centre, index) => {
        const distance = squaredDistance(row, centre);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });
      return best;
    });

    const changed = next.some((label, i) => label !== labels[i]);
    labels = next;
    if (!changed) break;

    centres.forEach((centre, index) => {
      const members = rows.filter((_, i) => labels[i] === index);
      if (members.length === 0) return;
      for (let d = 0; d < centre.length; d += 1) {
        centre[d] = members.reduce((sum, row) => sum + row[d], 0) / members.length;
      }
    });
  }

  return labels;
}

/** Each point's scale is its distance to this neighbour (Zelnik-Manor & Perona local scaling). */
const LOCAL_SCALE_NEIGHBOUR = 7;

/** Partition points into `k` zones. Returns a zone label (0..k-1) per point. */
export function spectralCluster(points: readonly Vec2[], k: number, rng: Rng): number[] {
  const n = points.length;
  if (n === 0) return [];
  if (k <= 1) return new Array<number>(n).fill(0);
  if (n <= k) return points.map((_, i) => i);

  const distance = points.map((a) => points.map((b) => Math.hypot(a.x - b.x, a.y - b.y)));
  const neighbour = Math.min(LOCAL_SCALE_NEIGHBOUR, n - 1);
  const scale = distance.map((row) => Math.max([...row].sort((x, y) => x - y)[neighbour], 1e-9));

  const affinity = distance.map((row, i) =>
    row.map((d, j) => (i === j ? 0 : Math.exp(-(d * d) / (scale[i] * scale[j])))),
  );
  const inverseRootDegree = affinity.map((row) => 1 / Math.sqrt(Math.max(row.reduce((s, w) => s + w, 0), 1e-12)));
  const laplacian = affinity.map((row, i) =>
    row.map((w, j) => (i === j ? 1 : 0) - inverseRootDegree[i] * w * inverseRootDegree[j]),
  );

  const { values, vectors } = jacobiEigen(laplacian);
  const order = values.map((_, i) => i).sort((x, y) => values[x] - values[y]).slice(0, k);

  const embedding = points.map((_, i) => {
    const row = order.map((index) => vectors[index][i]);
    const norm = Math.hypot(...row) || 1;
    return row.map((value) => value / norm);
  });

  return kmeans(embedding, k, rng);
}
