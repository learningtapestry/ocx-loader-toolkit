import { paginate } from "blitz";
import { resolver } from "@blitzjs/rpc";
import db, { Prisma } from "db";

interface GetNodesInput
  extends Pick<
    Prisma.NodeFindManyArgs,
    "where" | "orderBy" | "skip" | "take"
  > {}

export default resolver.pipe(
  resolver.authorize(),
  async ({ where, orderBy, skip = 0, take = 100 }: GetNodesInput) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const {
      items: nodes,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.node.count({ where }),
      query: (paginateArgs) =>
        db.node.findMany({ ...paginateArgs, where, orderBy }),
    });

    return {
      nodes,
      nextPage,
      hasMore,
      count,
    };
  }
);
