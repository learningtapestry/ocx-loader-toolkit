import { Notifier } from '@airbrake/node';

let airbrake = process.env.AIRBRAKE_PROJECT_ID ? new Notifier({
  projectId: parseInt(process.env.AIRBRAKE_PROJECT_ID!),
  projectKey: process.env.AIRBRAKE_PROJECT_KEY!,
  environment: process.env.NODE_ENV
}) : null;

if (!airbrake) {
  console.log("Airbrake is not configured");
}

export default airbrake;
