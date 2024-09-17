import { describe, it, expect, beforeEach } from "vitest";
import { parseStringPromise as parse } from 'xml2js';

import QtiTextAssessmentItem from '../QtiTextAssessmentItem';

describe('QtiTextAssessmentItem', () => {
  let assessmentItem: QtiTextAssessmentItem;

  beforeEach(() => {
    assessmentItem = new QtiTextAssessmentItem('item-1', 'What is the capital of France?');
  });

  it('should create an instance of QtiTextAssessmentItem', () => {
    expect(assessmentItem).toBeTruthy();
  });

  it('should output the correct XML', async () => {
    const xmlString = await assessmentItem.toXML();
    const xml = await parse(xmlString);
    const assessmentItemElement = xml.assessmentItem;

    expect(assessmentItemElement.$).toEqual({
      adaptive: 'false',
      identifier: 'item-1',
      timeDependent: 'false',
      title: 'Question with text response',
      xmlns: 'http://www.imsglobal.org/xsd/imsqti_v2p1',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation': 'http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd'
    });

    // Test presence and values of other elements
    expect(assessmentItemElement.responseDeclaration).toBeTruthy();
    expect(assessmentItemElement.outcomeDeclaration).toBeTruthy();
    expect(assessmentItemElement.itemBody).toBeTruthy();
    expect(assessmentItemElement.itemBody[0].extendedTextInteraction).toBeTruthy();
    expect(assessmentItemElement.itemBody[0].extendedTextInteraction[0].prompt).toBeTruthy();
    expect(assessmentItemElement.itemBody[0].extendedTextInteraction[0].$).toMatchObject({ expectedLines: '1' });
  });

  describe('when the expected response is long', () => {
    beforeEach(() => {
      assessmentItem = new QtiTextAssessmentItem('item-1', 'Write a short story', 'long');
    });

    it('should output the correct XML', async () => {
      const xmlString = await assessmentItem.toXML();
      const xml = await parse(xmlString);
      const assessmentItemElement = xml.assessmentItem;

      expect(assessmentItemElement.itemBody[0].extendedTextInteraction[0].$).toMatchObject({ expectedLines: '5' });
    });
  });

  it('should return an empty array for getAssets', async () => {
    const assets = await assessmentItem.getAssets();
    expect(assets).toEqual([]);
  });
});
