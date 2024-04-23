import { resolver } from "@blitzjs/rpc";
import db from "db";
import { LoadBundleSchema } from "../schemas";

import Course from "src/app/ocx/loader/Course";
import { Prisma } from ".prisma/client"

export default resolver.pipe(
  resolver.zod(LoadBundleSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    const bundle = await db.bundle.findFirst({
      where: { id }
    });

    // raise if bundle not found
    if (!bundle) throw new Error("Bundle not found");

    const course = new Course(bundle.name, bundle.sitemapUrl);

    await course.loadData();

    const updatedBundle = await db.bundle.update({
      where: { id },
      data: {
        parsedSitemap: course.sitemap as unknown as Prisma.JsonObject
      }
    });

    console.log(course.nodes);

    return updatedBundle;
  }
);
