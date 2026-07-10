-- CreateTable
CREATE TABLE "_TalentUnitsManyToMany" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_TalentUnitsManyToMany_AB_unique" ON "_TalentUnitsManyToMany"("A", "B");

-- CreateIndex
CREATE INDEX "_TalentUnitsManyToMany_B_index" ON "_TalentUnitsManyToMany"("B");

-- AddForeignKey
ALTER TABLE "_TalentUnitsManyToMany" ADD CONSTRAINT "_TalentUnitsManyToMany_A_fkey" FOREIGN KEY ("A") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TalentUnitsManyToMany" ADD CONSTRAINT "_TalentUnitsManyToMany_B_fkey" FOREIGN KEY ("B") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
