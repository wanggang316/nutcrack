interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisible?: number;
  size?: "sm" | "md";
  showPrevNext?: boolean;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 10,
  size = "sm",
  showPrevNext = true,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const sizeClass = size === "sm" ? "btn-sm" : "btn-md";

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const visibleCount = Math.min(totalPages, maxVisible);

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisible / 2);
      let start = currentPage - halfVisible;
      let end = currentPage + halfVisible;

      if (start < 1) {
        start = 1;
        end = maxVisible;
      } else if (end > totalPages) {
        end = totalPages;
        start = totalPages - maxVisible + 1;
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <div className="join mx-auto flex w-max min-w-max whitespace-nowrap">
        {showPrevNext && (
          <button
            className={`join-item btn min-w-9 ${sizeClass}`}
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            &lt;
          </button>
        )}
        {pages.map((page, index) => (
          <button
            key={typeof page === "number" ? page : `ellipsis-${index}`}
            className={`join-item btn min-w-9 ${sizeClass} ${
              page === currentPage ? "btn-active" : ""
            }`}
            onClick={() => typeof page === "number" && onPageChange(page)}
            disabled={typeof page !== "number"}
          >
            {page}
          </button>
        ))}
        {showPrevNext && (
          <button
            className={`join-item btn min-w-9 ${sizeClass}`}
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            &gt;
          </button>
        )}
      </div>
    </div>
  );
}

export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
}: Omit<
  PaginationProps,
  "maxVisible" | "size" | "showPrevNext" | "className"
>) {
  if (totalPages <= 1) return null;

  const window: number[] = [];
  const half = 3;
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, currentPage + half);
  if (currentPage - start < half) end = Math.min(totalPages, end + (half - (currentPage - start)));
  if (end - currentPage < half) start = Math.max(1, start - (half - (end - currentPage)));
  for (let i = start; i <= end; i++) window.push(i);

  const baseBtn =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 font-mono text-xs tabular-nums transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5 border-t border-parchment-200 pt-8">
      <button
        className={`${baseBtn} text-ink/55 hover:bg-white hover:text-ink`}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="上一页"
      >
        ‹
      </button>

      {start > 1 && (
        <>
          <button
            className={`${baseBtn} text-ink/55 hover:bg-white hover:text-ink`}
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {start > 2 && <span className="px-1 text-ink/30">…</span>}
        </>
      )}

      {window.map((page) => (
        <button
          key={page}
          className={`${baseBtn} ${
            page === currentPage
              ? "bg-teal-600 font-semibold text-white"
              : "text-ink/55 hover:bg-white hover:text-ink"
          }`}
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-ink/30">…</span>}
          <button
            className={`${baseBtn} text-ink/55 hover:bg-white hover:text-ink`}
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        className={`${baseBtn} text-ink/55 hover:bg-white hover:text-ink`}
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="下一页"
      >
        ›
      </button>
    </nav>
  );
}
