import { useEffect, useState } from "react";
import {
  ArrowPathIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { Link } from "@nutcrack/shared";
import { useAdminCategories } from "../../hooks/useCategories";
import { LinkStatusBadge, ProcessingStatusBadge } from "../StatusBadge";
import Pill from "../Pill";
import CategoryIcon from "../CategoryIcon";
import CategoryBadge from "../home/CategoryBadge";
import TagList from "../home/TagList";
import {
  areManualFieldsEmpty,
  getAiSuggestedManualFields,
  getCurrentManualFields,
  getManualFieldValidationMessage,
} from "../../utils/link-fields";

interface Props {
  link: Link | null;
  open: boolean;
  onClose: () => void;
  onReanalyze?: () => void;
  reanalyzeLoading?: boolean;
  onSave: (data: {
    title?: string;
    summary?: string;
    category?: string;
    tags?: string[];
  }) => void;
  onSaveAndPublish?: (data: {
    title?: string;
    summary?: string;
    category?: string;
    tags?: string[];
  }) => void;
}

export default function LinkEditModal({
  link,
  open,
  onClose,
  onReanalyze,
  reanalyzeLoading = false,
  onSave,
  onSaveAndPublish,
}: Props) {
  const inputClass =
    "input input-sm h-9 w-full rounded-md border border-base-300 bg-base-100 focus:border-primary focus:outline-none";
  const textareaClass =
    "textarea min-h-[148px] w-full rounded-md border border-base-300 bg-base-100 px-3 py-2 text-sm leading-7 focus:border-primary focus:outline-none";
  const selectClass =
    "select select-sm h-9 w-full rounded-md border border-base-300 bg-base-100 focus:border-primary focus:outline-none";
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const { data: categoriesData } = useAdminCategories();

  useEffect(() => {
    if (link) {
      const currentFields = getCurrentManualFields(link);
      const nextFields = areManualFieldsEmpty(currentFields)
        ? getAiSuggestedManualFields(link)
        : currentFields;

      setTitle(nextFields.title);
      setSummary(nextFields.summary);
      setCategory(nextFields.category);
      setTags(nextFields.tags.join(", "));
    }
  }, [link]);

  if (!open || !link) return null;

  const aiFields = getAiSuggestedManualFields(link);
  const getData = () => ({
    title,
    summary,
    category,
    tags: tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  });

  const applyAiSuggestion = () => {
    setTitle(aiFields.title);
    setSummary(aiFields.summary);
    setCategory(aiFields.category);
    setTags(aiFields.tags.join(", "));
  };

  const validationMessage = getManualFieldValidationMessage(getData());
  const canSubmit = !validationMessage;

  const hasAiSuggestion = Boolean(
    link.ai_title ||
    link.ai_summary ||
    link.ai_category ||
    (link.ai_tags && link.ai_tags.length > 0),
  );
  const canReanalyze =
    link.processing_status === "completed" && Boolean(onReanalyze);
  const showSaveAndPublish =
    Boolean(onSaveAndPublish) && link.status === "pending";
  const showSaveOnly =
    link.status === "published" ||
    link.status === "archived" ||
    link.status === "pending";
  const handleSaveAndPublishClick = () => {
    if (!onSaveAndPublish) return;
    onSaveAndPublish(getData());
  };
  const parsedTags = tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const sourceDomain = (() => {
    try {
      return new URL(link.url).hostname;
    } catch {
      return link.url;
    }
  })();
  const getCategoryIcon = (categoryName: string | null) => {
    if (!categoryName) return null;
    const categoryItem = categoriesData?.items.find(
      (item) => item.name === categoryName,
    );
    return categoryItem?.icon || null;
  };
  const renderPrimaryStatus = () => {
    if (link.status === "published") {
      return <LinkStatusBadge status="published" size="sm" />;
    }

    if (link.status === "archived") {
      return <LinkStatusBadge status="archived" size="sm" />;
    }

    if (link.status === "deleted") {
      return <LinkStatusBadge status="deleted" size="sm" />;
    }

    if (link.status === "pending" && link.processing_status === "completed") {
      return (
        <Pill
          size="sm"
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

    return <ProcessingStatusBadge status={link.processing_status} size="sm" />;
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box flex max-h-[90vh] max-w-5xl flex-col overflow-hidden border border-base-300 bg-base-100 p-0 shadow-xl">
        <div className="border-b border-base-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold tracking-[-0.02em] text-base-content">
                  编辑链接
                </h3>
                {renderPrimaryStatus()}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-base-content/55">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-base-content/55 transition-colors hover:text-primary"
                >
                  {link.url}
                </a>
              </div>
            </div>

            <button
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base-content/45 transition-colors hover:bg-base-200 hover:text-base-content"
              onClick={onClose}
              type="button"
              aria-label="关闭编辑弹窗"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <aside className="space-y-5 border-b border-base-200 bg-base-200/[0.28] px-6 py-6 lg:border-b-0 lg:border-r">
            {(hasAiSuggestion || canReanalyze) && (
              <section className="rounded-2xl border border-base-300 bg-base-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-base-content">
                    <SparklesIcon className="h-4 w-4 text-primary" />
                    AI 建议
                  </div>

                  {canReanalyze && (
                    <button
                      className="btn btn-ghost btn-xs gap-1 rounded-md font-normal text-base-content/70 hover:bg-base-200 hover:text-primary"
                      onClick={() => {
                        onReanalyze?.();
                      }}
                      disabled={reanalyzeLoading}
                      type="button"
                    >
                      <ArrowPathIcon className="h-3.5 w-3.5" />
                      {reanalyzeLoading ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        "重新分析"
                      )}
                    </button>
                  )}
                </div>

                {reanalyzeLoading && (
                  <div className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.06] px-3 py-2 text-sm text-primary">
                    正在重新获取 AI 建议，结果回来后请再次确认差异。
                  </div>
                )}

                {hasAiSuggestion ? (
                  <>
                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-base-content/42">
                          标题
                        </div>
                        <div className="text-sm leading-6 text-base-content/78">
                          {link.ai_title || "暂无"}
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-base-content/42">
                          摘要
                        </div>
                        <div className="whitespace-pre-wrap text-sm leading-6 text-base-content/78">
                          {link.ai_summary || "暂无"}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-base-content/42">
                          分类与标签
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {link.ai_category ? (
                            <CategoryBadge
                              category={link.ai_category}
                              clickable={false}
                              icon={
                                <CategoryIcon
                                  iconName={getCategoryIcon(link.ai_category)}
                                  className="h-3 w-3"
                                />
                              }
                            />
                          ) : null}
                          <TagList
                            tags={link.ai_tags || []}
                            clickable={false}
                            maxDisplay={10}
                            className="gap-1.5"
                          />
                          {!link.ai_category &&
                            (!link.ai_tags || link.ai_tags.length === 0) && (
                              <div className="text-sm text-base-content/52">
                                暂无
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        className="btn btn-ghost btn-xs rounded-md font-normal text-primary hover:bg-primary/10 hover:text-primary"
                        onClick={applyAiSuggestion}
                        type="button"
                      >
                        用 AI 建议覆盖当前字段
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-base-300 px-3 py-4 text-sm text-base-content/52">
                    当前还没有可用的 AI 建议。
                  </div>
                )}
              </section>
            )}

            {link.processing_status === "failed" && link.process_error && (
              <section className="rounded-2xl border border-error/18 bg-error/[0.05] p-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-error">处理失败</h4>
                  <p className="break-words text-sm leading-6 text-error/85">
                    {link.process_error}
                  </p>
                </div>
              </section>
            )}
          </aside>

          <section className="space-y-6 px-6 py-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-base-content/45">
                发布内容
              </p>
            </div>

            <div className="space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-base-content/72">
                  标题
                </span>
                <input
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-base-content/72">
                  摘要
                </span>
                <textarea
                  className={textareaClass}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </label>

              <div className="grid gap-5 lg:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-base-content/72">
                    分类
                  </span>
                  <select
                    className={selectClass}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">未分类</option>
                    {categoriesData?.items.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-base-content/72">
                    标签
                  </span>
                  <input
                    className={inputClass}
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="输入标签，用逗号分隔"
                  />
                </label>
              </div>

              {validationMessage && (
                <div className="rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm leading-6 text-warning">
                  {validationMessage}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-base-200 bg-base-100 px-6 py-4">
          <button
            className="btn btn-sm rounded-md"
            onClick={onClose}
            type="button"
          >
            取消
          </button>
          {showSaveOnly && (
            <button
              className="btn btn-outline btn-sm rounded-md"
              onClick={() => onSave(getData())}
              disabled={!canSubmit}
              type="button"
            >
              保存
            </button>
          )}
          {showSaveAndPublish && (
            <button
              className="btn btn-primary btn-sm rounded-md"
              onClick={handleSaveAndPublishClick}
              disabled={!canSubmit}
              type="button"
            >
              保存并发布
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
