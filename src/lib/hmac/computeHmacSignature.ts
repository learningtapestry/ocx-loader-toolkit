import crypto from "crypto"

export default function computeHmacSignature(timestamp: number, path: string, body: string, secretKey: string): string {
  const data = `${timestamp}${path}${body}`;

  return crypto.createHmac('sha256', secretKey)
    .update(data)
    .digest('hex')
}
