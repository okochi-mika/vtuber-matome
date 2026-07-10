/*
  Warnings:

  - You are about to drop the column `unitId` on the `Talent` table. All the data in the column will be lost.
  - You are about to drop the `_TalentUnitsManyToMany` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Talent" DROP CONSTRAINT "Talent_unitId_fkey";

-- DropForeignKey
ALTER TABLE "_TalentUnitsManyToMany" DROP CONSTRAINT "_TalentUnitsManyToMany_A_fkey";

-- DropForeignKey
ALTER TABLE "_TalentUnitsManyToMany" DROP CONSTRAINT "_TalentUnitsManyToMany_B_fkey";

-- AlterTable
ALTER TABLE "Talent" DROP COLUMN "unitId";

-- DropTable
DROP TABLE "_TalentUnitsManyToMany";

-- CreateTable
CREATE TABLE "_TalentToUnit" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_TalentToUnit_AB_unique" ON "_TalentToUnit"("A", "B");

-- CreateIndex
CREATE INDEX "_TalentToUnit_B_index" ON "_TalentToUnit"("B");

-- AddForeignKey
ALTER TABLE "_TalentToUnit" ADD CONSTRAINT "_TalentToUnit_A_fkey" FOREIGN KEY ("A") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TalentToUnit" ADD CONSTRAINT "_TalentToUnit_B_fkey" FOREIGN KEY ("B") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
