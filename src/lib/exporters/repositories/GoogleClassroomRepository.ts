import { ExportDestination } from "@prisma/client";

import ExportDestinationService from "src/lib/ExportDestinationService";

import callGoogleClassroomApi from "./callGoogleClassroom";

export default class GoogleClassroomRepository {
  exportDestinationService: ExportDestinationService;

  constructor(exportDestination: ExportDestination) {
    this.exportDestinationService = new ExportDestinationService(exportDestination);
  }

  async createCourse(name: string): Promise<{ id: string }> {
    const token = await this.exportDestinationService.getToken();

    return callGoogleClassroomApi(token, "courses", "POST", {
      name,
      ownerId: "me",
      courseState: "PROVISIONED",
    });
  }
}
