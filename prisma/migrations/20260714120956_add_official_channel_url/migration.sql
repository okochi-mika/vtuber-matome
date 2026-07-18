-- AlterTable
ALTER TABLE `Group` ADD COLUMN `officialChannelUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Office` ADD COLUMN `officialChannelUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Unit` ADD COLUMN `officialChannelUrl` VARCHAR(191) NULL;
