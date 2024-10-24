import { useState } from 'react';

import DeepArrayMap from "src/lib/DeepArrayMap"
import { PropertyValidationResult } from "src/lib/OcxNode"

import PropertyHighlightToggle from "./PropertyHighlightToggle"
import PropertyValidation from "./PropertyValidation"

interface BundleNodeScalarPropertyValuesProps {
  propertyName: string;
  propertyValues: string[];
  propertyValuesValidation: DeepArrayMap<[string, string], PropertyValidationResult>;
}

export default function BundleNodeScalarPropertyValues({propertyName, propertyValues, propertyValuesValidation} : BundleNodeScalarPropertyValuesProps) {
  const [showList, setShowList] = useState(false);
  const toggleListVerb = showList ? 'Hide' : 'Show';

  const buttonColor = propertyValues.length > 1 ? 'blue' : 'black';

  return (
    <span>
        &nbsp; <button
                  onClick={() => setShowList(!showList)}
                  style={{color: buttonColor}}
               >{toggleListVerb} {propertyValues.length} values</button>

      {showList &&
        <ul>
          {
            propertyValues.sort().map((value: string) => {
              const validation = propertyValuesValidation.get([propertyName, value]);

              return <li key={value}>
                {value}
                &nbsp;
                <PropertyHighlightToggle property={propertyName} value={value} />
                {
                  validation && <PropertyValidation validationData={validation} />
                }
              </li>
            })
          }
        </ul>
      }
    </span>
  );
}
