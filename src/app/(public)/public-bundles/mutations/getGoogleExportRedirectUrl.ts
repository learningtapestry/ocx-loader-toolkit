import { resolver } from "@blitzjs/rpc";

import { googleOAuth } from "config/secrets";

import ExportDestinationService from "src/lib/ExportDestinationService"
import { googleOAuthAuthLink } from "@/src/lib/exporters/repositories/callGoogleClassroom";

import { GoogleExportBundleSchema } from "../schemas";

export type GoogleExportRedirectResponse = {
  redirectUrl?: string;
  error?: string;
}

export default resolver.pipe(
  resolver.zod(GoogleExportBundleSchema),
  async ({ id, localUrlBase, language }): Promise<GoogleExportRedirectResponse> => {
    if (!googleOAuth.clientId || !googleOAuth.clientSecret) {
      return { error: "Google Classroom export is not configured on this server." }
    }

    const state = ExportDestinationService.encodeState({
      bundleId: id,
      language: language || "en",
      localUrlBase,
    });

    const redirectUri = `${localUrlBase}/api/google-classroom-oauth-export-callback`;
    const authUrl = googleOAuthAuthLink(state, redirectUri);

    return { redirectUrl: authUrl }
  }
)
