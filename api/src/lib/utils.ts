import { v4 as uuidv4 } from "uuid";
import type { ApiResponse, ApiError, ErrorCode } from "@nutcrack/shared";

export function generateRequestId(): string {
  return `req_${uuidv4().slice(0, 12)}`;
}

export function successResponse<T>(
  data: T,
  requestId?: string,
): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    meta: { request_id: requestId || generateRequestId() },
  };
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown,
  requestId?: string,
): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error: { code, message, details } as ApiError,
    meta: { request_id: requestId || generateRequestId() },
  };
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function parseCorsOrigins(value: string | undefined): string | string[] {
  const origins = (value || "*")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (origins.length <= 1) {
    return origins[0] || "*";
  }

  return origins;
}

export function generateSlug(name: string): string {
  const pinyinMap: Record<string, string> = {
    产品: "product",
    技术: "tech",
    开发: "dev",
    工具: "tool",
    其他: "other",
    设计: "design",
    收藏: "favorite",
    教程: "tutorial",
    资讯: "news",
  };
  if (pinyinMap[name]) return pinyinMap[name];
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-|-$/g, "") || `cat-${Date.now()}`
  );
}

export function generateApiToken(): { token: string; prefix: string } {
  const randomPart = `${crypto.randomUUID().replace(/-/g, "")}${crypto
    .randomUUID()
    .replace(/-/g, "")}`.slice(0, 40);
  const token = `nut_${randomPart}`;
  return { token, prefix: token.slice(0, 8) };
}

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
