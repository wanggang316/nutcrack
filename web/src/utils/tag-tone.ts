/** The four tag tones from the design tokens (`--nc-tag-1..4`). */
export type TagTone = 1 | 2 | 3 | 4;

/** Stable tone for a tag: string hash of the name, mod 4. */
export function tagTone(name: string): TagTone {
  let hash = 0;
  for (const ch of name) {
    hash = (hash * 31 + (ch.codePointAt(0) ?? 0)) | 0;
  }
  return ((Math.abs(hash) % 4) + 1) as TagTone;
}

/** Full class strings so Tailwind's scanner keeps them. */
export const TAG_TONE_CLASS: Record<TagTone, string> = {
  1: "bg-nc-tag-1-bg text-nc-tag-1-text",
  2: "bg-nc-tag-2-bg text-nc-tag-2-text",
  3: "bg-nc-tag-3-bg text-nc-tag-3-text",
  4: "bg-nc-tag-4-bg text-nc-tag-4-text",
};
