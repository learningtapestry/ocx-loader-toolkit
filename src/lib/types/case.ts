import { OCXDocument } from ".";

export interface CFDocument {
    identifier: string;
    uri: string;
    creator: string;
    Publisher: string;
    title: string;
    lastChangeDateTime: string;
    language: string;
    adoptionStatus: string;
    frameworkType: string;
    publisher: string;
}

export interface CFItem {
  identifier: string;
  uri: string;
  fullStatement: string;
  lastChangeDateTime: string;
  CFItemTypeURI: {
    title: string;
    identifier: string;
    uri: string;
  },
  CFItemType: string;
  extensions: {
    ocxType: "Activity";
    learningResourceType: string;
    educationalUse: string;
    timeRequired: string;
    provider: string;
    description: string;
    deliveryMechanism: string;
    deliverySystem: string;
    resourceURL: string;
    isIframeable: string;
    fullContent: string;
    ocx: OCXDocument;
  }
};

export interface CFAssociation {
  identifier: string;
  uri: string;
  associationType: "ext:isAlignedTo" | "isChildOf";
  originNodeURI: {
    title: string;
    identifier: string;
    uri: string;
  },
  destinationNodeURI: {
    title: string;
    identifier: string;
    uri: string;
  },
  lastChangeDateTime: string;
};


export interface CaseData {
  CFDocument: CFDocument;
  CFItems: CFItem[];
  CFAssociations: CFAssociation[];
}