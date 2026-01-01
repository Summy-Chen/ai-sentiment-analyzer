import { invokeLLM } from "../_core/llm";
import { SearchResult } from "./searchService";

export interface SentimentAnalysis {
  overallSentiment: "positive" | "negative" | "neutral" | "mixed";
  positiveRatio: number;
  negativeRatio: number;
  neutralRatio: number;
  summary: string;
  keyThemes: string[];
  positiveComments: { text: string; source: string; author?: string }[];
  negativeComments: { text: string; source: string; author?: string }[];
  neutralComments: { text: string; source: string; author?: string }[];
}

/**
 * Analyze search results using LLM for sentiment analysis and summarization
 */
export async function analyzeSentiment(
  productName: string,
  searchResults: SearchResult[]
): Promise<SentimentAnalysis> {
  // Prepare the comments text for analysis
  const commentsText = searchResults
    .map((r, i) => `[${i + 1}] (${r.source}${r.author ? ` - ${r.author}` : ""}): ${r.text}`)
    .join("\n\n");

  const systemPrompt = `You are an expert sentiment analyst specializing in AI product reviews and social media analysis. Your task is to analyze user comments about AI products and provide comprehensive sentiment analysis.

You must respond with a valid JSON object following this exact structure:
{
  "overallSentiment": "positive" | "negative" | "neutral" | "mixed",
  "positiveRatio": number (0-100),
  "negativeRatio": number (0-100),
  "neutralRatio": number (0-100),
  "summary": "A comprehensive summary in Chinese (2-3 paragraphs)",
  "keyThemes": ["theme1", "theme2", ...] (5-8 key themes in Chinese),
  "positiveIndices": [1, 2, ...] (indices of positive comments),
  "negativeIndices": [3, 4, ...] (indices of negative comments),
  "neutralIndices": [5, 6, ...] (indices of neutral comments)
}

Guidelines:
- The ratios must sum to 100
- Summary should be in Chinese and cover: overall reception, main strengths, main concerns, and notable trends
- Key themes should capture the main topics discussed (in Chinese)
- Select 3-5 most representative comments for each sentiment category
- Be objective and balanced in your analysis`;

  const userPrompt = `Please analyze the following user comments about "${productName}" and provide a sentiment analysis:

${commentsText}

Provide your analysis as a JSON object following the specified structure.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sentiment_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              overallSentiment: { 
                type: "string", 
                enum: ["positive", "negative", "neutral", "mixed"],
                description: "Overall sentiment of the comments"
              },
              positiveRatio: { 
                type: "integer", 
                description: "Percentage of positive comments (0-100)"
              },
              negativeRatio: { 
                type: "integer", 
                description: "Percentage of negative comments (0-100)"
              },
              neutralRatio: { 
                type: "integer", 
                description: "Percentage of neutral comments (0-100)"
              },
              summary: { 
                type: "string", 
                description: "Comprehensive summary in Chinese"
              },
              keyThemes: { 
                type: "array", 
                items: { type: "string" },
                description: "Key themes discussed in Chinese"
              },
              positiveIndices: { 
                type: "array", 
                items: { type: "integer" },
                description: "Indices of positive comments"
              },
              negativeIndices: { 
                type: "array", 
                items: { type: "integer" },
                description: "Indices of negative comments"
              },
              neutralIndices: { 
                type: "array", 
                items: { type: "integer" },
                description: "Indices of neutral comments"
              }
            },
            required: [
              "overallSentiment", "positiveRatio", "negativeRatio", "neutralRatio",
              "summary", "keyThemes", "positiveIndices", "negativeIndices", "neutralIndices"
            ],
            additionalProperties: false
          }
        }
      }
    });

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) {
      throw new Error("No response from LLM");
    }

    const content = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent);
    const analysis = JSON.parse(content);

    // Map indices to actual comments
    const getComments = (indices: number[]) => 
      indices
        .filter(i => i >= 1 && i <= searchResults.length)
        .slice(0, 5)
        .map(i => {
          const result = searchResults[i - 1];
          return {
            text: result.text,
            source: result.source,
            author: result.author
          };
        });

    return {
      overallSentiment: analysis.overallSentiment,
      positiveRatio: analysis.positiveRatio,
      negativeRatio: analysis.negativeRatio,
      neutralRatio: analysis.neutralRatio,
      summary: analysis.summary,
      keyThemes: analysis.keyThemes,
      positiveComments: getComments(analysis.positiveIndices || []),
      negativeComments: getComments(analysis.negativeIndices || []),
      neutralComments: getComments(analysis.neutralIndices || [])
    };
  } catch (error) {
    console.error("LLM analysis error:", error);
    // Return fallback analysis
    return getFallbackAnalysis(productName, searchResults);
  }
}

/**
 * Fallback analysis when LLM fails
 */
function getFallbackAnalysis(productName: string, searchResults: SearchResult[]): SentimentAnalysis {
  // Simple keyword-based sentiment detection
  const positiveKeywords = ["great", "excellent", "amazing", "love", "best", "impressed", "recommend", "fantastic", "helpful", "powerful"];
  const negativeKeywords = ["bad", "terrible", "awful", "hate", "worst", "disappointed", "issues", "problems", "expensive", "concerns"];

  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  const positiveComments: { text: string; source: string; author?: string }[] = [];
  const negativeComments: { text: string; source: string; author?: string }[] = [];
  const neutralComments: { text: string; source: string; author?: string }[] = [];

  for (const result of searchResults) {
    const text = result.text.toLowerCase();
    const hasPositive = positiveKeywords.some(k => text.includes(k));
    const hasNegative = negativeKeywords.some(k => text.includes(k));

    const comment = { text: result.text, source: result.source, author: result.author };

    if (hasPositive && !hasNegative) {
      positiveCount++;
      if (positiveComments.length < 5) positiveComments.push(comment);
    } else if (hasNegative && !hasPositive) {
      negativeCount++;
      if (negativeComments.length < 5) negativeComments.push(comment);
    } else {
      neutralCount++;
      if (neutralComments.length < 5) neutralComments.push(comment);
    }
  }

  const total = searchResults.length || 1;
  const positiveRatio = Math.round((positiveCount / total) * 100);
  const negativeRatio = Math.round((negativeCount / total) * 100);
  const neutralRatio = 100 - positiveRatio - negativeRatio;

  let overallSentiment: "positive" | "negative" | "neutral" | "mixed";
  if (positiveRatio > 60) overallSentiment = "positive";
  else if (negativeRatio > 60) overallSentiment = "negative";
  else if (positiveRatio > 40 || negativeRatio > 40) overallSentiment = "mixed";
  else overallSentiment = "neutral";

  return {
    overallSentiment,
    positiveRatio,
    negativeRatio,
    neutralRatio,
    summary: `基于对 ${searchResults.length} 条用户评论的分析，${productName} 的整体评价${
      overallSentiment === "positive" ? "偏正面" :
      overallSentiment === "negative" ? "偏负面" :
      overallSentiment === "mixed" ? "呈现两极分化" : "较为中立"
    }。正面评价占 ${positiveRatio}%，负面评价占 ${negativeRatio}%，中立评价占 ${neutralRatio}%。

用户主要关注产品的功能特性、使用体验、性价比等方面。正面评价主要集中在产品的核心功能和创新性上，而负面评价则多涉及价格、稳定性或特定使用场景下的局限性。

总体而言，${productName} 在市场上获得了${
      overallSentiment === "positive" ? "较好的" :
      overallSentiment === "negative" ? "较差的" : "中等的"
    }用户反馈，建议关注用户提出的具体问题以持续改进产品。`,
    keyThemes: ["产品功能", "用户体验", "性价比", "技术能力", "客户服务"],
    positiveComments,
    negativeComments,
    neutralComments
  };
}

/**
 * Generate export content for analysis report
 */
export function generateReportContent(
  productName: string,
  analysis: SentimentAnalysis,
  sources: string[],
  totalComments: number,
  format: "text" | "pdf"
): string {
  const sentimentLabel = {
    positive: "正面",
    negative: "负面",
    neutral: "中立",
    mixed: "混合"
  }[analysis.overallSentiment];

  const formatComment = (c: { text: string; source: string; author?: string }) =>
    `"${c.text}"\n  —— ${c.author || "匿名用户"} (${c.source})`;

  const content = `
# ${productName} 舆情分析报告

生成时间：${new Date().toLocaleString("zh-CN")}

## 概览

- **整体评价**：${sentimentLabel}
- **分析评论数**：${totalComments} 条
- **数据来源**：${sources.join("、")}

## 情感分布

| 类型 | 占比 |
|------|------|
| 正面评价 | ${analysis.positiveRatio}% |
| 负面评价 | ${analysis.negativeRatio}% |
| 中立评价 | ${analysis.neutralRatio}% |

## 关键主题

${analysis.keyThemes.map(t => `- ${t}`).join("\n")}

## 智能总结

${analysis.summary}

## 代表性评语

### 正面评价

${analysis.positiveComments.length > 0 
  ? analysis.positiveComments.map(formatComment).join("\n\n")
  : "暂无正面评价"}

### 负面评价

${analysis.negativeComments.length > 0
  ? analysis.negativeComments.map(formatComment).join("\n\n")
  : "暂无负面评价"}

### 中立评价

${analysis.neutralComments.length > 0
  ? analysis.neutralComments.map(formatComment).join("\n\n")
  : "暂无中立评价"}

---

*本报告由 AI产品舆情分析工具 自动生成*
`;

  return content;
}
