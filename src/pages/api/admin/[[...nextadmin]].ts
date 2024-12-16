import prisma from "../../../../prisma";
import { createHandler } from "@premieroctet/next-admin/pageHandler";
import options from "./pageRouterOptions";

import { invoke } from "src/app/blitz-server"
import getCurrentUser from "../../../app/(admin)/users/queries/getCurrentUser";
 
export const config = {
  api: {
    bodyParser: false,
  },
};
 
const { run } = createHandler({
  apiBasePath: "/api/admin",
  prisma,
  options,
  // onRequest: async (req) => {
  //   const currentUser = await invoke(getCurrentUser, null);

  //   if (!currentUser) {
  //     throw new Error('Forbidden');
  //   }
  // }
});
 
export default run;
