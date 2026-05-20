import { describe, it, expect } from "vitest";
import {
  generateRequestId,
  successResponse,
  errorResponse,
  extractDomain,
  parseCorsOrigins,
  generateSlug,
  generateApiToken,
  hashToken,
} from "../lib/utils.js";

describe("generateRequestId", () => {
  it("should generate a request ID starting with req_", () => {
    const id = generateRequestId();
    expect(id).toMatch(/^req_[a-f0-9-]+$/);
  });

  it("should generate unique IDs", () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();
    expect(id1).not.toBe(id2);
  });
});

describe("successResponse", () => {
  it("should return a success response", () => {
    const res = successResponse({ foo: "bar" });
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ foo: "bar" });
    expect(res.error).toBeNull();
    expect(res.meta.request_id).toBeTruthy();
  });
});

describe("errorResponse", () => {
  it("should return an error response", () => {
    const res = errorResponse("NOT_FOUND", "Resource not found");
    expect(res.success).toBe(false);
    expect(res.data).toBeNull();
    expect(res.error?.code).toBe("NOT_FOUND");
    expect(res.error?.message).toBe("Resource not found");
  });

  it("should include details when provided", () => {
    const res = errorResponse("VALIDATION_ERROR", "Bad input", {
      field: "url",
    });
    expect(res.error?.details).toEqual({ field: "url" });
  });
});

describe("extractDomain", () => {
  it("should extract domain from a URL", () => {
    expect(extractDomain("https://example.com/path")).toBe("example.com");
    expect(extractDomain("https://sub.example.com/page")).toBe(
      "sub.example.com",
    );
  });

  it("should return the input for invalid URLs", () => {
    expect(extractDomain("not-a-url")).toBe("not-a-url");
  });
});

describe("parseCorsOrigins", () => {
  it("should default to wildcard when unset", () => {
    expect(parseCorsOrigins(undefined)).toBe("*");
  });

  it("should keep a single origin as a string", () => {
    expect(parseCorsOrigins("https://links.example.com")).toBe(
      "https://links.example.com",
    );
  });

  it("should split comma separated origins", () => {
    expect(
      parseCorsOrigins(
        "https://links.example.com, https://translate.example.com",
      ),
    ).toEqual(["https://links.example.com", "https://translate.example.com"]);
  });
});

describe("generateSlug", () => {
  it("should return predefined slugs for known Chinese names", () => {
    expect(generateSlug("产品")).toBe("product");
    expect(generateSlug("技术")).toBe("tech");
    expect(generateSlug("开发")).toBe("dev");
    expect(generateSlug("工具")).toBe("tool");
    expect(generateSlug("其他")).toBe("other");
  });

  it("should generate slugs for English names", () => {
    expect(generateSlug("Technology")).toBe("technology");
    expect(generateSlug("My Category")).toBe("my-category");
  });
});

describe("generateApiToken", () => {
  it("should generate a token starting with nut_", () => {
    const { token, prefix } = generateApiToken();
    expect(token).toMatch(/^nut_/);
    expect(token.length).toBe(44);
    expect(prefix).toBe(token.slice(0, 8));
  });
});

describe("hashToken", () => {
  it("should produce a consistent hash", async () => {
    const hash1 = await hashToken("test-token");
    const hash2 = await hashToken("test-token");
    expect(hash1).toBe(hash2);
  });

  it("should produce different hashes for different inputs", async () => {
    const hash1 = await hashToken("token-a");
    const hash2 = await hashToken("token-b");
    expect(hash1).not.toBe(hash2);
  });

  it("should produce a hex string", async () => {
    const hash = await hashToken("test");
    expect(hash).toMatch(/^[a-f0-9]+$/);
    expect(hash.length).toBe(64);
  });
});
