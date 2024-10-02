-- AlterTable
ALTER TABLE "ExportDestination" ADD COLUMN     "userId" INTEGER;

-- AddForeignKey
ALTER TABLE "ExportDestination" ADD CONSTRAINT "ExportDestination_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
