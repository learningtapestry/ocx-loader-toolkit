import computeHmacSignature from "./computeHmacSignature"
import { timingSafeEqual } from "crypto"

export default function verifyHmacSignature(req: any, secretKey: string): boolean {
  const providedSignature = req.headers['x-hmac-signature']
  const timestamp = req.headers['x-timestamp']

  if (!providedSignature || !timestamp) {
    return false
  }

  // For POST requests, req.body might be already parsed as JSON
  // We need to ensure we're using the raw string for signature verification
  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)

  const computedSignature = computeHmacSignature(timestamp.toString(), req.path, body, secretKey)

  return timingSafeEqual(
    Buffer.from(providedSignature),
    Buffer.from(computedSignature)
  )
}
