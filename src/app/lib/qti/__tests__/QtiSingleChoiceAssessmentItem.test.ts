import { describe, it, expect, beforeEach } from "vitest";

import QtiSingleChoiceAssessmentItem from '../QtiSingleChoiceAssessmentItem';

describe('QtiSingleChoiceAssessmentItem', () => {
  let assessmentItem: QtiSingleChoiceAssessmentItem;

  beforeEach(() => {
    assessmentItem = new QtiSingleChoiceAssessmentItem('item-1', 'What is the capital of France?');
  });

  it('should create an instance of QtiSingleChoiceAssessmentItem', () => {
    expect(assessmentItem).toBeTruthy();
  });

  it('should add choices to the assessment item', async () => {
    await assessmentItem.addChoice('Berlin');
    await assessmentItem.addChoice('Paris', true);
    await assessmentItem.addChoice('Madrid');

    expect(assessmentItem.toXML()).toContain('Berlin');
    expect(assessmentItem.toXML()).toContain('Paris');
    expect(assessmentItem.toXML()).toContain('Madrid');

    expect(assessmentItem.toXML()).toContain('<correctResponse>');
  });

  it('should add choices with images to the assessment item', async () => {
    await assessmentItem.addChoice('Berlin', false, 'https://farm8.staticflickr.com/7377/9359257263_81b080a039_z_d.jpg');

    const xmlString = assessmentItem.toXML();
    expect(xmlString).toContain('<img');
    expect(xmlString).toContain('0.jpeg"');
    expect(xmlString).toContain('alt="Berlin"');

    expect(xmlString).not.toContain('<correctResponse>');
  });

  describe('#getAssets', async () => {
    it('should return an empty array if no choices have images', async () => {
      await assessmentItem.addChoice('Berlin');
       await assessmentItem.addChoice('Paris', true);
       await assessmentItem.addChoice('Madrid');
       const assets = await assessmentItem.getAssets();
       expect(assets).toEqual([]);
    });

    it('should return an array of assetData objects if choices have images', async () => {
      await assessmentItem.addChoice('Berlin', false, 'https://farm8.staticflickr.com/7377/9359257263_81b080a039_z_d.jpg');

      const assets = await assessmentItem.getAssets();
      expect(assets.length).toEqual(1);
      expect(assets[0].assetPath).toEqual('assets/item-1_0.jpeg');
      expect(assets[0].blob).toBeTruthy();
    });
  });
});

