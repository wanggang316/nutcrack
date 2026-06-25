interface TagListProps {
  tags: string[];
  selectedTags?: string[];
  onTagClick?: (tag: string) => void;
  maxDisplay?: number;
  showHash?: boolean;
  className?: string;
  clickable?: boolean;
  variant?: "default" | "outline";
}

export default function TagList({
  tags,
  selectedTags = [],
  onTagClick,
  maxDisplay = 5,
  showHash = true,
  className = "",
  clickable = true,
}: TagListProps) {
  if (tags.length === 0) return null;

  const displayTags = maxDisplay ? tags.slice(0, maxDisplay) : tags;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {displayTags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        const stateClass = isSelected
          ? "border-teal-500 bg-teal-50 text-teal-700"
          : "border-parchment-200 bg-transparent text-ink/55 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700";
        return (
          <button
            key={tag}
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs leading-5 transition-colors duration-150 ${stateClass} ${clickable ? "cursor-pointer" : "cursor-default"}`}
            onClick={() => clickable && onTagClick?.(tag)}
          >
            {showHash && <span className="text-ink/30">#</span>}
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
