import { describe, it, expect } from "vitest";
import computeHmacSignature from "../computeHmacSignature";
import verifyHmacSignature from "../verifyHmacSignature";
import { NextApiRequest } from "next"

describe('verifyHmacSignature', () => {
  it('should verify hmac signature', () => {
    const timestamp = 1234567890;
    const path = '/path/to/resource';
    const body = 'body';
    const secret = 'secret';

    const signature = computeHmacSignature(timestamp, path, body, secret);

    const req = {
      headers: {
        'x-hmac-signature': signature,
        'x-timestamp': timestamp,
      },
      url: path,
      body: body,
      method: 'POST',
      query: {},
      cookies: {},
    } as unknown as NextApiRequest;

    const verified = verifyHmacSignature(req, secret);

    expect(verified).toBeTruthy();
  });

  it('should return false for invalid signature', () => {
    const timestamp = 1234567890;
    const path = '/path/to/resource';
    const body = 'body';
    const secret = 'secret';

    const signature = computeHmacSignature(timestamp, path, body, secret);

    const req = {
      headers: {
        'x-hmac-signature': signature + 'x', // Invalid signature
        'x-timestamp': timestamp,
      },
      url: path,
      body: body,
      method: 'POST',
      query: {},
      cookies: {},
    } as unknown as NextApiRequest;

    const verified = verifyHmacSignature(req, secret);

    expect(verified).toBeFalsy();
  });

  it('should return false for missing signature or timestamp', () => {
    const req = {
      headers: {},
      url: '/path/to/resource',
      body: 'body',
      method: 'POST',
      query: {},
      cookies: {},
    } as unknown as NextApiRequest;

    const verified = verifyHmacSignature(req, 'secret');

    expect(verified).toBeFalsy();
  });

  it('should work when the body is a JSON object', () => {
    const timestamp = 1234567890;
    const path = '/api/endpoint';
    const body = { key: 'value', number: 123 };
    const secret = 'jsonSecret';

    const signature = computeHmacSignature(timestamp, path, JSON.stringify(body), secret);

    const req = {
      headers: {
        'x-hmac-signature': signature,
        'x-timestamp': timestamp,
      },
      url: path,
      body: body,
      method: 'POST',
      query: {},
      cookies: {},
    } as unknown as NextApiRequest;

    const verified = verifyHmacSignature(req, secret);

    expect(verified).toBeTruthy();
  });
});
