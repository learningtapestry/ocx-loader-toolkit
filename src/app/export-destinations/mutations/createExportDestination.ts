import { resolver } from "@blitzjs/rpc"
import db from "db"
import { CreateExportDestinationSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(CreateExportDestinationSchema),
  resolver.authorize(),
  async (input) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const exportDestination = await db.exportDestination.create({ data: input })

    return exportDestination
  }
)
