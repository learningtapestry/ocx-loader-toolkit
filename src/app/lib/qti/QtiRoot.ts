import * as xmlbuilder2 from 'xmlbuilder2';
import JSZip from "jszip";

import QtiAssessmentItem from "./QtiAssessmentItem";

export default class QtiRoot {
  identifier: string;
  title: string;
  language: string = 'en';

  assessmentId: string;
  assessmentSectionId: string;

  assessmentItems: QtiAssessmentItem[] = [];

  constructor(identifier: string, title: string) {
    this.identifier = identifier;
    this.title = title;

    this.assessmentId = this.generateRandomId();
    this.assessmentSectionId = this.generateRandomId();
  }

  addAssessmentItem(assessmentItem: QtiAssessmentItem): void {
    this.assessmentItems.push(assessmentItem);
  }

  async createManifest() {
    const assessmentItemsData = await Promise.all(this.assessmentItems.map(async (item) => {
      const resourceFiles = [
        {
          '@href': `items/${item.id}.xml`,
        },
        ...(await item.getAssets()).map((asset) => ({
          '@href': asset.assetPath,
        }))
      ];

      return {
        '@href': `items/${item.id}.xml`,
        '@identifier': `RES-${item.id}`,
        '@type': 'imsqti_item_xmlv2p1',
        metadata: {},
        file: resourceFiles,
      };
    }));

    return xmlbuilder2.create({
      manifest: {
        '@xmlns': 'http://www.imsglobal.org/xsd/imscp_v1p1',
        '@xmlns:imsmd': 'http://www.imsglobal.org/xsd/imsmd_v1p2',
        '@xmlns:imsqti': 'http://www.imsglobal.org/xsd/imsqti_metadata_v2p1',
        '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@identifier': this.identifier, // e.g., 'MANIFEST-CSRGD9WMVNPGX5H0'
        '@xsi:schemaLocation':
          'http://www.imsglobal.org/xsd/imscp_v1p1 http://www.imsglobal.org/xsd/imscp_v1p1.xsd http://www.imsglobal.org/xsd/imsmd_v1p2 http://www.imsglobal.org/xsd/imsmd_v1p2p4.xsd http://www.imsglobal.org/xsd/imsqti_metadata_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_metadata_v2p1.xsd',
        metadata: {
          schema: 'QTIv2.1 Package',
          schemaversion: '1.0.0',
          'imsmd:lom': {
            'imsmd:general': {
              'imsmd:identifier': this.title, // Or a specific identifier if needed
              'imsmd:title': {
                'imsmd:langstring': {
                  '@xml:lang': this.language,
                  '#text':this.title,
                },
              },
              'imsmd:language': this.language,
              'imsmd:description': {
                'imsmd:langstring': {
                  '@xml:lang': this.language,
                },
              },
            },
            'imsmd:lifecycle': {
              'imsmd:version': {
                'imsmd:langstring': {
                  '@xml:lang': this.language,
                  '#text': '2.1',
                },
              },
              'imsmd:status': {
                'imsmd:source': {
                  'imsmd:langstring': {
                    '@xml:lang': this.language,
                    '#text': 'LOMv1.0',
                  },
                },
                'imsmd:value': {
                  'imsmd:langstring': {
                    '@xml:lang': 'x-none',
                    '#text': 'Final',
                  },
                },
              },
            },
            'imsmd:metametadata': {
              'imsmd:metadatascheme': ['LOMv1.0', 'QTIv2.1'],
              'imsmd:language': this.language,
            },
            'imsmd:technical': {
              'imsmd:format': ['text/x-imsqti-item-xml', 'image/jpg', 'image/jpeg'],
            },
          },
        },
        organizations: {}, // You can add organization structure here if needed
        resources: {
          resource: [
            {
              '@href': 'assessment_test.xml',
              '@identifier': `RES-${this.assessmentId}`,
              '@type': 'imsqti_test_xmlv2p1',
              metadata: {},
              file: {
                '@href': 'assessment_test.xml',
              },
            },
            ...assessmentItemsData
          ],
        },
      },
    });
  }

  async createAssessmentTest() {
    return xmlbuilder2.create({
      assessmentTest: {
        '@xmlns': 'http://www.imsglobal.org/xsd/imsqti_v2p1',
        '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@xsi:schemaLocation': 'http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd',
        '@identifier':  this.identifier,
        '@title':  this.title,
        testPart: {
          '@identifier': 'tp_1',
          '@navigationMode': 'linear',
          '@submissionMode': 'individual',
          'assessmentSection': {
            '@identifier': 'as_1',
            '@title': 'Section 1',
            '@visible': 'true',
            'assessmentItemRef': this.assessmentItems.map((item) => ({
              '@identifier': item.id,
              '@href': `items/${item.id}.xml`,
            })),
          },
        },
      },
    });
  }

  async generateQtiZip(): Promise<Blob> {
    const assessmentTest = await this.createAssessmentTest();
    const manifest = await this.createManifest();

    const zip = new JSZip();
    const itemsFolder = zip.folder('items');
    const assetsFolder = zip.folder('assets');

    zip.file('assessment_test.xml', assessmentTest.end({ prettyPrint: true }));

    zip.file('imsmanifest.xml', manifest.end({ prettyPrint: true }));

    for (const item of this.assessmentItems) {
      itemsFolder!.file(`${item.id}.xml`, await item.toXML());

      const assets = await item.getAssets();

      for (const asset of assets) {
        const assetPathInsideAssets = asset.assetPath.split('/')[1];

        const arrayBuffer = await asset.blob.arrayBuffer();

        assetsFolder!.file(assetPathInsideAssets, arrayBuffer);
      }
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
