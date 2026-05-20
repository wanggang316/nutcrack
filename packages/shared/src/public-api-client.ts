import { createRequester, type ApiClientConfig } from "./api-core";
import type {
  CategoriesResponse,
  LinksQuery,
  PublicLinksResponse,
} from "./types";

export interface PublicApiClient {
  getLinks(query?: LinksQuery): Promise<PublicLinksResponse>;
  getCategories(): Promise<CategoriesResponse>;
}

export function createPublicApiClient(
  config: ApiClientConfig = {},
): PublicApiClient {
  const requester = createRequester("/api", config);

  return {
    getLinks: (query) =>
      requester.request("GET", "/links", undefined, { query }),
    getCategories: () => requester.request("GET", "/categories"),
  };
}
