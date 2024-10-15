import * as xmlbuilder2 from 'xmlbuilder2';

import QtiAssessmentItem, { AssetData } from "src/lib/qti/QtiAssessmentItem"

export default class QtiTextItem extends QtiAssessmentItem {

  constructor(id: string, text: string, image?: string | Blob) {
    super(id, text, image);
  }

  async toXML(): Promise<string> {
    const assessmentItem = xmlbuilder2.create({
      assessmentItem: {
        '@identifier': this.id,
        '@title': 'Text Item',
        '@adaptive': 'false',
        '@timeDependent': 'false',
        '@xmlns': 'http://www.imsglobal.org/xsd/imsqti_v2p1',
        '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@xsi:schemaLocation': 'http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd',
        instructureMetadata: {
          instructureField: [
            { '@name': 'points_possible', '@value': '0' },
            { '@name': 'question_type', '@value': 'text_only_question' },
          ],
        },
        itemBody: await this.promptBody()
      }
    });

    return assessmentItem.end({ prettyPrint: true });
  }
}
