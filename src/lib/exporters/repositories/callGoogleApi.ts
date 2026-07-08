export class GoogleApiError extends Error {
  status: number

  constructor(method: string, path: string, status: number, text: string) {
    super(`Google API ${method} ${path} failed: ${status} ${text}`)
    this.name = "GoogleApiError"
    this.status = status
  }
}

export default async function callGoogleApi(
  accessToken: string,
  baseUrl: string,
  path: string,
  method = "GET",
  body?: object,
) {
  const url = /^https?:\/\//i.test(path) ? path : `${baseUrl}/${path}`

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new GoogleApiError(method, path, response.status, text)
  }

  if (response.status === 204) {
    return undefined
  }

  const text = await response.text()
  return text ? JSON.parse(text) : undefined
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
