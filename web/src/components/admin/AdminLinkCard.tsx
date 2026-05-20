import {
  ArrowTopRightOnSquareIcon,
  RocketLaunchIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { Category, Link } from "@nutcrack/shared";
import ActionButton from "../ActionButton";
import CategoryBadge from "../home/CategoryBadge";
import CategoryIcon from "../CategoryIcon";
import TagList from "../home/TagList";
import { LinkStatusBadge, ProcessingStatusBadge } from "../StatusBadge";
import { formatDate } from "../../utils/date";
import Pill from "../Pill";

export interface AdminLinkCardProps {
  link: Link;
  categories?: Category[];
  showExternalLinkIcon?: boolean;
  showActions?: boolean;
  onPublish?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReprocess?: () => void;
  publishLoading?: boolean;
  deleteLoading?: boolean;
  reprocessLoading?: boolean;
}

export default function AdminLinkCard({
  link,
  categories = [],
  showExternalLinkIcon = false,
  showActions = false,
  onPublish,
  onEdit,
  onDelete,
  onReprocess,
  publishLoading = false,
  deleteLoading = false,
  reprocessLoading = false,
}: AdminLinkCardProps) {
  // 获取域名
  const getDomain = () => {
    return new URL(link.url).hostname;
  };

  // 获取标题
  const getTitle = () => {
    return link.title || link.ai_title || link.url;
  };

  // 获取摘要
  const getSummary = () => {
    return link.summary || link.ai_summary || "";
  };

  // 获取标签
  const getTags = () => {
    return link.tags?.length ? link.tags : link.ai_tags || [];
  };

  const getCategoryName = () => {
    return link.category || link.ai_category || null;
  };

  const renderStatusBadge = () => {
    if (link.status === "published") {
      return (
        <LinkStatusBadge status="published" size="sm" className="shrink-0" />
      );
    }

    if (link.status === "archived") {
      return (
        <LinkStatusBadge status="archived" size="sm" className="shrink-0" />
      );
    }

    if (link.status === "deleted") {
      return (
        <LinkStatusBadge status="deleted" size="sm" className="shrink-0" />
      );
    }

    if (link.status === "pending" && link.processing_status === "completed") {
      return (
        <Pill
          size="sm"
          className="shrink-0"
          toneClassName="text-[#8A6A00]"
          style={{
            backgroundColor:
              "color-mix(in srgb, currentColor 12%, transparent)",
            borderColor: "color-mix(in srgb, currentColor 14%, transparent)",
          }}
        >
          待发布
        </Pill>
      );
    }

    return (
      <ProcessingStatusBadge
        status={link.processing_status}
        size="sm"
        className="shrink-0"
      />
    );
  };

  // 根据分类名称获取图标
  const getCategoryIcon = (categoryName: string | null) => {
    if (!categoryName) return null;
    const category = categories.find((c) => c.name === categoryName);
    return category?.icon || null;
  };

  return (
    <article className="group border-b border-base-200 py-4 last:border-0">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <h3 className="break-words text-base font-semibold leading-snug">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-title transition-colors hover:text-primary"
              >
                {getTitle()}
              </a>
            </h3>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-4 text-base-content/40">
              <span className="break-all">{getDomain()}</span>
              {link.created_at && (
                <span className="whitespace-nowrap">
                  创建于 {formatDate(link.created_at)}
                </span>
              )}
              {link.published_at && (
                <span className="whitespace-nowrap">
                  发布于 {formatDate(link.published_at)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {showExternalLinkIcon && (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-base-content/35 opacity-0 transition-all hover:bg-base-200 hover:text-base-content/70 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                title="访问"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </a>
            )}
            {renderStatusBadge()}
          </div>
        </div>

        {link.processing_status === "failed" && link.process_error && (
          <div className="rounded-md border border-error/20 bg-error/8 p-2">
            <p className="break-words text-xs text-error">
              {link.process_error}
            </p>
          </div>
        )}

        {getSummary() && (
          <div className="rounded-lg bg-base-200/70 px-3 py-3">
            <p className="break-words text-sm leading-[1.65] text-base-content/70">
              {getSummary()}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {getCategoryName() && (
            <CategoryBadge
              category={getCategoryName()!}
              clickable={false}
              icon={
                <CategoryIcon
                  iconName={getCategoryIcon(getCategoryName())}
                  className="h-3 w-3"
                />
              }
            />
          )}
          <TagList
            tags={getTags()}
            maxDisplay={3}
            showHash={true}
            clickable={false}
          />
        </div>

        {showActions && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            {link.status === "pending" &&
              link.processing_status === "completed" &&
              onPublish && (
                <ActionButton
                  tone="primary"
                  icon={<RocketLaunchIcon className="h-3.5 w-3.5" />}
                  loading={publishLoading}
                  onClick={onPublish}
                >
                  发布
                </ActionButton>
              )}
            {link.status !== "published" &&
              link.processing_status === "failed" &&
              onReprocess && (
                <ActionButton
                  tone="neutral"
                  icon={<ArrowPathIcon className="h-3.5 w-3.5" />}
                  loading={reprocessLoading}
                  onClick={onReprocess}
                >
                  重试
                </ActionButton>
              )}
            {onEdit && (
              <ActionButton
                tone="neutral"
                icon={<PencilSquareIcon className="h-3.5 w-3.5" />}
                onClick={onEdit}
              >
                编辑
              </ActionButton>
            )}
            {onDelete && (
              <ActionButton
                tone="danger"
                icon={<TrashIcon className="h-3.5 w-3.5" />}
                loading={deleteLoading}
                onClick={onDelete}
              >
                删除
              </ActionButton>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
