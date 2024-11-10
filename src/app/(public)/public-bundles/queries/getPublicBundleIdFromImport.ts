import db from "db"

import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"

import { z } from "zod"

import LcmsOpenSciEdLegacyImporter from "src/lib/importers/LcmsOpenSciEdLegacyImporter"

const GetPublicBundleIdFromImport = z.object({
  bundleImportSourceId: z.number(),
  coordinates: z.array(z.string()),
})

export default resolver.pipe(
  resolver.zod(GetPublicBundleIdFromImport),
  async ({ bundleImportSourceId, coordinates }) => {
    console.log('getPublicBundleFromImport', bundleImportSourceId, coordinates);

    const bundleImportSource = await db.bundleImportSource.findFirst({
      where: { id: bundleImportSourceId },
    })

    if (!bundleImportSource) throw new NotFoundError()

    switch (bundleImportSource.type) {
      case 'lcms-legacy-ose':
        const bundle = await LcmsOpenSciEdLegacyImporter.findBundleByCoordinates(bundleImportSource, coordinates)

        return bundle!.prismaBundle.id
      default:
        throw new Error(`Unsupported bundle import source type: ${bundleImportSource.type}`)
    }
  }
);
