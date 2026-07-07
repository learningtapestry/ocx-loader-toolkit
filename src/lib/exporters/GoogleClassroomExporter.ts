import db from "db";

import { BundleExport, ExportDestination } from "@prisma/client";
import { JsonObject } from "type-fest";

import { publishBundleExportUpdate } from "src/app/jobs/BundleExportUpdate";

import GoogleClassroomRepository from "./repositories/GoogleClassroomRepository";
import { GOOGLE_CLASSROOM_PLACEHOLDER_COURSE_NAME } from "./repositories/callGoogleClassroom";

export default class GoogleClassroomExporter {
  prismaBundleExport: BundleExport;
  courseUrl: string | null = null;

  constructor(prismaBundleExport: BundleExport) {
    this.prismaBundleExport = prismaBundleExport;
  }

  async exportAll(): Promise<string | null> {
    try {
      console.log(`[${this.prismaBundleExport.id}] Google Classroom exportAll started`);

      await db.bundleExport.update({
        where: {
          id: this.prismaBundleExport.id,
        },
        data: {
          state: "exporting",
        },
      });

      publishBundleExportUpdate(this.prismaBundleExport.id, {
        status: "exporting",
        progress: 0,
        totalActivities: 1,
      });

      const exportDestination = (await db.exportDestination.findUnique({
        where: {
          id: this.prismaBundleExport.exportDestinationId,
        },
      }))! as ExportDestination;

      const repository = new GoogleClassroomRepository(exportDestination);
      const course = await repository.createCourse(GOOGLE_CLASSROOM_PLACEHOLDER_COURSE_NAME);

      this.courseUrl = `https://classroom.google.com/c/${course.id}`;

      await db.bundleExport.update({
        where: {
          id: this.prismaBundleExport.id,
        },
        data: {
          exportUrl: this.courseUrl,
          state: "exported",
          metadata: {
            ...(this.prismaBundleExport.metadata as JsonObject),
            googleClassroomCourseId: course.id,
          },
        },
      });

      publishBundleExportUpdate(this.prismaBundleExport.id, {
        status: "exported",
        progress: 1,
        totalActivities: 1,
        exportUrl: this.courseUrl,
      });

      console.log(`[${this.prismaBundleExport.id}] Google Classroom course exported - URL: ${this.courseUrl}`);

      return this.courseUrl;
    } catch (error: any) {
      console.error(`[${this.prismaBundleExport.id}] Error exporting to Google Classroom:`, error);

      await db.bundleExport.update({
        where: {
          id: this.prismaBundleExport.id,
        },
        data: {
          state: "failed",
        },
      });

      publishBundleExportUpdate(this.prismaBundleExport.id, {
        status: "failed",
        progress: 0,
        totalActivities: 1,
      });

      throw error;
    }
  }
}
