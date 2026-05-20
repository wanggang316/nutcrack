import CategoryIcon from "./CategoryIcon";
import type { Category, CategoryCount } from "@nutcrack/shared";

interface CategoryItem {
  id: string;
  name: string;
  icon: string | null;
  count: number;
}

interface CategoryListProps {
  categories: Category[];
  totalCount?: number;
  selectedCategory?: string;
  onCategorySelect?: (categoryName: string | undefined) => void;
}

export default function CategoryList({
  categories,
  totalCount = 0,
  selectedCategory,
  onCategorySelect,
}: CategoryListProps) {
  const handleCategoryClick = (categoryName: string) => {
    onCategorySelect?.(
      selectedCategory === categoryName ? undefined : categoryName,
    );
  };

  return (
    <div className="mb-6">
      <p className="text-xs font-semibold text-base-content/40 uppercase tracking-widest mb-2 px-2">
        分类
      </p>
      <ul className="space-y-0.5">
        <li>
          <button
            className={`flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-md transition-colors ${
              !selectedCategory
                ? "text-primary font-semibold bg-primary/10 border-l-2 border-primary pl-[6px]"
                : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
            }`}
            onClick={() => onCategorySelect?.(undefined)}
          >
            <span>全部</span>
            <span className="text-xs text-base-content/40">{totalCount}</span>
          </button>
        </li>
        {categories.map((cat) => (
          <li key={cat.id}>
            <button
              className={`flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-md transition-colors ${
                selectedCategory === cat.name
                  ? "text-primary font-semibold bg-primary/10 border-l-2 border-primary pl-[6px]"
                  : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
              }`}
              onClick={() => handleCategoryClick(cat.name)}
            >
              <div className="flex items-center gap-2">
                <CategoryIcon iconName={cat.icon || null} className="w-4 h-4" />
                {cat.name}
              </div>
              <span className="text-xs text-base-content/40">
                {cat.link_count || 0}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CategorySidebar({
  categories,
  categoriesWithCounts,
  totalCount,
  selectedCategory,
  onCategorySelect,
}: CategoryListProps & {
  categoriesWithCounts?: CategoryCount[];
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold text-base-content/40 uppercase tracking-widest mb-2 px-2">
        分类
      </p>
      <ul className="space-y-0.5">
        <li>
          <button
            className={`flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-md transition-colors ${
              !selectedCategory
                ? "text-primary font-semibold bg-primary/10 border-l-2 border-primary pl-[6px]"
                : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
            }`}
            onClick={() => onCategorySelect?.(undefined)}
          >
            <span>全部</span>
            <span className="text-xs text-base-content/40">{totalCount}</span>
          </button>
        </li>
        {categories.map((cat) => {
          const count =
            categoriesWithCounts?.find((c) => c.id === cat.id)?.count ||
            cat.link_count ||
            0;
          return (
            <li key={cat.id}>
              <button
                className={`flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-md transition-colors ${
                  selectedCategory === cat.name
                    ? "text-primary font-semibold bg-primary/10 border-l-2 border-primary pl-[6px]"
                    : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                }`}
                onClick={() =>
                  onCategorySelect?.(
                    selectedCategory === cat.name ? undefined : cat.name,
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <CategoryIcon
                    iconName={cat.icon || null}
                    className="w-4 h-4"
                  />
                  {cat.name}
                </div>
                <span className="text-xs text-base-content/40">{count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
