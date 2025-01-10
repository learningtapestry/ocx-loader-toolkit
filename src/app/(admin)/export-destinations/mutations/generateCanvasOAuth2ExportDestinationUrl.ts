import { resolver } from "@blitzjs/rpc"
import db from "db"
import { z } from "zod"

const GenerateCanvasOAuth2ExportDestinationUrlSchema = z.object({
  canvasInstanceId: z.number(),
  name: z.string().min(1, "Name is required"),
  baseUrl: z.string().url("Invalid URL format"),
})

export class StateEncoder {
  static encodeState(canvasInstanceId: number, name: string, baseUrl: string) {
    return Buffer.from(JSON.stringify({ canvasInstanceId, name, baseUrl })).toString('base64')
  }

  static decodeState(state: string): { name: string, canvasInstanceId: number, baseUrl: string } {
    return JSON.parse(Buffer.from(state, 'base64').toString())
  }
}

// TODO: this isn't really a mutation, as it doesn't change any data in the DB. Can we make it into a query?

export default resolver.pipe(
  resolver.zod(GenerateCanvasOAuth2ExportDestinationUrlSchema),
  resolver.authorize(),
  async ({ canvasInstanceId , name, baseUrl}, ctx) => {
    const canvasInstance = await db.canvasInstance.findFirst({ where: { id: canvasInstanceId } })
    if (!canvasInstance) throw new Error("Canvas instance not found")

    const state = StateEncoder.encodeState(canvasInstanceId, name, baseUrl)

    const authUrl = `${canvasInstance.baseUrl}/login/oauth2/auth?client_id=${
      canvasInstance.clientId
    }&response_type=code&redirect_uri=${encodeURIComponent(
      `${baseUrl}/api/canvas-oauth-callback`
    )}&state=${state}`

    return authUrl
  }
)
