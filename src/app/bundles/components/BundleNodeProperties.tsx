import { useState } from 'react';

import OcxBundle from "@/src/app/lib/OcxBundle";

import BundleNodeScalarPropertyValues from "./BundleNodeScalarPropertyValues"
import PropertyHighlightToggle from "./PropertyHighlightToggle"
import BundleNodeObjectPropertyValues from "./BundleNodeObjectPropertyValues"

import { useUiStore } from "@/src/app/stores/UiStore";

export default function BundleNodeProperties({ocxBundle} : {ocxBundle: OcxBundle}) {
  const resetPropertiesHighlights = useUiStore(state => state.resetPropertiesHighlights);

  const [showList, setShowList] = useState(false);
  const toggleListVerb = showList ? 'Hide' : 'Show';

  const properties = ocxBundle.allProperties.sort();
  const propertiesNodeCount = ocxBundle.allPropertiesNodeCount;
  const propertiesScalarValues = ocxBundle.allScalarPropertiesValues;
  const propertiesObjectValues = ocxBundle.allObjectPropertiesValues;

  return (
    <>
      <h2>Properties: {properties.length}
        &nbsp; <button onClick={() => setShowList(!showList)}>{toggleListVerb} List</button>
        &nbsp; <button onClick={resetPropertiesHighlights}>Reset Highlights</button>
      </h2>

      {showList &&
        <table>
          <thead>
          <tr>
            <th>Property</th>
            <th>Nodes</th>
            <th>Values</th>
          </tr>
          </thead>
          <tbody>
          {
            properties.sort().map((property: string) => (
              <tr key={property}>
                <td style={{color: propertiesScalarValues[property] ? 'black' : 'blue'}}>{property} &nbsp;
                  <PropertyHighlightToggle property={property} />
                </td>
                <td>{propertiesNodeCount[property]}</td>
                <td>
                  {propertiesScalarValues[property] &&
                    <BundleNodeScalarPropertyValues propertyName={property} propertyValues={propertiesScalarValues[property]} />
                  }
                  {propertiesObjectValues[property] &&
                    <BundleNodeObjectPropertyValues propertyName={property} propertyValues={propertiesObjectValues[property]} />
                  }
                </td>
              </tr>
            ))
          }
          </tbody>
        </table>
      }
    </>
  );
}
