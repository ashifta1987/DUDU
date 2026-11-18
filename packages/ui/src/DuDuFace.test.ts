import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { DuDuFace, FACE_SPECS, FACE_STATES, isFaceState, colors } from "./index";

describe("face states", () => {
  it("has exactly 39 states, all with a spec", () => {
    expect(FACE_STATES).toHaveLength(39);
    expect(new Set(FACE_STATES).size).toBe(39);
    for (const s of FACE_STATES) expect(FACE_SPECS[s]).toBeDefined();
  });

  it("guards unknown states", () => {
    expect(isFaceState("happy")).toBe(true);
    expect(isFaceState("grumpy-cat")).toBe(false);
    expect(isFaceState(42)).toBe(false);
  });
});

describe("<DuDuFace/>", () => {
  it("renders every state as an accessible svg", () => {
    for (const s of FACE_STATES) {
      const html = renderToStaticMarkup(createElement(DuDuFace, { state: s }));
      expect(html).toContain("<svg");
      expect(html).toContain(`data-state="${s}"`);
      expect(html).toContain('role="img"');
    }
  });

  it("uses DuDu orange for idle and study blue for focus", () => {
    expect(renderToStaticMarkup(createElement(DuDuFace, { state: "idle" }))).toContain(
      colors.orange,
    );
    expect(renderToStaticMarkup(createElement(DuDuFace, { state: "focus" }))).toContain(
      colors.blue,
    );
  });

  it("can be decorative", () => {
    const html = renderToStaticMarkup(createElement(DuDuFace, { title: "" }));
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
  });
});
