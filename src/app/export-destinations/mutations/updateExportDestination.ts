import { resolver } from "@blitzjs/rpc"
import db from "db"
import { UpdateExportDestinationSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(UpdateExportDestinationSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const exportDestination = await db.exportDestination.update({ where: { id }, data })

    return exportDestination
  }
)
