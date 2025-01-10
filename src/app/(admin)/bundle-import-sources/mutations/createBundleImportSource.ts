import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { CreateBundleImportSourceSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(CreateBundleImportSourceSchema),
  resolver.authorize(),
  async (input) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const bundleImportSource = await db.bundleImportSource.create({ data: input })

    return bundleImportSource
  }
)
