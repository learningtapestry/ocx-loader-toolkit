import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { DeleteBundleImportSourceSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(DeleteBundleImportSourceSchema),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const bundleImportSource = await db.bundleImportSource.deleteMany({ where: { id } })

    return bundleImportSource
  }
)
