import React, { useState } from "react";

import OcxNode from "src/app/lib/OcxNode"

import XMLViewer from 'react-xml-viewer';
import JsonView from '@uiw/react-json-view';

import { useMutation } from "@blitzjs/rpc"
import setNodeParent from "src/app/nodes/mutations/setNodeParent"
import fixNodeIsPartOf from "src/app/nodes/mutations/fixNodeIsPartOf"
import deleteNode from "src/app/nodes/mutations/deleteNode"
import removeChildrenNotFound from "src/app/nodes/mutations/removeChildrenNotFound"

import { useUiStore } from "src/app/stores/UiStore"
import { Prisma } from "@prisma/client"
import _ from "lodash"

export default function Node({ node, refetchBundle }: { node: OcxNode, refetchBundle: Function }) {
  const nodeTypesColors = useUiStore(state => state.nodeTypesColors);
  const highlightProperties = useUiStore(state => state.highlightProperties);
  const highlightPropertiesValues = useUiStore(state => state.highlightPropertiesValues);

  const [showMetadata, setShowMetadata] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const toggleMetadataVerb = showMetadata ? 'Hide' : 'Show';
  const toggleContentVerb = showContent ? 'Hide' : 'Show';

  const [setParentNodeMutation] = useMutation(setNodeParent);
  const [fixNodeIsPartOfMutation] = useMutation(fixNodeIsPartOf);
  const [deleteNodeMutation] = useMutation(deleteNode);
  const [removeChildrenNotFoundMutation] = useMutation(removeChildrenNotFound);

  const onFixParentNode = async function(position: 'firstChild' | 'lastChild' | 'remove'){
    await setParentNodeMutation({id: node.dbId, parentId: node.isPartOf && node.ocxBundle.findNodeByOcxId(node.isPartOf?.ocxId)?.dbId, position});
    refetchBundle();
  };

  const onFixNodeIsPartOf = async function(){
    await fixNodeIsPartOfMutation({id: node.dbId, parentId: node.parent!.prismaNode.id});
    refetchBundle();
  }

  const onDeleteNode = async function(){
    await deleteNodeMutation({id: node.dbId});
    refetchBundle();
  };

  const onRemoveChildrenNotFound = async function(){
    await removeChildrenNotFoundMutation({id: node.dbId});
    refetchBundle();
  }

  const metadataPropertiesToHighlight = Object.keys(node.metadata).filter(
    (key) => highlightProperties.includes(key) || highlightPropertiesValues[key]?.some(value => _.isEqual(value, node.metadata[key]))
  );

  return (
    <div key={node.ocxId} style={{paddingLeft: 16, borderLeft: '1px black solid'}}>
      <h2>
        <span dangerouslySetInnerHTML={{__html: `${node.metadata!.name as string}`}}></span>
        &nbsp;
        <span style={{color: nodeTypesColors[node.ocxCombinedTypes], fontWeight: 'normal'}}>[{node.ocxCombinedTypes}]</span>
        <span style={{color: 'DarkKhaki', fontWeight: 'normal'}}>[{node.ocxId}]</span>
        &nbsp;
        <button onClick={() => setShowContent(!showContent)}>{toggleContentVerb} Content</button>
        &nbsp;
        <button
          style={{color: node.propertiesValidationData.jsonIsValid ? 'black' : 'red'}}
          onClick={() => setShowMetadata(!showMetadata)}
        >{toggleMetadataVerb} Metadata</button>
      </h2>

      {
        metadataPropertiesToHighlight.length > 0 && (
          <ul>
            {
              metadataPropertiesToHighlight.map((key) => (
                <li key={key}>
                  <span style={{color: 'red'}}>{key}</span>: {
                      typeof node.metadata[key] === "string" ? <span>{node.metadata[key] as string}</span> :
                        <JsonView
                          value={node.metadata[key] as Prisma.JsonObject}
                          displayObjectSize={false}
                          displayDataTypes={false}
                        />
                    }
                </li>
              ))
            }
          </ul>
        )
      }

      {showMetadata &&
        <div>
          Sitemap Url: {node.prismaNode.url}

          <div style={{margin: '8px 0'}}>
            <JsonView
              value={node.metadata}
              displayObjectSize={false}
              displayDataTypes={false}
            />
          </div>

          Validation:

          <JsonView
            value={node.propertiesValidationData}
            displayObjectSize={false}
            displayDataTypes={false}
          />
        </div>
      }

      {showContent &&
        <div>
          <XMLViewer xml={node.prismaNode.content} />
        </div>
      }

      {
        node.parent != node.isPartOf && (
          <div style={{color: 'red'}}>
            <h3>Parent mismatch</h3>
            <ul>
              <li>Parent id: {node.parent?.ocxId}</li>
              <li>isPartOf id: {node.isPartOf?.ocxId}</li>
            </ul>

            { node.isPartOf &&
              <div style={{display: 'flex', gap: 4}}>
                <button onClick={() => onFixParentNode('lastChild')}>Fix: as last node</button>
                <button onClick={() => onFixParentNode('firstChild')}>Fix: as first node</button>
                <button onClick={() => onFixParentNode('remove')}>Remove from parent</button>
                <button onClick={onDeleteNode}>Delete node</button>
              </div>
            }

            { node.parent &&
              <div style={{display: 'flex', gap: 4}}>
                <button onClick={onFixNodeIsPartOf}>Fix isPartOf</button>
              </div>
            }
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
