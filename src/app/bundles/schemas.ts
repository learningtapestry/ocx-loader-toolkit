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

export const ImportBundleSchema = z.object({
  id: z.number(),
});

export const ImportBundleFromZipFileSchema = z.object({
  id: z.number(),
  zipDataUrl: z.string(),
});

export const RenamePropertyInBundleSchema = z.object({
  id: z.number(),
  oldName: z.string(),
  newName: z.string(),
  nodeType: z.string().optional(),
});

export const RemovePropertyInBundleSchema = z.object({
  id: z.number(),
  name: z.string(),
  nodeType: z.string().optional(),
});
