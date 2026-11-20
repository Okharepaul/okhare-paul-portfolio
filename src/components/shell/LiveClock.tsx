"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";

interface ClockReading {
  hours: string;
  minutes: string;
  zone: string;
}

const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: site.location.timeZone,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZoneName: "short",
});

const MINUTE_MS = 60_000;
const TIMER_SLACK_MS = 50;

function readClock(now: Date): ClockReading {
  const parts = formatter.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? "";
  return { hours: part("hour"), minutes: part("minute"), zone: part("timeZoneName") };
}

/** UK local time. Europe/London switches between GMT and BST on its own. */
export function LiveClock({ className = "" }: { className?: string }) {
  const [reading, setReading] = useState<ClockReading | null>(null);

  useEffect(() => {
    let timer = 0;

    // Read the time, then sleep until just after the next minute starts.
    const tick = (): void => {
      const now = new Date();
      setReading(readClock(now));
      const untilNextMinute = MINUTE_MS - (now.getSeconds() * 1000 + now.getMilliseconds());
      timer = window.setTimeout(tick, untilNextMinute + TIMER_SLACK_MS);
    };

    // Starting from a timer (not the effect body) keeps the first paint identical to the server render.
    timer = window.setTimeout(tick, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <time className={`tabular-nums ${className}`} dateTime={reading ? `${reading.hours}:${reading.minutes}` : undefined}>
      {reading?.hours ?? "--"}
      <span aria-hidden="true" className="animate-[blink_1s_steps(1)_infinite]">
        :
      </span>
      <span className="sr-only">:</span>
      {reading?.minutes ?? "--"}
      <span className="ml-1.5 text-faint">{reading?.zone ?? "UK"}</span>
    </time>
  );
}
