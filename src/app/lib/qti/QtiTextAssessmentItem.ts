import * as xmlbuilder2 from 'xmlbuilder2';

import QtiAssessmentItem, { AssetData } from "./QtiAssessmentItem";

export type TextAssessmentItemType = 'short' | 'long';

export default class QtiTextAssessmentItem extends QtiAssessmentItem {
  private type: TextAssessmentItemType;

  constructor(id: string, text: string, type: TextAssessmentItemType = 'short', image?: string | Blob) {
    super(id, text, image);
    this.type = type;
  }

  async toXML(): Promise<string> {
    const image = await this.questionImage;

    const assessmentItem = xmlbuilder2.create({
      assessmentItem: {
        '@adaptive': 'false',
        '@identifier': this.id,
        '@timeDependent': 'false',
        '@title': 'Question with text response',
        '@xmlns': 'http://www.imsglobal.org/xsd/imsqti_v2p1',
        '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@xsi:schemaLocation': 'http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd',
        responseDeclaration: {
          '@baseType': 'string',
          '@cardinality': 'single',
          '@identifier': 'RESPONSE',
        },
        outcomeDeclaration: {
          '@baseType': 'float',
          '@cardinality': 'single',
          '@identifier': 'SCORE',
        },
        itemBody: {
          'extendedTextInteraction': {
            '@responseIdentifier': 'RESPONSE',
            ...(this.type === 'long' && {'@expectedLines': 5}),
            ...(this.type === 'short' && {'@expectedLines': 1}),
            prompt: await this.promptBody()
          },
        },
      },
    });

    return assessmentItem.end({ prettyPrint: true });
  }
}
