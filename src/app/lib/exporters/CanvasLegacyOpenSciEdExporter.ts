// exporter using the legacy OSE OCX with googleClassroom data

import db from "@/db/index"

import { ExportDestination, User } from "@prisma/client"

import OcxBundle from "@/src/app/lib/OcxBundle"

import OcxBundleExportCanvas, {createExportOcxBundleToCanvas, AttachmentData, LinkData} from "@/src/app/lib/exporters/OcxBundleExportCanvas"

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import GoogleFormToQtiConverter from "@/src/app/lib/qti/GoogleFormToQtiConverter"
import GoogleRepository from "@/src/app/lib/exporters/repositories/GoogleRepository"

type GoogleClassroomMaterial = {
  version: string;
  object: {
    title: string;
    url: string;
    type: string;
  };
}

type GoogleClassroomData = {
  postTitle: { en: string };
  postInstructions: { en: string };
  materials: GoogleClassroomMaterial[];
}

export default class CanvasLegacyOpenSciEdExporter {
  exportDestination: ExportDestination;
  ocxBundle: OcxBundle;
  user: User;

  ocxBundleExportCanvas?: OcxBundleExportCanvas;

  googleRepository: GoogleRepository;

  // New field to store the course URL
  courseUrl: string | null = null;

  constructor(exportDestination: ExportDestination, ocxBundle: OcxBundle, user: User) {
    this.exportDestination = exportDestination;
    this.ocxBundle = ocxBundle;
    this.user = user;
    this.googleRepository = new GoogleRepository(ocxBundle.prismaBundle.sourceAccessData);
  }

  async exportAll(): Promise<string | null> {
    this.ocxBundleExportCanvas = await createExportOcxBundleToCanvas(
      db,
      this.ocxBundle,
      this.exportDestination,
      this.user,
      'TODO', // Replace with actual course name
      'TODO'  // Replace with actual course code
    );

    // Assuming `createExportOcxBundleToCanvas` returns metadata that includes the course ID
    const courseId = this.ocxBundleExportCanvas.bundleExportCanvasId;
    const baseUrl = this.exportDestination.baseUrl; // Ensure this contains the base URL of Canvas
    this.courseUrl = `${baseUrl}/courses/${courseId}`;

    const courseNode = this.ocxBundle.rootNodes[0];

    let canvasModulePosition = 1;

    // iterate on the oer:Unit nodes
    for (const unitNode of courseNode.children) {
      unitNode.metadata.name = `Unit ${unitNode.metadata.alternateName}: ${unitNode.metadata.name}`;
      const moduleExport = await this.ocxBundleExportCanvas.exportOcxNodeToModule(unitNode, canvasModulePosition++);

      let canvasModuleItemPosition = 1;

      // iterate on the oer:Lesson nodes
      for (const lessonNode of unitNode.children) {
        lessonNode.metadata.name = `Lesson ${lessonNode.metadata.alternateName}`;

        const lessonSubHeader = await this.ocxBundleExportCanvas.exportOcxNodeToModuleSubHeader(lessonNode, moduleExport.canvasId, canvasModuleItemPosition++, 0);

        // iterate on the oer:Activity nodes
        for (const activityNode of lessonNode.children) {
          const googleClassroomData = activityNode.metadata.googleClassroom as GoogleClassroomData;

          // legacy OSE OCX has googleClassroom data
          activityNode.metadata.name = googleClassroomData?.postTitle?.en;
          activityNode.metadata.instructions = googleClassroomData?.postInstructions?.en;

          const attachments: AttachmentData[] = [];
          const links: LinkData[] = [];

          let quizCreated = false;

          for (const material of googleClassroomData?.materials || []) {
            if ((material.version as string).includes('English')) {
              if (material.object.url) {
                if (material.object.type === 'material') {
                  if (material.object.url.includes('google.com/forms')) {
                    console.log('loading form', material.object.url);

                    const formJson = await this.googleRepository.downloadGoogleForm(material.object.url);

                    const formConverter = new GoogleFormToQtiConverter(formJson);

                    const qtiObject = await formConverter.convertToQti();

                    const qtiFileBlob = await qtiObject.generateQtiZip();


                    // // save the form json file to the disk
                    // const formFilePath = join(__dirname, '/__tests__/', 'fixtures', 'google_form.json');
                    //
                    // await writeFile(formFilePath, JSON.stringify(formJson, null, 2));
                    //
                    // // const testFilePath = join(__dirname, '/__tests__/', 'fixtures', 'test_form_qti.zip');
                    // const testFilePath = join(__dirname, '..', 'qti', '/__tests__/', 'output', 'generated_test.qti.zip');
                    // // const testFilePath = join(__dirname, '/__tests__/', 'fixtures', 'Archive.zip');
                    // const qtiFileBlob = new Blob([await readFile(testFilePath)]);

                    await this.ocxBundleExportCanvas.exportOcxNodeQtiFileToQuiz(activityNode, qtiFileBlob, moduleExport.canvasId, canvasModuleItemPosition++);
                    quizCreated = true;
                  } else {
                    console.log('downloading material', material.object.url);

                    const {blob, extension} = await this.googleRepository.downloadFromGoogleDrive(material.object.url);

                    const fileName = `${material.object.title}.${extension}`;

                    attachments.push({
                      blob,
                      name: fileName
                    });
                  }
                }

                if (material.object.type === 'video') {
                  links.push({
                    url: material.object.url,
                    name: material.object.title
                  });
                }
              }
            }
          }

          if (!quizCreated) {
            const activityExport = await this.ocxBundleExportCanvas.exportOcxNodeToAssignment(
              activityNode, attachments, links, moduleExport.canvasId, canvasModuleItemPosition++
            );
          }
        }
      }
    }

    await db.bundleExport.update(
      {
        where: {
          id: this.ocxBundleExportCanvas.prismaBundleExport.id
        },
        data: {
          exportUrl: this.courseUrl
        }
      }
    );

    // Return the stored course URL
    return this.courseUrl;
  }



}
