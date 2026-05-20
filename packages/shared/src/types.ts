// ========== Enums ==========

export const LinkStatus = {
  PENDING: "pending",
  PUBLISHED: "published",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;
export type LinkStatus = (typeof LinkStatus)[keyof typeof LinkStatus];

export const ProcessingStatus = {
  QUEUED: "queued",
  FETCHING: "fetching",
  ANALYZING: "analyzing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;
export type ProcessingStatus =
  (typeof ProcessingStatus)[keyof typeof ProcessingStatus];

export const TokenStatus = {
  ACTIVE: "active",
  DISABLED: "disabled",
  EXPIRED: "expired",
} as const;
export type TokenStatus = (typeof TokenStatus)[keyof typeof TokenStatus];

export const ActivityStatus = {
  SUCCESS: "success",
  FAILED: "failed",
  PENDING: "pending",
} as const;
export type ActivityStatus =
  (typeof ActivityStatus)[keyof typeof ActivityStatus];

export const ErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  INVALID_EMAIL: "INVALID_EMAIL",
  RATE_LIMITED: "RATE_LIMITED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_DISABLED: "TOKEN_DISABLED",
  AI_CONFIG_MISSING: "AI_CONFIG_MISSING",
  SCRAPE_FAILED: "SCRAPE_FAILED",
  AI_ANALYSIS_FAILED: "AI_ANALYSIS_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ========== API Response ==========

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: ApiMeta;
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export interface ApiMeta {
  request_id: string;
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

// ========== Link ==========

export interface Link {
  id: string;
  url: string;
  original_title: string | null;
  original_description: string | null;
  original_content: string | null;
  title: string | null;
  summary: string | null;
  key_points: string[];
  category: string | null;
  tags: string[];
  ai_title: string | null;
  ai_summary: string | null;
  ai_key_points: string[];
  ai_category: string | null;
  ai_tags: string[];
  status: LinkStatus;
  processing_status: ProcessingStatus;
  process_error: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface PublicLink {
  id: string;
  url: string;
  title: string | null;
  summary: string | null;
  key_points: string[];
  category: string | null;
  tags: string[];
  domain: string;
  published_at: string | null;
}

export interface ExternalLinkListItem {
  id: string;
  url: string;
  status: LinkStatus;
  processing_status: ProcessingStatus;
  title: string | null;
  summary: string | null;
  key_points: string[];
  category: string | null;
  tags: string[];
  domain: string;
  created_at: string;
  published_at: string | null;
}

// ========== Category ==========

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  link_count?: number;
  created_at: string;
  updated_at: string;
}

// ========== API Token ==========

export interface ApiToken {
  id: string;
  prefix: string;
  name: string;
  status: TokenStatus;
  permissions: string[];
  usage_count: number;
  last_used_at: string | null;
  last_used_ip: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
}

export interface ApiTokenCreateResponse {
  token: ApiToken;
  raw_token: string;
}

// ========== Settings ==========

export interface AiSettings {
  ai_api_base_url: string;
  ai_api_key: string;
  ai_model: string;
  ai_temperature: number;
}

// ========== Activity Log ==========

export interface ActivityLog {
  id: string;
  action: string;
  resource: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  status: ActivityStatus;
  error_message: string | null;
  user_agent: string | null;
  ip: string | null;
  token_id: string | null;
  user_id: string | null;
  duration: number | null;
  created_at: string;
}

// ========== Dashboard ==========

export interface DashboardData {
  total_links: number;
  pending_links: number;
  published_links: number;
  archived_links: number;
  this_week_count: number;
  this_month_count: number;
  category_count: number;
  tag_count: number;
  recent_activities: ActivityLog[];
}

// ========== Aggregation ==========

export interface TagCount {
  name: string;
  count: number;
}

export interface CategoryCount {
  id: string;
  count: number;
}

// ========== Request Types ==========

export interface LinksQuery {
  page?: number;
  page_size?: number;
  q?: string;
  category?: string;
  tags?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface AdminLinksQuery extends LinksQuery {
  status?: LinkStatus;
  processing_status?: ProcessingStatus;
}

export interface CreateLinkRequest {
  url: string;
}

export interface UpdateLinkRequest {
  title?: string;
  summary?: string;
  key_points?: string[];
  category?: string;
  tags?: string[];
}

export interface BatchIdsRequest {
  ids: string[];
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  icon?: string;
  sort_order?: number;
}

export interface CreateTokenRequest {
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SetupPasswordRequest {
  email: string;
  password: string;
}

export interface ExternalCreateLinkRequest {
  url: string;
}

export interface ExternalBatchCreateLinkRequest {
  urls: string[];
}

// ========== Response Types ==========

export interface PublicLinksResponse {
  items: PublicLink[];
  tags: TagCount[];
  categories: CategoryCount[];
  pagination: Pagination;
}

export interface AdminLinksResponse {
  items: Link[];
  pagination: Pagination;
}

export interface CategoriesResponse {
  items: Category[];
}

export interface ActivityLogsResponse {
  items: ActivityLog[];
  pagination: Pagination;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export interface CheckInitResponse {
  initialized: boolean;
}

export interface VerifyTokenResponse {
  valid: boolean;
  token_name?: string;
  permissions?: string[];
  expires_at?: string | null;
}

export interface ExternalLinksResponse {
  items: ExternalLinkListItem[];
  tags: TagCount[];
  categories: CategoryCount[];
  pagination: Pagination;
}

export interface DownloadItem {
  id: string;
  name: string;
  description: string;
  type: string;
  status: "available" | "coming_soon";
  download_url: string | null;
}

// ========== SSE Stream Types ==========

export interface LinkProcessingStreamEvent {
  type: "queued" | "fetching" | "analyzing" | "completed" | "failed";
  link_id: string;
  message?: string;
  data?: {
    url?: string;
    title?: string;
    summary?: string;
    key_points?: string[];
    category?: string;
    tags?: string[];
    error?: string;
  };
}
