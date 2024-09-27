import { describe, it, expect } from "vitest"

import OcxBundleExport from "../OcxBundleExport"

describe ('OcxBundleExport', () => {
  describe ('init', () => {
    it('should initialize exportDestination and canvasRepository from the constructor', async () => {
      const prismaBundleExport = {
        exportDestinationId: 1
      } as any;

      const exportDestination = {
        baseUrl: 'http://localhost:3000',
        metadata: {
          accessToken: '1234567890'
        }
      } as any;

      const ocxBundleExport = new OcxBundleExport(prismaBundleExport);

      expect(ocxBundleExport.initPromise).toBeDefined();

      await ocxBundleExport.initPromise;

      expect(ocxBundleExport.exportDestination).toBeDefined();
      expect(ocxBundleExport.canvasRepository).toBeDefined();
    });
  });
});
