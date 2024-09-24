import { Prisma, PrismaClient, User, ExportDestination as PrismaExportDestination  } from "@prisma/client"
import db from "@/db/index"

import OcxBundleExport from '@/src/app/lib/OcxBundleExport';

import OcxNode from "@/src/app/lib/OcxNode"
import OcxNodeExport from "@/src/app/lib/OcxNodeExport"
import OcxBundle from "@/src/app/lib/OcxBundle"

import CanvasRepository from "./repositories/CanvasRepository"

import { CanvasFileUploadParams, finalizeCanvasFileUpload } from "@/src/app/lib/exporters/repositories/callCanvas"
import QtiZip from "@/src/app/lib/exporters/QtiZip"

export type AttachmentData = {
  blob: Blob;
  name: string;
}

export type LinkData = {
  url: string;
  name: string;
}

export default class OcxBundleExportCanvas extends OcxBundleExport {
  async exportOcxNodeToModule(ocxNode: OcxNode, position: number) {
    const canvasModule = await this.canvasRepository!.createModule(this.bundleExportCanvasId, ocxNode.ocxName, position);

    return this.createOcxNodeExport(ocxNode, canvasModule);
  }

  async exportOcxNodeToModuleSubHeader(ocxNode: OcxNode, moduleId: number, position: number, indent: number) {
    const canvasModuleItem = await this.canvasRepository!.createModuleItem(
      this.bundleExportCanvasId,
      moduleId,
      ocxNode.ocxName,
      'SubHeader',
      null,
      position,
      indent
    );

    return this.createOcxNodeExport(ocxNode, canvasModuleItem);
  }

  async pollProgress(progressUrl: string, interval = 200) {
    return new Promise((resolve, reject) => {
      const poller = setInterval(async () => {
        try {
          const progressObject = await this.canvasRepository!.getProgress(progressUrl);

          const progress = progressObject.completion;

          if (progress >= 100) {
            clearInterval(poller);
            resolve('Operation complete!');
          }
        } catch (error) {
          console.error('Error polling progress:', error);
          clearInterval(poller);
          reject(error);
        }
      }, interval);
    });
  }

  async exportOcxNodeQtiFileToQuiz(ocxNode: OcxNode, qtiFile: Blob, moduleId: number, position: number) {
    // create the content_migration on Canvas for this QTI quiz with type qti_converter
    const contentMigration = await this.canvasRepository!.createContentMigration(
      this.bundleExportCanvasId,
      'qti_converter',
      {
        // insert_into_module_id: moduleId,
        // insert_into_module_type: 'quiz',
        // insert_into_position: position
      },
      {
        name: 'QTI-Quiz.zip',
        size: qtiFile.size,
        content_type: 'application/zip',
      }
    );

    const progressUrl = contentMigration.progress_url as string;

    await finalizeCanvasFileUpload(contentMigration.pre_attachment! as CanvasFileUploadParams, qtiFile, 'qti.zip');

    const quizName = await (new QtiZip(qtiFile)).getQuizTitle();

    await this.pollProgress(progressUrl);

    const quiz = await this.canvasRepository!.getQuizByName(this.bundleExportCanvasId, quizName);

    const updatedQuiz = await this.canvasRepository!.updateQuiz(this.bundleExportCanvasId, quiz.id as number, {
      title: ocxNode.ocxName,
      description: ocxNode.metadata.instructions as string
    });

    const moduleItem = await this.canvasRepository!.createModuleItem(
      this.bundleExportCanvasId,
      moduleId,
      ocxNode.ocxName,
      'Quiz',
      quiz.id as number,
      position,
      1
    );
  }

  async exportOcxNodeToAssignment(ocxNode: OcxNode, attachments: AttachmentData[] = [], links: LinkData[] = [], moduleId?: number, position?: number) {
    let instructions = ocxNode.metadata.instructions as string;

    for (const { blob, name } of attachments) {
      const uploadFileData = await this.canvasRepository!.uploadFileToCourse(this.bundleExportCanvasId, blob, name);

      const filePath = `/courses/${this.bundleExportCanvasId}/files/${uploadFileData.id}`;

      // add the file link to the instructions, using html tags
      instructions = `${instructions} <p><span>
                                        <a
                                          class="instructure_file_link instructure_scribd_file inline_disabled"
                                          title="${name}"
                                          href="${filePath}?wrap=1"
                                          target="_blank"
                                          data-canvas-previewable="false"
                                          data-api-endpoint="/api/v1${filePath}"
                                          data-api-returntype="File"
                                        >${name}</a>
                                      </span></p>`;
    }

    for (const { url, name } of links) {
      instructions = `${instructions} <p><a href="${url}" target="_blank">${name}</a></p>`;
    }

    const canvasAssignment = await this.canvasRepository!.createAssignment(
      this.bundleExportCanvasId,
      ocxNode.ocxName,
      1,
      instructions
    );

    if (moduleId && position) {
      await this.canvasRepository!.createModuleItem(
        this.bundleExportCanvasId,
        moduleId,
        ocxNode.ocxName,
        'Assignment',
        canvasAssignment.id as number,
        position,
        1
      );
    }

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
    accessToken: (destination.metadata! as Prisma.JsonObject).accessToken as string
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
