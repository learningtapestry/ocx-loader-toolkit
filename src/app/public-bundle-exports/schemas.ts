import { z } from "zod";

export const CreateBundleSchema = z.object({
  // template: __fieldName__: z.__zodType__(),
  name: z.string(),
  sitemapUrl: z.string(),
  sourceAccessToken: z.string().nullable().optional(),
  sourceAccessData: z.any()
});
