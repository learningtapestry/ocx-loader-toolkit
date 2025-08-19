import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { z } from "zod"
import SatchelImporter from "src/lib/importers/SatchelImporter"

const TriggerSatchelImportSchema = z.object({
  bundleImportSourceId: z.number(),
})

export default resolver.pipe(
  resolver.zod(TriggerSatchelImportSchema),
  resolver.authorize(),
  async (input) => {
    const bundleImportSource = await db.bundleImportSource.findUnique({
      where: {
        id: input.bundleImportSourceId
      }
    })

    if (!bundleImportSource) {
      throw new Error("Bundle import source not found")
    }

    if (bundleImportSource.type !== "satchel") {
      throw new Error("This import source is not a Satchel type")
    }

    const importer = new SatchelImporter(bundleImportSource)
    const result = await importer.importBundle()

    return result
  }
) 