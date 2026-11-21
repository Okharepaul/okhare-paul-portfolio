import { execFileSync } from "node:child_process";
import { describe, expect, test } from "vitest";

/** True when the tests run inside the git checkout (not, say, from an unpacked copy). */
function inGitCheckout(): boolean {
  try {
    return execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { encoding: "utf8" }).trim() === "true";
  } catch {
    return false;
  }
}

describe("the repository", () => {
  // A loose .gitignore line once matched src/app/api/build, so the build route never reached the live site.
  test.skipIf(!inGitCheckout())("ignores nothing under src, so every source file is deployed", () => {
    const ignored = execFileSync("git", ["ls-files", "--others", "--ignored", "--exclude-standard", "--directory", "src"], { encoding: "utf8" })
      .split("\n")
      .filter(Boolean);
    expect(ignored).toEqual([]);
  });
});
