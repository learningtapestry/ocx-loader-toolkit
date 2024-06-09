import { useState } from 'react';

import OcxBundle from "@/src/app/lib/OcxBundle";

import ColorDotWithNumber from "@/src/app/components/ColorDotWithNumber"

import BundleNodeScalarPropertyValues from "./BundleNodeScalarPropertyValues"
import PropertyHighlightToggle from "./PropertyHighlightToggle"
import BundleNodeObjectPropertyValues from "./BundleNodeObjectPropertyValues"

import renamePropertyInBundle from "@/src/app/bundles/mutations/renamePropertyInBundle"
import removePropertyInBundle from "@/src/app/bundles/mutations/removePropertyInBundle"

import { FaEdit, FaTrash } from "react-icons/fa"

import { useUiStore } from "@/src/app/stores/UiStore";
import { useMutation } from "@blitzjs/rpc"

export default function BundleNodeProperties({ocxBundle, refetchBundle} : {ocxBundle: OcxBundle, refetchBundle: () => void}) {
  const resetPropertiesHighlights = useUiStore(state => state.resetPropertiesHighlights);

  const [renamePropertyInBundleMutation] = useMutation(renamePropertyInBundle);
  const [removePropertyInBundleMutation] = useMutation(removePropertyInBundle);

  const [showList, setShowList] = useState(false);
  const toggleListVerb = showList ? 'Hide' : 'Show';

  const [filterPropertiesForType, setFilterPropertiesForType] = useState<string>('All');

  const allProperties = ocxBundle.allProperties.sort();

  let properties = allProperties;
  let propertiesNodeCount = ocxBundle.allPropertiesNodeCount;
  let propertiesNotValidNodeCount = ocxBundle.allPropertiesNotValidNodeCount;
  let propertiesUnrecognizedNodeCount = ocxBundle.allPropertiesUnrecognizedNodeCount;
  let propertiesScalarValues = ocxBundle.allScalarPropertiesValues;
  let propertiesScalarValuesValidation = ocxBundle.allScalarPropertiesValuesValidation;
  let propertiesObjectValues = ocxBundle.allObjectPropertiesValues;
  let propertiesObjectValuesValidation = ocxBundle.allObjectPropertiesValuesValidation;
  let nonStandardProperties = ocxBundle.allNonStandardProperties;

  const totalPropertiesNotValidCount = Object.values(ocxBundle.allPropertiesNotValidNodeCount).reduce((a, b) => a + b, 0);
  const totalPropertiesUnrecognizedCount = Object.values(ocxBundle.allPropertiesUnrecognizedNodeCount).reduce((a, b) => a + b, 0);

  let propertiesNotValidCount = 0;
  let propertiesUnrecognizedCount = 0;

  if (filterPropertiesForType !== 'All') {
    properties = ocxBundle.propertiesByType[filterPropertiesForType].sort();
    propertiesNodeCount = ocxBundle.propertiesNodeCountByType[filterPropertiesForType];
    propertiesNotValidNodeCount = ocxBundle.propertiesNotValidNodeCountByType[filterPropertiesForType];
    propertiesUnrecognizedNodeCount = ocxBundle.propertiesUnrecognizedNodeCountByType[filterPropertiesForType];
    propertiesScalarValues = ocxBundle.scalarPropertiesValuesByType[filterPropertiesForType];
    propertiesScalarValuesValidation = ocxBundle.scalarPropertiesValuesValidationByType[filterPropertiesForType];
    propertiesObjectValues = ocxBundle.objectPropertiesValuesByType[filterPropertiesForType];
    propertiesObjectValuesValidation = ocxBundle.objectPropertiesValuesValidationByType[filterPropertiesForType];
    nonStandardProperties = ocxBundle.nonStandardPropertiesByType[filterPropertiesForType];

    propertiesNotValidCount = Object.values(ocxBundle.propertiesNotValidNodeCountByType[filterPropertiesForType]).reduce((a, b) => a + b, 0);
    propertiesUnrecognizedCount = Object.values(ocxBundle.propertiesUnrecognizedNodeCountByType[filterPropertiesForType]).reduce((a, b) => a + b, 0);
  }

  const onRenameProperty = async (property: string) => {
    const newName = window.prompt(`Rename property ${property}`, property);
    const nodeType = filterPropertiesForType === 'All' ? undefined : filterPropertiesForType;

    if (newName && newName !== property) {
      await renamePropertyInBundleMutation({id: ocxBundle.prismaBundle.id, oldName: property, newName, nodeType});
      refetchBundle();
    }
  }

  const onRemoveProperty = async (property: string) => {
    const nodeType = filterPropertiesForType === 'All' ? undefined : filterPropertiesForType;

    if (window.confirm(`Are you sure you want to remove property ${property}?`)) {
      await removePropertyInBundleMutation({id: ocxBundle.prismaBundle.id, name: property, nodeType});
      refetchBundle();
    }
  }

  return (
    <>
      <h2>Properties: {allProperties.length}
        &nbsp; <button onClick={() => setShowList(!showList)}>{toggleListVerb} List</button>
        &nbsp; <button onClick={resetPropertiesHighlights}>Reset Highlights</button>
      </h2>
      <p>
        Properties values validation totals:
        &nbsp; {
          totalPropertiesNotValidCount > 0 &&
          <ColorDotWithNumber color="red" number={totalPropertiesNotValidCount} />
        }
          &nbsp; {
          totalPropertiesUnrecognizedCount > 0 &&
          <ColorDotWithNumber color="orange" number={totalPropertiesUnrecognizedCount} />
        }
      </p>

      {showList && <>
        <div>
          Filter by node type: &nbsp;
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

            <p>
              Properties values validation totals for type:
              {
                propertiesNotValidCount > 0 &&
                <ColorDotWithNumber color="red" number={propertiesNotValidCount} />
              }
              &nbsp;
              {
                propertiesUnrecognizedCount > 0 &&
                <ColorDotWithNumber color="orange" number={propertiesUnrecognizedCount} />
              }
            </p>
          </div>
        }
        {filterPropertiesForType == 'All' && <br />}

        <table>
          <thead>
          <tr>
            <th>Property</th>
            <th>Nodes</th>
            <th>Validation</th>
            <th>Values</th>
          </tr>
          </thead>
          <tbody>
          {
            properties.sort().map((property: string) => (
              <tr key={property}>
                <td style={{ color: propertiesScalarValues[property] ? "black" : "blue", verticalAlign: "top" }}>
                  <PropertyHighlightToggle property={property} /> &nbsp;
                  <FaEdit
                    title="Rename Property"
                    style={{cursor: 'pointer', color: 'darkgray', width: 10, top: 2, position: 'relative'}}
                    onClick={() => onRenameProperty(property)}
                  /> &nbsp;
                  <FaTrash
                    title="Remove property"
                    style={{cursor: 'pointer', color: 'darkgray', width: 10, top: 2, position: 'relative'}}
                    onClick={() => onRemoveProperty(property)}
                  /> &nbsp;
                  {nonStandardProperties.includes(property) && <span style={{color: "red", fontWeight: 'bold'}} title={"Non standard property"}>! &nbsp;</span>}
                  {property}
                </td>
                <td style={{verticalAlign: "top"}}>{propertiesNodeCount[property]}</td>
                <td style={{verticalAlign: "top"}}>
                  { propertiesNotValidNodeCount[property] == 0 && propertiesUnrecognizedNodeCount[property] == 0 &&
                    <ColorDotWithNumber color="green" />
                  }
                  { propertiesNotValidNodeCount[property] > 0 &&
                    <ColorDotWithNumber color="red" number={propertiesNotValidNodeCount[property]} />
                  }
                  { propertiesUnrecognizedNodeCount[property] > 0 &&
                    <ColorDotWithNumber color="orange" number={propertiesUnrecognizedNodeCount[property]} />
                  }
                </td>
                <td>
                  {propertiesScalarValues[property] &&
                    <BundleNodeScalarPropertyValues
                      propertyName={property}
                      propertyValues={propertiesScalarValues[property]}
                      propertyValuesValidation={propertiesScalarValuesValidation}
                    />
                  }
                  {propertiesObjectValues[property] &&
                    <BundleNodeObjectPropertyValues
                      propertyName={property}
                      propertyValues={propertiesObjectValues[property]}
                      propertyValuesValidation={propertiesObjectValuesValidation}
                    />
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
