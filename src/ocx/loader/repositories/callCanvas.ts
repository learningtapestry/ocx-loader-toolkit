import { HttpError } from "../types";

// const canvasBaseURL = 'https://canvas.instructure.com';
// const canvasAccessToken = '6936~BkIi8Lxs7qM9pWAITibFTmTcxKSOtxIK9LKOOZ15p6dwPEpQirrYzcvxzjMtAzxl';

const canvasBaseURL = 'http://ec2-3-82-213-67.compute-1.amazonaws.com';
const canvasAccessToken = 'rdcwb0qHrgR4jK0N7vARTRjuyoD3HvTQxo225RE5qdgVEgSibEfK2UCI1gazJ2xx';

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
