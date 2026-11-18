import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "./button";
import { cn } from "@/lib/utils";

describe("Button", () => {
  it("applies brand primary and 44px touch target by default", () => {
    const html = renderToStaticMarkup(<Button>Go</Button>);
    expect(html).toContain("bg-orange");
    expect(html).toContain("min-h-touch");
  });

  it("uses 56px targets for the kid size", () => {
    expect(renderToStaticMarkup(<Button size="kid">Go</Button>)).toContain("min-h-kid");
  });
});

describe("cn", () => {
  it("merges conflicting tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
