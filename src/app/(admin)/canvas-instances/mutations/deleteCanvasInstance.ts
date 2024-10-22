import { resolver } from "@blitzjs/rpc"
import db from "db"
import { DeleteCanvasInstanceSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(DeleteCanvasInstanceSchema),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const canvasInstance = await db.canvasInstance.deleteMany({ where: { id } })

    return canvasInstance
  }
)
