import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  createAnalysisRecord: vi.fn().mockResolvedValue(1),
  getAnalysisRecordsByUserId: vi.fn().mockResolvedValue([]),
  getAnalysisRecordById: vi.fn().mockResolvedValue(null),
  createMonitorTask: vi.fn().mockResolvedValue(1),
  getMonitorTasksByUserId: vi.fn().mockResolvedValue([]),
  getMonitorTaskById: vi.fn().mockResolvedValue(null),
  updateMonitorTask: vi.fn().mockResolvedValue(undefined),
  deleteMonitorTask: vi.fn().mockResolvedValue(undefined),
  getNotificationsByUserId: vi.fn().mockResolvedValue([]),
  markNotificationAsRead: vi.fn().mockResolvedValue(undefined),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(0),
  createSentimentTrend: vi.fn().mockResolvedValue(1),
  getSentimentTrendsByProduct: vi.fn().mockResolvedValue([
    {
      id: 1,
      productName: "ChatGPT",
      positiveRatio: 60,
      negativeRatio: 20,
      neutralRatio: 20,
      overallScore: 60,
      twitterCount: 10,
      redditCount: 8,
      otherCount: 5,
      totalCount: 23,
      analysisId: 1,
      recordedAt: new Date("2025-12-25")
    },
    {
      id: 2,
      productName: "ChatGPT",
      positiveRatio: 55,
      negativeRatio: 25,
      neutralRatio: 20,
      overallScore: 55,
      twitterCount: 12,
      redditCount: 6,
      otherCount: 4,
      totalCount: 22,
      analysisId: 2,
      recordedAt: new Date("2025-12-26")
    }
  ])
}));

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

describe("trend.getByProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return sentiment trends for a product", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trend.getByProduct({ 
      productName: "ChatGPT",
      limit: 30
    });

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(2);
    // Verify data is returned correctly
    expect(result[0].productName).toBe("ChatGPT");
    expect(result[0].positiveRatio).toBeDefined();
  });

  it("should be accessible without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw
    const result = await caller.trend.getByProduct({ productName: "Claude" });
    expect(result).toBeDefined();
  });

  it("should use default limit when not specified", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const { getSentimentTrendsByProduct } = await import("./db");

    await caller.trend.getByProduct({ productName: "ChatGPT" });

    expect(getSentimentTrendsByProduct).toHaveBeenCalledWith("ChatGPT", 30);
  });

  it("should respect custom limit", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const { getSentimentTrendsByProduct } = await import("./db");

    await caller.trend.getByProduct({ productName: "ChatGPT", limit: 10 });

    expect(getSentimentTrendsByProduct).toHaveBeenCalledWith("ChatGPT", 10);
  });

  it("should return empty array for product with no trends", async () => {
    const { getSentimentTrendsByProduct } = await import("./db");
    vi.mocked(getSentimentTrendsByProduct).mockResolvedValueOnce([]);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trend.getByProduct({ productName: "NewProduct" });

    expect(result).toEqual([]);
  });
});
