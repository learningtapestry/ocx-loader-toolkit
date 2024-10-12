import airbrake from "config/airbrake"

import { startWorkers } from "./jobs/exportBundleJob";

const start = async () => {
  try {
    await startWorkers();
    console.log("Export bundle workers started");
  } catch (error) {
    console.error("Failed to start export bundle workers:", error);
    await airbrake?.notify(error);
    process.exit(1);
  }
};

start();
