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
      className={`badge badge-sm gap-1 rounded-md px-2 py-2 ${
        selectedCategory === category
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-base-300 bg-base-300 text-base-content/60  hover:bg-primary/5 hover:border-primary/20 hover:text-primary"
      } ${clickable ? "cursor-pointer" : "cursor-default"}`}
      onClick={handleClick}
    >
      {icon || <CategoryIcon iconName={category} className="w-3 h-3" />}
      {category}
    </button>
  );
}
