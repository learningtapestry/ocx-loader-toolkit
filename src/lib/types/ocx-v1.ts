// OCX v1.0.0 TypeScript definitions
import { Prisma } from "@prisma/client"

// Base node interface with common properties
export interface OCXNodeBase {
  "@context": string;
  "@type": string;
  name: string;
  identifier: string;
  isPartOf?: Partial<OCXNode>[];
  hasPart?: Partial<OCXNode>[];
  position?: number;
  [key: string]: any; // Index signature for Prisma JSON compatibility
}

// Course node type
export interface OCXCourse extends OCXNodeBase {
  "@context": "https://schema.org/Course";
  "@type": "Course";
  academicSubject: string;
  audience: string;
  courseCode: string;
  hasPart: Partial<OCXNode>[];
}

// LessonGrouping node type
export interface OCXLessonGrouping extends OCXNodeBase {
  "@context": "https://schema.org/LessonGrouping";
  "@type": "LessonGrouping";
  isPartOf: Partial<OCXNode>[];
  hasPart: Partial<OCXNode>[];
  position: number;
}

// Lesson node type
export interface OCXLesson extends OCXNodeBase {
  "@context": "https://chanzuckerberg.com/Lesson";
  "@type": "Lesson";
  isPartOf: Partial<OCXNode>[];
  hasPart: Partial<OCXNode>[];
  position: number;
}

// Activity node type
export interface OCXActivity extends OCXNodeBase {
  "@context": "https://chanzuckerberg.com/Activity";
  "@type": "Activity";
  isPartOf: Partial<OCXNode>[];
  position: number;
  description?: string;
}

// Assessment node type
export interface OCXAssessment extends OCXNodeBase {
  "@context": "https://chanzuckerberg.com/Assesment";
  "@type": "Assessment";
  isPartOf: Partial<OCXNode>[];
  hasPart: Partial<OCXNode>[];
  position: number;
}

// Material node type
export interface OCXMaterial extends OCXNodeBase {
  "@context": "https://chanzuckerberg.com/Material";
  "@type": "Material";
  isPartOf: Partial<OCXNode>[];
  hasRepresentation: Partial<OCXNode>[];
}

// Representation node type
export interface OCXRepresentation extends OCXNodeBase {
  "@context": "https://chanzuckerberg.com/Representation";
  "@type": "Representation";
  isRepresentationOf: Partial<OCXNode>[];
  encodingFormat: string;
  accessResource: string;
}

// Union type for all possible node types
export type OCXNode = 
  | OCXCourse 
  | OCXLessonGrouping 
  | OCXLesson 
  | OCXActivity 
  | OCXAssessment 
  | OCXMaterial 
  | OCXRepresentation;



// LTI Placement definition
export interface OCXLTIPlacement {
  type: string;
}

// LTI Launch Definition
export interface OCXLTILaunchDefinition {
  definition_type: string;
  definition_id: string;
  name: string;
  description: string;
  url: string;
  domain: string;
  placements: {
    [key: string]: OCXLTIPlacement;
  };
}

// LTI Configuration
export interface OCXLTIConfiguration {
  title: string;
  description: string;
  target_link_uri: string;
  oidc_initiation_url: string;
  redirect_uris: string[];
  scopes: string[];
  placements: Array<{
    placement: string;
    enabled: boolean;
  }>;
  launch_settings: Record<string, any>;
}

// LTI Registration
export interface OCXLTIRegistration {
  vendor: string;
  name: string;
  admin_nickname: string;
  configuration: OCXLTIConfiguration;
}

// LTI section
export interface OCXLTI {
  launchDefinitions: OCXLTILaunchDefinition[];
  registrations: OCXLTIRegistration[];
}

// Main OCX document type
export interface OCXDocument {
  version: string;
  nodes: OCXNode[];
  lti?: OCXLTI;
}