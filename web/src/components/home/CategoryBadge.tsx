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
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs leading-5 transition-colors duration-150 ${
        selectedCategory === category
          ? "border-teal-500 bg-teal-50 text-teal-700"
          : "border-parchment-200 bg-parchment-100 text-ink/65 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700"
      } ${clickable ? "cursor-pointer" : "cursor-default"}`}
      onClick={handleClick}
    >
      {icon || <CategoryIcon iconName={category} className="h-3 w-3" />}
      {category}
    </button>
  );
}
