import { startWorkers } from "./jobs/exportBundleJob";

const start = async () => {
  try {
    await startWorkers();
    console.log("Export bundle workers started");
  } catch (error) {
    console.error("Failed to start export bundle workers:", error);
    process.exit(1);
  }
};

start();
