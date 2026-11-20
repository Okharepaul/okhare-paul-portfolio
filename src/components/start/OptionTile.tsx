"use client";

import type { PointerEvent } from "react";
import { pad2 } from "@/content/projects";

type OptionTileProps = {
  /** The form field this tile belongs to: tiles with one name form one question. */
  name: string;
  /** "single": only one tile of the question can be chosen. "multi": any number. */
  kind: "single" | "multi";
  /** Position among the question's tiles, from 0. */
  index: number;
  label: string;
  detail: string;
  /** What choosing it does to the estimate, e.g. "+ £250". */
  hint?: string | null;
  isSelected: boolean;
  onChoose: () => void;
};

/** How far a tile leans towards the pointer, in degrees. */
const TILT_DEGREES = 5;

/**
 * One answer to a question, as a large tile. It is a real radio button or
 * checkbox underneath, so it works with a keyboard and a screen reader. The
 * tile leans towards the pointer, and choosing it floods it with the
 * foreground colour from the point that was pressed.
 */
export function OptionTile({ name, kind, index, label, detail, hint, isSelected, onChoose }: OptionTileProps) {
  /** Where the pointer is on the tile, as 0..1 across and down. */
  const place = (event: PointerEvent<HTMLLabelElement>): { x: number; y: number } => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  };

  const handleMove = (event: PointerEvent<HTMLLabelElement>): void => {
    if (event.pointerType !== "mouse") return;
    const { x, y } = place(event);
    event.currentTarget.style.setProperty("--tilt-x", `${((0.5 - y) * 2 * TILT_DEGREES).toFixed(2)}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${((x - 0.5) * 2 * TILT_DEGREES).toFixed(2)}deg`);
  };

  const handleLeave = (event: PointerEvent<HTMLLabelElement>): void => {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
  };

  const handleDown = (event: PointerEvent<HTMLLabelElement>): void => {
    const { x, y } = place(event);
    event.currentTarget.style.setProperty("--press-x", `${(x * 100).toFixed(1)}%`);
    event.currentTarget.style.setProperty("--press-y", `${(y * 100).toFixed(1)}%`);
  };

  return (
    <label className="tile" data-selected={isSelected} onPointerMove={handleMove} onPointerLeave={handleLeave} onPointerDown={handleDown}>
      <input
        type={kind === "single" ? "radio" : "checkbox"}
        name={name}
        checked={isSelected}
        onChange={onChoose}
        className="sr-only"
      />
      <span aria-hidden="true" className="tile-fill" />
      <span className="tile-top">
        <span aria-hidden="true" className="tile-index">
          {pad2(index + 1)}
        </span>
        <span aria-hidden="true" className="tile-mark" data-shape={kind === "single" ? "round" : "square"}>
          <svg viewBox="0 0 12 12" fill="none" strokeWidth="2" strokeLinecap="square">
            <path d="M2 6.5l2.6 2.6L10 3.4" />
          </svg>
        </span>
      </span>
      <span className="tile-label">{label}</span>
      <span className="tile-detail">{detail}</span>
      {hint ? <span className="tile-price">{hint}</span> : null}
    </label>
  );
}
