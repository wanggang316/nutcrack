/**
 * Zod 验证 Schemas
 */

import { z } from "zod";

// 链接相关验证
export const createLinkSchema = z.object({
  url: z.string().url("Invalid URL"),
  title: z.string().min(1).max(200).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});

export const updateLinkSchema = z.object({
  url: z.string().url().optional(),
  title: z.string().min(1).max(200).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["pending", "active", "archived"]).optional(),
  processing_status: z
    .enum(["queued", "processing", "completed", "failed"])
    .optional(),
});

// Token 相关验证
export const createTokenSchema = z.object({
  name: z.string().min(1).max(100),
});

// Category 相关验证
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  sort_order: z.number().int().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// 设置相关验证
export const updateSettingsSchema = z.object({
  ai_enabled: z.boolean().optional(),
  ai_model: z.string().optional(),
  ai_prompt: z.string().optional(),
  max_links: z.number().int().positive().optional(),
});
