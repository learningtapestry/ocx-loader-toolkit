import QtiRoot from "./QtiRoot";
import QtiSingleChoiceAssessmentItem from "./QtiSingleChoiceAssessmentItem";
import QtiTextAssessmentItem from "./QtiTextAssessmentItem";

export default class GoogleFormToQtiConverter {
  private formData: any;

  constructor(googleFormJson: any) {
    this.formData = googleFormJson;
  }

  public async convertToQti(): Promise<QtiRoot> {
    const { formId, info, items } = this.formData;

    const qtiRoot = new QtiRoot(formId, info.title);

    for (const item of items) {
      const { title, questionItem } = item;

      if (!questionItem || !questionItem.question) {
        console.warn(`Skipping item with title "${title}" because it does not contain a question.`);
        continue;
      }

      const {
        questionId,
        textQuestion,
        multipleChoiceQuestion
      } = questionItem.question;

      if (textQuestion) {
        const answerLength = textQuestion.paragraph ? 'long' : 'short';

        const qtiTextItem = new QtiTextAssessmentItem(questionId, title, answerLength);
        qtiRoot.addAssessmentItem(qtiTextItem);
      } else if (multipleChoiceQuestion) {
        const qtiChoiceItem = new QtiSingleChoiceAssessmentItem(
          questionId,
          title
        );
        for (const choice of multipleChoiceQuestion.choices) {
          await qtiChoiceItem.addChoice(choice.value, choice.isCorrect);
        }
        qtiRoot.addAssessmentItem(qtiChoiceItem);
      } else {
        console.warn(`Unsupported question type for item with title "${title}".`);
      }
    }

    return qtiRoot;
  }
}
