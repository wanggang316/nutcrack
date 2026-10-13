import CategoryIcon from "./CategoryIcon";
import type { Category, CategoryCount } from "@nutcrack/shared";

interface CategoryListProps {
  categories: Category[];
  totalCount?: number;
  selectedCategory?: string;
  onCategorySelect?: (categoryName: string | undefined) => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 px-2.5 text-xs font-medium text-nc-muted">{children}</p>
  );
}

function CategoryRow({
  label,
  count,
  active,
  icon,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={active ? "true" : undefined}
      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors duration-150 ${
        active
          ? "bg-nc-raised font-semibold text-nc-text"
          : "text-nc-muted hover:text-nc-text"
      }`}
      onClick={onClick}
    >
      <span className="flex min-w-0 items-center gap-2">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <span
        className={`font-mono text-[11px] tabular-nums ${
          active ? "font-semibold text-nc-primary" : "text-nc-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

export default function CategoryList({
  categories,
  totalCount = 0,
  selectedCategory,
  onCategorySelect,
}: CategoryListProps) {
  return (
    <div className="mb-6">
      <SectionLabel>分类</SectionLabel>
      <ul className="space-y-0.5">
        <li>
          <CategoryRow
            label="全部"
            count={totalCount}
            active={!selectedCategory}
            onClick={() => onCategorySelect?.(undefined)}
          />
        </li>
        {categories.map((cat) => (
          <li key={cat.id}>
            <CategoryRow
              label={cat.name}
              count={cat.link_count || 0}
              active={selectedCategory === cat.name}
              icon={
                <CategoryIcon
                  iconName={cat.icon || null}
                  className="h-4 w-4 shrink-0"
                />
              }
              onClick={() =>
                onCategorySelect?.(
                  selectedCategory === cat.name ? undefined : cat.name,
                )
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CategorySidebar({
  categories,
  categoriesWithCounts,
  totalCount = 0,
  selectedCategory,
  onCategorySelect,
}: CategoryListProps & {
  categoriesWithCounts?: CategoryCount[];
}) {
  return (
    <div className="mb-6">
      <SectionLabel>分类</SectionLabel>
      <ul className="space-y-0.5">
        <li>
          <CategoryRow
            label="全部"
            count={totalCount}
            active={!selectedCategory}
            onClick={() => onCategorySelect?.(undefined)}
          />
        </li>
        {categories.map((cat) => {
          const count =
            categoriesWithCounts?.find((c) => c.id === cat.id)?.count ||
            cat.link_count ||
            0;
          return (
            <li key={cat.id}>
              <CategoryRow
                label={cat.name}
                count={count}
                active={selectedCategory === cat.name}
                icon={
                  <CategoryIcon
                    iconName={cat.icon || null}
                    className="h-4 w-4 shrink-0"
                  />
                }
                onClick={() =>
                  onCategorySelect?.(
                    selectedCategory === cat.name ? undefined : cat.name,
                  )
                }
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
