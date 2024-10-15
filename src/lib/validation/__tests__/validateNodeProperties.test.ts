import { describe, it, expect, beforeEach } from "vitest";

import { Bundle } from "@prisma/client";
import OcxBundle from "src/lib/OcxBundle";
import db from "db";

import fs from 'fs';
import path from 'path';

import validateNodeProperties from '../validateNodeProperties';

describe('validateNodeProperties', () => {
  let prismaBundle: Bundle;
  let ocxBundle: OcxBundle;

  describe('with IM data', () => {
    const zipData = fs.readFileSync(path.join(__dirname, 'fixtures', 'im_bundle.ocx.zip'));

    beforeEach(async () => {
      prismaBundle = await db.bundle.create({
        data: {
          name: 'name',
          sitemapUrl: '',
        }
      });

      ocxBundle = new OcxBundle(prismaBundle, []);

      await ocxBundle.importFromZipFile(db, zipData);
    });

    it('should validate node metadata', async () => {
      const node = ocxBundle.findNodeByOcxId('im:048b2bd1-a908-5899-b4b2-18e7de38252e');
      const result = validateNodeProperties(node.metadata, node.ocxTypes);

      expect(result.propertiesValidationResultsByProperty['@id']).toEqual({
        "propertyName": "@id",
        "isRecognizedProperty": true,
        "isValid": true,
        "validationErrors": []
      });

      expect(result.missingProperties).toEqual([]);
      expect(result.nonStandardProperties).toEqual([
        "forCourse",
        "identifier",
        "gradingformat",
        "ocx:submissionType",
        "ocx:interactionType",
        "ocx:submissionGroup",
        "ocx:accessToInformation"
      ]);
      expect(result.hasUnrecognizedType).toBe(false);
      expect(result.jsonIsValid).toBe(false);
    });
  });

  describe('with OSE data', () => {
    const zipData = fs.readFileSync(path.join(__dirname, 'fixtures', 'ose_bundle.ocx.zip'));

    beforeEach(async () => {
      prismaBundle = await db.bundle.create({
        data: {
          name: 'name',
          sitemapUrl: '',
        }
      });

      ocxBundle = new OcxBundle(prismaBundle, []);

      await ocxBundle.importFromZipFile(db, zipData);
    });

    it('should validate node metadata', async () => {
      const node = ocxBundle.findNodeByOcxId('#Activity_10-9');
      const result = validateNodeProperties(node.metadata, node.ocxTypes);

      expect(result.propertiesValidationResultsByProperty['@id']).toEqual({
        "propertyName": "@id",
        "isRecognizedProperty": true,
        "isValid": true,
        "validationErrors": []
      });

      expect(result.missingProperties).toEqual([]);
      expect(result.nonStandardProperties).toEqual([
        "day",
        "slideId",
        "labTitle",
        "material",
        "forCourse",
        "googleClassroom"
      ]);
      expect(result.hasUnrecognizedType).toBe(false);
      expect(result.jsonIsValid).toBe(false);
    });
  });
});
