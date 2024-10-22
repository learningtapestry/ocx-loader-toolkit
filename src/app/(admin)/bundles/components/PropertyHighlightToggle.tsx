import { useUiStore } from "src/app/stores/UiStore"
import { Prisma } from "@prisma/client"

export default function PropertyHighlightToggle({ property, value }: { property: string, value?: Prisma.JsonValue }) {
  const addHighlightProperty = useUiStore(state => state.addHighlightProperty);
  const removeHighlightProperty = useUiStore(state => state.removeHighlightProperty);
  const highlightProperties = useUiStore(state => state.highlightProperties);

  const addHighlightPropertyValue = useUiStore(state => state.addHighlightPropertyValue);
  const removeHighlightPropertyValue = useUiStore(state => state.removeHighlightPropertyValue);
  const highlightPropertiesValues = useUiStore(state => state.highlightPropertiesValues);

  const isHighlighted = value === undefined ? highlightProperties.includes(property) : highlightPropertiesValues[property]?.includes(value);

  const onClick = () => {
    if (value === undefined) {
      if (isHighlighted) {
        removeHighlightProperty(property);
      } else {
        addHighlightProperty(property);
      }
    } else {
      if (isHighlighted) {
        removeHighlightPropertyValue(property, value);
      } else {
        addHighlightPropertyValue(property, value);
      }
    }
  }

  return (
    <svg width="12" height="12" onClick={onClick}>
      <circle cx="6" cy="7" r="5" fill={isHighlighted ? '#FFBF00' : 'none'} stroke="#FFBF00" strokeWidth="1" />
    </svg>
  );
}
