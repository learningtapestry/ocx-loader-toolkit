import * as yauzl from "yauzl";
import * as xpath from 'xpath-ts';
import { DOMParserImpl as dom } from 'xmldom-ts';

export default class QtiZip {
  qtiFileBlob: Blob;
  qtiFileBuffer?: Buffer;

  constructor(qtiFileBlob: Blob) {
    this.qtiFileBlob = qtiFileBlob;
  }

  async getQtiFileBuffer() {
    if (this.qtiFileBuffer) {
      return this.qtiFileBuffer;
    }

    const arrayBuffer = await this.qtiFileBlob.arrayBuffer();
    this.qtiFileBuffer = Buffer.from(arrayBuffer);

    return this.qtiFileBuffer;
  }

  async getManifest(): Promise<Document> {
    const qtiFileBuffer = await this.getQtiFileBuffer();

    return new Promise((resolve, reject) => {
      yauzl.fromBuffer(qtiFileBuffer, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(err);
          return;
        }

        zipfile.readEntry();
        zipfile.on('entry', (entry) => {
          if (/imsmanifest.xml/.test(entry.fileName)) {
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                reject(err);
                return;
              }

              let xml = '';
              readStream.on('data', (data) => {
                xml += data;
              });

              readStream.on('end', () => {
                const doc = new dom().parseFromString(xml);

                resolve(doc);
              });
            });
          } else {
            zipfile.readEntry();
          }
        });
      });
    });
  }

  async getQuizTitle(): Promise<string> {
    const manifestDoc = await this.getManifest();

    const nodes = xpath.select("//imsmd:title/imsmd:langstring/text()", manifestDoc) as Node[];

    if (nodes.length === 0) {
      return 'Untitled Quiz';
    } else {
      return nodes[0].nodeValue as string;
    }
  }
}
