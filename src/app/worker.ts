import airbrake from "config/airbrake"

import { initPgBoss, startWorkers } from "./jobs/initJobs";

const start = async () => {
  try {
    await initPgBoss();
    await startWorkers();
    console.log("Export bundle workers started");
  } catch (error) {
    console.error("Failed to start export bundle workers:", error);
    await airbrake?.notify(error);
    process.exit(1);
  }
};

start();
