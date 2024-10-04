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


// TODO: for production move this to a separate worker
import { startWorkers } from "src/app/jobs/exportBundleJob"
startWorkers().then(() => console.log("Export bundle workers started"))
