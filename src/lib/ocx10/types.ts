import { Ocx10CurriculumType } from "./curriculumTypes"

export const OCX10_FORMAT = "ocx@1.0.0"

export interface Ocx10ManifestContentEntry {
  path: string
  id: string
  name: string
  type: string
}

export interface Ocx10Manifest {
  "@id": string
  name: string
  description?: string
  format: string
  inLanguage: string
  contents: Ocx10ManifestContentEntry[]
}

export interface Ocx10LinkReference {
  link: {
    "@id": string
    "@type": string
  }
}

export interface Ocx10HasPartStub {
  "@id": string
  "@type": string
  name?: string
}

export interface Ocx10CommonFields {
  "@id": string
  "@type": Ocx10CurriculumType
  identifier?: string
  audience?: string[]
  author?: string
  license?: string
  provider?: string
  inLanguage?: string
  providerDateCreated?: string
  providerDateModified?: string
  name?: string
  description?: string
  academicSubject?: string
  gradeLevel?: string[]
  courseCode?: string
  timeRequired?: string
  hasPart?: (Ocx10LinkReference | Ocx10HasPartStub)[]
  hasEducationalAlignment?: Ocx10LinkReference[]
}

export interface Ocx10Course extends Ocx10CommonFields {
  "@type": "Course"
  name: string
  academicSubject: string
  gradeLevel: string[]
  courseCode: string
}

export interface Ocx10LessonGrouping extends Ocx10CommonFields {
  "@type": "LessonGrouping"
  groupLevel: number
  groupName: string
  position: number
  ordinalName: string
}

export interface Ocx10Lesson extends Ocx10CommonFields {
  "@type": "Lesson"
  position?: number
  ordinalName?: string
  curriculumLabel?: string
}

export interface Ocx10Activity extends Ocx10CommonFields {
  "@type": "Activity"
  position?: number
  ordinalName?: string
  curriculumLabel?: string
  studentGroupingType?: string
  educationalUse?: string
  gradingRequired?: boolean
  submissionRequired?: boolean
  isOptional?: boolean
}

export type Ocx10CurriculumEntity =
  | Ocx10Course
  | Ocx10LessonGrouping
  | Ocx10Lesson
  | Ocx10Activity

export interface Ocx10LoadedEntity {
  path: string
  entity: Ocx10CurriculumEntity
}
