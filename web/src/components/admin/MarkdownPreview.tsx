interface MarkdownPreviewProps {
  markdown: string;
  className?: string;
}

function renderInlineMarkdown(text: string) {
  const nodes: React.ReactNode[] = [];
  const pattern =
    /(\[\s*!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)\s*\]\((https?:\/\/[^\s)]+)\)|!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2] !== undefined && match[3] && match[4]) {
      nodes.push(
        <a
          key={`${match.index}-linked-image`}
          href={match[4]}
          target="_blank"
          rel="noreferrer"
          className="inline-block"
        >
          <img
            src={match[3]}
            alt={match[2]}
            className="my-3 max-h-96 rounded-lg border border-base-300"
          />
        </a>,
      );
    } else if (match[5] !== undefined && match[6]) {
      nodes.push(
        <img
          key={`${match.index}-image`}
          src={match[6]}
          alt={match[5]}
          className="my-3 max-h-96 rounded-lg border border-base-300"
        />,
      );
    } else if (match[7] && match[8]) {
      nodes.push(
        <a
          key={`${match.index}-link`}
          href={match[8]}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline decoration-primary/35 underline-offset-2"
        >
          {match[7]}
        </a>,
      );
    } else if (match[9]) {
      nodes.push(
        <code
          key={`${match.index}-code`}
          className="rounded bg-base-200 px-1 py-0.5 font-mono text-[0.9em]"
        >
          {match[9]}
        </code>,
      );
    } else if (match[10]) {
      nodes.push(
        <strong key={`${match.index}-strong`} className="font-semibold">
          {renderInlineMarkdown(match[10])}
        </strong>,
      );
    } else if (match[11]) {
      nodes.push(
        <em key={`${match.index}-em`}>{renderInlineMarkdown(match[11])}</em>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderHtmlBlock(html: string, key: string) {
  return (
    <div
      key={key}
      className="overflow-auto rounded-lg border border-base-300 bg-base-100/70 p-3"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function isMarkdownTableSeparator(line: string) {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return false;
  return trimmed
    .split("|")
    .filter((cell) => cell.trim().length > 0)
    .every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function parseMarkdownTable(lines: string[]) {
  if (lines.length < 2) return null;
  const [headerLine, separatorLine, ...bodyLines] = lines;
  if (!headerLine.includes("|") || !isMarkdownTableSeparator(separatorLine)) {
    return null;
  }

  const toCells = (line: string) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());

  const headers = toCells(headerLine);
  const aligns = toCells(separatorLine).map((cell) => {
    const trimmed = cell.trim();
    if (trimmed.startsWith(":") && trimmed.endsWith(":")) return "center";
    if (trimmed.endsWith(":")) return "right";
    return "left";
  }) as Array<"left" | "center" | "right">;
  const rows = bodyLines
    .filter((line) => line.trim())
    .map((line) => toCells(line));

  return { headers, aligns, rows };
}

export default function MarkdownPreview({
  markdown,
  className = "",
}: MarkdownPreviewProps) {
  const lines = markdown.split("\n");
  const blocks: React.ReactNode[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let quoteLines: string[] = [];
  let codeLines: string[] = [];
  let codeFence: string | null = null;
  let pendingCodeTitle: string | null = null;
  let tableLines: string[] = [];
  let htmlLines: string[] = [];
  let htmlTag: "video" | "iframe" | "table" | null = null;

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className="leading-7 text-base-content/85">
        {renderInlineMarkdown(paragraphLines.join(" "))}
      </p>,
    );
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc space-y-2 pl-5">
        {listItems.map((item, index) => (
          <li key={index} className="leading-7">
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  const flushQuote = () => {
    if (quoteLines.length === 0) return;
    blocks.push(
      <blockquote
        key={`quote-${blocks.length}`}
        className="border-l-4 border-base-300 pl-4 italic text-base-content/70"
      >
        {quoteLines.map((line, index) => (
          <p key={index} className="leading-7">
            {renderInlineMarkdown(line)}
          </p>
        ))}
      </blockquote>,
    );
    quoteLines = [];
  };

  const flushCode = () => {
    if (!codeFence) return;
    const rows = codeLines.length > 0 ? codeLines : [""];
    blocks.push(
      <div
        key={`code-${blocks.length}`}
        className="overflow-auto rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3"
      >
        {pendingCodeTitle ? (
          <div className="mb-4 flex items-center justify-between">
            <div className="text-lg font-semibold text-base-content">
              {renderInlineMarkdown(pendingCodeTitle)}
            </div>
          </div>
        ) : null}
        <div className="min-w-max font-mono text-[13px] leading-6 text-stone-800">
          {rows.map((line, index) => (
            <div key={index}>
              <code className="whitespace-pre-wrap break-words">
                {line || " "}
              </code>
            </div>
          ))}
        </div>
      </div>,
    );
    codeFence = null;
    codeLines = [];
    pendingCodeTitle = null;
  };

  const flushTable = () => {
    if (tableLines.length === 0) return;
    const table = parseMarkdownTable(tableLines);
    if (!table) {
      paragraphLines.push(...tableLines);
      tableLines = [];
      return;
    }

    blocks.push(
      <div
        key={`table-${blocks.length}`}
        className="overflow-auto rounded-xl border border-base-300 bg-base-100/70"
      >
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-base-200/70">
            <tr>
              {table.headers.map((header, index) => (
                <th
                  key={index}
                  className="border-b border-base-300 px-3 py-2 font-medium text-base-content/80"
                  style={{ textAlign: table.aligns[index] }}
                >
                  {renderInlineMarkdown(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="odd:bg-base-100 even:bg-base-100/60"
              >
                {table.headers.map((_, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border-t border-base-300 px-3 py-2 align-top text-base-content/80"
                    style={{ textAlign: table.aligns[cellIndex] }}
                  >
                    {renderInlineMarkdown(row[cellIndex] || "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
    tableLines = [];
  };

  const flushHtml = () => {
    if (htmlLines.length === 0) return;
    blocks.push(renderHtmlBlock(htmlLines.join("\n"), `html-${blocks.length}`));
    htmlLines = [];
    htmlTag = null;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nextLine = lines[index + 1];
    const trimmed = line.trim();

    if (codeFence) {
      if (trimmed.startsWith("```")) {
        flushCode();
      } else {
        codeLines.push(line);
      }
      continue;
    }

    if (htmlTag) {
      htmlLines.push(line);
      if (trimmed.includes(`</${htmlTag}>`)) {
        flushHtml();
      }
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      codeFence = trimmed.slice(3).trim() || "plain";
      continue;
    }

    if (trimmed.startsWith("<video")) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      htmlTag = "video";
      htmlLines.push(line);
      if (trimmed.includes("</video>")) {
        flushHtml();
      }
      continue;
    }

    if (trimmed.startsWith("<iframe")) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      htmlTag = "iframe";
      htmlLines.push(line);
      if (trimmed.includes("</iframe>")) {
        flushHtml();
      }
      continue;
    }

    if (trimmed.startsWith("<table")) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      htmlTag = "table";
      htmlLines.push(line);
      if (trimmed.includes("</table>")) {
        flushHtml();
      }
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      if (level === 4) {
        pendingCodeTitle = headingText;
        continue;
      }
      pendingCodeTitle = null;
      const classNameByLevel = [
        "text-3xl font-semibold",
        "text-2xl font-semibold",
        "text-xl font-semibold",
        "text-lg font-semibold",
        "text-base font-semibold",
        "text-sm font-semibold uppercase tracking-wide",
      ][level - 1];
      blocks.push(
        <div key={`h-${blocks.length}`} className={classNameByLevel}>
          {renderInlineMarkdown(headingText)}
        </div>,
      );
      continue;
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      flushQuote();
      flushTable();
      pendingCodeTitle = null;
      listItems.push(listMatch[1]);
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      flushTable();
      pendingCodeTitle = null;
      quoteLines.push(quoteMatch[1]);
      continue;
    }

    if (trimmed.includes("|")) {
      if (
        tableLines.length > 0 ||
        (nextLine && isMarkdownTableSeparator(nextLine))
      ) {
        flushParagraph();
        flushList();
        flushQuote();
        tableLines.push(line);
        continue;
      }
    }

    if (pendingCodeTitle) {
      blocks.push(
        <div key={`h-${blocks.length}`} className="text-lg font-semibold">
          {renderInlineMarkdown(pendingCodeTitle)}
        </div>,
      );
      pendingCodeTitle = null;
    }

    paragraphLines.push(trimmed);
  }

  if (pendingCodeTitle) {
    blocks.push(
      <div key={`h-${blocks.length}`} className="text-lg font-semibold">
        {renderInlineMarkdown(pendingCodeTitle)}
      </div>,
    );
    pendingCodeTitle = null;
  }

  flushParagraph();
  flushList();
  flushQuote();
  flushTable();
  flushCode();
  flushHtml();

  return <div className={`space-y-4 text-sm ${className}`}>{blocks}</div>;
}
