import db from "db"

import boss from "./pgBoss"
import airbrake from "config/airbrake"

import LcmsOpenSciEdLegacyImporter from "src/lib/importers/LcmsOpenSciEdLegacyImporter"

export type ImportBundleJobData = {
  bundleImportSourceId: number
  ocxUrl: string
}

export const queueName = "import-bundle"

export async function startWorker() {
  console.log("Starting importBundleJob worker")

  boss.work<ImportBundleJobData>(queueName, async ([job]) => {
    const { bundleImportSourceId, ocxUrl } = job.data

    console.log(`[${bundleImportSourceId}, ${ocxUrl}] Starting import`)

    try {
      const bundleImportSource = await db.bundleImportSource.findUnique({
        where: {
          id: bundleImportSourceId
        }
      })

      switch(bundleImportSource?.type) {
        case "lcms-legacy-ose":
          const importer = new LcmsOpenSciEdLegacyImporter(bundleImportSource)
          await importer.importBundle(ocxUrl)

          break
        default:
          throw new Error(`Unsupported bundle import source type: ${bundleImportSource?.type}`)
      }
    } catch (e) {
      console.error(`${bundleImportSourceId}, ocxUrl: ${ocxUrl}] Error importing bundle:`, e)
      await airbrake?.notify(e)
      throw e
    }
  })
}

export async function enqueueJob(data: ImportBundleJobData) {
  await boss.send(queueName, data)
}

const ImportBundleJob = {
  startWorker,
  queueName,
  enqueueJob,
}

export default ImportBundleJob
