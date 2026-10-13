import type { ReactNode } from "react";
import CategoryIcon from "../CategoryIcon";

export interface CategoryBadgeProps {
  category: string;
  selectedCategory?: string;
  onCategoryClick?: (category: string) => void;
  clickable?: boolean;
  icon?: ReactNode;
}

export default function CategoryBadge({
  category,
  selectedCategory,
  onCategoryClick,
  clickable = true,
  icon,
}: CategoryBadgeProps) {
  const handleClick = () => {
    if (clickable) {
      onCategoryClick?.(selectedCategory === category ? "" : category);
    }
  };

  return (
    <button
      type="button"
      aria-pressed={selectedCategory === category}
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 text-xs leading-5 transition-colors duration-150 ${
        selectedCategory === category
          ? "border-nc-primary font-medium text-nc-primary"
          : "border-nc-border-strong text-nc-muted hover:text-nc-text"
      } ${clickable ? "cursor-pointer" : "cursor-default"}`}
      onClick={handleClick}
    >
      {icon || <CategoryIcon iconName={category} className="h-3 w-3" />}
      {category}
    </button>
  );
}
