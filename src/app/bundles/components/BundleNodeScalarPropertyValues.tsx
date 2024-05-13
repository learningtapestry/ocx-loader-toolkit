import { useState } from 'react';

import PropertyHighlightToggle from "@/src/app/bundles/components/PropertyHighlightToggle"

export default function BundleNodeScalarPropertyValues({propertyName, propertyValues} : {propertyName: string, propertyValues: string[]}) {
  const [showList, setShowList] = useState(false);
  const toggleListVerb = showList ? 'Hide' : 'Show';

  return (
    <span>
        &nbsp; <button onClick={() => setShowList(!showList)}>{toggleListVerb} {propertyValues.length} values</button>

      {showList &&
        <ul>
          {
            propertyValues.sort().map((value: string) => (
              <li key={value}>{value} &nbsp;
                <PropertyHighlightToggle property={propertyName} value={value} />
              </li>
            ))
          }
        </ul>
      }
    </span>
  );
}
