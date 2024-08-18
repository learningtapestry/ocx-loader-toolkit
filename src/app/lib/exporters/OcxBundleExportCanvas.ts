import { Prisma, PrismaClient, User, ExportDestination as PrismaExportDestination  } from "@prisma/client"
import db from "@/db/index"

import OcxBundleExport from '@/src/app/lib/OcxBundleExport';

import OcxNode from "@/src/app/lib/OcxNode"
import OcxNodeExport from "@/src/app/lib/OcxNodeExport"
import OcxBundle from "@/src/app/lib/OcxBundle"

import CanvasRepository from "./repositories/CanvasRepository"

export default class OcxBundleExportCanvas extends OcxBundleExport {
  async exportOcxNodeToModule(ocxNode: OcxNode, position: number) {
    const canvasModule = await this.canvasRepository!.createModule(this.bundleExportCanvasId, ocxNode.metadata.name as string, position);

    return this.createOcxNodeExport(ocxNode, canvasModule);
  }

  async exportOcxNodeToModuleSubHeader(ocxNode: OcxNode, moduleId: number, position: number, indent: number) {
    const canvasModuleItem = await this.canvasRepository!.createModuleItem(
      this.bundleExportCanvasId,
      moduleId,
      ocxNode.metadata.name as string,
      'SubHeader',
      null,
      position,
      indent
    );

    return this.createOcxNodeExport(ocxNode, canvasModuleItem);
  }

  async exportOcxNodeToActivity(ocxNode: OcxNode) {
    const canvasAssignment = await this.canvasRepository!.createAssignment(this.bundleExportCanvasId, 'ocxNode.title', 1);

    return this.createOcxNodeExport(ocxNode, canvasAssignment);
  }

  async createOcxNodeExport(ocxNode: OcxNode, metadata: Prisma.JsonObject) {
    const prismaNodeExport = await db.nodeExport.create({
      data: {
        idOnDestination: metadata.id!.toString(),
        metadata,
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
    return this.metadata.id as number;
  }

  get metadata() {
    return this.prismaBundleExport.metadata as Prisma.JsonObject;
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
