import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadItemsFromFile, loadUrlsFromFile } from "../utils/files.js";

async function withTempFile(content: unknown) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "nutcrack-cli-"));
  const filePath = path.join(dir, "data.json");
  await fs.writeFile(filePath, JSON.stringify(content), "utf8");
  return {
    filePath,
    cleanup: async () => {
      await fs.rm(dir, { recursive: true, force: true });
    },
  };
}

test("loadUrlsFromFile supports object with urls", async () => {
  const temp = await withTempFile({ urls: ["https://a.com", "https://b.com"] });
  try {
    const urls = await loadUrlsFromFile(temp.filePath);
    assert.deepEqual(urls, ["https://a.com", "https://b.com"]);
  } finally {
    await temp.cleanup();
  }
});

test("loadItemsFromFile supports array payload", async () => {
  const temp = await withTempFile([
    {
      source: "x",
      url: "https://x.com/example/status/123",
      fetch_method: "scraper",
    },
  ]);
  try {
    const items = await loadItemsFromFile<{
      source: string;
      url: string;
    }>(temp.filePath);
    assert.equal(items.length, 1);
    assert.equal(items[0]?.source, "x");
    assert.equal(items[0]?.url, "https://x.com/example/status/123");
  } finally {
    await temp.cleanup();
  }
});

test("loadItemsFromFile supports object with items", async () => {
  const temp = await withTempFile({
    items: [
      {
        source: "rednote",
        url: "https://www.xiaohongshu.com/explore/abc",
        fetch_method: "agent",
      },
    ],
  });
  try {
    const items = await loadItemsFromFile<{
      source: string;
      url: string;
    }>(temp.filePath);
    assert.equal(items.length, 1);
    assert.equal(items[0]?.source, "rednote");
  } finally {
    await temp.cleanup();
  }
});
