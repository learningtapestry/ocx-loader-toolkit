// exporter using the legacy OSE OCX with googleClassroom data

import db from "@/db/index"

import { google } from 'googleapis';
import { googleApiKey } from "@/config/secrets"

import { ExportDestination, User } from "@prisma/client"

import OcxBundle from "@/src/app/lib/OcxBundle"

import OcxBundleExportCanvas, {createExportOcxBundleToCanvas, AttachmentData, LinkData} from "@/src/app/lib/exporters/OcxBundleExportCanvas"

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
      const moduleExport = await this.ocxBundleExportCanvas.exportOcxNodeToModule(unitNode, canvasModulePosition++);

      let canvasModuleItemPosition = 1;

      // iterate on the oer:Lesson nodes
      for (const lessonNode of unitNode.children) {
        const lessonSubHeader = await this.ocxBundleExportCanvas.exportOcxNodeToModuleSubHeader(lessonNode, moduleExport.canvasId, canvasModuleItemPosition++, 0);

        // iterate on the oer:Activity nodes
        for (const activityNode of lessonNode.children) {
          // legacy OSE OCX has googleClassroom data
          activityNode.metadata.name = activityNode.metadata.googleClassroom?.postTitle?.en;
          activityNode.metadata.instructions = activityNode.metadata.googleClassroom?.postInstructions?.en;

          const attachments: AttachmentData[] = [];
          const links: LinkData[] = [];

          for (const material of activityNode.metadata.googleClassroom?.materials || []) {
            if ((material.version as string).includes('English')) {
              if (material.object.url) {
                if (material.object.type === 'material') {
                  // if it's a form, skip it for now
                  if (material.object.url.includes('google.com/forms')) {
                    console.log('skipping form', material.object.url);

                    continue;
                  }

                  console.log('downloading material', material.object.url);

                  const {blob, mimeType} = await this.downloadFromGoogleDrive(material.object.url);
                  const extension = mimeType?.split('/')[1] || 'pdf';

                  const fileName = `${material.object.title}.${extension}`;

                  attachments.push({
                    blob,
                    name: fileName
                  });
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

          const activityExport = await this.ocxBundleExportCanvas.exportOcxNodeToAssignment(
            activityNode, attachments, links, moduleExport.canvasId, canvasModuleItemPosition++
          );
        }
      }
    }
  }

  async downloadFromGoogleDrive(originalUrl: string) {
    const fileId = originalUrl.split('/')[5];

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

      // Fetch the actual file content as a stream
      const contentResponse = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      );

      const arrayBuffer = contentResponse.data;
      const blob = new Blob([arrayBuffer as BlobPart], { type: mimeType as string });

      return {
        blob,
        mimeType,
      };
    } catch (e) {
      console.error('Error downloading file', e);

      throw e;
    }
  }
}
