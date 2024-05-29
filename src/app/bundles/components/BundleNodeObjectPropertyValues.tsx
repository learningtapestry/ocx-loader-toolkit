import { useState } from 'react';

import { Prisma } from "@prisma/client"

import JsonView from '@uiw/react-json-view';

import PropertyHighlightToggle from "@/src/app/bundles/components/PropertyHighlightToggle"

export default function BundleNodeObjectPropertyValues({propertyName, propertyValues} : {propertyName: string, propertyValues: Prisma.JsonObject[]}) {
  const [showList, setShowList] = useState(false);
  const toggleListVerb = showList ? 'Hide' : 'Show';

  const buttonColor = propertyValues.length > 1 ? 'blue' : 'black';

  return (
    <span>
        &nbsp;  <button
                  onClick={() => setShowList(!showList)}
                  style={{color: buttonColor}}
                >{toggleListVerb} {propertyValues.length} values</button>
      {showList &&
        <ul>
          {
            propertyValues.sort().map((value: Prisma.JsonObject) => (
              <li key={JSON.stringify(value)}>
                <PropertyHighlightToggle property={propertyName} value={value} />
                <JsonView
                  value={value}
                  displayObjectSize={false}
                  displayDataTypes={false}
                />
              </li>
            ))
          }
        </ul>
      }
    </span>
  );
}
