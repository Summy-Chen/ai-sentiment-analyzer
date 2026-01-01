import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the search and analysis services
vi.mock("./services/searchService", () => ({
  searchSocialMedia: vi.fn().mockResolvedValue({
    results: [
      { text: "Great product, love using it!", source: "Twitter", author: "@user1" },
      { text: "Has some issues but overall good", source: "Reddit", author: "redditor1" },
      { text: "Not worth the price", source: "Twitter", author: "@user2" },
      { text: "Amazing AI capabilities", source: "Reddit", author: "redditor2" },
      { text: "Average experience, nothing special", source: "Twitter", author: "@user3" }
    ],
    totalFound: 5,
    sources: ["Twitter", "Reddit"]
  })
}));

vi.mock("./services/analysisService", () => ({
  analyzeSentiment: vi.fn().mockResolvedValue({
    overallSentiment: "mixed",
    positiveRatio: 40,
    negativeRatio: 20,
    neutralRatio: 40,
    summary: "Test summary for the product analysis",
    keyThemes: ["功能", "价格", "体验"],
    positiveComments: [
      { text: "Great product, love using it!", source: "Twitter", author: "@user1" }
    ],
    negativeComments: [
      { text: "Not worth the price", source: "Twitter", author: "@user2" }
    ],
    neutralComments: [
      { text: "Average experience, nothing special", source: "Twitter", author: "@user3" }
    ]
  }),
  generateReportContent: vi.fn().mockReturnValue("# Test Report\n\nThis is a test report content.")
}));

// Mock database functions
vi.mock("./db", () => ({
  createAnalysisRecord: vi.fn().mockResolvedValue(1),
  getAnalysisRecordsByUserId: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      productName: "TestProduct",
      overallSentiment: "positive",
      positiveRatio: 60,
      negativeRatio: 20,
      neutralRatio: 20,
      summary: "Test summary",
      keyThemes: ["功能", "体验"],
      positiveComments: [],
      negativeComments: [],
      neutralComments: [],
      totalCommentsAnalyzed: 10,
      sources: ["Twitter"],
      createdAt: new Date()
    }
  ]),
  getAnalysisRecordById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    productName: "TestProduct",
    overallSentiment: "positive",
    positiveRatio: 60,
    negativeRatio: 20,
    neutralRatio: 20,
    summary: "Test summary",
    keyThemes: ["功能", "体验"],
    positiveComments: [],
    negativeComments: [],
    neutralComments: [],
    totalCommentsAnalyzed: 10,
    sources: ["Twitter"],
    createdAt: new Date()
  }),
  createMonitorTask: vi.fn().mockResolvedValue(1),
  getMonitorTasksByUserId: vi.fn().mockResolvedValue([]),
  getMonitorTaskById: vi.fn().mockResolvedValue(null),
  updateMonitorTask: vi.fn().mockResolvedValue(undefined),
  deleteMonitorTask: vi.fn().mockResolvedValue(undefined),
  getNotificationsByUserId: vi.fn().mockResolvedValue([]),
  markNotificationAsRead: vi.fn().mockResolvedValue(undefined),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(0)
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
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
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("analysis.analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should analyze a product and return sentiment data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analysis.analyze({ productName: "ChatGPT" });

    expect(result).toBeDefined();
    expect(result.productName).toBe("ChatGPT");
    expect(result.overallSentiment).toBe("mixed");
    expect(result.positiveRatio).toBe(40);
    expect(result.negativeRatio).toBe(20);
    expect(result.neutralRatio).toBe(40);
    expect(result.summary).toBeDefined();
    expect(result.keyThemes).toBeInstanceOf(Array);
    expect(result.sources).toContain("Twitter");
    expect(result.sources).toContain("Reddit");
  });

  it("should save analysis record when user is authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const { createAnalysisRecord } = await import("./db");

    const result = await caller.analysis.analyze({ productName: "Claude" });

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(createAnalysisRecord).toHaveBeenCalled();
  });

  it("should not save analysis record when user is not authenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const { createAnalysisRecord } = await import("./db");

    const result = await caller.analysis.analyze({ productName: "Midjourney" });

    expect(result).toBeDefined();
    expect(result.id).toBeUndefined();
  });

  it("should reject empty product name", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.analysis.analyze({ productName: "" })).rejects.toThrow();
  });
});

describe("analysis.history", () => {
  it("should return user's analysis history", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analysis.history();

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].productName).toBe("TestProduct");
  });

  it("should require authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.analysis.history()).rejects.toThrow();
  });
});

describe("analysis.exportReport", () => {
  it("should export report for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analysis.exportReport({ 
      analysisId: 1, 
      format: "text" 
    });

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.filename).toContain("TestProduct");
    expect(result.mimeType).toBe("text/plain");
  });

  it("should require authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.analysis.exportReport({ analysisId: 1, format: "text" })
    ).rejects.toThrow();
  });
});
