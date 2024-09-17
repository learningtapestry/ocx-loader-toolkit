import * as xmlbuilder2 from 'xmlbuilder2';

import QtiAssessmentItem, { AssetData} from "./QtiAssessmentItem"

export default class QtiChoiceAssessmentItem extends QtiAssessmentItem {
  singleChoice: boolean;
  choices: { text: string; imageIndex?: number; isCorrect?: boolean }[];
  questionImage: Promise<Blob | null>;

  constructor(id: string, text: string, singleChoice = true, image? : string | Blob) {
    super(id, text);

    this.singleChoice = singleChoice;
    this.choices = [];

    if (typeof image === 'string') {
      this.questionImage = fetch(image).then(response => response.blob());
    } else if (image instanceof Blob) {
      this.questionImage = Promise.resolve(image);
    } else {
      this.questionImage = Promise.resolve(null);
    }
  }

  async addChoice(text: string, isCorrect?: boolean, image?: string | Blob) {
    let imageBlob = null;

    if (typeof image === 'string') {
      const response = await fetch(image);
      imageBlob = await response.blob();
    } else if (image instanceof Blob) {
      imageBlob = image;
    }

    let imageIndex;

    if (imageBlob) {
      this.images.push(imageBlob);
      imageIndex = this.images.length - 1;
    }

    this.choices.push({ text, isCorrect, imageIndex });
  }

  imageUri(index: number): string {
    const extension = this.images[index].type.split('/')[1];

    return `assets/${this.id}_${index}.${extension}`;
  }

  async questionImageUri(): Promise<string | null> {
    const blob = await this.questionImage;

    if (!blob) return null;

    const extension = blob.type.split('/')[1];

    return `assets/${this.id}_question.${extension}`;
  }

  async getAssets(): Promise<AssetData[]> {
    const assets = this.images.map((imageBlob, index) => {
      return {
        assetPath: this.imageUri(index),
        blob: imageBlob
      };
    });

    const blob = await this.questionImage;

    if (blob) {
      assets.push({
        assetPath: (await this.questionImageUri())!,
        blob: blob
      });
    }

    return assets;
  }

  async toXML(): Promise<string> {
    const assessmentItem = xmlbuilder2.create({
      assessmentItem: {
        '@adaptive': 'false',
        '@identifier': this.id,
        '@timeDependent': 'false',
        '@title': 'Question with images',
        '@xmlns': 'http://www.imsglobal.org/xsd/imsqti_v2p1',
        '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@xsi:schemaLocation': 'http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd',
        responseDeclaration: {
          '@baseType': 'identifier',
          '@cardinality': this.singleChoice ? 'single' : 'multiple',
          '@identifier': 'RESPONSE',
        },
        outcomeDeclaration: {
          '@baseType': 'float',
          '@cardinality': 'single',
          '@identifier': 'SCORE',
          ...(this.choices.some((choice) => choice.isCorrect) && {
              correctResponse: {
                value: this.choices.find((choice) => choice.isCorrect)?.text,
              },
          }),
        },
        itemBody: {
          choiceInteraction: {
            '@maxChoices': this.singleChoice ? '1' : String(this.choices.length),
            '@responseIdentifier': 'RESPONSE',
            '@shuffle': 'false',
            prompt: {
              div: {
              div: [
                { '#text': this.text },
                ...(await this.questionImage ? [{
                  img: {
                    '@src': `../${await this.questionImageUri()}`,
                    '@alt': 'Question image'
                  }
                }] : [])
              ]
              },
            },
            simpleChoice: this.choices.map((choice, index) => {
              const choiceContent = typeof(choice.imageIndex) === 'number'
                ? {
                    div: {
                      div: [
                        { div: choice.text },
                        { img: { '@alt': choice.text, '@src': `../${this.imageUri(choice.imageIndex)}` } }
                      ],
                    },
                  }
                : {
                    div: choice.text,
                  };

              return {
                '@identifier': String.fromCharCode(97 + index), // Generates 'a', 'b', 'c', etc.
                ...choiceContent,
              };
            }),
          },
        },
      },
    });

    return assessmentItem.end({ prettyPrint: true });
  }
}
