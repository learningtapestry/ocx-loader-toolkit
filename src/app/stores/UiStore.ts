import {create} from 'zustand';
import _ from "lodash"
import { Prisma } from "@prisma/client"

export interface UiStoreState {
  nodeTypesColors: Record<string, string>;

  highlightProperties: string[];
  highlightPropertiesValues: Record<string, Prisma.JsonValue[]>;

  setNodeTypes: (nodeTypes: string[]) => void;

  addHighlightProperty: (property: string) => void;
  removeHighlightProperty: (property: string) => void;

  addHighlightPropertyValue: (property: string, value: Prisma.JsonValue) => void;
  removeHighlightPropertyValue: (property: string, value: Prisma.JsonValue) => void;

  resetPropertiesHighlights: () => void;
}

export const useUiStore = create<UiStoreState>((set) => ({
  nodeTypesColors: {},
  highlightProperties: [],
  highlightPropertiesValues: {},

  setNodeTypes: (nodeTypes) => {
    const nodeTypesColors: Record<string, string> = {};

    nodeTypes.forEach((type, index) => {
      nodeTypesColors[type] = distinctiveColors[index % distinctiveColors.length];
    });

    set({nodeTypesColors});
  },

  addHighlightProperty: (property) => {
    set((state) => {
      if (state.highlightProperties.includes(property)) {
        return state;
      }
      const highlightProperties = [...state.highlightProperties, property];
      return {highlightProperties};
    });
  },
  removeHighlightProperty: (property) => {
    set((state) => {
      const highlightProperties = state.highlightProperties.filter((p) => p !== property);
      return {highlightProperties};
    });
  },
  addHighlightPropertyValue: (property, value) => {
    set((state) => {
      const highlightPropertiesValues = {...state.highlightPropertiesValues};
      if (!highlightPropertiesValues[property]) {
        highlightPropertiesValues[property] = [];
      }
      if (highlightPropertiesValues[property].some(v => _.isEqual(v, value))) {
        return state;
      }
      highlightPropertiesValues[property].push(value);
      return {highlightPropertiesValues};
    });
  },
  removeHighlightPropertyValue: (property, value) => {
    set((state) => {
      const highlightPropertiesValues = {...state.highlightPropertiesValues};
      if (!highlightPropertiesValues[property]) {
        return state;
      }
      highlightPropertiesValues[property] = highlightPropertiesValues[property].filter((v) => !_.isEqual(v, value));
      return {highlightPropertiesValues};
    });
  },
  resetPropertiesHighlights: () => {
    set({highlightProperties: [], highlightPropertiesValues: {}});
  }
}));

const distinctiveColors = [
  "#6699ff",
  "#ff9933",
  "#33cc99",
  "#cc66ff",
  "#00aacc",
  "#ff99c2",
  "#eeee66",
  "#ff6666",
  "#99cc00",
  "#9966ff",
  "#cc9900",
  "#1199ff",
  "#cc0033",
  "#66cc33",
  "#6600cc",
  "#ffcc00",
  "#0099cc",
  "#ff3399",
  "#33cc33",
  "#9933ff",
  "#666600",
  "#0066cc",
  "#ff0066",
  "#00cc66",
  "#660099",
  "#cc6600",
  "#3366ff",
  "#ff5050",
  "#339933",
  "#993366"
];
