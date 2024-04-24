import React, { useState } from "react";
import OcxNode from "@/src/lib/OcxNode"

import XMLViewer from 'react-xml-viewer';

export default function Node({ node }: { node: OcxNode }) {
  const [showMetadata, setShowMetadata] = useState(false);

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
          </div>
        )
      }

      {
        node.childrenNotFoundData.length > 0 && (
          <div style={{ color: "red" }}>
            <h3>Children not found</h3>
            <pre>{JSON.stringify(node.childrenNotFoundData, null, 2)}</pre>
          </div>
        )
      }

      {
        node.children.map((child : OcxNode) => <Node key={child.ocxId} node={child} />)
      }
    </div>
  );
}
