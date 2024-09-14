import { describe, it, expect, beforeEach } from "vitest";

import QtiRoot from "../QtiRoot"
import QtiSingleChoiceAssessmentItem from "../QtiSingleChoiceAssessmentItem"

import * as JSZip from 'jszip';
import * as fs from 'fs';
import * as path from 'path';

describe('QtiRoot', async () => {
  let qtiRoot: QtiRoot;

  beforeEach(async () => {
    qtiRoot = new QtiRoot('test-identifier', 'Test Title');

    const assessmentItem1 = new QtiSingleChoiceAssessmentItem('item1', 'Question 1?');
    await assessmentItem1.addChoice('Choice A');
    await assessmentItem1.addChoice('Choice B');
    await assessmentItem1.addChoice('Choice C');

    const assessmentItem2 = new QtiSingleChoiceAssessmentItem('item2', 'Question 2 with an image?');
    await assessmentItem2.addChoice('Choice D', false, 'https://farm8.staticflickr.com/7377/9359257263_81b080a039_z_d.jpg');
    await assessmentItem2.addChoice('Choice E');

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
