import { describe, it, expect, beforeEach } from "vitest"

import QtiZip from "../QtiZip";
import { join } from "path"
import { readFile } from "fs/promises"

describe('QtiZip', () => {
  let qtiZip: QtiZip;
  let qtiZipBlob: Blob;

  beforeEach(async () => {
    const testFilePath = join(__dirname, 'fixtures', 'test_form_qti.zip');
    qtiZipBlob = new Blob([await readFile(testFilePath)]);

    qtiZip = new QtiZip(qtiZipBlob);
  });

  describe('#getQuizTitle', () => {
    it('should return the manifest file', async () => {
      const title = await qtiZip.getQuizTitle();

      expect(title).toEqual('Untitled form');
    });
  });
});
