import { useState } from 'react';

import OcxBundle from "src/lib/OcxBundle";

import { useUiStore } from "src/app/stores/UiStore"

export default function BundleNodeTypes({ocxBundle} : {ocxBundle: OcxBundle}) {
  const nodeTypesColors = useUiStore(state => state.nodeTypesColors);

  const [showList, setShowList] = useState(false);
  const toggleListVerb = showList ? 'Hide' : 'Show';

  const types = ocxBundle.allCombinedTypes;
  const typesNodeCount = ocxBundle.allCombinedTypesNodeCount;

  return (
    <>
      <h2>Types (combined): {types.length}
        &nbsp; <button onClick={() => setShowList(!showList)}>{toggleListVerb} List</button>
      </h2>

      {showList &&
        <ul>
          {
            types.sort().map((type: string) => (
              <li key={type}>
                <span style={{color: nodeTypesColors[type]}}>{type}</span>
                ({typesNodeCount[type]})
              </li>
            ))
          }
        </ul>
      }
    </>
  );
}
