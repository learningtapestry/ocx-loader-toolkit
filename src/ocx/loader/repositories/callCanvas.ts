import { HttpError } from "../types";

export default async function callCanvas(
  baseUrl: string,
  accessToken: string,
  path: string,
  method = 'GET',
  body = {}
) {
  const url = /^https?:\/\//i.test(path)
    ? path
    : new URL(`api/v1/${path}?per_page=100`, baseUrl);

  try {
    const response = await fetch(url, {
      body: method === 'GET' ? undefined : JSON.stringify(body),
      method: method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new HttpError('', response.statusText, path, response.status);
    }

    return await response.json();
  } catch (e: any) {
    throw e;
  }
}
