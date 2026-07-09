import { api } from "src/app/blitz-server"

import db from "db"
import { randomBytes } from "crypto"

import { formatCourseNameWithLanguage } from "src/constants/languages"
import { getGoogleOAuth2Token } from "src/lib/exporters/repositories/callGoogleClassroom"
import ExportDestinationService from "src/lib/ExportDestinationService"

import { JsonObject } from "@prisma/client/runtime/library"

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

  const { bundleId, language, localUrlBase } = ExportDestinationService.decodeState<{
    bundleId: number
    language: string
    localUrlBase: string
  }>(state)

  const redirectUri = `${localUrlBase}/api/google-classroom-oauth-export-callback`
  const response = await getGoogleOAuth2Token(code, redirectUri)

  if (!response.ok) {
    res.status(400).json({ error: "Failed to get Google access token" })
    return
  }

  const { access_token, refresh_token, expires_in } = await response.json()

  const exportDestination = await db.exportDestination.create({
    data: {
      name: "Temp Google Classroom Export Destination",
      type: "google-classroom-oauth2-temp",
      baseUrl: "https://classroom.googleapis.com",
      metadata: {
        accessToken: access_token,
        refreshToken: refresh_token,
        accessTokenExpiry: new Date(Date.now() + expires_in * 1000).toISOString(),
      },
    },
  })

  const token = randomBytes(32).toString("hex")

  const bundle = await db.bundle.findFirst({
    where: {
      id: bundleId,
    },
  })
  const courseName = formatCourseNameWithLanguage(
    (bundle?.importMetadata as JsonObject)?.full_course_name as string,
    language || "en",
  )

  const bundleExport = await db.bundleExport.create({
    data: {
      name: "Temp Google Classroom Export",
      metadata: {
        courseName,
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
      state: "waiting_user_input",
    },
  })

  res.redirect(`/public-bundle-exports-gc/${bundleExport.id}?token=${token}`)
})
