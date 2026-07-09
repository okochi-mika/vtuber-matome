/*
  Warnings:

  - Added the required column `officeId` to the `Talent` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Talent" DROP CONSTRAINT "Talent_unitId_fkey";

-- AlterTable
ALTER TABLE "Talent" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "officeId" TEXT NOT NULL,
ALTER COLUMN "unitId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Talent" ADD CONSTRAINT "Talent_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Talent" ADD CONSTRAINT "Talent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Talent" ADD CONSTRAINT "Talent_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
