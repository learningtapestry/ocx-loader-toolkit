import { resolver } from "@blitzjs/rpc";
import { z } from "zod";

const GetClientInfoVarsInput = z.object({}); // No input for now

export type ClientInfoVarsResponse = {
  clientName?: string;
  canvasLoaderAdministratorUrl?: string;
}

export default resolver.pipe(
  resolver.zod(GetClientInfoVarsInput.optional()),
  async (_, ctx) : Promise<ClientInfoVarsResponse> => {
    return {
      clientName: process.env.CLIENT_NAME || "",
      canvasLoaderAdministratorUrl: process.env.CANVAS_LOADER_ADMINISTRATOR_URL || "",
    };
  }
);
