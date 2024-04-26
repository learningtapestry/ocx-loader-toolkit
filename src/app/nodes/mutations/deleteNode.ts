import { resolver } from "@blitzjs/rpc";

import db from "db";

import { DeleteNodeSchema } from "../schemas";

import OcxNode from "@/src/app/lib/OcxNode"
import OcxBundle from "@/src/app/lib/OcxBundle"

export default resolver.pipe(
  resolver.zod(DeleteNodeSchema),
  resolver.authorize(),
  async ({ id }) => {
    const node = await db.node.findFirst({
      where: { id },
      include: { bundle: {
          include: { nodes: true }
      } }
    });

    const ocxBundle = new OcxBundle(node!.bundle!, node!.bundle!.nodes);
    const oxcNode = new OcxNode(node!, ocxBundle);

    await oxcNode.delete(db);

    const updatedNode = await db.node.findFirst({
      where: { id }
    });

    return updatedNode;
  }
);
