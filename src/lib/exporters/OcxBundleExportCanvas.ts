import {
  Prisma,
  PrismaClient,
  User,
  BundleExport,
  ExportDestination
} from "@prisma/client"
import db from "db"
import airbrake from "config/airbrake"

import prettyBytes from "pretty-bytes"

import OcxBundleExport from "src/lib/OcxBundleExport"

import OcxNode from "src/lib/OcxNode"
import OcxNodeExport from "src/lib/OcxNodeExport"

import CanvasRepository from "./repositories/CanvasRepository"

import { CanvasFileUploadParams, finalizeCanvasFileUpload } from "src/lib/exporters/repositories/callCanvas"
import QtiZip from "src/lib/exporters/QtiZip"
import ExportDestinationService from "src/lib/ExportDestinationService"

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

  async pollProgressUntilFinished(progressUrl: string, interval = 200) {
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

          airbrake?.notify(error);

          clearInterval(poller);
          reject(error);
        }
      }, interval);
    });
  }

  async exportOcxNodeQtiFileToQuiz(ocxNode: OcxNode, qtiFile: Blob, moduleId: number, position: number) {
    console.log(
      `[${this.prismaBundleExport.id}] Exporting QTI file to Canvas quiz:`,
      ocxNode.ocxName,
    )

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

    await this.pollProgressUntilFinished(progressUrl);

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
    console.log(`[${this.prismaBundleExport.id}] Exporting assignment:`, ocxNode.ocxName);

    let instructions = ocxNode.metadata.instructions as string;

    for (const { blob, name } of attachments) {
      // // only for faster testing
      // if (blob.size > 2 * 1024 * 1024) {
      //   console.log(`[${this.prismaBundleExport.id}] Skipping attachment: ${name} / ${prettyBytes(blob.size)}`);
      //
      //   continue
      // }

      console.log(
        `[${this.prismaBundleExport.id}] Uploading attachment: ${name} / ${prettyBytes(blob.size)}`,
      );
      const uploadFileData = await this.canvasRepository!.uploadFileToCourse(this.bundleExportCanvasId, blob, name);
      console.log(`[${this.prismaBundleExport.id}] Uploaded: ${name}`);

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

    console.log(`[${this.prismaBundleExport.id}] Assignment created:`, ocxNode.ocxName);

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
  bundleExport: BundleExport,
) {
  const exportDestination = await db.exportDestination.findUnique({
    where: {
      id: bundleExport.exportDestinationId
    }
  })! as ExportDestination;

  const exportDestinationService = new ExportDestinationService(exportDestination);

  const canvasRepository = new CanvasRepository({
    baseUrl: exportDestination.baseUrl,
    accessToken: await exportDestinationService.getToken()
  });

  let canvasCourse: Prisma.JsonObject;

  const metadata = bundleExport.metadata as Prisma.JsonObject;

  if (metadata.existingCourseId) {
    canvasCourse = await canvasRepository.getCourse(metadata.existingCourseId as number);

    console.log(`[${bundleExport.id}] Using existing course:`, canvasCourse.name, canvasCourse.course_code);
  } else {
    const name = (metadata.newCourseName || bundleExport.name) as string;
    const courseCode = (bundleExport.metadata as any).courseCode as string;

    canvasCourse = await canvasRepository.createCourse(name, courseCode);

    console.log(`[${bundleExport.id}] Created new course:`, canvasCourse.name, canvasCourse.course_code);
  }

  const updatedBundleExport = await db.bundleExport.update({
    where: {
      id: bundleExport.id
    },
    data: {
      metadata: canvasCourse
    }
  });

  const ocxBundleExport = new OcxBundleExportCanvas(updatedBundleExport);

  await ocxBundleExport.initPromise;

  return ocxBundleExport;
}
