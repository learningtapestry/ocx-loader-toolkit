import { api } from "src/app/blitz-server"

import db from "db";
import { randomBytes } from 'crypto';

import { getOAuth2Token } from "src/lib/exporters/repositories/callCanvas"
import ExportDestinationService from "@/src/lib/ExportDestinationService"

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

  const { canvasInstanceId, bundleId } = ExportDestinationService.decodeState<{canvasInstanceId: number, bundleId: number}>(state);

  const canvasInstance = await db.canvasInstance.findFirst({ where: { id: canvasInstanceId } })

  if (!canvasInstance) {
    res.status(400).json({ error: "Canvas instance not found" })
    return
  }

  const response = await getOAuth2Token(canvasInstance, code, canvasInstance.baseUrl)

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

  const bundleExport = await db.bundleExport.create({
    data: {
      name: `Temp ${canvasInstance.name} Export`,
      metadata: {
        courseCode: "test1"
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
