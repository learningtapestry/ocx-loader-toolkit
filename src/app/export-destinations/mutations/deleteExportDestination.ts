import { resolver } from "@blitzjs/rpc"
import db from "db"
import { DeleteExportDestinationSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(DeleteExportDestinationSchema),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const exportDestination = await db.exportDestination.deleteMany({ where: { id } })

    return exportDestination
  }
)
