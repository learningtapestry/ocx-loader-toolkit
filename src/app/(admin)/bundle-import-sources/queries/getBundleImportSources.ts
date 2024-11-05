import { paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "@/db"

interface GetBundleImportSourcesInput
  extends Pick<Prisma.BundleImportSourceFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(),
  async ({ where, orderBy, skip = 0, take = 100 }: GetBundleImportSourcesInput) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const {
      items: bundleImportSources,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.bundleImportSource.count({ where }),
      query: (paginateArgs) => db.bundleImportSource.findMany({ ...paginateArgs, where, orderBy }),
    })

    return {
      bundleImportSources,
      nextPage,
      hasMore,
      count,
    }
  }
)
