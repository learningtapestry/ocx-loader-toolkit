import { z } from "zod";

export const CreateNodeSchema = z.object({
  // template: __fieldName__: z.__zodType__(),
});
export const UpdateNodeSchema = CreateNodeSchema.merge(
  z.object({
    id: z.number(),
  })
);

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
