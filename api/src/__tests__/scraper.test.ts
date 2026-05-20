import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  scrapeLinkHtmlWithJina,
  scrapeLinkWithJina,
} from "../services/link-scrape.js";

describe("scrapeLinkWithJina", () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.JINA_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.JINA_API_KEY = "jina-secret";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.JINA_API_KEY = originalApiKey;
  });

  it("posts to jina and extracts the title from markdown content", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "# InboxLM\n\nBody content",
    }) as typeof fetch;

    const result = await scrapeLinkWithJina("https://example.com/post");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://r.jina.ai/",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer jina-secret",
          "Content-Type": "application/json",
        }),
      }),
    );
    expect(result).toEqual({
      title: "InboxLM",
      description: null,
      content: "# InboxLM\n\nBody content",
    });
  });

  it("requests html from jina when html mode is used", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        "<html><head><title>InboxLM</title></head><body><article>Body</article></body></html>",
    }) as typeof fetch;

    const result = await scrapeLinkHtmlWithJina("https://example.com/post");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://r.jina.ai/",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jina-secret",
          "Content-Type": "application/json",
          "X-Return-Format": "html",
        }),
      }),
    );
    expect(result.content).toContain("<article>Body</article>");
  });

  it("throws when JINA_API_KEY is missing", async () => {
    delete process.env.JINA_API_KEY;

    await expect(
      scrapeLinkWithJina("https://example.com/post"),
    ).rejects.toThrow("JINA_API_KEY is required");
  });

  it("throws when jina returns a non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
    }) as typeof fetch;

    await expect(
      scrapeLinkWithJina("https://example.com/post"),
    ).rejects.toThrow("Jina fetch failed: 502 Bad Gateway");
  });
});
