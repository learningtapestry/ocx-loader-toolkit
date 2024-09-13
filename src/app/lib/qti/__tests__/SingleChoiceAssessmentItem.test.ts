import { describe, it, expect, beforeEach } from "vitest";

import SingleChoiceAssessmentItem from '../SingleChoiceAssessmentItem';

describe('SingleChoiceAssessmentItem', () => {
  let assessmentItem: SingleChoiceAssessmentItem;

  beforeEach(() => {
    assessmentItem = new SingleChoiceAssessmentItem('item-1', 'What is the capital of France?');
  });

  it('should create an instance of SingleChoiceAssessmentItem', () => {
    expect(assessmentItem).toBeTruthy();
  });

  it('should add choices to the assessment item', () => {
    assessmentItem.addChoice('Berlin');
    assessmentItem.addChoice('Paris', true);
    assessmentItem.addChoice('Madrid');

    expect(assessmentItem.toXML()).toContain('Berlin');
    expect(assessmentItem.toXML()).toContain('Paris');
    expect(assessmentItem.toXML()).toContain('Madrid');

    expect(assessmentItem.toXML()).toContain('<correctResponse>');

    // console.log(assessmentItem.toXML());
  });

  it('should add choices with images to the assessment item', () => {
    assessmentItem.addChoice('Berlin', false, 'berlin.jpg');

    const xmlString = assessmentItem.toXML();
    expect(xmlString).toContain('<img');
    expect(xmlString).toContain('src="berlin.jpg"');
    expect(xmlString).toContain('alt="Berlin"');

    expect(xmlString).not.toContain('<correctResponse>');
  });
});

