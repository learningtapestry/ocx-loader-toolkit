import { useState } from 'react';

import { Prisma } from "@prisma/client"

import JsonView from '@uiw/react-json-view';

import DeepArrayMap from "@/src/app/lib/DeepArrayMap";
import { PropertyValidationResult } from "@/src/app/lib/OcxNode";

import PropertyHighlightToggle from "@/src/app/bundles/components/PropertyHighlightToggle";
import PropertyValidation from "@/src/app/bundles/components/PropertyValidation";

interface BundleNodeObjectPropertyValuesProps {
  propertyName: string;
  propertyValues: Prisma.JsonObject[];
  propertyValuesValidation: DeepArrayMap<[string, Prisma.JsonObject], PropertyValidationResult>;
}

export default function BundleNodeObjectPropertyValues({propertyName, propertyValues, propertyValuesValidation} : BundleNodeObjectPropertyValuesProps) {
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
            propertyValues.sort().map((value: Prisma.JsonObject) => {
              const validation = propertyValuesValidation.get([propertyName, value]);

              return <li key={JSON.stringify(value)}>
                <PropertyHighlightToggle property={propertyName} value={value} />
                {
                  validation && <PropertyValidation validationData={validation} />
                }
                <JsonView
                  value={value}
                  displayObjectSize={false}
                  displayDataTypes={false}
                />
              </li>
            })
          }
        </ul>
      }
    </span>
  );
}
