import { z } from "zod";

export const DeleteNodeSchema = z.object({
  id: z.number(),
});

export const RemoveChildrenNotFoundSchema = z.object({
  id: z.number(),
});

export const SetNodeParentSchema = z.object({
  id: z.number(),
  parentId: z.number().nullable(),
  position: z.enum(["firstChild", "lastChild", "remove"])
});

export const FixNodeIsPartOfSchema = z.object({
  id: z.number(),
  parentId: z.number(),
});
