import * as xmlbuilder2 from 'xmlbuilder2';

export default class SingleChoiceAssessmentItem {
  id: string;
  text: string;
  choices: { text: string; image?: string; isCorrect?: boolean }[];

  constructor(id: string, text: string) {
    this.id = id;
    this.text = text;
    this.choices = [];
  }

  addChoice(text: string, isCorrect?: boolean, image?: string): void {
    this.choices.push({ text, isCorrect, image });
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
          // Conditionally add correctResponse if a correct choice exists
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
              const choiceContent = choice.image
                ? {
                    div: {
                      div: [
                        { div: choice.text },
                        { img: { '@alt': choice.text, '@src': choice.image } }
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
