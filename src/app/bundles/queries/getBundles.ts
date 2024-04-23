import { paginate } from "blitz";
import { resolver } from "@blitzjs/rpc";
import db, { Prisma } from "db";

interface GetBundlesInput
  extends Pick<
    Prisma.BundleFindManyArgs,
    "where" | "orderBy" | "skip" | "take"
  > {}

export default resolver.pipe(
  resolver.authorize(),
  async ({ where, orderBy, skip = 0, take = 100 }: GetBundlesInput) => {
    const {
      items: bundles,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.bundle.count({ where }),
      query: (paginateArgs) =>
        db.bundle.findMany({ ...paginateArgs, where, orderBy }),
    });

    return {
      bundles,
      nextPage,
      hasMore,
      count,
    };
  }
);
