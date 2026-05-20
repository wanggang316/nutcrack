import type { Link } from "@nutcrack/shared";

export type ManualLinkFields = {
  title: string;
  summary: string;
  category: string;
  tags: string[];
};

export function getAiSuggestedManualFields(
  link: Pick<Link, "ai_title" | "ai_summary" | "ai_category" | "ai_tags">,
): ManualLinkFields {
  return {
    title: link.ai_title || "",
    summary: link.ai_summary || "",
    category: link.ai_category || "",
    tags: link.ai_tags || [],
  };
}

export function getCurrentManualFields(
  link: Pick<Link, "title" | "summary" | "category" | "tags">,
): ManualLinkFields {
  return {
    title: link.title || "",
    summary: link.summary || "",
    category: link.category || "",
    tags: link.tags || [],
  };
}

export function areManualFieldsEmpty(fields: ManualLinkFields) {
  return (
    !fields.title.trim() &&
    !fields.summary.trim() &&
    !fields.category.trim() &&
    fields.tags.length === 0
  );
}

export function getManualFieldValidation(fields: ManualLinkFields) {
  const missing: string[] = [];

  if (!fields.title.trim()) missing.push("标题");
  if (!fields.summary.trim()) missing.push("摘要");
  if (!fields.category.trim()) missing.push("分类");
  if (fields.tags.length === 0) missing.push("标签");

  return {
    isValid: missing.length === 0,
    missing,
  };
}

export function getManualFieldValidationMessage(fields: ManualLinkFields) {
  const { isValid, missing } = getManualFieldValidation(fields);
  if (isValid) return null;
  return `请先补全${missing.join("、")}`;
}
