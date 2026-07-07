-- DropForeignKey
ALTER TABLE "Channel" DROP CONSTRAINT "Channel_talentId_fkey";

-- AlterTable
ALTER TABLE "Talent" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
