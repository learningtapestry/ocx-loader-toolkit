import { z } from "zod";

export const CreateBundleSchema = z.object({
  // template: __fieldName__: z.__zodType__(),
  name: z.string(),
  sitemapUrl: z.string(),
  sourceAccessToken: z.string().nullable().optional(),
  sourceAccessData: z.any()
});

export const ExportBundleSchema = z.object({
  id: z.number(),
  canvasUrl: z.string(),
  localUrlBase: z.string(),
  language: z.string().optional()
});
