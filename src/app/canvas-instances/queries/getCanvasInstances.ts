import { paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "db"

interface GetCanvasInstancesInput
  extends Pick<Prisma.CanvasInstanceFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(),
  async ({ where, orderBy, skip = 0, take = 100 }: GetCanvasInstancesInput) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const {
      items: canvasInstances,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.canvasInstance.count({ where }),
      query: (paginateArgs) => db.canvasInstance.findMany({ ...paginateArgs, where, orderBy }),
    })

    return {
      canvasInstances,
      nextPage,
      hasMore,
      count,
    }
  }
)
