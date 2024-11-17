import { describe, it, expect } from "vitest"

import computeHmacSignature from "../computeHmacSignature"

describe('computeHmacSignature', () => {
  it('should compute hmac signature', () => {
    const timestamp = 1234567890
    const path = '/path/to/resource'
    const body = 'body'

    const secret = 'secret'

    const signature = computeHmacSignature(timestamp, path, body, secret)

    expect(signature).toEqual('22e30670719026495ea8ef4403d6c98e773fd51b0cfb4b77d9e46def811c9a06')
  })
})
