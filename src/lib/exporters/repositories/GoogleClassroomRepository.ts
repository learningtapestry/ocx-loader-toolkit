import { ExportDestination } from "@prisma/client"

import ExportDestinationService from "src/lib/ExportDestinationService"

import { CourseworkPayload } from "../googleClassroom/types"
import callGoogleClassroomApi from "./callGoogleClassroom"

export default class GoogleClassroomRepository {
  exportDestinationService: ExportDestinationService

  constructor(exportDestination: ExportDestination) {
    this.exportDestinationService = new ExportDestinationService(exportDestination)
  }

  async createCourse(name: string, description?: string): Promise<{ id: string; name: string }> {
    const token = await this.exportDestinationService.getToken()

    const body: Record<string, string> = {
      name,
      ownerId: "me",
      courseState: "PROVISIONED",
    }

    if (description) {
      body.description = description
    }

    return callGoogleClassroomApi(token, "courses", "POST", body)
  }

  async createCourseWorkMaterial(
    courseId: string,
    payload: CourseworkPayload,
  ): Promise<{ id: string }> {
    const token = await this.exportDestinationService.getToken()

    return callGoogleClassroomApi(
      token,
      `courses/${courseId}/courseWorkMaterials`,
      "POST",
      payload,
    )
  }

  async createCourseWork(courseId: string, payload: CourseworkPayload): Promise<{ id: string }> {
    const token = await this.exportDestinationService.getToken()

    return callGoogleClassroomApi(token, `courses/${courseId}/courseWork`, "POST", payload)
  }
}
