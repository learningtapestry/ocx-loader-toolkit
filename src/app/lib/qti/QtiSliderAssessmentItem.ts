import * as xmlbuilder2 from 'xmlbuilder2';

import QtiAssessmentItem from "@/src/app/lib/qti/QtiAssessmentItem";

export interface SliderAttributes {
  lowerBound: number;
  upperBound: number;
  step?: number;
}

export interface MapEntry {
  mapKey: number;
  mappedValue: number;
}

export default class QtiSliderAssessmentItem extends QtiAssessmentItem {
  private sliderAttributes: SliderAttributes;
  private correctValue?: number;

  constructor(id: string, text: string, sliderAttributes: SliderAttributes, correctValue?: number, image?: string | Blob) {
    super(id, text, image);
    this.sliderAttributes = sliderAttributes;
    this.correctValue = correctValue;
  }

  // apparently Canvas doesn't support native sliderInteraction?
  async toXML(): Promise<string> {
    const choices = [];
    for (let i = this.sliderAttributes.lowerBound; i <= this.sliderAttributes.upperBound; i += this.sliderAttributes.step || 1) {
      choices.push({
        value: i,
        text: i.toString(),
      });
    }

    const promptBody = await this.promptBody();

    const assessmentItem = xmlbuilder2.create({
      assessmentItem: {
        '@xmlns': 'http://www.imsglobal.org/xsd/imsqti_v2p2',
        '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@xsi:schemaLocation': 'http://www.imsglobal.org/xsd/imsqti_v2p2 http://www.imsglobal.org/xsd/qti/qtiv2p2/imsqti_v2p2p2.xsd',
        '@identifier': this.id,
        '@title': this.text.substring(0, 50),
        '@adaptive': 'false',
        '@timeDependent': 'false',
        responseDeclaration: {
          '@identifier': 'RESPONSE',
          '@cardinality': 'single',
          '@baseType': 'integer',
          correctResponse: {
            value: this.correctValue,
          },
        },
        outcomeDeclaration: {
          '@identifier': 'SCORE',
          '@cardinality': 'single',
          '@baseType': 'float',
        },
        itemBody: {
          div: promptBody,
          'choiceInteraction': {
            '@responseIdentifier': 'RESPONSE',
            '@shuffle': 'false',
            '@maxChoices': '1',
            simpleChoice: choices.map((choice) => ({
              '@identifier': choice.value.toString(),
              '@fixed': 'true',
              '#text': choice.text,
            })),
          },
        },
        responseProcessing: {
          '@template': 'http://www.imsglobal.org/question/qti_v2p2/rptemplates/map_response',
        },
      },
    });

    return assessmentItem.end({ prettyPrint: true });
  }
}
