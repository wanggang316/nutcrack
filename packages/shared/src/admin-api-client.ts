import { createRequester, type ApiClientConfig } from "./api-core";
import type {
  ActivityLogsResponse,
  AdminLinksQuery,
  AdminLinksResponse,
  AiSettings,
  ApiToken,
  ApiTokenCreateResponse,
  AuthUser,
  BatchIdsRequest,
  CategoriesResponse,
  Category,
  CheckInitResponse,
  CreateCategoryRequest,
  DashboardData,
  Link,
  LinkProcessingStreamEvent,
  LoginRequest,
  LoginResponse,
  SetupPasswordRequest,
  UpdateCategoryRequest,
  UpdateLinkRequest,
} from "./types";

export interface AdminApiClient {
  login(body: LoginRequest): Promise<LoginResponse>;
  setupPassword(body: SetupPasswordRequest): Promise<null>;
  getMe(): Promise<AuthUser>;
  checkInit(): Promise<CheckInitResponse>;
  getDashboard(): Promise<DashboardData>;
  getAiSettings(): Promise<AiSettings>;
  updateAiSettings(body: Partial<AiSettings>): Promise<AiSettings>;
  getCategories(): Promise<CategoriesResponse>;
  createCategory(body: CreateCategoryRequest): Promise<Category>;
  updateCategory(id: string, body: UpdateCategoryRequest): Promise<Category>;
  deleteCategory(id: string): Promise<null>;
  getTokens(): Promise<{ items: ApiToken[] }>;
  createToken(name: string): Promise<ApiTokenCreateResponse>;
  deleteToken(id: string): Promise<null>;
  disableToken(id: string): Promise<null>;
  enableToken(id: string): Promise<null>;
  getActivityLogs(query?: {
    page?: number;
    page_size?: number;
  }): Promise<ActivityLogsResponse>;
  getLinks(query?: AdminLinksQuery): Promise<AdminLinksResponse>;
  getPendingLinks(query?: {
    page?: number;
    page_size?: number;
  }): Promise<AdminLinksResponse>;
  getLink(id: string): Promise<Link>;
  createLink(url: string): Promise<Link>;
  updateLink(id: string, body: UpdateLinkRequest): Promise<Link>;
  publishLink(id: string): Promise<Link>;
  archiveLink(id: string): Promise<null>;
  deleteLink(id: string): Promise<null>;
  batchPublishLinks(ids: string[]): Promise<null>;
  batchDeleteLinks(ids: string[]): Promise<null>;
  reprocessLink(id: string): Promise<null>;
  createLinkStream(
    url: string,
    onEvent: (event: LinkProcessingStreamEvent) => void,
  ): Promise<void>;
}

export function createAdminApiClient(
  config: ApiClientConfig = {},
): AdminApiClient {
  const adminRequester = createRequester("/api/admin", config);
  const adminAuthRequester = createRequester("/api/admin/auth", config);

  return {
    login: (body) => adminAuthRequester.request("POST", "/login", body),
    setupPassword: (body) =>
      adminAuthRequester.request("POST", "/setup-password", body),
    getMe: () => adminAuthRequester.request("GET", "/me"),
    checkInit: () => adminAuthRequester.request("GET", "/check-init"),
    getDashboard: () => adminRequester.request("GET", "/dashboard"),
    getAiSettings: () => adminRequester.request("GET", "/settings/ai"),
    updateAiSettings: (body) =>
      adminRequester.request("PUT", "/settings/ai", body),
    getCategories: () => adminRequester.request("GET", "/categories"),
    createCategory: (body) =>
      adminRequester.request("POST", "/categories", body),
    updateCategory: (id, body) =>
      adminRequester.request("PATCH", `/categories/${id}`, body),
    deleteCategory: (id) =>
      adminRequester.request("DELETE", `/categories/${id}`),
    getTokens: () => adminRequester.request("GET", "/tokens"),
    createToken: (name) => adminRequester.request("POST", "/tokens", { name }),
    deleteToken: (id) => adminRequester.request("DELETE", `/tokens/${id}`),
    disableToken: (id) =>
      adminRequester.request("POST", `/tokens/${id}/disable`),
    enableToken: (id) => adminRequester.request("POST", `/tokens/${id}/enable`),
    getActivityLogs: (query) =>
      adminRequester.request("GET", "/activity-logs", undefined, { query }),
    getLinks: (query) =>
      adminRequester.request("GET", "/links", undefined, { query }),
    getPendingLinks: (query) =>
      adminRequester.request("GET", "/pending-links", undefined, { query }),
    getLink: (id) => adminRequester.request("GET", `/links/${id}`),
    createLink: (url) => adminRequester.request("POST", "/links", { url }),
    updateLink: (id, body) =>
      adminRequester.request("PATCH", `/links/${id}`, body),
    publishLink: (id) => adminRequester.request("POST", `/links/${id}/publish`),
    archiveLink: (id) => adminRequester.request("POST", `/links/${id}/archive`),
    deleteLink: (id) => adminRequester.request("DELETE", `/links/${id}`),
    batchPublishLinks: (ids) =>
      adminRequester.request("POST", "/links/batch/publish", {
        ids,
      } satisfies BatchIdsRequest),
    batchDeleteLinks: (ids) =>
      adminRequester.request("POST", "/links/batch/delete", {
        ids,
      } satisfies BatchIdsRequest),
    reprocessLink: (id) =>
      adminRequester.request("POST", `/links/${id}/reprocess`),
    createLinkStream: async (url, onEvent) => {
      const response = await adminRequester.rawRequest(
        "POST",
        "/links/stream",
        { url },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data) continue;
          onEvent(JSON.parse(data) as LinkProcessingStreamEvent);
        }
      }
    },
  };
}
