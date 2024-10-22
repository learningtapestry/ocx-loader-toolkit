import { resolver } from "@blitzjs/rpc"
import db from "db"
import { CreateCanvasInstanceSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(CreateCanvasInstanceSchema),
  resolver.authorize(),
  async (input) => {
    const canvasInstance = await db.canvasInstance.create({ data: input })
    return canvasInstance
  }
)
