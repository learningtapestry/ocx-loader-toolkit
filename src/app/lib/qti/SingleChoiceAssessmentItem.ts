import * as xmlbuilder2 from 'xmlbuilder2';

type assetData = {
  assetPath: string;
  blob: Blob;
}

export default class SingleChoiceAssessmentItem {
  id: string;
  text: string;
  choices: { text: string; imageIndex?: number; isCorrect?: boolean }[];
  images: Blob[];

  constructor(id: string, text: string) {
    this.id = id;
    this.text = text;
    this.choices = [];
    this.images = [];
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

  getAssets(): assetData[] {
    return this.images.map((imageBlob, index) => {
      return {
        assetPath: this.imageUri(index),
        blob: imageBlob
      }
    })
  }

  toXML(): string {
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
          '@cardinality': 'single',
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
            '@maxChoices': '1',
            '@responseIdentifier': 'RESPONSE',
            '@shuffle': 'false',
            prompt: {
              div: {
                div: this.text,
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
