import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("PWA assets", () => {
  it("has required icons", () => {
    expect(existsSync("public/icons/icon-192.png")).toBe(true);
    expect(existsSync("public/icons/icon-512.png")).toBe(true);
    expect(existsSync("public/icons/icon-512-maskable.png")).toBe(true);
    expect(existsSync("public/apple-touch-icon.png")).toBe(true);
    expect(existsSync("public/favicon.png")).toBe(true);
  });

  it("declares a valid installable manifest in the Vite PWA config", () => {
    const source = readFileSync("vite.config.ts", "utf8");
    expect(source).toContain('name: "RoadTag"');
    expect(source).toContain('short_name: "RoadTag"');
    expect(source).toContain('display: "standalone"');
    expect(source).toContain('start_url: "/"');
    expect(source).toContain('registerType: "prompt"');
    expect(source).not.toContain("orientation");
  });

  it("keeps the US map source in the repository", () => {
    expect(existsSync("src/assets/us-map.svg")).toBe(true);
    expect(existsSync("public/map/ATTRIBUTION.txt")).toBe(true);
  });
});
