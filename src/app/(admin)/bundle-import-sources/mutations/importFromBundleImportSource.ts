import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { ImportFromBundleImportSourceSchema } from "../schemas"
import LcmsOpenSciEdLegacyImporter from "@/src/lib/importers/LcmsOpenSciEdLegacyImporter"

export default resolver.pipe(
  resolver.zod(ImportFromBundleImportSourceSchema),
  resolver.authorize(),
  async ({ id }) => {
    const bundleImportSource = await db.bundleImportSource.findUnique({ where: { id } })

    if (!bundleImportSource) throw new Error("Bundle Import Source not found")

    const importer = new LcmsOpenSciEdLegacyImporter(bundleImportSource)

    const bundlesToUpdate = await importer.importAllBundlesWithJobs()

    return bundlesToUpdate
  }
)
