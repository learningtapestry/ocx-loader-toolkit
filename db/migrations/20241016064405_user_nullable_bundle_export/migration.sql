-- DropForeignKey
ALTER TABLE "BundleExport" DROP CONSTRAINT "BundleExport_userId_fkey";

-- AlterTable
ALTER TABLE "BundleExport" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "BundleExport" ADD CONSTRAINT "BundleExport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
