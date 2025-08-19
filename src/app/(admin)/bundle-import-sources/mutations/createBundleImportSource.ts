import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { CreateBundleImportSourceSchema } from "../schemas"
import PeriodicSatchelImportJob from "src/app/jobs/periodicSatchelImportJob"

export default resolver.pipe(
  resolver.zod(CreateBundleImportSourceSchema),
  resolver.authorize(),
  async (input) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const bundleImportSource = await db.bundleImportSource.create({ data: {
      ...input,
      accessData: JSON.stringify(input.accessData || {}),
    } })

    // If this is a Satchel import source, schedule periodic imports using pg-boss
    if (input.type === "satchel") {
      const intervalMinutes = input.accessData?.interval_minutes || "60"
      await PeriodicSatchelImportJob.schedulePeriodicImport(
        bundleImportSource.id,
        intervalMinutes
      )
    }

    return bundleImportSource
  }
)
