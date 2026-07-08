import { googleOAuth } from "config/secrets"

import callGoogleApi, { GoogleApiError } from "./callGoogleApi"

export { GoogleApiError }

// TODO(refactor): document courseworkmaterials scope in phase plan — required for courseWorkMaterials.create
export const GOOGLE_CLASSROOM_SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses",
  "https://www.googleapis.com/auth/classroom.coursework.students",
  "https://www.googleapis.com/auth/classroom.courseworkmaterials",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/forms.body",
]

const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_CLASSROOM_API_BASE = "https://classroom.googleapis.com/v1"

export function googleOAuthAuthLink(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: googleOAuth.clientId!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_CLASSROOM_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `${GOOGLE_OAUTH_AUTH_URL}?${params.toString()}`;
}

export async function getGoogleOAuth2Token(code: string, redirectUri: string) {
  return fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: googleOAuth.clientId!,
      client_secret: googleOAuth.clientSecret!,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
}

export async function refreshGoogleOAuth2Token(refreshToken: string) {
  return fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: googleOAuth.clientId!,
      client_secret: googleOAuth.clientSecret!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
}

export default async function callGoogleClassroomApi(
  accessToken: string,
  path: string,
  method = "GET",
  body?: object,
) {
  return callGoogleApi(accessToken, GOOGLE_CLASSROOM_API_BASE, path, method, body)
}
