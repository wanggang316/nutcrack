declare module "@nutcrack/scrape" {
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

  export function validateScrapeUrl(url: string): URL;
  export function extractTitleFromText(text: string): string | null;
  export function scrapeWithJina(
    url: string,
    options: JinaScrapeOptions,
  ): Promise<ScrapeResult>;
}
