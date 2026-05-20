import { generateJson, normalizeNullableString } from "@nutcrack/ai";
import type { AiSettings } from "@nutcrack/shared";

export interface LinkAiAnalysisResult {
  ai_title: string;
  ai_summary: string;
  ai_key_points: string[];
  ai_category: string;
  ai_tags: string[];
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeNullableString(item))
    .filter((item): item is string => Boolean(item));
}

export async function analyzeLinkContent(
  settings: AiSettings,
  url: string,
  title: string | null,
  content: string | null,
  description: string | null,
  categories: string[],
): Promise<LinkAiAnalysisResult> {
  const contentSnippet = content?.slice(0, 10000) || "无";
  const normalizedCategories =
    categories.length > 0 ? categories.join("、") : "其他";

  const prompt = `你是一个专业的内容分析助手，可以阅读并理解网络内容，包括博客文章，各类新闻，视频，PDF或图片等。请分析以下网页内容并返回JSON格式的结构化摘要。

**重要：你必须严格按照以下JSON格式返回结果，不要添加任何其他文本、解释或格式：**

{
  "title": "根据输入的标题，生成简洁明确的中文新标题；如果输入标题合理，可以直接使用或翻译使用，否则基于内容生成",
  "summary": "简洁明了的3-4句话摘要，除非指定了其他语言，否则使用中文",
  "category": "从以下分类中选择最合适的一个：${normalizedCategories}",
  "tags": ["中文的3-5个相关标签的字符串数组"],
  "language": "检测到的语言代码(zh, en, ja等)",
  "sentiment": "positive, neutral, 或 negative"
}

**分析要求：**
- 摘要要简洁且信息丰富，突出核心观点，可以带有一些戏谑性或者吸引人的幽默表达。如果用户有特殊要求，可以遵循
- 严格从给定的分类列表中选择最合适的一个分类
- 标签应该具体且相关，有助于内容检索
- 准确检测内容的主要语言

**请只返回JSON对象，不要包含任何其他文本。**

以下是内容信息：
- URL: ${url}
- 标题: ${title || "无"}
- 原始描述: ${description || "无"}
- 主要内容: ${contentSnippet}`;

  return generateJson(
    {
      baseUrl: settings.ai_api_base_url,
      apiKey: settings.ai_api_key,
      model: settings.ai_model,
      temperature: settings.ai_temperature,
    },
    {
      prompt,
      parse: (value: unknown) => {
        const result = value as Record<string, unknown>;
        const parsedTitle =
          normalizeNullableString(result.title) ||
          normalizeNullableString(result.ai_title);
        const parsedSummary =
          normalizeNullableString(result.summary) ||
          normalizeNullableString(result.ai_summary);
        const parsedCategory =
          normalizeNullableString(result.category) ||
          normalizeNullableString(result.ai_category);
        const parsedTags =
          normalizeStringArray(result.tags).length > 0
            ? normalizeStringArray(result.tags)
            : normalizeStringArray(result.ai_tags);
        const parsedKeyPoints = normalizeStringArray(result.ai_key_points);

        return {
          ai_title: parsedTitle || title || "",
          ai_summary: parsedSummary || "",
          ai_key_points: parsedKeyPoints,
          ai_category: parsedCategory || "其他",
          ai_tags: parsedTags,
        };
      },
    },
  );
}
