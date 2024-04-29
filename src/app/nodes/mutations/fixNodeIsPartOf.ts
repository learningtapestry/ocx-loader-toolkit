import {NotFoundError} from "blitz";
import { resolver } from "@blitzjs/rpc";
import db from "db";
import { FixNodeIsPartOfSchema, SetNodeParentSchema } from "../schemas"
import OcxBundle from "@/src/app/lib/OcxBundle"

export default resolver.pipe(
  resolver.zod(FixNodeIsPartOfSchema),
  resolver.authorize(),
  async ({ id, parentId}) => {
    const node = await db.node.findFirst({
      where: { id },
      include: { bundle: {
          include: { nodes: true }
        }
      }
    })

    if (!node) throw new NotFoundError();

    const ocxBundle = new OcxBundle(node.bundle, node.bundle.nodes);
    const ocxNode = ocxBundle.findNodeByDbId(node.id);
    const parentNodeOcx = ocxBundle.findNodeByDbId(parentId);

    await ocxNode.fixIsPartOf(db, parentNodeOcx);

    return db.node.findFirst({
      where: { id },
      include: {
        parent: true, bundle: {
          include: { nodes: true }
        }
      }
    })
  }
);
