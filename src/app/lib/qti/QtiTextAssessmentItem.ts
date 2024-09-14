import * as xmlbuilder2 from 'xmlbuilder2';

import QtiAssessmentItem, { AssetData } from "./QtiAssessmentItem";

export default class QtiTextAssessmentItem extends QtiAssessmentItem {
  constructor(id: string, text: string) {
    super(id, text);
  }

  getAssets(): AssetData[] {
    return []; // Text questions don't have assets
  }

  toXML(): string {
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
            prompt: {
              div: {
                div: this.text,
              },
            },
          },
        },
      },
    });

    return assessmentItem.end({ prettyPrint: true });
  }
}
