import { z } from "zod";

export const CreateBundleSchema = z.object({
  // template: __fieldName__: z.__zodType__(),
  name: z.string(),
  sitemapUrl: z.string(),
});
export const UpdateBundleSchema = CreateBundleSchema.merge(
  z.object({
    id: z.number(),
  })
);

export const DeleteBundleSchema = z.object({
  id: z.number(),
});

export const LoadBundleSchema = z.object({
  id: z.number(),
});

