import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import type { PublicLink, Category } from "@nutcrack/shared";
import CategoryBadge from "./CategoryBadge";
import CategoryIcon from "../CategoryIcon";
import TagList from "./TagList";
import { formatDateOnly } from "../../utils/date";

export interface PublicLinkCardProps {
  link: PublicLink;
  categories?: Category[];
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
    <div className="group py-4 border-b border-base-200 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Title — 16px, clear anchor for the eye */}
          <h3 className="break-words font-semibold text-base leading-snug">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-title hover:text-primary"
            >
              {link.title || link.url}
            </a>
          </h3>

          {/* Domain · Date — 12px, lowest tier */}
          <div className="flex items-center gap-1.5 text-xs text-base-content/40 leading-4">
            <span>{link.domain}</span>
            {link.published_at && (
              <>
                <span>·</span>
                <span>{formatDateOnly(link.published_at)}</span>
              </>
            )}
          </div>

          {/* Summary — 14px, secondary tier */}
          {link.summary && (
            <p className="break-words text-sm text-base-content/70 leading-[1.65]">
              {link.summary}
            </p>
          )}

          {/* Category + Tags */}
          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            {link.category && (
              <CategoryBadge
                category={link.category}
                selectedCategory={selectedCategory}
                onCategoryClick={onCategoryClick}
                clickable={true}
                icon={
                  <CategoryIcon
                    iconName={getCategoryIcon(link.category)}
                    className="w-3 h-3"
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

        {/* External link icon — visible on hover */}
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          {showExternalLinkIcon && (
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-base-200 text-base-content/40 hover:text-base-content/70"
              title="访问"
              onClick={handleExternalLinkClick}
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
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
                  className="btn btn-ghost btn-xs text-error rounded-md"
                  onClick={onDelete}
                >
                  删除
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
