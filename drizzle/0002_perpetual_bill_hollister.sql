CREATE TABLE `sentiment_trends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productName` varchar(255) NOT NULL,
	`positiveRatio` int NOT NULL,
	`negativeRatio` int NOT NULL,
	`neutralRatio` int NOT NULL,
	`overallScore` int NOT NULL,
	`twitterCount` int NOT NULL DEFAULT 0,
	`redditCount` int NOT NULL DEFAULT 0,
	`otherCount` int NOT NULL DEFAULT 0,
	`totalCount` int NOT NULL,
	`analysisId` int,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sentiment_trends_id` PRIMARY KEY(`id`)
);
