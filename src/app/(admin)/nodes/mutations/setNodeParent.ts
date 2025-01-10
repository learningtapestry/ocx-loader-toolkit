import {NotFoundError} from "blitz";
import { resolver } from "@blitzjs/rpc";
import db from "db";
import { SetNodeParentSchema } from "../schemas"
import OcxBundle from "src/lib/OcxBundle"

export default resolver.pipe(
  resolver.zod(SetNodeParentSchema),
  resolver.authorize(),
  async ({ id, parentId, position }) => {
    const node = await db.node.findFirst({
      where: { id },
      include: { parent: true, bundle: {
          include: { nodes: true }
        }
      }
    })

    if (!node) throw new NotFoundError();

    const ocxBundle = new OcxBundle(node.bundle, node.bundle.nodes);
    const ocxNode = ocxBundle.findNodeByDbId(node.id);

    if (position === 'remove') {
      ocxNode!.parent?.removeChild(db, ocxNode);
    } else {
      const newParentNodeOcx = ocxBundle.findNodeByDbId(parentId!);

      if (newParentNodeOcx) {
        await ocxNode.setParent(db, newParentNodeOcx, position);
      } else {
        throw new NotFoundError();
      }
    }

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
