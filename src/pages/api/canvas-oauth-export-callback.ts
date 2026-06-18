import { api } from "src/app/blitz-server"
import { getSession } from "@blitzjs/auth"

import db from "db";
import { randomBytes } from 'crypto';

import { getOAuth2Token } from "src/lib/exporters/repositories/callCanvas"
import ExportDestinationService from "src/lib/ExportDestinationService"
import { StateEncoder } from "src/app/(admin)/export-destinations/mutations/generateCanvasOAuth2ExportDestinationUrl"

import { languages } from "src/constants/languages";
import { JsonObject } from "@prisma/client/runtime/library";
import { resolveExportCourseName } from "src/lib/ocx10/toLegacyExportView"

function toolkitBaseUrlFromRequest(req: { headers: Record<string, string | string[] | undefined> }) {
  const host = req.headers.host
  const protocol = req.headers['x-forwarded-proto'] || 'http'

  return `${protocol}://${host}`
}

export default api(async (req, res) => {
  const { code, state } = req.query

  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Missing code parameter" })
    return
  }

  if (!state || typeof state !== "string") {
    res.status(400).json({ error: "Missing state parameter" })
    return
  }

  // Admin export destination setup (reusable canvas-oauth2)
  try {
    const adminState = StateEncoder.decodeState(state)

    if (adminState.name && adminState.baseUrl && adminState.canvasInstanceId && adminState.bundleId === undefined) {
      const session = await getSession(req, res)
      const userId = session.userId

      const canvasInstance = await db.canvasInstance.findFirst({
        where: { id: adminState.canvasInstanceId },
      })

      if (!canvasInstance) {
        res.status(400).json({ error: "Canvas instance not found" })
        return
      }

      const callbackPath = adminState.callbackPath || '/api/canvas-oauth-export-callback'

      const response = await getOAuth2Token(
        canvasInstance,
        code,
        adminState.baseUrl,
        callbackPath,
      )

      if (!response.ok) {
        res.status(400).json({ error: "Failed to get Canvas access token" })
        return
      }

      const { access_token, refresh_token, expires_in } = await response.json()

      const exportDestination = await db.exportDestination.create({
        data: {
          name: adminState.name,
          type: "canvas-oauth2",
          baseUrl: canvasInstance.baseUrl,
          canvasInstanceId: adminState.canvasInstanceId,
          userId,
          metadata: {
            accessToken: access_token,
            refreshToken: refresh_token,
            accessTokenExpiry: new Date(Date.now() + expires_in * 1000),
          },
        },
      })

      res.redirect(`/export-destinations/${exportDestination.id}`)
      return
    }
  } catch {
    // fall through to public bundle export flow
  }

  const { canvasInstanceId, bundleId, language } = ExportDestinationService.decodeState<{canvasInstanceId: number, bundleId: number, language: string}>(state);

  const canvasInstance = await db.canvasInstance.findFirst({ where: { id: canvasInstanceId } })

  if (!canvasInstance) {
    res.status(400).json({ error: "Canvas instance not found" })
    return
  }

  const toolkitBaseUrl = toolkitBaseUrlFromRequest(req)

  const response = await getOAuth2Token(
    canvasInstance,
    code,
    toolkitBaseUrl,
    '/api/canvas-oauth-export-callback',
  )

  if (!response.ok) {
    res.status(400).json({ error: "Failed to get Canvas access token" })
    return
  }

  const { access_token, refresh_token, expires_in } = await response.json()

  const exportDestination = await db.exportDestination.create({
    data: {
      name: `Temp ${canvasInstance.name} Export Destination`,
      type: "canvas-oauth2-temp",
      baseUrl: canvasInstance.baseUrl,
      canvasInstanceId,
      metadata: {
        accessToken: access_token,
        refreshToken: refresh_token,
        accessTokenExpiry: new Date(Date.now() + expires_in * 1000),
      },
    },
  })

  // create a random token
  const token = randomBytes(32).toString('hex');

  const bundle = await db.bundle.findFirst({
    where: {
      id: bundleId,
    },
    include: {
      nodes: true,
    },
  });
  const languageDescription = language !== 'en' && languages[language] ? ` [${languages[language]}]` : '';
  const courseName = resolveExportCourseName(bundle!, languageDescription);

  const bundleExport = await db.bundleExport.create({
    data: {
      name: `Temp ${canvasInstance.name} Export`,
      metadata: {
        courseName: courseName,
        courseCode: "test1",
        language: language || "en",
      },
      token: token,
      bundle: {
        connect: {
          id: bundleId,
        },
      },
      exportDestination: {
        connect: {
          id: exportDestination.id,
        },
      },
      state: 'waiting_user_input'
    },
  });

  // Redirect to the new page instead of creating a bundleExport
  res.redirect(`/public-bundle-exports/${bundleExport.id}?token=${token}`)
})
