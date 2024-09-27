-- CreateTable
CREATE TABLE "ExportDestination" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "ExportDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleExport" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "exportDestinationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "bundleId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "BundleExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeExport" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nodeId" INTEGER NOT NULL,
    "bundleExportId" INTEGER NOT NULL,
    "idOnDestination" TEXT NOT NULL,
    "pathOnDestination" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "NodeExport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BundleExport" ADD CONSTRAINT "BundleExport_exportDestinationId_fkey" FOREIGN KEY ("exportDestinationId") REFERENCES "ExportDestination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleExport" ADD CONSTRAINT "BundleExport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleExport" ADD CONSTRAINT "BundleExport_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeExport" ADD CONSTRAINT "NodeExport_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeExport" ADD CONSTRAINT "NodeExport_bundleExportId_fkey" FOREIGN KEY ("bundleExportId") REFERENCES "BundleExport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
