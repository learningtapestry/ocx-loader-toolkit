-- AlterTable
ALTER TABLE "Bundle" ADD COLUMN     "importMetadata" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "importSourceId" INTEGER;

-- CreateTable
CREATE TABLE "BundleImportSource" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "accessData" JSONB NOT NULL,
    "lastCheck" TIMESTAMP(3),

    CONSTRAINT "BundleImportSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BundleImportSource_name_key" ON "BundleImportSource"("name");

-- AddForeignKey
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_importSourceId_fkey" FOREIGN KEY ("importSourceId") REFERENCES "BundleImportSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
