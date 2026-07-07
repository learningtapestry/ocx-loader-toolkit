import { googleOAuth } from "config/secrets"

export const GOOGLE_CLASSROOM_SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses",
];

export const GOOGLE_CLASSROOM_PLACEHOLDER_COURSE_NAME = "OCX Loader Export";

const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_CLASSROOM_API_BASE = "https://classroom.googleapis.com/v1";

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
  body?: object
) {
  const url = /^https?:\/\//i.test(path)
    ? path
    : `${GOOGLE_CLASSROOM_API_BASE}/${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Classroom API ${method} ${path} failed: ${response.status} ${text}`);
  }

  return response.json();
}
