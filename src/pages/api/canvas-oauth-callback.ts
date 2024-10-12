import { api } from "src/app/blitz-server"
import { getSession } from "@blitzjs/auth"

import db from "db";

import { StateEncoder } from "src/app/export-destinations/mutations/generateCanvasOAuth2ExportDestinationUrl"

export default api(async (req, res) => {
  const { code, state } = req.query
  const session = await getSession(req, res)
  const userId = session.userId

  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Missing code parameter" })
    return
  }

  if (!state || typeof state !== "string") {
    res.status(400).json({ error: "Missing state parameter" })
    return
  }

  const { name, canvasInstanceId, baseUrl } = StateEncoder.decodeState(state);

  const canvasInstance = await db.canvasInstance.findFirst({ where: { id: canvasInstanceId } })

  if (!canvasInstance) {
    res.status(400).json({ error: "Canvas instance not found" })
    return
  }

  // get the Canvas access token
  const response = await fetch(`${canvasInstance.baseUrl}/login/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: canvasInstance.clientId,
      client_secret: canvasInstance.clientSecret,
      redirect_uri: `${baseUrl}/api/canvas-oauth-callback`,
      code,
    }),
  })

  if (!response.ok) {
    res.status(400).json({ error: "Failed to get Canvas access token" })
    return
  }

  const { access_token, refresh_token, expires_in } = await response.json()

  const exportDestination = await db.exportDestination.create({
    data: {
      name,
      type: "canvas-oauth2",
      baseUrl: canvasInstance.baseUrl,
      canvasInstanceId,
      userId,
      metadata: {
        accessToken: access_token,
        refreshToken: refresh_token,
        accessTokenExpiry: new Date(Date.now() + expires_in * 1000),
      },
    },
  })

  res.redirect(`/export-destinations/${exportDestination.id}`)
})
