import computeHmacSignature from "./computeHmacSignature"
import { timingSafeEqual } from "crypto"
import { NextApiRequest } from "next"
import { parse } from 'url';

export default function verifyHmacSignature(req: NextApiRequest, secretKey: string): boolean {
  const providedSignature = req.headers['x-hmac-signature'] as string;
  const timestamp = req.headers['x-timestamp'] as string;

  if (!providedSignature || !timestamp) {
    return false;
  }

  const url = req.url || '';
  const { pathname: path } = parse(url, true);

  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || '');

  const computedSignature = computeHmacSignature(parseInt(timestamp), path || '', body, secretKey);

  try {
    return timingSafeEqual(Buffer.from(providedSignature, 'utf8'), Buffer.from(computedSignature, 'utf8'));
  } catch (error) {
    return false;
  }
}
