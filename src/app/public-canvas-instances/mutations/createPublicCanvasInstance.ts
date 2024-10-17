import { resolver } from "@blitzjs/rpc"
import db from "db"
import { CreateCanvasInstanceSchema } from "../schemas"
import { getOAuth2Token } from "@/src/lib/exporters/repositories/callCanvas"
import ExportDestinationService from "@/src/lib/ExportDestinationService"

export default resolver.pipe(
  resolver.zod(CreateCanvasInstanceSchema),
  async (input) => {

    // verify that the data is valid
    const tempCanvasInstance = {
      clientId: input.clientId,
      clientSecret: input.clientSecret,
      baseUrl: input.baseUrl,
    }

    const response = await getOAuth2Token(tempCanvasInstance, '', input.localBaseUrl);
    const responseData = await response.json();

    if (responseData.error.includes("invalid_client")) {
      return {
        message: "Invalid data",
        status: 'error'
      };
    }

    const existingCanvasInstance = await ExportDestinationService.findPublicCanvasInstanceByUrl(input.baseUrl);

    if (existingCanvasInstance) {
      await db.canvasInstance.update({
        where: {
          id: existingCanvasInstance.id
        },
        data: {
          clientId: input.clientId,
          clientSecret: input.clientSecret,
        }
      });

      return {
        message: "Canvas instance updated",
        status: 'ok'
      };
    } else {
      const name = ExportDestinationService.publicCanvasInstanceNameFromUrl(input.baseUrl);

      const canvasInstance = await db.canvasInstance.create({
        data: {
          name: name,
          clientId: input.clientId,
          clientSecret: input.clientSecret,
          baseUrl: input.baseUrl,
        }
      });

      return {
        message: "Canvas instance created",
        status: 'ok'
      }
    }
  }
)
