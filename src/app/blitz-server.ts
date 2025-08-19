import {setupBlitzServer} from "@blitzjs/next"
import {AuthServerPlugin, PrismaStorage, simpleRolesIsAuthorized} from "@blitzjs/auth"
import db from "db"
import {BlitzLogger} from "blitz"
import {RpcServerPlugin} from "@blitzjs/rpc"
import {authConfig} from "./blitz-auth-config"

const {api, getBlitzContext, useAuthenticatedBlitzContext, invoke} = setupBlitzServer({
  plugins: [
    AuthServerPlugin({
      ...authConfig,
      storage: PrismaStorage(db),
      isAuthorized: simpleRolesIsAuthorized,
    }),
    RpcServerPlugin({}),
  ],
  logger: BlitzLogger({})
})

export {api, getBlitzContext, useAuthenticatedBlitzContext, invoke}

// initialize the background job queue
import { initPgBoss, startWorkers, scheduleAllPeriodicJobs } from "src/app/jobs/initJobs";

initPgBoss();

// in production we start the workers in a separate process
if (process.env.NODE_ENV === "development") {
  startWorkers().then(() => console.log("Export bundle workers started"))
}

// Schedule all periodic jobs at startup
// Disabled for now as we need to test race conditions and singleton behavior of pg-boss
// scheduleAllPeriodicJobs().then(() => console.log("All periodic jobs scheduled"))

