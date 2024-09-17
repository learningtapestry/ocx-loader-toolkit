import QtiRoot from "./QtiRoot";
import QtiChoiceAssessmentItem from "./QtiChoiceAssessmentItem";
import QtiTextAssessmentItem from "./QtiTextAssessmentItem";
import QtiTextItem from "./QtiTextItem"
import QtiSliderAssessmentItem from "./QtiSliderAssessmentItem";

type FormImage = {
  contentUri: string;
  properties: {
    alignment: 'LEFT' | 'CENTER' | 'RIGHT';
    width: number;
  }
}

type TextQuestion = {
  paragraph: boolean;
  image? : FormImage;
}

type ChoiceOption = {
  value: string;
  image?: FormImage;
  isCorrect?: boolean;
}

type ChoiceQuestion = {
  type: 'CHECKBOX' | 'RADIO';
  options: ChoiceOption[];
}

type ScaleQuestion = {
  low: number;
  high: number;
}

type QuestionItem = {
  question: {
    questionId: string;
    required?: boolean;
    textQuestion?: TextQuestion;
    choiceQuestion?: ChoiceQuestion;
    scaleQuestion?: ScaleQuestion;
  },
  image?: FormImage;
}

type TextItem = {
  image?: FormImage;
}

type GoogleFormItem = {
  itemId: string;
  title: string;
  textItem?: TextItem;
  questionItem?: QuestionItem;
}

export default class GoogleFormToQtiConverter {
  formData: any;
  qtiRoot: QtiRoot;

  constructor(googleFormJson: any) {
    this.formData = googleFormJson;
    this.qtiRoot = new QtiRoot(this.formData.formId, this.formData.info.title);
  }

  public async convertToQti(): Promise<QtiRoot> {
    const { formId, info, items } = this.formData;

    this.qtiRoot = new QtiRoot(formId, info.title);

    for (const item of items as GoogleFormItem[]) {
      if (item.textItem) await this.addTextItem(item);
      else if (item.questionItem) {
        const question = item.questionItem.question;

        if (question.textQuestion) await this.addTextQuestion(item);
        else if (question.choiceQuestion) {
          if (question.choiceQuestion.type === 'CHECKBOX') await this.addChoiceQuestion(item, false);
          else if (question.choiceQuestion.type === 'RADIO') await this.addChoiceQuestion(item, true);
        } else if (question.scaleQuestion) await this.addScaleQuestion(item);
      }
    }

    return this.qtiRoot;
  }

  // example
  // {
  //   "itemId": "509a8a96",
  //   "textItem": {},
  //   "title": "Something something"
  // },
  async addTextItem(item: GoogleFormItem) {
    const textItem = item.textItem!;

    const qtiTextItem = new QtiTextItem(item.itemId, item.title, textItem.image?.contentUri);

    return this.qtiRoot.addAssessmentItem(qtiTextItem);
  }

  // example questionItem/choiceQuestion/RADIO:
  // {
  //   "itemId": "1f2aa090",
  //   "title": "Consider these 2 wave pulses that are about to run into each other. Which answer correctly models what the resulting wave shape would look like at the point where they meet?",
  //   "questionItem": {
  //     "question": {
  //       "questionId": "5d46f41b",
  //       "required": true,
  //       "choiceQuestion": {
  //         "type": "RADIO",
  //         "options": [
  //           {
  //             "value": "Option 1",
  //             "image": {
  //               "contentUri": "https://lh3.googleusercontent.com/Gg5cbyIHLAUZasAr3XdJU6u0e2_PoXObnZlgb4hUHNQl1tjxr0uMPAcxAxgZePYwc7-NJQbB69XM_bNHG70BVIsckbOZdC_OlP96EZhUPIREaG7yF12nRQhyTBXdxkgosQ",
  //               "properties": {
  //                 "alignment": "LEFT",
  //                 "width": 260
  //               }
  //             }
  //           },...
  //        ],
  //        "image": {
  //           "contentUri": "https://lh3.googleusercontent.com/U-EndehUd5A7JgAMJ3JczYlx6569zCGa7evQGZI6VZJkaOVD2SHKnOrmxXQbm3Q-hGGtfUIk4w2TdIRM2y8equyry7TG5KKJC01CUZBrQJt08ZAMm02qlkAMbxFCKOoGKQ",
  //           "properties": {
  //             "alignment": "CENTER",
  //             "width": 219
  //           }
  //         }
  //       }

  // example questionItem/choiceQuestion/CHECKBOX:
  // {
  //   "itemId": "3b151ea6",
  //   "title": "Which molecule structure(s) would most likely absorb energy due to the forces from the fields that make up microwave radiation in the microwave oven? (Select all that apply.)",
  //   "questionItem": {
  //   "question": {
  //     "questionId": "57ee7f55",
  //     "required": true,
  //     "choiceQuestion": {
  //       "type": "CHECKBOX",
  //       "options": [
  //         {
  //           "value": "Oxygen",
  //           "image": {
  //             "contentUri": "https://lh4.googleusercontent.com/7OXK2ATpeHEsEx5CiJ1tFRSOdoOfK7QeMx9sON3600laVszq_rAni3CI0ei2hO6OvGgZc01M_7DSsvm4ZSdz3P-0dq7llHpS1ACYtyijdUdtlT9eDLEbmsr-w-OggRRP1Q",
  //             "properties": {
  //               "alignment": "LEFT",
  //               "width": 260
  //             }
  //           }
  //         }, ...
  async addChoiceQuestion(item: GoogleFormItem, singleChoice = true) {
    const choiceQuestion = item.questionItem!.question.choiceQuestion!;

    const qtiChoiceItem = new QtiChoiceAssessmentItem(item.itemId, item.title, singleChoice, item.questionItem!.image?.contentUri);

    for (const option of choiceQuestion.options) {
      await qtiChoiceItem.addChoice(option.value, option.isCorrect, option.image?.contentUri);
    }

    return this.qtiRoot.addAssessmentItem(qtiChoiceItem);
  }

  // example text question
  // {
  //   "itemId": "3b151ea6",
  // "title": "Which molecule structure(s) would most likely absorb energy due to the forces from the fields that make up microwave radiation in the microwave oven? (Select all that apply.)",
  // "questionItem": {
  //   "question": {
  //     "questionId": "57ee7f55",
  //     "required": true,
  //     "textQuestion": {
  //       "paragraph": true
  //     }
  //   }
  // }
  async addTextQuestion(item: GoogleFormItem) {
    const textQuestion = item.questionItem!.question.textQuestion!;

    const qtiTextItem = new QtiTextAssessmentItem(item.itemId, item.title,
      textQuestion.paragraph ? 'long' : 'short',
      item.questionItem!.image?.contentUri);
    return this.qtiRoot.addAssessmentItem(qtiTextItem);
  }

  // example scale question
  // {
  //   "itemId": "395bb529",
  //   "title": "On a scale of 1-5 (5 being the best): How effectively did you use the feedback from your peers?",
  //   "questionItem": {
  //     "question": {
  //       "questionId": "5009cd91",
  //       "required": true,
  //       "scaleQuestion": {
  //         "low": 1,
  //         "high": 5
  //       }
  //     }
  //   }
  // }
  async addScaleQuestion(item: GoogleFormItem) {
    const scaleQuestion = item.questionItem!.question.scaleQuestion!;

    const qtiSliderItem = new QtiSliderAssessmentItem(
      item.itemId,
      item.title,
      {
        lowerBound: scaleQuestion.low,
        upperBound: scaleQuestion.high,
        step: 1
      },
      undefined,
      item.questionItem!.image?.contentUri
    );

    return this.qtiRoot.addAssessmentItem(qtiSliderItem);
  }
}
