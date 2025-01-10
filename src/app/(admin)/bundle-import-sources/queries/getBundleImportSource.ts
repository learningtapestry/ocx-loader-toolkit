import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { z } from "zod"

const GetBundleImportSource = z.object({
  // This accepts type of undefined, but is required at runtime
  id: z.number().optional().refine(Boolean, "Required"),
})

export default resolver.pipe(
  resolver.zod(GetBundleImportSource),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const bundleImportSource = await db.bundleImportSource.findFirst({ where: { id } })

    if (!bundleImportSource) throw new NotFoundError()

    return bundleImportSource
  }
)
