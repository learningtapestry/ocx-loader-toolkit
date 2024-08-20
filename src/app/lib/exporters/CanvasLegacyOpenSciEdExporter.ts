// exporter using the legacy OSE OCX with googleClassroom data

import db from "@/db/index"

import { ExportDestination, User } from "@prisma/client"

import OcxBundle from "@/src/app/lib/OcxBundle"

import OcxBundleExportCanvas, {createExportOcxBundleToCanvas} from "@/src/app/lib/exporters/OcxBundleExportCanvas"

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

          let attachedFileBlob: Blob | undefined;
          let fileName: string | undefined;

          // TODO manage when there is content which should be uploaded as a file - for now, just a test
          if (activityNode.metadata.googleClassroom?.materials?.[0]?.object.identifier === 'LT.L1.HO1') {
            attachedFileBlob = new Blob(['This is a test file'], { type: 'text/plain' });
            fileName = 'test.txt';
          }

          const activityExport = await this.ocxBundleExportCanvas.exportOcxNodeToAssignment(
            activityNode, moduleExport.canvasId, canvasModuleItemPosition++, attachedFileBlob, fileName
          );
        }
      }
    }
  }
}
