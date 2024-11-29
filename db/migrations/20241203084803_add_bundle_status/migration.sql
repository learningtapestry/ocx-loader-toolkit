-- CreateEnum
CREATE TYPE "BundleStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- AlterTable
ALTER TABLE "Bundle" ADD COLUMN     "status" "BundleStatus" NOT NULL DEFAULT 'pending';
