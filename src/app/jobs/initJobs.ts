import boss from "src/app/jobs/pgBoss"

import ExportBundleJob from "./exportBundleJob"
import ImportBundleJob from "./importBundleJob"
import PeriodicSatchelImportJob from "./periodicSatchelImportJob"

const jobs = [
  ExportBundleJob,
  ImportBundleJob,
  PeriodicSatchelImportJob
]

export async function initPgBoss() {
  await boss.start()

  for (const job of jobs) {
    await boss.createQueue(job.queueName)
  }
}

export async function startWorkers() {
  for (const job of jobs) {
    await job.startWorker()
  }
}

export async function scheduleAllPeriodicJobs() {
  console.log("Scheduling all periodic jobs...")
  
  // Schedule all Satchel periodic imports
  await PeriodicSatchelImportJob.scheduleAllSatchelImports()
  
  console.log("All periodic jobs scheduled")
}
