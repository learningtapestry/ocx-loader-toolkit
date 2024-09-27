import { paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "db"

interface GetExportDestinationsInput
  extends Pick<Prisma.ExportDestinationFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(),
  async ({ where, orderBy, skip = 0, take = 100 }: GetExportDestinationsInput) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const {
      items: exportDestinations,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.exportDestination.count({ where }),
      query: (paginateArgs) => db.exportDestination.findMany({ ...paginateArgs, where, orderBy }),
    })

    return {
      exportDestinations,
      nextPage,
      hasMore,
      count,
    }
  }
)
