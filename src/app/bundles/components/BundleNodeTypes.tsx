import { useState } from 'react';

import OcxBundle from "@/src/app/lib/OcxBundle";

export default function BundleNodeTypes({ocxBundle} : {ocxBundle: OcxBundle}) {
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
              <li key={type}>{type} ({typesNodeCount[type]})</li>
            ))
          }
        </ul>
      }
    </>
  );
}
