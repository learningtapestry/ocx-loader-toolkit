import { Prisma } from "@prisma/client"

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

