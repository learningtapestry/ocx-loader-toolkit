import { resolver } from "@blitzjs/rpc"
import db from "db"
import { UpdateCanvasInstanceSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(UpdateCanvasInstanceSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    const canvasInstance = await db.canvasInstance.update({ where: { id }, data })
    return canvasInstance
  }
)
