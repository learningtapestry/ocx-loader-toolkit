import { resolver } from "@blitzjs/rpc";
import { ExportBundleSchema } from "../schemas";

import ExportDestinationService from "src/lib/ExportDestinationService"

export type ExportRedirectResponse = {
  redirectUrl?: string;
  error?: string;
}

export default resolver.pipe(
  resolver.zod(ExportBundleSchema),
  async ({ id, canvasUrl, localUrlBase, language, ...data }, ctx) : Promise<ExportRedirectResponse> => {
    const canvasInstance = await ExportDestinationService.findPublicCanvasInstanceByUrl(canvasUrl);

    if (canvasInstance) {
      const state = ExportDestinationService.encodeState({
        canvasInstanceId: canvasInstance.id,
        bundleId: id,
        language: language || "en",
      });

      const authUrl = `${canvasInstance.baseUrl}/login/oauth2/auth?client_id=${
        canvasInstance.clientId
      }&response_type=code&redirect_uri=${encodeURIComponent(
        `${localUrlBase}/api/canvas-oauth-export-callback`
      )}&state=${state}`

      return { redirectUrl: authUrl }
    } else {
      return { error: "Canvas instance not found" }
    }
  }
)
