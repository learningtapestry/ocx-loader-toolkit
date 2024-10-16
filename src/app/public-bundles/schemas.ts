import { z } from "zod";

export const CreateBundleSchema = z.object({
  // template: __fieldName__: z.__zodType__(),
  name: z.string(),
  sitemapUrl: z.string(),
  sourceAccessToken: z.string().nullable().optional(),
  sourceAccessData: z.any()
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

export const ImportLegacyOSEUnitSchema = z.object({
  id: z.number(),
  unitUrl: z.string(),
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

export const ExportBundleSchema = z.object({
  id: z.number(),
  canvasUrl: z.string(),
  localUrlBase: z.string(),
});
