import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import type { LinksQuery, PublicLink } from "@nutcrack/shared";
import { publicApi } from "../../utils/api";
import { LinkCard, MonthSection, TagCloud } from "../../components/home";

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
    const date = link.published_at ?? link.url;
    const month = link.published_at
      ? new Date(link.published_at).toISOString().slice(0, 7)
      : "未发布";
    const list = groups.get(month);
    if (list) {
      list.push(link);
    } else {
      groups.set(month, [link]);
    }
    void date;
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([month, links]) => ({ month, links }));
}

export default function List() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const category = searchParams.get("category") ?? undefined;
  const tagsRaw = searchParams.get("tags");
  const selectedTags = useMemo(
    () => (tagsRaw ? tagsRaw.split(",").filter(Boolean) : []),
    [tagsRaw],
  );

  const query: LinksQuery = useMemo(
    () => ({ page, category, tags: tagsRaw ?? undefined }),
    [page, category, tagsRaw],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-links", query],
    queryFn: () => publicApi.getLinks(query),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["public-categories"],
    queryFn: () => publicApi.getCategories(),
  });

  const items = data?.items ?? [];
  const groups = useMemo(() => groupByMonth(items), [items]);
  const totalPages = data?.pagination.total_pages ?? 1;

  const setParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.delete("page");
    setSearchParams(next);
  };

  const handleTagClick = (tag: string) => {
    const set = new Set(selectedTags);
    if (set.has(tag)) {
      set.delete(tag);
    } else {
      set.add(tag);
    }
    const joined = Array.from(set).join(",");
    setParam("tags", joined || undefined);
  };

  const handleCategoryClick = (cat: string) => {
    setParam("category", cat === category ? undefined : cat);
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

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      {data?.tags && data.tags.length > 0 && (
        <div className="mb-6">
          <TagCloud
            tags={data.tags.map((t) => t.name)}
            selectedTags={selectedTags}
            onTagClick={handleTagClick}
            maxDisplay={30}
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : isError ? (
        <div className="rounded-md bg-parchment-50 p-4 text-sm text-base-content/70">
          加载失败，请稍后重试
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-sm text-base-content/50">
          还没有收藏，请稍候
        </div>
      ) : (
        <div>
          {groups.map(({ month, links }) => (
            <MonthSection key={month} month={month} count={links.length}>
              {links.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  categories={categoriesData?.items ?? []}
                  selectedCategory={category}
                  selectedTags={selectedTags}
                  onCategoryClick={handleCategoryClick}
                  onTagClick={handleTagClick}
                />
              ))}
            </MonthSection>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="join">
            <button
              type="button"
              className="join-item btn btn-sm min-w-9"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`join-item btn btn-sm min-w-9 ${
                    pageNumber === page ? "btn-active" : ""
                  }`}
                  onClick={() => handlePageChange(pageNumber)}
                >
                  {pageNumber}
                </button>
              ),
            )}
            <button
              type="button"
              className="join-item btn btn-sm min-w-9"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
