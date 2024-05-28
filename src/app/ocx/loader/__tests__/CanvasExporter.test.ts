import {describe, it, expect} from "vitest";

import cheerio from 'cheerio';

import { setupRecorder } from "nock-record";
const record = setupRecorder();

import Course from "../Course";
import CanvasExporter from "../CanvasExporter";

import dotenv from 'dotenv';
dotenv.config({ path: '.env.test.local' });

describe('CanvasExporter', () => {
  const accessToken = process.env.CANVAS_ACCESS_TOKEN as string;
  const baseUrl = process.env.CANVAS_BASE_URL as string;

  const canvasConfig = {
    accessToken,
    baseUrl
  };

  const name = 'Grade 6 Unit 2';
  const sitemapUrl = 'https://raw.githubusercontent.com/illustrativemathematics/static-ocx/main/build/cms_im-PR1334/ed-node-244422/sitemap.xml';

  const course = new Course(name, sitemapUrl);
  const exporter = new CanvasExporter(canvasConfig, course);

  const loadData = async () => {
    let { completeRecording } = await record("Course#loadData");

    await course.loadData();
    completeRecording();
  }

  it('should export to Canvas', async () => {
    await loadData();
    course.reorganiseNodesIntoSections();

    let { completeRecording, assertScopesFinished } = await record("CanvasExporter#export");

    await exporter.export();

    // Complete the recording, allow for Nock to write fixtures
    completeRecording();
    // Optional; assert that all recorded fixtures have been called
    assertScopesFinished();

    expect(exporter.course.unit.exportData.canvasUrl).toMatch(baseUrl);


    // expect(exporter.course.nodesWithErrors.length).toEqual(0);
    //
    // // check that every node in the course has a canvasUrl and canvasId
    // for (const node of exporter.course.nodes) {
    //   expect(node.canvasUrl).toBeDefined();
    //   expect(node.canvasId).toBeDefined();
    // }

    const $sitemap = cheerio.load(exporter.updatedSitemap);
    expect($sitemap('ocx\\:ocx').length).toEqual(77);
  }, 1000000);
});
