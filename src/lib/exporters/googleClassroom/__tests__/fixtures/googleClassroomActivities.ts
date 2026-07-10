import OcxNode from "src/lib/OcxNode"
import OcxBundle from "src/lib/OcxBundle"
import { Bundle, Node as PrismaNode } from "@prisma/client"

const bundle = { id: 1 } as Bundle

// TODO(refactor): share one OcxBundle across fixture nodes instead of constructing per makeNode call
function makeNode(id: number, metadata: Record<string, unknown>, parentId: number | null = null): OcxNode {
  const prismaNode = {
    id,
    parentId,
    metadata,
    bundleId: 1,
    content: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as PrismaNode

  const ocxBundle = new OcxBundle(bundle, [prismaNode])
  return new OcxNode(prismaNode, ocxBundle)
}

export const lessonParent = makeNode(1, {
  "@id": "lesson-1",
  "@type": "oer:Lesson",
  name: "Lesson 1",
  alternateName: "1",
  hasPart: [],
})

export const assignmentActivity = makeNode(
  2,
  {
    "@id": "activity-1",
    "@type": "oer:Activity",
    name: "Initial Model Activity",
    alternateName: "1",
    hasPart: [],
    gradingFormat: { "@type": "oer:PointGradeFormat" },
    googleClassroom: {
      postType: "assignment",
      postTitle: { en: "Initial Model", es: "Diagrama inicial" },
      postInstructions: {
        en: "Use the attached Initial Diagram doc to draw a diagram explaining your thinking.",
        es: "",
      },
      materials: [],
    },
  },
  1,
)

export const materialActivity = makeNode(
  3,
  {
    "@id": "activity-2",
    "@type": "oer:Activity",
    name: "Reading Material",
    alternateName: "2",
    hasPart: [],
    googleClassroom: {
      postType: "material",
      postTitle: { en: "Reading", es: "" },
      postInstructions: { en: "Read the article.", es: "" },
      materials: [
        {
          version: "English",
          object: {
            url: "https://example.com/resource",
            type: "material",
            title: "Example Resource",
          },
        },
      ],
    },
  },
  1,
)

export const summaryPostActivity = makeNode(
  4,
  {
    "@id": "activity-3",
    "@type": "oer:Activity",
    name: "Summary",
    alternateName: "3",
    hasPart: [],
    googleClassroom: {
      postType: "summary post",
      postTitle: { en: "Lesson Summary", es: "" },
      postInstructions: { en: "Review today's learning.", es: "" },
      materials: [],
    },
  },
  1,
)

export const ambiguousPostTypeActivity = makeNode(
  5,
  {
    "@id": "activity-4",
    "@type": "oer:Activity",
    name: "Ambiguous",
    alternateName: "4",
    hasPart: [],
    googleClassroom: {
      postType: "assignment, material - choose one, based on blueprint",
      postTitle: { en: "Ambiguous", es: "" },
      postInstructions: { en: "", es: "" },
      materials: [],
    },
  },
  1,
)

export const youtubeMaterialActivity = makeNode(
  6,
  {
    "@id": "activity-5",
    "@type": "oer:Activity",
    name: "Video",
    alternateName: "5",
    hasPart: [],
    googleClassroom: {
      postType: "material",
      postTitle: { en: "Video", es: "" },
      postInstructions: { en: "", es: "" },
      materials: [
        {
          version: "English",
          object: {
            url: "https://youtu.be/ocs6BXQPOgg",
            type: "video",
            title: "Demo video",
          },
        },
      ],
    },
  },
  1,
)

export const driveMaterialActivity = makeNode(
  7,
  {
    "@id": "activity-6",
    "@type": "oer:Activity",
    name: "Drive Doc",
    alternateName: "6",
    hasPart: [],
    googleClassroom: {
      postType: "material",
      postTitle: { en: "Doc", es: "" },
      postInstructions: { en: "", es: "" },
      materials: [
        {
          version: "English",
          object: {
            url: "https://docs.google.com/document/d/abc123/edit",
            type: "material",
            title: "Google Doc",
          },
        },
      ],
    },
  },
  1,
)

export const htmlInstructionsActivity = makeNode(
  8,
  {
    "@id": "activity-7",
    "@type": "oer:Activity",
    name: "HTML Instructions",
    alternateName: "7",
    hasPart: [],
    gradingFormat: { "@type": "oer:PointGradeFormat" },
    googleClassroom: {
      postType: "assignment",
      postTitle: { en: "HTML Test", es: "" },
      postInstructions: {
        en: "<p>Draw a <em>diagram</em></p>",
        es: "",
      },
      materials: [],
    },
  },
  1,
)
