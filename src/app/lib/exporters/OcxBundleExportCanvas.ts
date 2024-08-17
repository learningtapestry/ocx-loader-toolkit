import { Prisma, PrismaClient, User, ExportDestination as PrismaExportDestination  } from "@prisma/client"
import db from "@/db/index"

import OcxBundleExport from '@/src/app/lib/OcxBundleExport';

import OcxNode from "@/src/app/lib/OcxNode"
import OcxNodeExport from "@/src/app/lib/OcxNodeExport"
import OcxBundle from "@/src/app/lib/OcxBundle"

import CanvasRepository from "./repositories/CanvasRepository"

export default class OcxBundleExportCanvas extends OcxBundleExport {
  async exportOcxNodeToModule(ocxNode: OcxNode, position) {
    if (!this.canvasRepository) {
      throw new Error('Canvas repository not initialized');
    }

    const canvasModule = await this.canvasRepository.createModule(this.bundleExportCanvasId, ocxNode.metadata.name, position);

    const prismaNodeExport = await db.nodeExport.create({
      data: {
        idOnDestination: canvasModule.id!.toString(),
        metadata: canvasModule,
        node: {
          connect: {
            id: ocxNode.dbId
          }
        },
        bundleExport: {
          connect: {
            id: this.prismaBundleExport.id
          }
        }
      }
    });

    return new OcxNodeExport(prismaNodeExport);
  }

  async exportOcxNodeToCanvas(ocxNode: OcxNode) {
    if (!this.canvasRepository) {
      throw new Error('Canvas repository not initialized');
    }

    const canvasAssignment = await this.canvasRepository.createAssignment((this.prismaBundleExport.metadata! as Prisma.JsonObject).id as number, 'ocxNode.title', 1);

    const prismaNodeExport = await db.nodeExport.create({
      data: {
        idOnDestination: canvasAssignment.id!.toString(),
        pathOnDestination: canvasAssignment.html_url as string,
        metadata: canvasAssignment,
        node: {
          connect: {
            id: ocxNode.dbId
          }
        },
        bundleExport: {
          connect: {
            id: this.prismaBundleExport.id
          }
        }
      }
    });

    return new OcxNodeExport(prismaNodeExport);
  }

  get bundleExportCanvasId() {
    return (this.prismaBundleExport.metadata! as Prisma.JsonObject).id as number;
  }
}

export async function createExportOcxBundleToCanvas(
  db: PrismaClient,
  ocxBundle: OcxBundle,
  destination: PrismaExportDestination,
  user: User,
  name: string,
  code: string
) {
  // export to Canvas
  // if successful, create a new BundleExport record

  const canvasRepository = new CanvasRepository({
    baseUrl: destination.baseUrl,
    accessToken: (destination.metadata! as Prisma.JsonObject).token as string
  });

  const canvasCourse = await canvasRepository.createCourse(name, code);

  const prismaBundleExport = await db.bundleExport.create({
    data: {
      metadata: canvasCourse,
      name: name,
      exportDestination: {
        connect: {
          id: destination.id
        }
      },
      bundle: {
        connect: {
          id: ocxBundle.prismaBundle.id
        }
      },
      user: {
        connect: {
          id: user.id
        }
      }
    }
  });

  const ocxBundleExport = new OcxBundleExportCanvas(prismaBundleExport);

  await ocxBundleExport.initPromise;

  return ocxBundleExport;
}
