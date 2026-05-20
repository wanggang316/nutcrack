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
  variant = "default",
}: TagListProps) {
  if (tags.length === 0) return null;

  const displayTags = maxDisplay ? tags.slice(0, maxDisplay) : tags;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayTags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        const variantClass =
          variant === "outline"
            ? isSelected
              ? "border border-primary text-primary bg-base-100"
              : "border border-base-content/20 bg-base-100 text-base-content/60 hover:border-primary hover:text-primary"
            : isSelected
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-base-300 bg-base-300 text-base-content/60 hover:bg-primary/5 hover:border-primary/20 hover:text-primary";
        return (
          <button
            key={tag}
            className={`badge badge-sm rounded-md px-2 py-2 ${variantClass} ${clickable ? "cursor-pointer" : "cursor-default"}`}
            onClick={() => clickable && onTagClick?.(tag)}
          >
            {showHash ? "#" : ""}
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
