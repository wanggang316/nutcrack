import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import type { PublicLink, Category } from "@nutcrack/shared";
import CategoryBadge from "./CategoryBadge";
import CategoryIcon from "../CategoryIcon";
import TagList from "./TagList";
import { formatDateOnly } from "../../utils/date";

export interface PublicLinkCardProps {
  link: PublicLink;
  categories?: Category[];
  /** 1-based position within its month section — renders an editorial numeral. */
  index?: number;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
  selectedCategory?: string;
  selectedTags?: string[];
  showEditActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  showExternalLinkIcon?: boolean;
}

export default function LinkCard({
  link,
  categories = [],
  index,
  onTagClick,
  onCategoryClick,
  selectedCategory,
  selectedTags = [],
  showEditActions = false,
  onEdit,
  onDelete,
  showExternalLinkIcon = true,
}: PublicLinkCardProps) {
  const handleExternalLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const getCategoryIcon = (categoryName: string | null) => {
    if (!categoryName) return null;
    const category = categories.find((c) => c.name === categoryName);
    return category?.icon || null;
  };

  return (
    <article className="group relative -mx-3 rounded-xl px-3 transition-colors duration-200 hover:bg-white/70">
      <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] gap-x-3 border-b border-parchment-200 py-5 group-last:border-b-0">
        {/* Editorial numeral — quiet ember spark, brightens on hover */}
        <span
          className="select-none pt-0.5 text-right font-display text-sm tabular-nums text-ember-400/70 transition-colors duration-200 group-hover:text-ember-500"
          aria-hidden="true"
        >
          {typeof index === "number"
            ? String(index).padStart(2, "0")
            : ""}
        </span>

        <div className="min-w-0 space-y-2">
          {/* Title — strongest contrast, the anchor for the eye */}
          <h3 className="break-words text-[15px] font-semibold leading-snug text-ink">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-title hover:text-teal-700"
            >
              {link.title || link.url}
            </a>
          </h3>

          {/* Domain · Date — crafted mono meta, lowest tier */}
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-ink/40">
            <span className="truncate">{link.domain}</span>
            {link.published_at && (
              <>
                <span className="text-ink/25">·</span>
                <span className="shrink-0">
                  {formatDateOnly(link.published_at)}
                </span>
              </>
            )}
          </div>

          {/* Summary — secondary tier, clamped for an even rhythm */}
          {link.summary && (
            <p className="line-clamp-2 break-words text-sm leading-relaxed text-ink/65">
              {link.summary}
            </p>
          )}

          {/* Category + Tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {link.category && (
              <CategoryBadge
                category={link.category}
                selectedCategory={selectedCategory}
                onCategoryClick={onCategoryClick}
                clickable={true}
                icon={
                  <CategoryIcon
                    iconName={getCategoryIcon(link.category)}
                    className="h-3 w-3"
                  />
                }
              />
            )}
            <TagList
              tags={link.tags}
              selectedTags={selectedTags}
              onTagClick={onTagClick}
              maxDisplay={3}
              showHash={true}
            />
          </div>
        </div>

        {/* External link — reveals on hover */}
        <div className="flex shrink-0 items-start gap-1 pt-0.5">
          {showExternalLinkIcon && (
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-1.5 text-ink/35 opacity-0 transition-all duration-200 hover:bg-teal-50 hover:text-teal-700 focus-visible:opacity-100 group-hover:opacity-100"
              title="访问"
              onClick={handleExternalLinkClick}
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
          )}
          {showEditActions && (
            <div className="flex gap-1">
              {onEdit && (
                <button
                  className="btn btn-ghost btn-xs rounded-md"
                  onClick={onEdit}
                >
                  编辑
                </button>
              )}
              {onDelete && (
                <button
                  className="btn btn-ghost btn-xs rounded-md text-error"
                  onClick={onDelete}
                >
                  删除
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
