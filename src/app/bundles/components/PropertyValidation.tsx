import { useState } from 'react';

import { PropertyValidationResult } from "@/src/app/lib/OcxNode"

import JsonView from '@uiw/react-json-view';

export default function PropertyValidation({validationData} : {validationData: PropertyValidationResult}) {
  const [showErrors, setShowErrors] = useState(false);

  let color = 'green';
  if (!validationData.isRecognizedProperty) color = 'orange';
  else if (!validationData.isValid) color = 'red';

  return <div style={{ display: 'inline-block' }}>
    <svg width="12" height="12" onClick={() => setShowErrors(!showErrors)}>
      <circle cx="6" cy="7" r="4" fill="none" stroke={color} strokeWidth="2" />
    </svg>

    {
      showErrors && validationData.validationErrors.length > 0 && <div>
        Validation errors:
        <JsonView
          value={validationData.validationErrors}
          displayObjectSize={false}
          displayDataTypes={false}
        />
      </div>

    }
  </div>
}
