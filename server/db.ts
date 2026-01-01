import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  analysisRecords, InsertAnalysisRecord, AnalysisRecord,
  monitorTasks, InsertMonitorTask, MonitorTask,
  notifications, InsertNotification, Notification,
  sentimentTrends, InsertSentimentTrend, SentimentTrend
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User functions
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Analysis record functions
export async function createAnalysisRecord(record: InsertAnalysisRecord): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(analysisRecords).values(record);
  return result[0].insertId;
}

export async function getAnalysisRecordsByUserId(userId: number): Promise<AnalysisRecord[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select()
    .from(analysisRecords)
    .where(eq(analysisRecords.userId, userId))
    .orderBy(desc(analysisRecords.createdAt));
}

export async function getAnalysisRecordById(id: number): Promise<AnalysisRecord | undefined> {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select()
    .from(analysisRecords)
    .where(eq(analysisRecords.id, id))
    .limit(1);

  return result[0];
}

// Monitor task functions
export async function createMonitorTask(task: InsertMonitorTask): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(monitorTasks).values(task);
  return result[0].insertId;
}

export async function getMonitorTasksByUserId(userId: number): Promise<MonitorTask[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select()
    .from(monitorTasks)
    .where(eq(monitorTasks.userId, userId))
    .orderBy(desc(monitorTasks.createdAt));
}

export async function getMonitorTaskById(id: number): Promise<MonitorTask | undefined> {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select()
    .from(monitorTasks)
    .where(eq(monitorTasks.id, id))
    .limit(1);

  return result[0];
}

export async function updateMonitorTask(id: number, data: Partial<InsertMonitorTask>): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(monitorTasks)
    .set(data)
    .where(eq(monitorTasks.id, id));
}

export async function deleteMonitorTask(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(monitorTasks).where(eq(monitorTasks.id, id));
}

export async function getActiveMonitorTasks(): Promise<MonitorTask[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select()
    .from(monitorTasks)
    .where(eq(monitorTasks.isActive, true));
}

// Notification functions
export async function createNotification(notification: InsertNotification): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(notifications).values(notification);
  return result[0].insertId;
}

export async function getNotificationsByUserId(userId: number): Promise<Notification[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, id));
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    return 0;
  }

  const result = await db.select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return result.length;
}

// Sentiment trend functions
export async function createSentimentTrend(trend: InsertSentimentTrend): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(sentimentTrends).values(trend);
  return result[0].insertId;
}

export async function getSentimentTrendsByProduct(
  productName: string,
  limit: number = 30
): Promise<SentimentTrend[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select()
    .from(sentimentTrends)
    .where(eq(sentimentTrends.productName, productName))
    .orderBy(desc(sentimentTrends.recordedAt))
    .limit(limit);
}

export async function getLatestSentimentTrend(
  productName: string
): Promise<SentimentTrend | undefined> {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select()
    .from(sentimentTrends)
    .where(eq(sentimentTrends.productName, productName))
    .orderBy(desc(sentimentTrends.recordedAt))
    .limit(1);

  return result[0];
}
