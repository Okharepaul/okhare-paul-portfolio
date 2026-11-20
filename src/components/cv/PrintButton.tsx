"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Arrow } from "@/components/ui/primitives";

/**
 * Opens the browser's print dialog, where "Save as PDF" produces the CV from
 * the print stylesheet. Arriving with ?print=1 (the "Download résumé" links)
 * opens it straight away.
 */
export function PrintButton() {
  const shouldPrintOnArrival = useSearchParams().get("print") === "1";

  useEffect(() => {
    if (!shouldPrintOnArrival) return;
    // Let fonts settle first so the PDF is set in the right typefaces.
    let cancelled = false;
    document.fonts.ready
      .then(() => {
        if (!cancelled) window.print();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [shouldPrintOnArrival]);

  return (
    <button type="button" onClick={() => window.print()} className="btn btn-solid">
      Download PDF
      <Arrow direction="down" />
    </button>
  );
}
