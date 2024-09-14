import { describe, it, expect, beforeEach } from "vitest";

import QtiRoot from "../QtiRoot"
import SingleChoiceAssessmentItem from "../SingleChoiceAssessmentItem"

import * as JSZip from 'jszip';
import * as fs from 'fs';
import * as path from 'path';

describe('QtiRoot', () => {
  let qtiRoot: QtiRoot;

  beforeEach(() => {
    qtiRoot = new QtiRoot('test-identifier', 'Test Title');

    const assessmentItem1 = new SingleChoiceAssessmentItem('item1', 'Question 1?');
    assessmentItem1.addChoice('Choice A');
    assessmentItem1.addChoice('Choice B');
    assessmentItem1.addChoice('Choice C');

    const assessmentItem2 = new SingleChoiceAssessmentItem('item2', 'Question 2 with an image?');
    assessmentItem2.addChoice('Choice D', false, 'https://www.example.com/image.png');
    assessmentItem2.addChoice('Choice E');

    qtiRoot.addAssessmentItem(assessmentItem1);
    qtiRoot.addAssessmentItem(assessmentItem2);
  });

  describe('#createManifest', () => {
    it('should create the correct manifest structure', () => {
      const manifest = qtiRoot.createManifest();

      console.log(manifest);
    });
  });

  describe('#createAssessmentTest', () => {
    it('should create the correct assessment structure', () => {
      const assessment = qtiRoot.createAssessmentTest();

      console.log(assessment);
    });
  });

  describe('#generateQtiZip', async () => {
    it('should create a QTI zip file with correct contents', async () => {
      const zipBlob = await qtiRoot.generateQtiZip();
      const arrayBuffer = await zipBlob.arrayBuffer();

      const zip = await JSZip.loadAsync(arrayBuffer);

      expect(zip.file('assessment_test.xml')).toBeTruthy();
      expect(zip.file('imsmanifest.xml')).toBeTruthy();
      expect(zip.file('items/item1.xml')).toBeTruthy();
      expect(zip.file('items/item2.xml')).toBeTruthy();

      const outputDir = path.join(__dirname, 'output');
      const outputZipPath = path.join(outputDir, 'generated_test.qti.zip');
      const outputUnzipPath = path.join(outputDir, 'test.qti');

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      await fs.promises.writeFile(outputZipPath, Buffer.from(arrayBuffer));

      const extract = (await import('extract-zip')).default;

      await extract(outputZipPath, { dir: outputUnzipPath });
    });
  });
});
