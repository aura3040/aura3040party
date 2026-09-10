CREATE TABLE `registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referenceCode` varchar(32) NOT NULL,
	`eventDate` varchar(10) NOT NULL,
	`eventTime` varchar(5) NOT NULL,
	`name` varchar(100) NOT NULL,
	`nickname` varchar(100) NOT NULL,
	`gender` enum('male','female') NOT NULL,
	`birthYear` int NOT NULL,
	`phone` varchar(20) NOT NULL,
	`partySize` int NOT NULL,
	`feePerPerson` int NOT NULL,
	`totalAmount` int NOT NULL,
	`privacyAgreed` boolean NOT NULL DEFAULT false,
	`payerName` varchar(100),
	`paymentReportedAt` timestamp,
	`status` enum('pending','paid','confirmed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `registrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `registrations_referenceCode_unique` UNIQUE(`referenceCode`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
