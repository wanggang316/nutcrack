import { describe, expect, it } from "vitest";
import { TAG_TONE_CLASS, tagTone } from "./tag-tone";

describe("tagTone", () => {
  it("is deterministic and within 1..4", () => {
    for (const tag of ["AI", "Rust", "开源", "Claude Code", ""]) {
      const tone = tagTone(tag);
      expect(tone).toBe(tagTone(tag));
      expect([1, 2, 3, 4]).toContain(tone);
    }
  });

  it("spreads tags across tones", () => {
    const tones = new Set(
      ["AI", "Rust", "开源", "LLM", "Web", "设计", "写作", "数据库"].map(
        tagTone,
      ),
    );
    expect(tones.size).toBeGreaterThan(1);
  });

  it("maps every tone to token classes", () => {
    expect(TAG_TONE_CLASS[1]).toContain("nc-tag-1-bg");
  });
});
