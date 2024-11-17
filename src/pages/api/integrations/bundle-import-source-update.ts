import db from "db"

import { api } from "src/app/blitz-server"

import verifyHmacSignature from "src/lib/hmac/verifyHmacSignature"

import { enqueueJob } from "src/app/jobs/importBundleJob"

// example: POST /api/integrations/bundle-import-source-update?bundleImportSourceId=1  payload: { ocxUrl: 'https://example.com/path/to/resource/123?foo=bar' }

export default api(async (req, res, ctx) => {
  const hmacSecret = process.env.HMAC_SECRET!

  const verified = verifyHmacSignature(req, hmacSecret)

  if (!verified) {
    return res.status(401).json({ error: "Invalid HMAC signature" })
  }

  const bundleImportSourceId = Number(req.query.bundleImportSourceId)

  const bundleImportSource = await db.bundleImportSource.findUnique({
    where: { id: bundleImportSourceId },
  })

  if (!bundleImportSource) {
    throw new Error(`Bundle Import Source not found for id: ${bundleImportSourceId}`)
  }

  const ocxUrl = req.body.ocxUrl

  await enqueueJob({ bundleImportSourceId, ocxUrl })

  console.log(`${req.url}: enqueued import job for ${ocxUrl}`)

  return res.json({ message: "Import job enqueued" })
})
