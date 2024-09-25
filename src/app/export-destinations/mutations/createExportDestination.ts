import { resolver } from "@blitzjs/rpc"
import db from "db"
import { CreateExportDestinationSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(CreateExportDestinationSchema),
  resolver.authorize(),
  async (input) => {
    // this is necessary to satisfy the type system
    const adjustedInput = {
      ...input,
      metadata: input.metadata as Record<string, any>,
    }

    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const exportDestination = await db.exportDestination.create({ data: adjustedInput })

    return exportDestination
  }
)
