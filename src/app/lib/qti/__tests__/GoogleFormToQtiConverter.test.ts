import { describe, it, expect, beforeEach } from "vitest";
import GoogleFormToQtiConverter from "../GoogleFormToQtiConverter";
import googleFormJson from "./fixtures/google_form.json";

describe('GoogleFormToQtiConverter', () => {
  let converter: GoogleFormToQtiConverter;

  beforeEach(() => {
    converter = new GoogleFormToQtiConverter(googleFormJson);
  });

  it('should create a QtiRoot with the correct title and identifier', async () => {
    const qtiRoot = await converter.convertToQti();

    expect(qtiRoot.identifier).toBe(googleFormJson.formId);
    expect(qtiRoot.title).toBe(googleFormJson.info.title);
  });

  it('should add correct assessment items to QtiRoot', async () => {
    const qtiRoot = await converter.convertToQti();

    const items = qtiRoot.assessmentItems;

    expect(items.length).toBe(googleFormJson.items.length);

    for (const [index, item] of googleFormJson.items.entries()) {
      expect(items[index]?.id).toBe(item.questionItem.question.questionId);
      expect(items[index]?.text).toBe(item.title);
    }
  });

  it('should skip items without question', async () => {
    const formJsonWithoutQuestions = {
      ...googleFormJson,
      items: [
        ...googleFormJson.items,
        { itemId: "no-question", title: "No Question" },
      ],
    };

    const localConverter = new GoogleFormToQtiConverter(formJsonWithoutQuestions);
    const qtiRoot = await localConverter.convertToQti();

    expect(qtiRoot.assessmentItems.length).toBe(googleFormJson.items.length);
  });
});
