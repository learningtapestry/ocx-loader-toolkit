import callCanvas from "./callCanvas";

import { Prisma } from "@prisma/client"

export default class CanvasRepository {
  canvasConfig: { accessToken: string, baseUrl: string };

  constructor(canvasConfig: { accessToken: string, baseUrl: string }) {
    this.canvasConfig = canvasConfig;
  }

  async createCourse(name: string, code: string): Promise<Prisma.JsonObject> {
    const { accessToken, baseUrl } = this.canvasConfig;

    const courseData = {
      course: {
        name: name,
        course_code: code,
      }
    }

    return callCanvas(baseUrl, accessToken, 'accounts/self/courses', 'POST', courseData);
  }

  async createModule(course_id: number, name: string, position: number): Promise<Prisma.JsonObject> {
    const { accessToken, baseUrl } = this.canvasConfig;

    const moduleData = {
      module: {
        name,
        position,
        published: true
      }
    }

    return await callCanvas(baseUrl, accessToken, `courses/${course_id}/modules`, 'POST', moduleData);
  }

  async createAssignment(course_id: number, name: string, position: number): Promise<Prisma.JsonObject> {
    const { accessToken, baseUrl } = this.canvasConfig;

    const assignmentData = {
      assignment: {
        name: name,
        position: position,
        assignment_group_id: 1,
        points_possible: 100,
        submission_types: ['online_text_entry'],
        allowed_extensions: ['pdf'],
        due_at: new Date().toISOString(),
        course_id: course_id
      }
    }

    return callCanvas(baseUrl, accessToken, `courses/${course_id}/assignments`, 'POST', assignmentData);
  }
}
