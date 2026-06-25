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
    <p className="mb-2.5 flex items-center gap-1.5 px-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40">
      <span className="h-1 w-1 rounded-full bg-ember-500" aria-hidden="true" />
      {children}
    </p>
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
      className={`flex w-full items-center justify-between rounded-lg border-l-2 py-1.5 pr-2.5 pl-2 text-sm transition-colors duration-150 ${
        active
          ? "border-ember-500 bg-teal-50 font-semibold text-teal-700"
          : "border-transparent text-ink/65 hover:bg-white hover:text-ink"
      }`}
      onClick={onClick}
    >
      <span className="flex min-w-0 items-center gap-2">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <span
        className={`font-mono text-[11px] tabular-nums ${
          active ? "text-teal-600/70" : "text-ink/35"
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
