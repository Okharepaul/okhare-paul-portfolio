"use client";

import { useState } from "react";
import type { SwarmStats } from "@/lib/swarm/engine";
import { SwarmField } from "@/components/swarm/SwarmField";

const MIN_DRONES = 2;
const MAX_DRONES = 12;
const POINTS = 72;
const SANDBOX_REGION = { x0: 0.04, y0: 0.08, x1: 0.96, y1: 0.92 };
const EMPTY_STATS: SwarmStats = { delivered: 0, blocked: 0, reroutes: 0, runs: 0 };

const stepButtonClass =
  "label grid size-9 cursor-pointer place-items-center border border-line-strong text-fg transition-colors duration-300 hover:border-accent hover:bg-accent hover:text-on-accent disabled:pointer-events-none disabled:opacity-40";

/** E—01: change the size of the swarm, deal a new city, click a stop to block it. */
export function SwarmSandbox() {
  const [drones, setDrones] = useState(5);
  const [seed, setSeed] = useState(7);
  const [stats, setStats] = useState<SwarmStats>(EMPTY_STATS);

  const readouts = [
    { label: "Drones", value: drones },
    { label: "Delivered", value: stats.delivered },
    { label: "Blocked now", value: stats.blocked },
    { label: "Re-routes", value: stats.reroutes },
  ];

  return (
    <div className="border border-line bg-stage">
      <div className="relative aspect-[4/3] cursor-crosshair md:aspect-[5/2]">
        {/* Changing the size or the seed rebuilds the swarm on the same canvas. */}
        <SwarmField
          points={POINTS}
          zones={drones}
          seed={seed}
          region={SANDBOX_REGION}
          interaction="click"
          onStats={setStats}
        />
        <p className="label pointer-events-none absolute top-4 left-4 text-faint">Click near a stop to block it</p>
      </div>

      <div className="flex flex-col gap-5 border-t border-line p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Remove a drone" disabled={drones <= MIN_DRONES} onClick={() => setDrones((count) => count - 1)} className={stepButtonClass}>
            −
          </button>
          <button type="button" aria-label="Add a drone" disabled={drones >= MAX_DRONES} onClick={() => setDrones((count) => count + 1)} className={stepButtonClass}>
            +
          </button>
          <button type="button" onClick={() => setSeed((value) => value + 1)} className="btn min-h-9!">
            New city
          </button>
        </div>
        <dl aria-live="off" className="grid grid-cols-4 gap-5">
          {readouts.map((readout) => (
            <div key={readout.label}>
              <dt className="label text-faint">{readout.label}</dt>
              <dd className="display mt-1 text-3xl tabular-nums">{readout.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="label border-t border-line px-4 py-3 text-faint normal-case tracking-normal">
        This version runs the zone clustering and route planning live. The learning layer from the dissertation is the part still to come.
      </p>
    </div>
  );
}
