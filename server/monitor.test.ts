import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  createAnalysisRecord: vi.fn().mockResolvedValue(1),
  getAnalysisRecordsByUserId: vi.fn().mockResolvedValue([]),
  getAnalysisRecordById: vi.fn().mockResolvedValue(null),
  createMonitorTask: vi.fn().mockResolvedValue(1),
  getMonitorTasksByUserId: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      productName: "TestProduct",
      isActive: true,
      frequency: "daily",
      notifyOnSignificantChange: true,
      significantChangeThreshold: 20,
      notifyEmail: false,
      notifyInApp: true,
      lastAnalysisId: null,
      lastAnalyzedAt: null,
      lastSentimentScore: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]),
  getMonitorTaskById: vi.fn().mockImplementation((id: number) => {
    if (id === 1) {
      return Promise.resolve({
        id: 1,
        userId: 1,
        productName: "TestProduct",
        isActive: true,
        frequency: "daily",
        notifyOnSignificantChange: true,
        significantChangeThreshold: 20,
        notifyEmail: false,
        notifyInApp: true,
        lastAnalysisId: null,
        lastAnalyzedAt: null,
        lastSentimentScore: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    return Promise.resolve(null);
  }),
  updateMonitorTask: vi.fn().mockResolvedValue(undefined),
  deleteMonitorTask: vi.fn().mockResolvedValue(undefined),
  getNotificationsByUserId: vi.fn().mockResolvedValue([]),
  markNotificationAsRead: vi.fn().mockResolvedValue(undefined),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(0),
  getActiveMonitorTasks: vi.fn().mockResolvedValue([])
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

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
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

describe("monitor.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a monitor task for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const { createMonitorTask } = await import("./db");

    const result = await caller.monitor.create({ 
      productName: "ChatGPT",
      frequency: "daily",
      notifyInApp: true,
      notifyEmail: false
    });

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(createMonitorTask).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        productName: "ChatGPT",
        frequency: "daily"
      })
    );
  });

  it("should require authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.monitor.create({ productName: "ChatGPT" })
    ).rejects.toThrow();
  });

  it("should use default values for optional fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const { createMonitorTask } = await import("./db");

    await caller.monitor.create({ productName: "Claude" });

    expect(createMonitorTask).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: "daily",
        notifyInApp: true,
        notifyEmail: false,
        significantChangeThreshold: 20
      })
    );
  });
});

describe("monitor.list", () => {
  it("should return user's monitor tasks", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.monitor.list();

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(1);
    expect(result[0].productName).toBe("TestProduct");
  });

  it("should require authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.monitor.list()).rejects.toThrow();
  });
});

describe("monitor.update", () => {
  it("should update monitor task settings", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const { updateMonitorTask } = await import("./db");

    const result = await caller.monitor.update({ 
      id: 1, 
      isActive: false,
      frequency: "weekly"
    });

    expect(result.success).toBe(true);
    expect(updateMonitorTask).toHaveBeenCalledWith(1, {
      isActive: false,
      frequency: "weekly"
    });
  });

  it("should reject update for non-existent task", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.monitor.update({ id: 999, isActive: false })
    ).rejects.toThrow("监控任务不存在");
  });

  it("should reject update for task owned by another user", async () => {
    const ctx = createAuthContext(2); // Different user
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.monitor.update({ id: 1, isActive: false })
    ).rejects.toThrow("监控任务不存在");
  });
});

describe("monitor.delete", () => {
  it("should delete monitor task", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const { deleteMonitorTask } = await import("./db");

    const result = await caller.monitor.delete({ id: 1 });

    expect(result.success).toBe(true);
    expect(deleteMonitorTask).toHaveBeenCalledWith(1);
  });

  it("should reject delete for non-existent task", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.monitor.delete({ id: 999 })
    ).rejects.toThrow("监控任务不存在");
  });
});

describe("notification.list", () => {
  it("should return user's notifications", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.list();

    expect(result).toBeInstanceOf(Array);
  });

  it("should require authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.notification.list()).rejects.toThrow();
  });
});

describe("notification.unreadCount", () => {
  it("should return unread notification count", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notification.unreadCount();

    expect(typeof result).toBe("number");
    expect(result).toBe(0);
  });
});
