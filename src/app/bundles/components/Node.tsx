import React, { useState } from "react";

import OcxNode from "@/src/app/lib/OcxNode"

import XMLViewer from 'react-xml-viewer';

import { useMutation } from "@blitzjs/rpc"
import setNodeParent from "@/src/app/nodes/mutations/setNodeParent"
import deleteNode from "@/src/app/nodes/mutations/deleteNode"
import removeChildrenNotFound from "@/src/app/nodes/mutations/removeChildrenNotFound"

export default function Node({ node, refetchBundle }: { node: OcxNode, refetchBundle: Function }) {
  const [showMetadata, setShowMetadata] = useState(false);

  const [setParentNodeMutation] = useMutation(setNodeParent);
  const [deleteNodeMutation] = useMutation(deleteNode);
  const [removeChildrenNotFoundMutation] = useMutation(removeChildrenNotFound);

  const onFixParentNode = async function(position: 'firstChild' | 'lastChild' | 'remove'){
    await setParentNodeMutation({id: node.dbId, parentId: node.isPartOf && node.ocxBundle.findNodeByOcxId(node.isPartOf?.ocxId)?.dbId, position});
    refetchBundle();
  };

  const onDeleteNode = async function(){
    await deleteNodeMutation({id: node.dbId});
    refetchBundle();
  };

  const onRemoveChildrenNotFound = async function(){
    await removeChildrenNotFoundMutation({id: node.dbId});
    refetchBundle();
  }

  return (
    <div key={node.ocxId} style={{paddingLeft: 16, borderLeft: '1px black solid'}}>
      <h2>{node.prismaNode.url}</h2>
      <h3>{node.ocxId}</h3>

      <div style={{marginBottom: 4}}>
        <button onClick={() => setShowMetadata(!showMetadata)}>Toggle Metadata</button>
        {showMetadata && <pre>{JSON.stringify(node.metadata, null, 2)}</pre>}
      </div>

      <div>
        <XMLViewer xml={node.prismaNode.content} />
      </div>

      {
        node.parent != node.isPartOf && (
          <div style={{color: 'red'}}>
            <h3>Parent mismatch</h3>
            <ul>
              <li>Parent id: {node.parent?.ocxId}</li>
              <li>isPartOf id: {node.isPartOf?.ocxId}</li>
            </ul>

            <div style={{display: 'flex', gap: 4}}>
              <button onClick={() => onFixParentNode('lastChild')}>Fix: as last node</button>
              <button onClick={() => onFixParentNode('firstChild')}>Fix: as first node</button>
              <button onClick={() => onFixParentNode('remove')}>Remove from parent</button>
              <button onClick={onDeleteNode}>Delete node</button>
            </div>
          </div>
        )
      }

      {
        node.childrenNotFoundData.length > 0 && (
          <div style={{ color: "red" }}>
            <h3>Children not found <button onClick={onRemoveChildrenNotFound}>Remove Children Not Found</button></h3>
            <pre>{JSON.stringify(node.childrenNotFoundData, null, 2)}</pre>
          </div>
        )
      }

      {
        node.children.map((child : OcxNode) => <Node key={child.ocxId} node={child} refetchBundle={refetchBundle} />)
      }
    </div>
  );
}
