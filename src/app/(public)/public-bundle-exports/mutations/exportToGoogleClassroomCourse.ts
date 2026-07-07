import { resolver } from "@blitzjs/rpc"
import db from "db"
// TODO(refactor): use @prisma/client/runtime/library JsonObject like other GC public-export files
import { JsonObject } from "type-fest"

import { ExportToGoogleClassroomCourseSchema } from "../schemas"

import ExportBundleJob from "@/src/app/jobs/exportBundleJob"

export default resolver.pipe(
  resolver.zod(ExportToGoogleClassroomCourseSchema),
  async (input) => {
    const { bundleExportId, token, newCourseName } = input

    const bundleExport = await db.bundleExport.findFirst({
      where: { id: bundleExportId },
    })

    if (!bundleExport || bundleExport.token !== token) {
      throw new Error("Invalid token")
    }

    const updatedBundleExport = await db.bundleExport.update({
      where: { id: bundleExportId },
      data: {
        state: "pending",
        metadata: {
          ...(bundleExport.metadata as JsonObject),
          newCourseName,
        },
      },
      include: {
        bundle: true,
        exportDestination: true,
      },
    })

    await ExportBundleJob.enqueueJob({
      bundleExportId: bundleExport.id,
    })

    return updatedBundleExport
  }
)
