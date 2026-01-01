import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Analysis records table - stores sentiment analysis results
 */
export const analysisRecords = mysqlTable("analysis_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  
  // Overall sentiment scores
  overallSentiment: mysqlEnum("overallSentiment", ["positive", "negative", "neutral", "mixed"]).notNull(),
  positiveRatio: int("positiveRatio").notNull(), // 0-100 percentage
  negativeRatio: int("negativeRatio").notNull(), // 0-100 percentage
  neutralRatio: int("neutralRatio").notNull(), // 0-100 percentage
  
  // Analysis content
  summary: text("summary").notNull(), // LLM generated summary
  keyThemes: json("keyThemes").$type<string[]>().notNull(), // Key themes extracted
  
  // Representative comments
  positiveComments: json("positiveComments").$type<{text: string; source: string; author?: string}[]>().notNull(),
  negativeComments: json("negativeComments").$type<{text: string; source: string; author?: string}[]>().notNull(),
  neutralComments: json("neutralComments").$type<{text: string; source: string; author?: string}[]>().notNull(),
  
  // Raw data reference
  totalCommentsAnalyzed: int("totalCommentsAnalyzed").notNull(),
  sources: json("sources").$type<string[]>().notNull(), // e.g., ["Twitter", "Reddit"]
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalysisRecord = typeof analysisRecords.$inferSelect;
export type InsertAnalysisRecord = typeof analysisRecords.$inferInsert;

/**
 * Monitor tasks table - stores scheduled monitoring configurations
 */
export const monitorTasks = mysqlTable("monitor_tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  
  // Monitoring settings
  isActive: boolean("isActive").default(true).notNull(),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly"]).default("daily").notNull(),
  
  // Notification settings
  notifyOnSignificantChange: boolean("notifyOnSignificantChange").default(true).notNull(),
  significantChangeThreshold: int("significantChangeThreshold").default(20).notNull(), // percentage change
  notifyEmail: boolean("notifyEmail").default(false).notNull(),
  notifyInApp: boolean("notifyInApp").default(true).notNull(),
  
  // Last analysis reference
  lastAnalysisId: int("lastAnalysisId"),
  lastAnalyzedAt: timestamp("lastAnalyzedAt"),
  lastSentimentScore: int("lastSentimentScore"), // 0-100, for tracking changes
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonitorTask = typeof monitorTasks.$inferSelect;
export type InsertMonitorTask = typeof monitorTasks.$inferInsert;

/**
 * Notifications table - stores user notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  type: mysqlEnum("type", ["sentiment_change", "analysis_complete", "monitor_alert"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  
  // Related records
  analysisId: int("analysisId"),
  monitorTaskId: int("monitorTaskId"),
  
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Sentiment trends table - stores historical sentiment data for trend analysis
 */
export const sentimentTrends = mysqlTable("sentiment_trends", {
  id: int("id").autoincrement().primaryKey(),
  productName: varchar("productName", { length: 255 }).notNull(),
  
  // Sentiment scores at this point in time
  positiveRatio: int("positiveRatio").notNull(),
  negativeRatio: int("negativeRatio").notNull(),
  neutralRatio: int("neutralRatio").notNull(),
  overallScore: int("overallScore").notNull(), // 0-100, calculated sentiment score
  
  // Data source breakdown
  twitterCount: int("twitterCount").default(0).notNull(),
  redditCount: int("redditCount").default(0).notNull(),
  otherCount: int("otherCount").default(0).notNull(),
  totalCount: int("totalCount").notNull(),
  
  // Reference to full analysis if available
  analysisId: int("analysisId"),
  
  // Timestamp for trend tracking
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type SentimentTrend = typeof sentimentTrends.$inferSelect;
export type InsertSentimentTrend = typeof sentimentTrends.$inferInsert;
