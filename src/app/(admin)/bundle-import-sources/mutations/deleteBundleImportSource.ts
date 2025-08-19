import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { DeleteBundleImportSourceSchema } from "../schemas"
import PeriodicSatchelImportJob from "src/app/jobs/periodicSatchelImportJob"

export default resolver.pipe(
  resolver.zod(DeleteBundleImportSourceSchema),
  resolver.authorize(),
  async ({ id }) => {
    // Get the import source before deleting to check if it's a Satchel type
    const bundleImportSource = await db.bundleImportSource.findUnique({
      where: { id }
    })

    if (bundleImportSource?.type === "satchel") {
      // Unschedule the periodic job before deleting
      await PeriodicSatchelImportJob.unschedulePeriodicImport(id)
    }

    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const result = await db.bundleImportSource.deleteMany({ where: { id } })

    return result
  }
)
