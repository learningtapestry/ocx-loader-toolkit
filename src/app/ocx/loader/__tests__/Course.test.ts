import {describe, it, expect} from "vitest";

import { setupRecorder } from "nock-record";
const record = setupRecorder();

import Course from "../Course";
import CourseNode from "../CourseNode";

describe('Course', () => {
  const name = 'Grade 6 Unit 2';
  const sitemapUrl = 'https://raw.githubusercontent.com/illustrativemathematics/static-ocx/main/build/cms_im-PR1334/ed-node-244422/sitemap.xml';

  const course = new Course(name, sitemapUrl);

  describe('#loadData', () => {
    it('should load data from a sitemap', async () => {
      const { completeRecording, assertScopesFinished } = await record("Course#loadData");

      await course.loadData();

      // Complete the recording, allow for Nock to write fixtures
      completeRecording();
      // Optional; assert that all recorded fixtures have been called
      assertScopesFinished();

      expect(course.nodes.length).toEqual(115);
      expect(course.unit).toBeInstanceOf(CourseNode);
      expect(course.unit.children.length).toBeGreaterThan(0);
    });
  });
});
