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
    <article className="group relative">
      <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] gap-x-3 border-b border-nc-border py-5 group-last:border-b-0">
        {/* Editorial numeral — quiet, decorative */}
        <span
          className="select-none pt-1 text-right font-mono text-xs tabular-nums text-nc-muted"
          aria-hidden="true"
        >
          {typeof index === "number" ? String(index).padStart(2, "0") : ""}
        </span>

        <div className="min-w-0 space-y-2.5">
          {/* Title — strongest contrast, the anchor for the eye */}
          <h3 className="break-words text-[17px] font-semibold leading-snug text-nc-text [text-wrap:pretty]">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-title hover:text-nc-primary"
            >
              {link.title || link.url}
            </a>
          </h3>

          {/* Domain · Date — meta, lowest tier */}
          <div className="-mt-1 flex items-center gap-1.5 text-xs text-nc-muted">
            <span className="truncate">{link.domain}</span>
            {link.published_at && (
              <>
                <span aria-hidden="true">·</span>
                <span className="shrink-0">
                  {formatDateOnly(link.published_at)}
                </span>
              </>
            )}
          </div>

          {/* Summary — reading serif, the body of the entry */}
          {link.summary && (
            <p className="line-clamp-3 break-words font-serif text-base leading-[1.8] text-nc-text/[0.88]">
              {link.summary}
            </p>
          )}

          {/* Category + Tags — de-emphasised meta */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
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
              tone="quiet"
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
              className="rounded-lg p-1.5 text-nc-muted opacity-0 transition-[opacity,color] duration-200 hover:text-nc-primary focus-visible:opacity-100 group-hover:opacity-100"
              title="访问"
              aria-label="在新窗口打开"
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
