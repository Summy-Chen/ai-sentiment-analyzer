CREATE TABLE `analysis_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`overallSentiment` enum('positive','negative','neutral','mixed') NOT NULL,
	`positiveRatio` int NOT NULL,
	`negativeRatio` int NOT NULL,
	`neutralRatio` int NOT NULL,
	`summary` text NOT NULL,
	`keyThemes` json NOT NULL,
	`positiveComments` json NOT NULL,
	`negativeComments` json NOT NULL,
	`neutralComments` json NOT NULL,
	`totalCommentsAnalyzed` int NOT NULL,
	`sources` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analysis_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monitor_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`frequency` enum('daily','weekly','monthly') NOT NULL DEFAULT 'daily',
	`notifyOnSignificantChange` boolean NOT NULL DEFAULT true,
	`significantChangeThreshold` int NOT NULL DEFAULT 20,
	`notifyEmail` boolean NOT NULL DEFAULT false,
	`notifyInApp` boolean NOT NULL DEFAULT true,
	`lastAnalysisId` int,
	`lastAnalyzedAt` timestamp,
	`lastSentimentScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitor_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('sentiment_change','analysis_complete','monitor_alert') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`analysisId` int,
	`monitorTaskId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
