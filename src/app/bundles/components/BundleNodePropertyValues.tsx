import { useState } from 'react';

export default function BundleNodePropertyValues({propertyName, propertyValues} : {propertyName: string, propertyValues: string[]}) {
  const [showList, setShowList] = useState(false);
  const toggleListVerb = showList ? 'Hide' : 'Show';

  return (
    <span>
        &nbsp; <button onClick={() => setShowList(!showList)}>{toggleListVerb} {propertyValues.length} values</button>

      {showList &&
        <ul>
          {
            propertyValues.sort().map((value: string) => (
              <li key={value}>{value}</li>
            ))
          }
        </ul>
      }
    </span>
  );
}
