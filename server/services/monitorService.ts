import { 
  getActiveMonitorTasks, 
  updateMonitorTask, 
  createAnalysisRecord,
  createNotification,
  getUserByOpenId
} from "../db";
import { searchSocialMedia } from "./searchService";
import { analyzeSentiment } from "./analysisService";
import { notifyOwner } from "../_core/notification";

/**
 * Execute monitoring for all active tasks
 * This should be called by a scheduled job
 */
export async function executeMonitoringTasks(): Promise<void> {
  console.log("[Monitor] Starting monitoring task execution...");
  
  const activeTasks = await getActiveMonitorTasks();
  console.log(`[Monitor] Found ${activeTasks.length} active monitoring tasks`);

  for (const task of activeTasks) {
    try {
      await executeMonitorTask(task);
    } catch (error) {
      console.error(`[Monitor] Error executing task ${task.id}:`, error);
    }
  }

  console.log("[Monitor] Monitoring task execution completed");
}

/**
 * Execute a single monitoring task
 */
async function executeMonitorTask(task: {
  id: number;
  userId: number;
  productName: string;
  frequency: "daily" | "weekly" | "monthly";
  notifyOnSignificantChange: boolean;
  significantChangeThreshold: number;
  notifyEmail: boolean;
  notifyInApp: boolean;
  lastSentimentScore: number | null;
}): Promise<void> {
  console.log(`[Monitor] Executing task ${task.id} for product: ${task.productName}`);

  // Search and analyze
  const searchResponse = await searchSocialMedia(task.productName);
  
  if (searchResponse.results.length === 0) {
    console.log(`[Monitor] No results found for ${task.productName}`);
    return;
  }

  const analysis = await analyzeSentiment(task.productName, searchResponse.results);

  // Calculate sentiment score (0-100, where 100 is most positive)
  const currentSentimentScore = analysis.positiveRatio;

  // Save analysis record
  const analysisId = await createAnalysisRecord({
    userId: task.userId,
    productName: task.productName,
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

  // Check for significant change
  let hasSignificantChange = false;
  let changeAmount = 0;

  if (task.lastSentimentScore !== null && task.notifyOnSignificantChange) {
    changeAmount = Math.abs(currentSentimentScore - task.lastSentimentScore);
    hasSignificantChange = changeAmount >= task.significantChangeThreshold;
  }

  // Update task with new analysis info
  await updateMonitorTask(task.id, {
    lastAnalysisId: analysisId,
    lastAnalyzedAt: new Date(),
    lastSentimentScore: currentSentimentScore
  });

  // Send notifications if significant change detected
  if (hasSignificantChange) {
    const changeDirection = currentSentimentScore > (task.lastSentimentScore || 0) ? "上升" : "下降";
    const notificationTitle = `${task.productName} 舆情变化提醒`;
    const notificationMessage = `${task.productName} 的舆情评分${changeDirection}了 ${changeAmount.toFixed(1)}%，当前正面评价占比为 ${currentSentimentScore}%。建议查看最新分析报告了解详情。`;

    // In-app notification
    if (task.notifyInApp) {
      await createNotification({
        userId: task.userId,
        type: "sentiment_change",
        title: notificationTitle,
        message: notificationMessage,
        analysisId,
        monitorTaskId: task.id
      });
    }

    // Owner notification (for email alerts - using the built-in notification system)
    if (task.notifyEmail) {
      try {
        await notifyOwner({
          title: notificationTitle,
          content: notificationMessage
        });
      } catch (error) {
        console.error("[Monitor] Failed to send owner notification:", error);
      }
    }

    console.log(`[Monitor] Significant change detected for ${task.productName}: ${changeAmount.toFixed(1)}%`);
  }

  console.log(`[Monitor] Task ${task.id} completed. Sentiment score: ${currentSentimentScore}`);
}

/**
 * Check if a task should run based on its frequency
 */
export function shouldTaskRun(
  frequency: "daily" | "weekly" | "monthly",
  lastAnalyzedAt: Date | null
): boolean {
  if (!lastAnalyzedAt) return true;

  const now = new Date();
  const lastRun = new Date(lastAnalyzedAt);
  const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);

  switch (frequency) {
    case "daily":
      return hoursSinceLastRun >= 24;
    case "weekly":
      return hoursSinceLastRun >= 24 * 7;
    case "monthly":
      return hoursSinceLastRun >= 24 * 30;
    default:
      return false;
  }
}
