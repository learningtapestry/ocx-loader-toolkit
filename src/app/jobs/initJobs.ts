import boss from "src/app/jobs/pgBoss"

import ExportBundleJob from "./exportBundleJob"
import ImportBundleJob from "./importBundleJob"

const jobs = [
  ExportBundleJob,
  ImportBundleJob
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
