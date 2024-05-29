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

  const [filterPropertiesForType, setFilterPropertiesForType] = useState<string>('All');

  const allProperties = ocxBundle.allProperties.sort();

  let properties = allProperties;
  let propertiesNodeCount = ocxBundle.allPropertiesNodeCount;
  let propertiesScalarValues = ocxBundle.allScalarPropertiesValues;
  let propertiesObjectValues = ocxBundle.allObjectPropertiesValues;

  if (filterPropertiesForType !== 'All') {
    properties = ocxBundle.propertiesByType[filterPropertiesForType].sort();
    propertiesNodeCount = ocxBundle.propertiesNodeCountByType[filterPropertiesForType];
    propertiesScalarValues = ocxBundle.scalarPropertiesValuesByType[filterPropertiesForType];
    propertiesObjectValues = ocxBundle.objectPropertiesValuesByType[filterPropertiesForType];
  }

  return (
    <>
      <h2>Properties: {allProperties.length}
        &nbsp; <button onClick={() => setShowList(!showList)}>{toggleListVerb} List</button>
        &nbsp; <button onClick={resetPropertiesHighlights}>Reset Highlights</button>
      </h2>

      {showList && <>
        <div>
          Filter by node type:
          <select onChange={(e) => setFilterPropertiesForType(e.target.value)}>
            <option value={'All'}>All</option>
            {
              ocxBundle.allCombinedTypes.sort().map((type) => (
                <option key={type} value={type}>{type} ({ocxBundle.allCombinedTypesNodeCount[type]})</option>
              ))
            }
          </select>
        </div>

        {filterPropertiesForType !== 'All' &&
          <div>
            <h3>Properties for type: {properties.length}</h3>
          </div>
        }
        {filterPropertiesForType == 'All' && <br />}

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
                <td style={{ color: propertiesScalarValues[property] ? "black" : "blue" }}>{property} &nbsp;
                  <PropertyHighlightToggle property={property} />
                </td>
                <td>{propertiesNodeCount[property]}</td>
                <td>
                  {propertiesScalarValues[property] &&
                    <BundleNodeScalarPropertyValues propertyName={property}
                                                    propertyValues={propertiesScalarValues[property]} />
                  }
                  {propertiesObjectValues[property] &&
                    <BundleNodeObjectPropertyValues propertyName={property}
                                                    propertyValues={propertiesObjectValues[property]} />
                  }
                </td>
              </tr>
            ))
          }
          </tbody>
        </table>
      </>
      }
    </>
  );
}
