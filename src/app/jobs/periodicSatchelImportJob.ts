import db from "db"
import boss from "./pgBoss"
import airbrake from "config/airbrake"
import SatchelImporter from "src/lib/importers/SatchelImporter"
import { sendEmail } from 'src/lib/email/EmailService'

export type PeriodicSatchelImportJobData = {
  bundleImportSourceId: number
  intervalMinutes: number
}

export const queueName = "periodic-satchel-import"

export async function startWorker() {
  console.log("Starting periodicSatchelImportJob worker")

  boss.work<PeriodicSatchelImportJobData>(queueName, async ([job]) => {
    const { bundleImportSourceId, intervalMinutes } = job.data

    console.log(`[${bundleImportSourceId}] Starting periodic import`)

    try {
      const bundleImportSource = await db.bundleImportSource.findUnique({
        where: {
          id: bundleImportSourceId
        }
      })

      if (!bundleImportSource) {
        throw new Error(`Bundle import source not found: ${bundleImportSourceId}`)
      }

      if (bundleImportSource.type !== "satchel") {
        throw new Error(`Unsupported bundle import source type: ${bundleImportSource.type}`)
      }

      const importer = new SatchelImporter(bundleImportSource)
      await importer.importBundle()

      console.log(`[${bundleImportSourceId}] Finished periodic import`)
    } catch (e) {
      console.error(`[${bundleImportSourceId}] Error in periodic import:`, e)

      // Get the import source for error reporting
      const bundleImportSource = await db.bundleImportSource.findUnique({
        where: { id: bundleImportSourceId }
      })

      await sendEmail({
        to: process.env.NOTIFICATION_EMAIL!,
        subject: 'Periodic Satchel Import Failed',
        body: `Failed to import from base URL: ${bundleImportSource?.baseUrl || 'unknown'}\nError: ${(e as Error).message}`
      })

      await airbrake?.notify(e)
      throw e
    }
  })
}

export async function enqueueJob(data: PeriodicSatchelImportJobData) {
  await boss.send(queueName, data)
}

export async function schedulePeriodicImport(
  bundleImportSourceId: number,
  intervalMinutes: string = "60"
) {
  // Schedule the job using pg-boss schedule
  const scheduleName = `satchel-import-${bundleImportSourceId}`
  
  await boss.schedule(scheduleName, `${intervalMinutes} minutes`, {
    bundleImportSourceId,
    intervalMinutes
  })

  console.log(`Scheduled periodic import for bundle import source ${bundleImportSourceId} every ${intervalMinutes} minutes`)
}

export async function unschedulePeriodicImport(bundleImportSourceId: number) {
  const scheduleName = `satchel-import-${bundleImportSourceId}`
  
  try {
    await boss.unschedule(scheduleName)
    console.log(`Unscheduled periodic import for bundle import source ${bundleImportSourceId}`)
  } catch (e) {
    console.error(`Failed to unschedule periodic import for bundle import source ${bundleImportSourceId}:`, e)
  }
}

export async function scheduleAllSatchelImports() {
  console.log("Scheduling all Satchel periodic imports...")
  
  const satchelImportSources = await db.bundleImportSource.findMany({
    where: {
      type: "satchel"
    }
  })

  for (const importSource of satchelImportSources) {
    const accessData = importSource.accessData as any
    const intervalMinutes = accessData?.interval_minutes || 60

    // Schedule all Satchel sources (baseUrl is required for all import sources)
    await schedulePeriodicImport(importSource.id, intervalMinutes)
  }

  console.log(`Scheduled ${satchelImportSources.length} Satchel periodic imports`)
}

const PeriodicSatchelImportJob = {
  startWorker,
  queueName,
  enqueueJob,
  schedulePeriodicImport,
  unschedulePeriodicImport,
  scheduleAllSatchelImports
}

export default PeriodicSatchelImportJob 