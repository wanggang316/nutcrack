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
  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      maxVisible={Math.min(totalPages, 10)}
      size="sm"
      showPrevNext={true}
    />
  );
}
