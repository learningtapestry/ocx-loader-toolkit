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

    let unitPosition = 1;

    // iterate on the oer:Unit nodes
    for (const unitNode of courseNode.children) {
      const moduleExport = await this.ocxBundleExportCanvas.exportOcxNodeToModule(unitNode, unitPosition++);

      let lessonPosition = 1;

      // iterate on the oer:Lesson nodes
      for (const lessonNode of unitNode.children) {
        const lessonSubHeader = await this.ocxBundleExportCanvas.exportOcxNodeToModuleSubHeader(lessonNode, moduleExport.metadata.id, lessonPosition++, 0);
      }
    }
  }
}
