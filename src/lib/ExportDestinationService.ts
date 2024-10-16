import { CanvasInstance, ExportDestination } from "@prisma/client"

import db from "db"
import { JsonObject } from "type-fest"

export default class ExportDestinationService {
  exportDestination: ExportDestination;

  constructor(exportDestination: ExportDestination) {
    this.exportDestination = exportDestination;
  }

  async refreshAccessToken() {
    const canvasInstance = await db.canvasInstance.findFirst({
      where: { id: this.exportDestination.canvasInstanceId! },
    });

    const response = await fetch(`${canvasInstance!.baseUrl}/login/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: canvasInstance!.clientId,
        client_secret: canvasInstance!.clientSecret,
        refresh_token: (this.exportDestination.metadata! as any).refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh Canvas access token");
    }

    const { access_token, refresh_token, expires_in } = await response.json();

    await db.exportDestination.update({
      where: { id: this.exportDestination.id },
      data: {
        metadata: {
          ...(this.exportDestination.metadata as any),
          accessToken: access_token,
          refreshToken: refresh_token,
          accessTokenExpiry: new Date(Date.now() + expires_in * 1000),
        },
      },
    });

    return access_token;
  }

  async getToken(): Promise<string> {
    if (this.exportDestination.type === 'canvas') {
      return (this.exportDestination.metadata! as any).accessToken;
    }

    if (this.exportDestination.type === 'canvas-oauth2') {
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
      hostname = url.split('/')[0]
    }

    return hostname
  }

  static async findCanvasInstanceByUrl(url: string): Promise<CanvasInstance | null> {
    const hostname = ExportDestinationService.extractHostname(url)

    return db.canvasInstance.findFirst({
      where: {
        baseUrl: {
          contains: hostname,
          mode: 'insensitive'
        }
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
