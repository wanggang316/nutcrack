export interface ScrapeResult {
  title: string | null;
  description: string | null;
  content: string | null;
}

export interface JinaScrapeOptions {
  apiKey: string;
  timeoutMs?: number;
  endpoint?: string;
  fetchImpl?: typeof fetch;
  extraHeaders?: Record<string, string>;
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;

  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function expandIpv6Address(ipv6: string): number[] | null {
  const normalized = ipv6.toLowerCase();
  if (normalized.includes(":::")) return null;

  const [leftPart, rightPart = ""] = normalized.split("::");
  const left = leftPart ? leftPart.split(":") : [];
  const right = rightPart ? rightPart.split(":") : [];
  const hasIpv4Tail =
    right.length > 0 && right[right.length - 1]?.includes(".");

  let ipv4TailGroups: number[] = [];
  if (hasIpv4Tail) {
    const ipv4Tail = right.pop();
    if (!ipv4Tail) return null;

    const octets = ipv4Tail.split(".").map((part) => Number(part));
    if (
      octets.length !== 4 ||
      octets.some((octet) => Number.isNaN(octet) || octet < 0 || octet > 255)
    ) {
      return null;
    }

    ipv4TailGroups = [octets[0] * 256 + octets[1], octets[2] * 256 + octets[3]];
  }

  const totalGroups = left.length + right.length + ipv4TailGroups.length;
  if (totalGroups > 8) return null;

  const fillCount = normalized.includes("::") ? 8 - totalGroups : 0;
  if (!normalized.includes("::") && totalGroups !== 8) return null;

  const groups = [
    ...left,
    ...Array(fillCount).fill("0"),
    ...right,
    ...ipv4TailGroups.map((group) => group.toString(16)),
  ];

  if (groups.length !== 8) return null;

  const parsed = groups.map((group) => Number.parseInt(group, 16));
  if (
    parsed.some((group) => Number.isNaN(group) || group < 0 || group > 0xffff)
  ) {
    return null;
  }

  return parsed;
}

function isPrivateIpv6(hostname: string): boolean {
  const groups = expandIpv6Address(hostname);
  if (!groups) return false;

  const isUnspecified = groups.every((group) => group === 0);
  if (isUnspecified) return true;

  const isLoopback =
    groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1;
  if (isLoopback) return true;

  const first = groups[0];
  if (
    first === 0 &&
    groups[1] === 0 &&
    groups[2] === 0 &&
    groups[3] === 0 &&
    groups[4] === 0 &&
    groups[5] === 0xffff
  ) {
    const mappedIpv4 = `${Math.floor(groups[6] / 256)}.${groups[6] % 256}.${Math.floor(groups[7] / 256)}.${groups[7] % 256}`;
    return isPrivateIpv4(mappedIpv4);
  }

  return (first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80;
}

function isPrivateHost(hostname: string): boolean {
  if (hostname === "localhost") return true;

  const host =
    hostname.startsWith("[") && hostname.endsWith("]")
      ? hostname.slice(1, -1)
      : hostname;

  const isIpv4Literal = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
  if (isIpv4Literal) return isPrivateIpv4(host);

  const isIpv6Literal = host.includes(":");
  if (isIpv6Literal) return isPrivateIpv6(host);

  return false;
}

export function validateScrapeUrl(url: string): URL {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (parsedUrl.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are allowed");
  }

  if (isPrivateHost(parsedUrl.hostname.toLowerCase())) {
    throw new Error("Private IP addresses are not allowed");
  }

  return parsedUrl;
}

export function extractTitleFromText(text: string): string | null {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const heading = lines.find((line) => line.startsWith("#"));
  if (heading) {
    return heading.replace(/^#+\s*/, "").trim() || null;
  }

  return lines[0] || null;
}

export async function scrapeWithJina(
  url: string,
  options: JinaScrapeOptions,
): Promise<ScrapeResult> {
  validateScrapeUrl(url);

  if (!options.apiKey) {
    throw new Error("JINA_API_KEY is required");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(options.endpoint ?? "https://r.jina.ai/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
      ...options.extraHeaders,
    },
    body: JSON.stringify({ url }),
    signal: AbortSignal.timeout(options.timeoutMs ?? 30000),
  });

  if (!response.ok) {
    throw new Error(
      `Jina fetch failed: ${response.status} ${response.statusText}`,
    );
  }

  const text = await response.text();
  const normalized = text.trim();

  return {
    title: extractTitleFromText(normalized),
    description: null,
    content: normalized || null,
  };
}
