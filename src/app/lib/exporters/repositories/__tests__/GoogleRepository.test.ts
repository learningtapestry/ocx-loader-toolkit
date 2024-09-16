import {describe, it, expect} from "vitest";

import GoogleRepository from "../GoogleRepository";

describe('GoogleRepository', () => {
  describe('extractFileId', () => {
    const googleRepository = new GoogleRepository();

    it('should extract file ID from docs.google.com/forms URLs', () => {
      expect(googleRepository.extractFileId('https://docs.google.com/forms/d/1uu9v0rsV87MxmgTX-_TSlTavgGX_29itEzMTRRGnd6s/copy')).toBe('1uu9v0rsV87MxmgTX-_TSlTavgGX_29itEzMTRRGnd6s');
      expect(googleRepository.extractFileId('https://docs.google.com/forms/d/1uu9v0rsV87MxmgTX-_TSlTavgGX_29itEzMTRRGnd6s/edit')).toBe('1uu9v0rsV87MxmgTX-_TSlTavgGX_29itEzMTRRGnd6s');
      expect(googleRepository.extractFileId('https://docs.google.com/forms/d/1uu9v0rsV87MxmgTX-_TSlTavgGX_29itEzMTRRGnd6s/edit?usp=sharing')).toBe('1uu9v0rsV87MxmgTX-_TSlTavgGX_29itEzMTRRGnd6s');
    });

    it('should work when the url includes /u/id/', () => {
      expect(googleRepository.extractFileId('https://docs.google.com/forms/u/2/d/1mb9Te34uwV3h0Y2Y0BTLglbU_2ZgrS1efTvCsJ-VDRM/copy')).toBe('1mb9Te34uwV3h0Y2Y0BTLglbU_2ZgrS1efTvCsJ-VDRM');
    });

    it('should extract file ID from drive.google.com/open?id= URLs', () => {
      expect(googleRepository.extractFileId('https://drive.google.com/open?id=1ji3ysa7zqP-yN6A_jgiv9SuNjvSWISYI_1736F8xAt4')).toBe('1ji3ysa7zqP-yN6A_jgiv9SuNjvSWISYI_1736F8xAt4');
    });

    it('should throw an error for invalid URLs', () => {
      expect(() => googleRepository.extractFileId('https://www.example.com')).toThrowError('Could not extract file ID from URL: https://www.example.com');
      expect(() => googleRepository.extractFileId('invalid-url')).toThrowError('Could not extract file ID from URL: invalid-url');
    });
  });
});
