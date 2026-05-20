import {
  scrapeWithJina,
  validateScrapeUrl,
  type ScrapeResult,
} from "@nutcrack/scrape";

export { validateScrapeUrl };

export async function scrapeLinkWithJina(url: string): Promise<ScrapeResult> {
  return scrapeWithJina(url, {
    apiKey: process.env.JINA_API_KEY || "",
  });
}

export async function scrapeLinkHtmlWithJina(
  url: string,
): Promise<ScrapeResult> {
  return scrapeWithJina(url, {
    apiKey: process.env.JINA_API_KEY || "",
    extraHeaders: {
      "X-Return-Format": "html",
    },
  });
}
