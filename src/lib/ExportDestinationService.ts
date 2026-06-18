import { CanvasInstance, ExportDestination } from "@prisma/client"

import db from "db"
import { JsonObject } from "type-fest"
import { CANVAS_USER_AGENT } from "../constants/canvas"
import {
  formatCanvasErrorResponse,
  logCanvasRequestFailure,
} from "./exporters/repositories/callCanvas"

export default class ExportDestinationService {
  exportDestination: ExportDestination;

  constructor(exportDestination: ExportDestination) {
    this.exportDestination = exportDestination;
  }

  async refreshAccessToken() {
    const canvasInstance = await db.canvasInstance.findFirst({
      where: { id: this.exportDestination.canvasInstanceId! },
    });

    const metadata = this.exportDestination.metadata! as {
      refreshToken?: string;
      accessToken?: string;
      accessTokenExpiry?: string | Date;
    };

    if (!metadata.refreshToken) {
      throw new Error(
        "Cannot refresh Canvas access token: export destination is missing a refresh token. Re-authorize the Canvas export destination via OAuth."
      );
    }

    const tokenUrl = `${canvasInstance!.baseUrl}/login/oauth2/token`;

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": CANVAS_USER_AGENT,
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: canvasInstance!.clientId,
        client_secret: canvasInstance!.clientSecret,
        refresh_token: metadata.refreshToken,
      }),
    });

    if (!response.ok) {
      const responseBody = await response.text();

      logCanvasRequestFailure(
        "POST",
        "/login/oauth2/token",
        tokenUrl,
        response.status,
        response.statusText,
        responseBody,
        {}
      );

      console.error("Canvas OAuth token refresh failed", {
        exportDestinationId: this.exportDestination.id,
        exportDestinationType: this.exportDestination.type,
        canvasInstanceId: canvasInstance!.id,
        canvasBaseUrl: canvasInstance!.baseUrl,
      });

      const canvasError = formatCanvasErrorResponse(responseBody);
      const detail = canvasError ?? `${response.status} ${response.statusText}`;

      throw new Error(`Failed to refresh Canvas access token: ${detail}`);
    }

    const { access_token, refresh_token, expires_in } = await response.json();

    const updatedMetadata = {
      ...(this.exportDestination.metadata as any),
      accessToken: access_token,
      // Canvas does not return a new refresh token on refresh; keep the existing one.
      refreshToken: refresh_token ?? metadata.refreshToken,
      accessTokenExpiry: new Date(Date.now() + expires_in * 1000),
    };

    await db.exportDestination.update({
      where: { id: this.exportDestination.id },
      data: {
        metadata: updatedMetadata,
      },
    });

    this.exportDestination = {
      ...this.exportDestination,
      metadata: updatedMetadata,
    };

    return access_token;
  }

  async getToken(): Promise<string> {
    if (this.exportDestination.type === 'canvas') {
      return (this.exportDestination.metadata! as any).accessToken;
    }

    if (this.exportDestination.type === 'canvas-oauth2' || this.exportDestination.type === 'canvas-oauth2-temp') {
      let { accessToken, accessTokenExpiry } = (this.exportDestination.metadata! as any);

      const accessTokenExpiryDate = new Date(accessTokenExpiry);

      if (accessTokenExpiryDate < new Date()) {
        accessToken = await this.refreshAccessToken();
      }

      return accessToken;
    }

    throw new Error(`Unsupported export destination type: ${this.exportDestination.type}`);
  }

  static extractHostname(url: string): string {
    let hostname;

    try {
      hostname = (new URL(url)).hostname
    } catch (e) {
      hostname = url.split('/')[0].toLowerCase()
    }

    return hostname
  }

  static publicCanvasInstanceNameFromUrl(url: string): string {
    const hostname = ExportDestinationService.extractHostname(url)

    return `public:${hostname}`;
  }

  static async findPublicCanvasInstanceByUrl(url: string): Promise<CanvasInstance | null> {
    const name = ExportDestinationService.publicCanvasInstanceNameFromUrl(url);

    return db.canvasInstance.findFirst({
      where: {
        name
      }
    });
  }

  static encodeState(state: JsonObject): string {
    return Buffer.from(JSON.stringify(state)).toString('base64');
  }

  static decodeState<T extends JsonObject = JsonObject>(state: string): T {
    return JSON.parse(Buffer.from(state, 'base64').toString()) as T;
  }
}
