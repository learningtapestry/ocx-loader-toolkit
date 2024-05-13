import { useState } from 'react';

import OcxBundle from "@/src/app/lib/OcxBundle";
import BundleNodePropertyValues from "@/src/app/bundles/components/BundleNodePropertyValues"
import PropertyHighlightToggle from "@/src/app/bundles/components/PropertyHighlightToggle"

import { useUiStore } from "@/src/app/stores/UiStore";

export default function BundleNodeProperties({ocxBundle} : {ocxBundle: OcxBundle}) {
  const resetPropertiesHighlights = useUiStore(state => state.resetPropertiesHighlights);

  const [showList, setShowList] = useState(false);
  const toggleListVerb = showList ? 'Hide' : 'Show';

  const properties = ocxBundle.allProperties.sort();
  const propertiesNodeCount = ocxBundle.allPropertiesNodeCount;
  const propertiesValues = ocxBundle.allScalarPropertiesValues;

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
                <td>{property} &nbsp;
                  <PropertyHighlightToggle property={property} />
                </td>
                <td>{propertiesNodeCount[property]}</td>
                <td>
                  {propertiesValues[property] &&
                    <BundleNodePropertyValues propertyName={property} propertyValues={propertiesValues[property]} />
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
