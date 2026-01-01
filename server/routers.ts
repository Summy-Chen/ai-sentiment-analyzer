import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createAnalysisRecord,
  getAnalysisRecordsByUserId,
  getAnalysisRecordById,
  createMonitorTask,
  getMonitorTasksByUserId,
  getMonitorTaskById,
  updateMonitorTask,
  deleteMonitorTask,
  getNotificationsByUserId,
  markNotificationAsRead,
  getUnreadNotificationCount
} from "./db";
import { searchSocialMedia } from "./services/searchService";
import { analyzeSentiment, generateReportContent } from "./services/analysisService";

// Analysis router
const analysisRouter = router({
  // Analyze a product - public but saves to DB if authenticated
  analyze: publicProcedure
    .input(z.object({ productName: z.string().min(1).max(200) }))
    .query(async ({ input, ctx }) => {
      const { productName } = input;

      // Search for social media discussions
      const searchResponse = await searchSocialMedia(productName);

      if (searchResponse.results.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "未找到相关评论，请尝试其他产品名称"
        });
      }

      // Analyze sentiment using LLM
      const analysis = await analyzeSentiment(productName, searchResponse.results);

      // Save to database if user is authenticated
      let recordId: number | undefined;
      if (ctx.user) {
        try {
          recordId = await createAnalysisRecord({
            userId: ctx.user.id,
            productName,
            overallSentiment: analysis.overallSentiment,
            positiveRatio: analysis.positiveRatio,
            negativeRatio: analysis.negativeRatio,
            neutralRatio: analysis.neutralRatio,
            summary: analysis.summary,
            keyThemes: analysis.keyThemes,
            positiveComments: analysis.positiveComments,
            negativeComments: analysis.negativeComments,
            neutralComments: analysis.neutralComments,
            totalCommentsAnalyzed: searchResponse.totalFound,
            sources: searchResponse.sources
          });
        } catch (error) {
          console.error("Failed to save analysis record:", error);
        }
      }

      return {
        id: recordId,
        productName,
        ...analysis,
        totalCommentsAnalyzed: searchResponse.totalFound,
        sources: searchResponse.sources
      };
    }),

  // Get user's analysis history
  history: protectedProcedure.query(async ({ ctx }) => {
    return await getAnalysisRecordsByUserId(ctx.user.id);
  }),

  // Get a specific analysis record
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const record = await getAnalysisRecordById(input.id);
      if (!record || record.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "分析记录不存在"
        });
      }
      return record;
    }),

  // Export analysis report
  exportReport: protectedProcedure
    .input(z.object({
      analysisId: z.number(),
      format: z.enum(["pdf", "text"])
    }))
    .mutation(async ({ input, ctx }) => {
      const record = await getAnalysisRecordById(input.analysisId);
      if (!record || record.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "分析记录不存在"
        });
      }

      const content = generateReportContent(
        record.productName,
        {
          overallSentiment: record.overallSentiment,
          positiveRatio: record.positiveRatio,
          negativeRatio: record.negativeRatio,
          neutralRatio: record.neutralRatio,
          summary: record.summary,
          keyThemes: record.keyThemes,
          positiveComments: record.positiveComments,
          negativeComments: record.negativeComments,
          neutralComments: record.neutralComments
        },
        record.sources,
        record.totalCommentsAnalyzed,
        input.format
      );

      const filename = `${record.productName}_舆情分析报告_${new Date().toISOString().split("T")[0]}.${input.format === "pdf" ? "md" : "txt"}`;
      const mimeType = input.format === "pdf" ? "text/markdown" : "text/plain";

      return {
        content,
        filename,
        mimeType
      };
    })
});

// Monitor router
const monitorRouter = router({
  // Create a new monitor task
  create: protectedProcedure
    .input(z.object({
      productName: z.string().min(1).max(200),
      frequency: z.enum(["daily", "weekly", "monthly"]).default("daily"),
      notifyEmail: z.boolean().default(false),
      notifyInApp: z.boolean().default(true),
      significantChangeThreshold: z.number().min(5).max(100).default(20)
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await createMonitorTask({
        userId: ctx.user.id,
        productName: input.productName,
        frequency: input.frequency,
        notifyEmail: input.notifyEmail,
        notifyInApp: input.notifyInApp,
        significantChangeThreshold: input.significantChangeThreshold,
        isActive: true,
        notifyOnSignificantChange: true
      });

      return { id };
    }),

  // List user's monitor tasks
  list: protectedProcedure.query(async ({ ctx }) => {
    return await getMonitorTasksByUserId(ctx.user.id);
  }),

  // Update a monitor task
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      isActive: z.boolean().optional(),
      frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
      notifyEmail: z.boolean().optional(),
      notifyInApp: z.boolean().optional(),
      significantChangeThreshold: z.number().min(5).max(100).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const task = await getMonitorTaskById(input.id);
      if (!task || task.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "监控任务不存在"
        });
      }

      const { id, ...updateData } = input;
      await updateMonitorTask(id, updateData);

      return { success: true };
    }),

  // Delete a monitor task
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const task = await getMonitorTaskById(input.id);
      if (!task || task.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "监控任务不存在"
        });
      }

      await deleteMonitorTask(input.id);

      return { success: true };
    })
});

// Notification router
const notificationRouter = router({
  // List user's notifications
  list: protectedProcedure.query(async ({ ctx }) => {
    return await getNotificationsByUserId(ctx.user.id);
  }),

  // Get unread count
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return await getUnreadNotificationCount(ctx.user.id);
  }),

  // Mark notification as read
  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await markNotificationAsRead(input.id);
      return { success: true };
    })
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  analysis: analysisRouter,
  monitor: monitorRouter,
  notification: notificationRouter
});

export type AppRouter = typeof appRouter;
