import { resolver } from "@blitzjs/rpc"
import db from "db"
import { UpdateExportDestinationSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(UpdateExportDestinationSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    // this is necessary to satisfy the type system
    const adjustedData = {
      ...data,
      metadata: data.metadata as Record<string, any>,
    }

    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const exportDestination = await db.exportDestination.update({ where: { id }, data: adjustedData })

    return exportDestination
  }
)
