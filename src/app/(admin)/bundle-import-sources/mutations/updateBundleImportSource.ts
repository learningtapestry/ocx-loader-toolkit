import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { UpdateBundleImportSourceSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(UpdateBundleImportSourceSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const bundleImportSource = await db.bundleImportSource.update({ where: { id }, data })

    return bundleImportSource
  }
)
