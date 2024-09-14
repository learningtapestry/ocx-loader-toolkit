// exporter using the legacy OSE OCX with googleClassroom data

import db from "@/db/index"

import { google } from 'googleapis';
import { googleApiKey } from "@/config/secrets"

import { ExportDestination, User } from "@prisma/client"

import OcxBundle from "@/src/app/lib/OcxBundle"

import OcxBundleExportCanvas, {createExportOcxBundleToCanvas, AttachmentData, LinkData} from "@/src/app/lib/exporters/OcxBundleExportCanvas"

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import GoogleFormToQtiConverter from "@/src/app/lib/qti/GoogleFormToQtiConverter"

export default class CanvasLegacyOpenSciEdExporter {
  exportDestination: ExportDestination;
  ocxBundle: OcxBundle;
  user: User;

  ocxBundleExportCanvas?: OcxBundleExportCanvas;

  constructor(exportDestination: ExportDestination, ocxBundle: OcxBundle, user: User) {
    this.exportDestination = exportDestination;
    this.ocxBundle = ocxBundle;
    this.user = user;
  }

  async exportAll() {
    this.ocxBundleExportCanvas = await createExportOcxBundleToCanvas(db, this.ocxBundle, this.exportDestination, this.user, 'TODO', 'TODO');

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
          // legacy OSE OCX has googleClassroom data
          activityNode.metadata.name = activityNode.metadata.googleClassroom?.postTitle?.en;
          activityNode.metadata.instructions = activityNode.metadata.googleClassroom?.postInstructions?.en;

          const attachments: AttachmentData[] = [];
          const links: LinkData[] = [];

          let quizCreated = false;

          for (const material of activityNode.metadata.googleClassroom?.materials || []) {
            if ((material.version as string).includes('English')) {
              if (material.object.url) {
                if (material.object.type === 'material') {
                  if (material.object.url.includes('google.com/forms')) {
                    console.log('loading form', material.object.url);

                    const formJson = await this.downloadGoogleForm(material.object.url);

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

                    const {blob, extension} = await this.downloadFromGoogleDrive(material.object.url);

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
  }

  async downloadGoogleForm(originalUrl: string): Promise<any> {
    const fileId =  originalUrl.split('/')[5];

    const auth = new google.auth.GoogleAuth({
      credentials: googleApiKey,
      scopes: ['https://www.googleapis.com/auth/forms.body.readonly'], // Adjust scope if needed
    });

    const forms = google.forms({
      version: 'v1',
      auth,
    });

    try {
      const res = await forms.forms.get({ formId: fileId });
      return res.data;
    } catch (e) {
      console.error('Error downloading form:', e);
      throw e;
    }
  }

  async downloadFromGoogleDrive(originalUrl: string) {
    const fileId = originalUrl.includes('https://drive.google.com/open?id=') ? originalUrl.split('/open?id=')[1] : originalUrl.split('/')[5];

    const auth = new google.auth.GoogleAuth({
      credentials: googleApiKey,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({
      version: 'v3',
      auth
    });

    try {
      // Fetch the file metadata to get the file name and mime type
      const metadataResponse = await drive.files.get({
        fileId,
        fields: 'name, mimeType',
      });

      const fileName = metadataResponse.data.name;
      const mimeType = metadataResponse.data.mimeType;

      if (mimeType === 'application/vnd.google-apps.document') {
        const exportResponse = await drive.files.export(
          { fileId, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
          { responseType: 'arraybuffer' }
        );

        const arrayBuffer = exportResponse.data;
        const blob = new Blob([arrayBuffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

        return {
          blob,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extension: 'docx'
        };
      } else {
        const contentResponse = await drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'arraybuffer' }
        );

        const arrayBuffer = contentResponse.data;
        const blob = new Blob([arrayBuffer as BlobPart], { type: mimeType as string });

        return {
          blob,
          mimeType,
          extension: mimeType?.split('/')[1] || 'pdf'
        };
      }
    } catch (e) {
      console.error('Error downloading file', e);

      throw e;
    }
  }

}
