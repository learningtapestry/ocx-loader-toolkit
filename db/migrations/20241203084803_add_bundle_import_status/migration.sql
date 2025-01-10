-- CreateEnum
CREATE TYPE "BundleImportStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- AlterTable
ALTER TABLE "Bundle" ADD COLUMN     "status" "BundleImportStatus" NOT NULL DEFAULT 'pending';
