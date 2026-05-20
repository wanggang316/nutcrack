import { createRequester, type ApiClientConfig } from "./api-core";
import type {
  ExternalBatchCreateLinkRequest,
  ExternalLinksResponse,
  ExternalCreateLinkRequest,
  Link,
  VerifyTokenResponse,
  AdminLinksQuery,
} from "./types";

export interface AuthApiClient {
  verifyToken(): Promise<VerifyTokenResponse>;
  createLink(
    body: ExternalCreateLinkRequest,
  ): Promise<Pick<Link, "id" | "url" | "status" | "processing_status" | "created_at">>;
  createLinksBatch(body: ExternalBatchCreateLinkRequest): Promise<{
    items: Array<{
      url: string;
      success?: boolean;
      id?: string | null;
      status?: string;
      processing_status?: string;
      error?: { code?: string; message: string };
    }>;
  }>;
  getLinks(query?: AdminLinksQuery): Promise<ExternalLinksResponse>;
  getLink(
    id: string,
  ): Promise<Partial<Link> & Pick<Link, "id" | "url" | "status" | "processing_status">>;
}

export function createAuthApiClient(
  config: ApiClientConfig = {},
): AuthApiClient {
  const requester = createRequester("/api/auth", config);

  return {
    verifyToken: () => requester.request("POST", "/tokens/verify"),
    createLink: (body) => requester.request("POST", "/links", body),
    createLinksBatch: (body) => requester.request("POST", "/links/batch", body),
    getLinks: (query) => requester.request("GET", "/links", undefined, { query }),
    getLink: (id) => requester.request("GET", `/links/${id}`),
  };
}
