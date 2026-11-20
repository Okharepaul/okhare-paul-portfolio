"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { site } from "@/content/site";

const subscribe = (): (() => void) => () => {};

interface EmailProps {
  className?: string;
  /** Rendered after the address, inside the link. */
  children?: ReactNode;
}

/**
 * The address is assembled in the browser, so it never appears whole in the
 * HTML that spam bots scrape. Before hydration it reads "name [at] domain".
 */
export function Email({ className = "", children }: EmailProps) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const { user, domain } = site.email;

  if (!hydrated) {
    return (
      <span className={className}>
        {user} [at] {domain}
        {children}
      </span>
    );
  }

  const address = `${user}@${domain}`;
  return (
    <a className={className} href={`mailto:${address}`}>
      {address}
      {children}
    </a>
  );
}
