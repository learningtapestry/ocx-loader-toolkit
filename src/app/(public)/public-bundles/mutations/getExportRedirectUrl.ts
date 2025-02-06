import { resolver } from "@blitzjs/rpc";
import { ExportBundleSchema } from "../schemas";

import ExportDestinationService from "src/lib/ExportDestinationService"
import { scopeUrls, oauth2AuthLink } from "@/src/lib/exporters/repositories/callCanvas";

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

      const authUrl = oauth2AuthLink(canvasInstance, state, `${localUrlBase}/api/canvas-oauth-export-callback`);

      return { redirectUrl: authUrl }
    } else {
      return { error: `This Canvas instance has not yet been approved. Ask your Canvas administrator to visit ${process.env.GUIDE_FOR_CANVAS_INSTANCE_ADMNISTRATOR_URL} to add a Developer Key.` }
    }
  }
)
