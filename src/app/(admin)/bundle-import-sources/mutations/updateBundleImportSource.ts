import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { UpdateBundleImportSourceSchema } from "../schemas"
import PeriodicSatchelImportJob from "src/app/jobs/periodicSatchelImportJob"

export default resolver.pipe(
  resolver.zod(UpdateBundleImportSourceSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    // Get the current import source to check if it's a Satchel type
    const currentImportSource = await db.bundleImportSource.findUnique({
      where: { id }
    })

    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const bundleImportSource = await db.bundleImportSource.update({ where: { id }, data })

    // If this is a Satchel import source, reschedule the periodic job
    if (bundleImportSource.type === "satchel") {
      const intervalMinutes = data.accessData?.interval_minutes || "60"
      
      // Unschedule the existing job first
      await PeriodicSatchelImportJob.unschedulePeriodicImport(id)
      
      // Schedule the new job with updated settings
      await PeriodicSatchelImportJob.schedulePeriodicImport(
        id,
        intervalMinutes
      )
    }

    return bundleImportSource
  }
)
