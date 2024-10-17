import { describe, it, expect, beforeEach } from "vitest";

import ExportDestinationService from "../ExportDestinationService"

import db from "db"
import { CanvasInstance } from "@prisma/client"

describe('ExportDestinationService', () => {
  describe('.extractHostname', () => {
    it ('should extract hostname from completeURL', () => {
      const url = 'https://example.com/path/to/resource';
      const hostname = ExportDestinationService.extractHostname(url);

      expect(hostname).toEqual('example.com');
    });

    it ('should extract hostname from incompleteURL', () => {
      const url = 'example.com/path/to/resource';
      const hostname = ExportDestinationService.extractHostname(url);

      expect(hostname).toEqual('example.com');
    });

    it ('should return hostname if it is only hostname', () => {
      const url = 'example.com';
      const hostname = ExportDestinationService.extractHostname(url);

      expect(hostname).toEqual('example.com');
    });
  });

  describe('.findPublicCanvasInstanceByUrl', () => {
    const baseUrl = 'https://example.com';

    let canvasInstance: CanvasInstance;

    beforeEach(async () => {
      await db.canvasInstance.deleteMany();
      canvasInstance = await db.canvasInstance.create({
        data: {
          name: ExportDestinationService.publicCanvasInstanceNameFromUrl(baseUrl),
          baseUrl,
          clientId: 'clientId',
          clientSecret: 'clientSecret'
        }
      });
    });

    it ('should return null if no export destination found', async () => {
      const url = 'https://example2.com/path/to/resource';
      const foundCanvasInstance = await ExportDestinationService.findPublicCanvasInstanceByUrl(url);

      expect(foundCanvasInstance).toBeNull();
    });

    it ('should return export destination if found', async () => {
      const url = 'https://example.com/path/to/resource';
      const foundCanvasInstance = await ExportDestinationService.findPublicCanvasInstanceByUrl(url);

      expect(foundCanvasInstance!.id).toEqual(canvasInstance.id);
    });

    it('should return export destination with case insensitive full url', async () => {
      const url = 'https://EXAMPLE.com/path/to/resource';
      const foundCanvasInstance = await ExportDestinationService.findPublicCanvasInstanceByUrl(url);

      expect(foundCanvasInstance!.id).toEqual(canvasInstance.id);
    });

    it('should return export destination with case insensitive hostname', async () => {
      const url = 'EXAMPLE.com/path/to/resource';
      const foundCanvasInstance = await ExportDestinationService.findPublicCanvasInstanceByUrl(url);

      expect(foundCanvasInstance!.id).toEqual(canvasInstance.id);
    });
  });

  describe('.encodeState and .decodeState', () => {
    it('should encode and decode state', () => {
      const state = {
        canvasInstanceId: 1,
        name: 'Example',
        baseUrl: 'https://example.com'
      };

      const encodedState = ExportDestinationService.encodeState(state);
      const decodedState = ExportDestinationService.decodeState(encodedState);

      expect(decodedState).toEqual(state);
    });
  });
});
