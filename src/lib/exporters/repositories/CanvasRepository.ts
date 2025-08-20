import callCanvas, { uploadFileToCanvasCourse } from "./callCanvas";

import { Prisma } from "@prisma/client";

type ModuleItemType = 'File' | 'Page' | 'Discussion' | 'Assignment' | 'Quiz' | 'SubHeader' | 'ExternalUrl' | 'ExternalTool';

type CanvasCourse = {
  id: string;
  name: string;
  course_code: string;
}

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
      },
      enroll_me: true
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

    return callCanvas(baseUrl, accessToken, `courses/${course_id}/modules`, 'POST', moduleData);
  }

  async createModuleItem(course_id: number, module_id: number,
    title: string,
    type: ModuleItemType,
    content_id: number | null,
    position: number,
                         indent = 0): Promise<Prisma.JsonObject> {
    const { accessToken, baseUrl } = this.canvasConfig;

    const moduleItemData = {
      module_item: {
        title,
        type,
        content_id,
        position,
        indent
      }
    }

    return callCanvas(baseUrl, accessToken, `courses/${course_id}/modules/${module_id}/items`, 'POST', moduleItemData);
  }

  async createAssignment(course_id: number, name: string, position: number, description: string): Promise<Prisma.JsonObject> {
    const { accessToken, baseUrl } = this.canvasConfig;

    const assignmentData = {
      assignment: {
        name,
        position,
        description,
        assignment_group_id: 1,
        points_possible: 0,
        submission_types: ['online_text_entry'],
        allowed_extensions: ['pdf'],
        course_id: course_id
      }
    }

    return callCanvas(baseUrl, accessToken, `courses/${course_id}/assignments`, 'POST', assignmentData);
  }

  async uploadFileToCourse(course_id: number, blob: Blob, name = (blob as File).name, parentFolderPath = '/'): Promise<Prisma.JsonObject> {
    return (await uploadFileToCanvasCourse(this.canvasConfig.baseUrl, this.canvasConfig.accessToken, course_id, blob, name, parentFolderPath)).json();
  }

  async getCourses(): Promise<CanvasCourse[]> {
    const { accessToken, baseUrl } = this.canvasConfig;

    const courses = (await callCanvas(baseUrl, accessToken, 'courses?per_page=100', 'GET')) as CanvasCourse[];

    console.log(courses);

    return courses;
  }

  async getCourse(courseId: number): Promise<CanvasCourse> {
    const { accessToken, baseUrl } = this.canvasConfig;

    return callCanvas(baseUrl, accessToken, `courses/${courseId}`, 'GET');
  }

  async createContentMigration(course_id: number, migrationType: string, migrationSettings: Prisma.JsonObject, preAttachmentData: Prisma.JsonObject): Promise<Prisma.JsonObject> {
    const { accessToken, baseUrl } = this.canvasConfig;

    const contentMigrationData = {
      migration_type: migrationType,
      settings: migrationSettings,
      pre_attachment: preAttachmentData
    }

    return callCanvas(baseUrl, accessToken, `courses/${course_id}/content_migrations`, 'POST', contentMigrationData);
  }

  async getQuizByName(course_id: number, quizName: string): Promise<Prisma.JsonObject> {
    const { accessToken, baseUrl } = this.canvasConfig;

    // the order is from the first created to the last, so in case of duplicated name start from the most recent
    const quizzes = (await callCanvas(baseUrl, accessToken, `courses/${course_id}/quizzes`, 'GET')).reverse();

    let quiz = quizzes.find((quiz: Prisma.JsonObject) => quiz.title === quizName);

    if (!quiz) {
      console.log(`Quiz with name ${quizName} not found, using the last quiz`);
      console.log(quizzes.map((quiz: Prisma.JsonObject) => [quiz.title, quiz.id]));

      // TODO can there be pagination here?
      // the last one in the original array should be the right one
      quiz = quizzes[0];
    }

    return quiz
  }

  async updateQuiz(course_id: number, quiz_id: number, quizData: Prisma.JsonObject): Promise<Prisma.JsonObject> {
    const { accessToken, baseUrl } = this.canvasConfig;

    const params = {
      quiz: quizData
    }

    return callCanvas(baseUrl, accessToken, `courses/${course_id}/quizzes/${quiz_id}`, 'PUT', params);
  }

  async getProgress(progressUrl: string) {
    const { accessToken, baseUrl } = this.canvasConfig;

    return callCanvas(baseUrl, accessToken, progressUrl, 'GET');
  }
}
