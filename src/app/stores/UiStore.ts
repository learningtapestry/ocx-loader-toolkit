import {create} from 'zustand';

export interface UiStoreState {
  nodeTypesColors: Record<string, string>;

  setNodeTypes: (nodeTypes: string[]) => void;
}

export const useUiStore = create<UiStoreState>((set) => ({
  nodeTypesColors: {},

  setNodeTypes: (nodeTypes) => {
    const nodeTypesColors: Record<string, string> = {};

    nodeTypes.forEach((type, index) => {
      nodeTypesColors[type] = distinctiveColors[index % distinctiveColors.length];
    });

    set({nodeTypesColors});
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
