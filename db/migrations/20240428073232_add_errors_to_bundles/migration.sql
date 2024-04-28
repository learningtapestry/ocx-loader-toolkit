-- AlterTable
ALTER TABLE "Bundle" ADD COLUMN     "errors" JSONB NOT NULL DEFAULT '[]';
