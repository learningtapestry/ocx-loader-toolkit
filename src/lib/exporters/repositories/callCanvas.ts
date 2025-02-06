import { CanvasInstance, Prisma } from "@prisma/client"
import airbrake from "config/airbrake"

export class HttpError extends Error {
  description: string = '';
  readonly path: string;
  readonly status: number;

  constructor(
    description: string,
    message: string,
    path: string,
    status: number
  ) {
    super(message);

    this.description = description;
    this.name = this.constructor.name;
    this.path = path;
    this.status = status;
  }
}

export default async function callCanvas(
  baseUrl: string,
  accessToken: string,
  path: string,
  method = 'GET',
  body = {}
) {
  const url = /^https?:\/\//i.test(path)
    ? path
    : new URL(`api/v1/${path}`, baseUrl);

  const fetchWithAuthorization = async () => {
    const response = await fetch(url, {
      body: method === 'GET' ? undefined : JSON.stringify(body),
      method: method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new HttpError(`${method} url: ${url}`, response.statusText, path, response.status);
    }

    return response;
  }

  try {
    const response = await fetchWithAuthorization();

    return await response.json();
  } catch (e: any) {
    if (e instanceof HttpError) {
      console.log("Retrying once due to HttpError:", e);
      airbrake?.notify(e);

      await new Promise(r => setTimeout(r, 1000));

      // if this fails again, the exception will propagate
      const response = await fetchWithAuthorization();

      return await response.json();
    } else {
      throw e;
    }
  }
}

export async function uploadFileToCanvasCourse(baseUrl: string,
                                     accessToken: string,
                                     courseId: number,
                                     blob: Blob,
                                     name = (blob as File).name,
                                     parentFolderPath = '/'): Promise<Response> {
  const fileUploadParams = await callCanvas(baseUrl, accessToken, `courses/${courseId}/files`, 'POST', {
    name: name,
    size: blob.size,
    content_type: blob.type,
    parent_folder_path: parentFolderPath
  });

  if (!fileUploadParams.upload_url) {
    throw new Error('Upload failed');
  }

  return await finalizeCanvasFileUpload(fileUploadParams, blob, name);
}

export type CanvasFileUploadParams = {
  upload_url: string,
  upload_params: Prisma.JsonObject
}

export async function finalizeCanvasFileUpload(fileUploadParams: CanvasFileUploadParams, blob: Blob, name: string) {
  const formData = new FormData();

  Object.entries(fileUploadParams.upload_params).forEach(([key, value]) => {
    formData.append(key, value as string);
  });

  formData.append('file', blob, name);

  return await fetch(fileUploadParams.upload_url, {
    method: 'POST',
    body: formData
  });
}

type CanvasInstanceLike = {
  baseUrl: string,
  clientId: string,
  clientSecret: string,
}

export async function getOAuth2Token(canvasInstance: CanvasInstance | CanvasInstanceLike, code: string, baseUrl: string) {
  return fetch(`${canvasInstance.baseUrl}/login/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: canvasInstance.clientId,
      client_secret: canvasInstance.clientSecret,
      redirect_uri: `${baseUrl}/api/canvas-oauth-callback`,
      code: code,
    }),
  });
}

export const scopeUrls = [
  // Assigments
  "url:POST|/api/v1/courses/:course_id/assignments",
  // Content Migrations
  "url:POST|/api/v1/courses/:course_id/content_migrations",
  // Courses
  "url:GET|/api/v1/courses",
  "url:GET|/api/v1/courses/:id",
  "url:POST|/api/v1/accounts/:account_id/courses",
  "url:POST|/api/v1/courses/:course_id/files",
  // Discussion Topics
  "url:POST|/api/v1/courses/:course_id/discussion_topics",
  // Modules
  "url:POST|/api/v1/courses/:course_id/modules",
  "url:POST|/api/v1/courses/:course_id/modules/:module_id/items",
  // Progress
  "url:GET|/api/v1/progress/:id",
  // Quiz Questions
  "url:POST|/api/v1/courses/:course_id/quizzes/:quiz_id/questions",
  // Quizzes
  "url:GET|/api/v1/courses/:course_id/quizzes",
  "url:PUT|/api/v1/courses/:course_id/quizzes/:id",
]

export function oauth2AuthLink(canvasInstance: CanvasInstance | CanvasInstanceLike, state: string, redirectUrl: string) {
  return `${canvasInstance.baseUrl}/login/oauth2/auth?client_id=${
    canvasInstance.clientId
  }&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUrl
  )}&state=${
    state
  }&scope=${
    scopeUrls.join(" ")
  }`
}
