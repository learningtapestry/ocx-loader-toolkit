import {describe, it, expect} from "vitest";

import CanvasRepository from "../CanvasRepository"

import dotenv from 'dotenv';
dotenv.config({ path: '.env.test.local' });

describe('CanvasRepository', () => {
  const accessToken = process.env.CANVAS_ACCESS_TOKEN as string;
  const baseUrl = process.env.CANVAS_BASE_URL as string;

  const canvasConfig = {
    accessToken,
    baseUrl
  };

  const repository = new CanvasRepository(canvasConfig);

  describe('#createCourse', () => {
    it('should create a course', async () => {
      const name = 'Test Course';
      const code = 'test1';

      const course = await repository.createCourse(name, code);

      expect(course.name).toEqual(name);
      expect(course.course_code).toEqual(code);
      expect(course.uuid).toBeDefined();
    });
  })

  describe('#createModule', () => {
    it('should create a module', async () => {
      const courseId = 1;
      const name = 'Test Module';

      const newModule = await repository.createModule(courseId, name, 1);

      expect(newModule.name).toEqual(name);
    });
  })
});
