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
      canvasLoaderAdministratorUrl: process.env.GUIDE_FOR_CANVAS_INSTANCE_ADMNISTRATOR_URL || "",
    };
  }
);
