import { TAG_TONE_CLASS, tagTone } from "../../utils/tag-tone";

interface TagListProps {
  tags: string[];
  selectedTags?: string[];
  onTagClick?: (tag: string) => void;
  maxDisplay?: number;
  showHash?: boolean;
  className?: string;
  clickable?: boolean;
  variant?: "default" | "outline";
  /** chip: hashed tag colours (sidebar). quiet: de-emphasised meta text (list). */
  tone?: "chip" | "quiet";
}

export default function TagList({
  tags,
  selectedTags = [],
  onTagClick,
  maxDisplay = 5,
  showHash = true,
  className = "",
  clickable = true,
  tone = "chip",
}: TagListProps) {
  if (tags.length === 0) return null;

  const displayTags = maxDisplay ? tags.slice(0, maxDisplay) : tags;

  return (
    <div
      className={`flex flex-wrap ${tone === "quiet" ? "gap-x-2.5 gap-y-1" : "gap-1.5"} ${className}`}
    >
      {displayTags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        const base =
          tone === "quiet"
            ? `text-xs leading-5 underline-offset-4 hover:text-nc-text hover:underline ${
                isSelected ? "font-medium text-nc-primary" : "text-nc-muted"
              }`
            : `rounded-md px-2 py-0.5 text-xs leading-5 ${TAG_TONE_CLASS[tagTone(tag)]} ${
                isSelected
                  ? "font-semibold ring-1 ring-inset ring-current"
                  : "hover:ring-1 hover:ring-inset hover:ring-current"
              }`;
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={isSelected}
            className={`inline-flex items-center transition-colors duration-150 ${base} ${clickable ? "cursor-pointer" : "cursor-default"}`}
            onClick={() => clickable && onTagClick?.(tag)}
          >
            {showHash && <span aria-hidden="true">#</span>}
            {tag}
          </button>
        );
      })}
    </div>
  );
}

export function TagCloud({
  tags,
  selectedTags = [],
  onTagClick,
  maxDisplay = 20,
  variant = "default",
}: Omit<TagListProps, "showHash">) {
  return (
    <TagList
      tags={tags}
      selectedTags={selectedTags}
      onTagClick={onTagClick}
      maxDisplay={maxDisplay}
      showHash={true}
      className="flex-wrap"
      variant={variant}
    />
  );
}

export function FilterTags({
  selectedTags,
  onTagRemove,
}: {
  selectedTags: string[];
  onTagRemove: (tag: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {selectedTags.map((tag) => (
        <span
          key={tag}
          className="badge badge-primary badge-sm gap-1 rounded-md"
        >
          #{tag}
          <button onClick={() => onTagRemove(tag)} aria-label="移除">
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
