-- AlterTable
ALTER TABLE "ExportDestination" ADD COLUMN     "canvasInstanceId" INTEGER;

-- CreateTable
CREATE TABLE "CanvasInstance" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,

    CONSTRAINT "CanvasInstance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExportDestination" ADD CONSTRAINT "ExportDestination_canvasInstanceId_fkey" FOREIGN KEY ("canvasInstanceId") REFERENCES "CanvasInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
