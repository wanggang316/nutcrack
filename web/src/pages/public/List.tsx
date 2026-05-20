import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { LinksQuery, PublicLink } from "@nutcrack/shared";
import { publicApi } from "../../utils/api";
import Logo from "../../components/Logo";
import { CategorySidebar } from "../../components/CategoryList";
import { LinkCard, TagList } from "../../components/home";
import { SimplePagination } from "../../components/Pagination";

function parsePage(raw: string | null): number {
  if (!raw) return 1;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

function groupByMonth(items: PublicLink[]): Array<{
  month: string;
  links: PublicLink[];
}> {
  const groups = new Map<string, PublicLink[]>();
  for (const link of items) {
    const month = link.published_at
      ? (() => {
          const d = new Date(link.published_at);
          return `${d.getFullYear()}年${d.getMonth() + 1}月`;
        })()
      : "未发布";
    const list = groups.get(month);
    if (list) {
      list.push(link);
    } else {
      groups.set(month, [link]);
    }
  }
  return Array.from(groups.entries()).map(([month, links]) => ({
    month,
    links,
  }));
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

  return (
    <div className="min-h-screen">
      {/* Top navbar */}
      <div className="sticky top-0 z-30 border-b border-parchment-200 bg-base-200/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <button
            className="btn btn-ghost btn-sm lg:hidden"
            onClick={() => setIsMobileSidebarOpen((open) => !open)}
            aria-label="切换侧边栏"
          >
            {isMobileSidebarOpen ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </button>

          <a href="/" className="ml-1 flex items-center">
            <Logo variant="default" />
          </a>

          <div className="ml-auto flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="join hidden lg:flex">
              <input
                type="search"
                className="input input-bordered input-sm join-item w-56"
                placeholder="搜索标题、标签、描述..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm join-item">
                <MagnifyingGlassIcon className="h-4 w-4" />
              </button>
            </form>

            <button
              type="button"
              className="btn btn-ghost btn-sm lg:hidden"
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
          <div className="border-t border-parchment-200 px-4 py-2 lg:hidden">
            <form onSubmit={handleSearchSubmit} className="join w-full">
              <input
                ref={mobileSearchInputRef}
                type="search"
                className="input input-bordered input-sm join-item flex-1"
                placeholder="搜索标题、标签、描述..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm join-item">
                <MagnifyingGlassIcon className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile sidebar drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            type="button"
            className="fixed inset-0 cursor-default bg-black/40"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="关闭侧边栏"
          />
          <aside className="relative h-full w-72 max-w-[85vw] overflow-y-auto border-r border-parchment-200 bg-base-200 p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-semibold">筛选</span>
              <button
                className="btn btn-ghost btn-sm btn-circle"
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

            {data?.tags && data.tags.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-base-content/40">
                  热门标签
                </h3>
                <TagList
                  tags={data.tags.map((t) => t.name)}
                  selectedTags={selectedTags}
                  onTagClick={handleTagClick}
                  maxDisplay={20}
                  variant="outline"
                />
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Two-column body */}
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-20">
            <CategorySidebar
              categories={categoriesData?.items ?? []}
              categoriesWithCounts={data?.categories}
              totalCount={totalCount}
              selectedCategory={category}
              onCategorySelect={handleCategorySelect}
            />

            {data?.tags && data.tags.length > 0 && (
              <div>
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-base-content/40">
                  热门标签
                </h3>
                <TagList
                  tags={data.tags.map((t) => t.name)}
                  selectedTags={selectedTags}
                  onTagClick={handleTagClick}
                  maxDisplay={20}
                  variant="outline"
                />
              </div>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {hasFilter && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-base-content/50">筛选:</span>
              {category && (
                <span className="badge badge-primary badge-sm gap-1">
                  {category}
                  <button
                    onClick={() => handleCategorySelect(undefined)}
                    aria-label="移除"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="badge badge-primary badge-sm gap-1"
                >
                  #{tag}
                  <button onClick={() => handleTagClick(tag)} aria-label="移除">
                    ×
                  </button>
                </span>
              ))}
              {q && (
                <span className="badge badge-primary badge-sm gap-1">
                  搜索: {q}
                  <button onClick={handleClearSearch} aria-label="清除搜索">
                    ×
                  </button>
                </span>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center p-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-base-content/50">
                还没有已发布的链接
              </p>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-base-content/35">
                添加链接并完成 AI 处理后，这里会展示最新公开内容。
              </p>
            </div>
          ) : (
            <div>
              {grouped.map(({ month, links }) => (
                <div key={month} className="mb-10">
                  <div className="mb-1 flex items-center gap-3">
                    <h2 className="shrink-0 text-xs font-semibold uppercase tracking-widest text-base-content/40">
                      {month}
                    </h2>
                    <span className="text-xs text-base-content/30">
                      {links.length}
                    </span>
                    <div className="flex-1 border-t border-parchment-200" />
                  </div>
                  {links.map((link) => (
                    <LinkCard
                      key={link.id}
                      link={link}
                      categories={categoriesData?.items ?? []}
                      selectedCategory={category}
                      selectedTags={selectedTags}
                      onCategoryClick={(cat) =>
                        handleCategorySelect(cat === category ? undefined : cat)
                      }
                      onTagClick={handleTagClick}
                    />
                  ))}
                </div>
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
