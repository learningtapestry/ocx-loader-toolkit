import { describe, it, expect, beforeEach } from "vitest";

import QtiChoiceAssessmentItem from '../QtiChoiceAssessmentItem';

describe('QtiChoiceAssessmentItem', () => {
  let assessmentItem: QtiChoiceAssessmentItem;

  beforeEach(() => {
    assessmentItem = new QtiChoiceAssessmentItem('item-1', 'What is the capital of France?');
  });

  it('should create an instance of QtiChoiceAssessmentItem', () => {
    expect(assessmentItem).toBeTruthy();
  });

  it('should add choices to the assessment item', async () => {
    await assessmentItem.addChoice('Berlin');
    await assessmentItem.addChoice('Paris', true);
    await assessmentItem.addChoice('Madrid');

    const xml = await assessmentItem.toXML();

    expect(xml).toContain('Berlin');
    expect(xml).toContain('Paris');
    expect(xml).toContain('Madrid');

    expect(xml).toContain('<correctResponse>');
  });

  it('should add choices with images to the assessment item', async () => {
    await assessmentItem.addChoice('Berlin', false, 'https://farm8.staticflickr.com/7377/9359257263_81b080a039_z_d.jpg');

    const xmlString = await assessmentItem.toXML();
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

  describe('when there is an image in the question', () => {
    beforeEach(async () => {
      assessmentItem = new QtiChoiceAssessmentItem('item-1', 'What is the capital of France?', true, 'https://farm8.staticflickr.com/7377/9359257263_81b080a039_z_d.jpg');

      await assessmentItem.addChoice('Berlin');
      await assessmentItem.addChoice('Paris', true);
      await assessmentItem.addChoice('Madrid');
    });

    it('should add the question image to the assessment item', async () => {
      const xmlString = await assessmentItem.toXML();
      expect(xmlString).toContain('<img');
      expect(xmlString).toContain('question.jpeg');
    });
  });
});
