import type { ApiResponse } from "./types";

export interface ApiClientConfig {
  base_url?: string;
  fetch_impl?: typeof fetch;
  get_access_token?: () => string | null | undefined | Promise<string | null | undefined>;
  on_unauthorized?: () => void | Promise<void>;
  default_headers?: HeadersInit;
}

export interface ApiRequestOptions extends Omit<RequestInit, "body" | "method"> {
  query?: object;
}

export class ApiClientError extends Error {
  code?: string;
  status: number;
  details?: unknown;
  request_id?: string;

  constructor(
    message: string,
    options: {
      code?: string;
      status: number;
      details?: unknown;
      request_id?: string;
    },
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
    this.request_id = options.request_id;
  }
}

function joinUrl(baseUrl: string, prefix: string, path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${prefix}${normalizedPath}`;
}

function appendQuery(url: string, query?: ApiRequestOptions["query"]) {
  if (!query || Object.keys(query).length === 0) {
    return url;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

export function createRequester(prefix: string, config: ApiClientConfig = {}) {
  const baseUrl = (config.base_url ?? "").replace(/\/$/, "");
  const fetchImpl = config.fetch_impl ?? fetch;

  async function rawRequest(
    method: string,
    path: string,
    body?: unknown,
    options: ApiRequestOptions = {},
  ) {
    const token = await config.get_access_token?.();
    const headers = new Headers(config.default_headers);

    if (body !== undefined && !(body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (options.headers) {
      const requestHeaders = new Headers(options.headers);
      requestHeaders.forEach((value, key) => headers.set(key, value));
    }

    return fetchImpl(appendQuery(joinUrl(baseUrl, prefix, path), options.query), {
      ...options,
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  }

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    let response: Response;

    try {
      response = await rawRequest(method, path, body, options);
    } catch (error) {
      throw new ApiClientError("Unable to reach server", {
        status: 0,
        details: error,
      });
    }

    if (response.status === 204) {
      return null as T;
    }

    const responseText = await response.text();
    let json: ApiResponse<T> | null = null;

    if (responseText.trim()) {
      try {
        json = JSON.parse(responseText) as ApiResponse<T>;
      } catch {
        throw new ApiClientError(
          response.ok
            ? "Server returned an invalid response"
            : responseText || response.statusText || "Request failed",
          {
            status: response.status,
            details: responseText,
          },
        );
      }
    }

    if (response.status === 401) {
      await config.on_unauthorized?.();
    }

    if (!json) {
      throw new ApiClientError(
        response.ok
          ? "Server returned an empty response"
          : response.statusText || "Request failed",
        {
          status: response.status,
        },
      );
    }

    if (!response.ok || !json.success) {
      throw new ApiClientError(json.error?.message || "Request failed", {
        code: json.error?.code,
        status: response.status,
        details: json.error?.details,
        request_id: json.meta?.request_id,
      });
    }

    return json.data as T;
  }

  return {
    request,
    rawRequest,
  };
}
