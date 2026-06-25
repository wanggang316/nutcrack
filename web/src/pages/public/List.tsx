import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Bars3Icon,
  InboxIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { LinksQuery, PublicLink } from "@nutcrack/shared";
import { publicApi } from "../../utils/api";
import { CategorySidebar } from "../../components/CategoryList";
import { LinkCard, TagList } from "../../components/home";
import { SimplePagination } from "../../components/Pagination";

function parsePage(raw: string | null): number {
  if (!raw) return 1;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

interface MonthGroup {
  key: string;
  /** Chinese dateline, e.g. "2026年6月". */
  title: string;
  links: PublicLink[];
}

function groupByMonth(items: PublicLink[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  for (const link of items) {
    let key: string;
    let group: MonthGroup;
    if (link.published_at) {
      const d = new Date(link.published_at);
      key = `${d.getFullYear()}-${d.getMonth()}`;
      group = groups.get(key) ?? {
        key,
        title: `${d.getFullYear()}年${d.getMonth() + 1}月`,
        links: [],
      };
    } else {
      key = "unpublished";
      group = groups.get(key) ?? { key, title: "未发布", links: [] };
    }
    group.links.push(link);
    groups.set(key, group);
  }
  return Array.from(groups.values());
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 flex items-center gap-1.5 px-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40">
      <span className="h-1 w-1 rounded-full bg-ember-500" aria-hidden="true" />
      {children}
    </p>
  );
}

function SearchField({
  value,
  onChange,
  inputRef,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  className?: string;
}) {
  return (
    <div
      className={`group flex items-center gap-2 rounded-full border border-parchment-200 bg-white/70 px-3.5 py-1.5 transition-colors duration-150 focus-within:border-teal-400 focus-within:bg-white ${className}`}
    >
      <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-ink/40 transition-colors group-focus-within:text-teal-600" />
      <input
        ref={inputRef}
        type="search"
        className="w-full bg-transparent text-sm text-ink placeholder:text-ink/35 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
        placeholder="搜索标题、标签、描述…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function FilterPill({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 py-0.5 pl-2.5 pr-1.5 text-xs text-white">
      {children}
      <button
        onClick={onRemove}
        aria-label="移除筛选"
        className="grid h-4 w-4 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/20 hover:text-white"
      >
        <XMarkIcon className="h-3 w-3" />
      </button>
    </span>
  );
}

function MonthHeading({ group }: { group: MonthGroup }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-parchment-200 pb-2.5">
      <h2 className="font-display text-2xl font-medium leading-none tracking-tight text-ink">
        {group.title}
      </h2>
      <span className="shrink-0 font-mono text-xs tabular-nums text-ink/45">
        {group.links.length} 篇
      </span>
    </div>
  );
}

export default function List() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const category = searchParams.get("category") ?? undefined;
  const tagsRaw = searchParams.get("tags");
  const q = searchParams.get("q") ?? undefined;

  const selectedTags = useMemo(
    () => (tagsRaw ? tagsRaw.split(",").filter(Boolean) : []),
    [tagsRaw],
  );

  const query: LinksQuery = useMemo(
    () => ({ page, page_size: 20, category, tags: tagsRaw ?? undefined, q }),
    [page, category, tagsRaw, q],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["public-links", query],
    queryFn: () => publicApi.getLinks(query),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["public-categories"],
    queryFn: () => publicApi.getCategories(),
  });

  const [searchInput, setSearchInput] = useState(q ?? "");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchInput(q ?? "");
  }, [q]);

  useEffect(() => {
    if (isMobileSearchOpen) {
      mobileSearchInputRef.current?.focus();
    }
  }, [isMobileSearchOpen]);

  const setParam = (
    next: URLSearchParams,
    key: string,
    value: string | undefined,
  ) => {
    if (value === undefined || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    setParam(next, "q", searchInput.trim() || undefined);
    next.delete("page");
    setSearchParams(next);
    setIsMobileSearchOpen(false);
  };

  const handleCategorySelect = (categoryName: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    setParam(next, "category", categoryName);
    next.delete("page");
    setSearchParams(next);
    setIsMobileSidebarOpen(false);
  };

  const handleTagClick = (tag: string) => {
    const set = new Set(selectedTags);
    if (set.has(tag)) {
      set.delete(tag);
    } else {
      set.add(tag);
    }
    const next = new URLSearchParams(searchParams);
    setParam(next, "tags", Array.from(set).join(",") || undefined);
    next.delete("page");
    setSearchParams(next);
    setIsMobileSidebarOpen(false);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    const next = new URLSearchParams(searchParams);
    next.delete("q");
    next.delete("page");
    setSearchParams(next);
  };

  const handleClearAll = () => {
    setSearchInput("");
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(nextPage));
    }
    setSearchParams(next);
  };

  const items = data?.items ?? [];
  const grouped = useMemo(() => groupByMonth(items), [items]);
  const totalPages = data?.pagination.total_pages ?? 1;
  const totalCount = data?.pagination.total ?? 0;
  const hasFilter = Boolean(category || selectedTags.length || q);

  const popularTags = data?.tags ?? [];

  const renderTagsBlock = () =>
    popularTags.length > 0 ? (
      <div className="mt-6">
        <SectionLabel>热门标签</SectionLabel>
        <div className="px-1">
          <TagList
            tags={popularTags.map((t) => t.name)}
            selectedTags={selectedTags}
            onTagClick={handleTagClick}
            maxDisplay={20}
          />
        </div>
      </div>
    ) : null;

  return (
    <div className="min-h-[100dvh]">
      {/* Masthead */}
      <header className="sticky top-0 z-30 border-b border-parchment-200 bg-parchment-50/85 backdrop-blur">
        <div
          className="h-[3px] w-full bg-gradient-to-r from-ember-500 via-teal-500 to-teal-600"
          aria-hidden="true"
        />
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5 lg:px-6">
          <button
            className="grid h-9 w-9 place-items-center rounded-lg text-ink/60 transition-colors hover:bg-white hover:text-ink lg:hidden"
            onClick={() => setIsMobileSidebarOpen((open) => !open)}
            aria-label="切换侧边栏"
          >
            {isMobileSidebarOpen ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </button>

          <a href="/" className="flex min-w-0 items-center gap-2.5">
            <img
              src="/logo.png"
              width={30}
              height={30}
              alt="Nutcrack"
              loading="eager"
              decoding="async"
              className="shrink-0"
              style={{ width: 30, height: 30 }}
            />
            <span className="font-display text-xl font-semibold tracking-tight text-ink">
              Nutcrack
            </span>
          </a>

          <div className="ml-auto flex items-center gap-2">
            <form
              onSubmit={handleSearchSubmit}
              className="hidden lg:block"
            >
              <SearchField
                value={searchInput}
                onChange={setSearchInput}
                className="w-64"
              />
            </form>

            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-lg text-ink/60 transition-colors hover:bg-white hover:text-ink lg:hidden"
              onClick={() => setIsMobileSearchOpen((open) => !open)}
              aria-label="搜索"
            >
              {isMobileSearchOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <MagnifyingGlassIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {isMobileSearchOpen && (
          <div className="border-t border-parchment-200 px-4 py-2.5 lg:hidden">
            <form onSubmit={handleSearchSubmit}>
              <SearchField
                value={searchInput}
                onChange={setSearchInput}
                inputRef={mobileSearchInputRef}
              />
            </form>
          </div>
        )}
      </header>

      {/* Mobile sidebar drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            type="button"
            className="fixed inset-0 cursor-default bg-ink/40 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="关闭侧边栏"
          />
          <aside className="relative h-full w-72 max-w-[85vw] overflow-y-auto border-r border-parchment-200 bg-parchment-50 p-4">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-display text-base font-semibold text-ink">
                筛选
              </span>
              <button
                className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 transition-colors hover:bg-white hover:text-ink"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label="关闭"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <CategorySidebar
              categories={categoriesData?.items ?? []}
              categoriesWithCounts={data?.categories}
              totalCount={totalCount}
              selectedCategory={category}
              onCategorySelect={handleCategorySelect}
            />

            {renderTagsBlock()}
          </aside>
        </div>
      )}

      {/* Two-column body */}
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 lg:px-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24">
            <CategorySidebar
              categories={categoriesData?.items ?? []}
              categoriesWithCounts={data?.categories}
              totalCount={totalCount}
              selectedCategory={category}
              onCategorySelect={handleCategorySelect}
            />
            {renderTagsBlock()}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {hasFilter && (
            <div className="mb-7 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink/40">
                筛选
              </span>
              {category && (
                <FilterPill onRemove={() => handleCategorySelect(undefined)}>
                  {category}
                </FilterPill>
              )}
              {selectedTags.map((tag) => (
                <FilterPill key={tag} onRemove={() => handleTagClick(tag)}>
                  #{tag}
                </FilterPill>
              ))}
              {q && (
                <FilterPill onRemove={handleClearSearch}>“{q}”</FilterPill>
              )}
              <button
                onClick={handleClearAll}
                className="ml-1 text-xs text-ink/45 underline-offset-4 transition-colors hover:text-teal-700 hover:underline"
              >
                清除全部
              </button>
            </div>
          )}

          {isLoading ? (
            <div aria-busy="true" aria-label="加载中">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3 border-b border-parchment-200 py-5"
                >
                  <div className="skeleton-line mt-1 h-3 w-4" />
                  <div className="space-y-2.5">
                    <div className="skeleton-line h-4 w-3/4" />
                    <div className="skeleton-line h-2.5 w-32" />
                    <div className="skeleton-line h-3 w-full" />
                    <div className="skeleton-line h-3 w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="animate-fade-up py-20 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-600">
                <InboxIcon className="h-7 w-7" />
              </div>
              <p className="font-display text-lg text-ink">
                {hasFilter ? "没有符合条件的链接" : "还没有已发布的链接"}
              </p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink/45">
                {hasFilter
                  ? "试试调整或清除筛选条件，换个角度看看。"
                  : "添加链接并完成 AI 处理后，这里会展示最新公开内容。"}
              </p>
              {hasFilter && (
                <button
                  onClick={handleClearAll}
                  className="mt-5 inline-flex items-center rounded-full bg-teal-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                >
                  清除筛选
                </button>
              )}
            </div>
          ) : (
            <div>
              {grouped.map((group) => (
                <section key={group.key} className="animate-fade-up mb-12">
                  <MonthHeading group={group} />
                  {group.links.map((link, i) => (
                    <LinkCard
                      key={link.id}
                      link={link}
                      index={i + 1}
                      categories={categoriesData?.items ?? []}
                      selectedCategory={category}
                      selectedTags={selectedTags}
                      onCategoryClick={(cat) =>
                        handleCategorySelect(cat === category ? undefined : cat)
                      }
                      onTagClick={handleTagClick}
                    />
                  ))}
                </section>
              ))}

              {totalPages > 1 && (
                <SimplePagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
