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
  logger: BlitzLogger({}),
})

export {api, getBlitzContext, useAuthenticatedBlitzContext, invoke}

// initialize the background job queue
import { initPgBoss, startWorkers } from "src/app/jobs/exportBundleJob"

initPgBoss();

// in production we start the workers in a separate process
if (process.env.NODE_ENV === "development") {
  startWorkers().then(() => console.log("Export bundle workers started"))
}

