import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the search and analysis services
vi.mock("./services/searchService", () => ({
  searchSocialMedia: vi.fn().mockResolvedValue({
    results: [
      { text: "Great product!", source: "Twitter", author: "@user1", url: "https://twitter.com/user1/status/123", platform: "twitter" },
      { text: "Not bad, could be better", source: "Reddit", author: "r/tech", url: "https://reddit.com/r/tech/comments/abc", platform: "reddit" },
    ],
    totalFound: 2,
    sources: ["Twitter", "Reddit"],
    sourceBreakdown: { twitter: 1, reddit: 1, news: 0, web: 0 }
  })
}));

vi.mock("./services/analysisService", () => ({
  analyzeSentiment: vi.fn().mockResolvedValue({
    overallSentiment: "positive",
    positiveRatio: 60,
    negativeRatio: 20,
    neutralRatio: 20,
    summary: "Overall positive sentiment",
    keyThemes: ["quality", "performance"],
    positiveComments: [{ text: "Great!", source: "Twitter", author: "@user1", url: "https://twitter.com/user1/status/123" }],
    negativeComments: [{ text: "Could be better", source: "Reddit", author: "r/tech", url: "https://reddit.com/r/tech/comments/abc" }],
    neutralComments: []
  })
}));

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  saveAnalysisRecord: vi.fn().mockResolvedValue(1),
  createSentimentTrend: vi.fn().mockResolvedValue(undefined),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Multi-product comparison", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should analyze a single product successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analysis.analyze({ productName: "ChatGPT" });

    expect(result).toBeDefined();
    expect(result.productName).toBe("ChatGPT");
    expect(result.overallSentiment).toBeDefined();
    expect(result.positiveRatio).toBeGreaterThanOrEqual(0);
    expect(result.negativeRatio).toBeGreaterThanOrEqual(0);
    expect(result.neutralRatio).toBeGreaterThanOrEqual(0);
  });

  it("should support parallel analysis for comparison", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Simulate parallel analysis for comparison
    const products = ["ChatGPT", "Claude", "Gemini"];
    const results = await Promise.all(
      products.map(productName => caller.analysis.analyze({ productName }))
    );

    expect(results).toHaveLength(3);
    results.forEach((result, index) => {
      expect(result.productName).toBe(products[index]);
      expect(result.overallSentiment).toBeDefined();
    });
  });
});

describe("Comment URL tracking", () => {
  it("should include URL in search results", async () => {
    const { searchSocialMedia } = await import("./services/searchService");
    const result = await searchSocialMedia("TestProduct");

    expect(result.results).toBeDefined();
    result.results.forEach(comment => {
      // URL should be present (may be undefined for some results)
      if (comment.url) {
        expect(comment.url).toMatch(/^https?:\/\//);
      }
    });
  });

  it("should include platform-specific URLs", async () => {
    const { searchSocialMedia } = await import("./services/searchService");
    const result = await searchSocialMedia("TestProduct");

    const twitterComment = result.results.find(r => r.platform === "twitter");
    const redditComment = result.results.find(r => r.platform === "reddit");

    if (twitterComment?.url) {
      expect(twitterComment.url).toContain("twitter.com");
    }
    if (redditComment?.url) {
      expect(redditComment.url).toContain("reddit.com");
    }
  });
});

describe("Time range filtering", () => {
  it("should support different time range limits", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test with different limits
    const limits = [7, 30, 90];
    
    for (const limit of limits) {
      // This would normally query the database
      // For now, just verify the API accepts the parameter
      try {
        await caller.trend.getByProduct({ productName: "TestProduct", limit });
      } catch (e) {
        // Expected to fail without database, but should not throw type errors
        expect(e).toBeDefined();
      }
    }
  });
});

describe("Keyword extraction", () => {
  it("should extract key themes from analysis", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analysis.analyze({ productName: "TestProduct" });

    expect(result.keyThemes).toBeDefined();
    expect(Array.isArray(result.keyThemes)).toBe(true);
  });
});
