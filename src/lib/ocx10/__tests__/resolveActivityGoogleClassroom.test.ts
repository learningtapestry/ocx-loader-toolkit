import { describe, expect, it } from "vitest"

import path from "path"
import { pathToFileURL } from "url"

import {
  mapInLanguageToVersion,
  resolveActivityGoogleClassroom,
} from "../resolveActivityGoogleClassroom"

describe("resolveActivityGoogleClassroom", () => {
  it("maps lmsActivity title and content to legacy googleClassroom fields", () => {
    const activity = {
      "@type": "Activity",
      name: "Watch videos of native american sky stories",
      hasPart: [{ "@id": "material-1", "@type": "Material", name: "Native American Sky Stories Videos" }],
    }

    const materialNodesById = new Map([
      [
        "material-1",
        {
          "@type": "Material",
          "@id": "material-1",
          content:
            "Use the attached links to access the two videos of different Native American sky stories explaining why the North Star does not move",
          lmsActivity: {
            title: "Native American Sky Stories Videos",
            content:
              "Use the attached links to access the two videos of different Native American sky stories explaining why the North Star does not move",
            language: "en-US",
            accessResource: "assets/lms_activity/SCI-G8-SS-LS1-L2-A2.lmsActivity.json",
          },
        },
      ],
    ])

    expect(resolveActivityGoogleClassroom(activity, materialNodesById)).toEqual({
      postTitle: {
        en: "Native American Sky Stories Videos",
        es: "Native American Sky Stories Videos",
      },
      postInstructions: {
        en: "Use the attached links to access the two videos of different Native American sky stories explaining why the North Star does not move",
        es: "Use the attached links to access the two videos of different Native American sky stories explaining why the North Star does not move",
      },
      materials: [],
    })
  })

  it("prepends distinct material intro text before lmsActivity content", () => {
    const activity = {
      "@type": "Activity",
      name: "Activity name",
      hasPart: [{ "@id": "material-1", "@type": "Material" }],
    }

    const materialNodesById = new Map([
      [
        "material-1",
        {
          "@type": "Material",
          "@id": "material-1",
          content: "Intro line for students.",
          lmsActivity: {
            title: "LMS title",
            content: "Detailed instructions.",
            language: "en-US",
            accessResource: "assets/lms_activity/example.json",
          },
        },
      ],
    ])

    expect(resolveActivityGoogleClassroom(activity, materialNodesById).postInstructions.en).toBe(
      "Intro line for students.\n\nDetailed instructions."
    )
  })

  it("falls back to activity name and empty instructions without lmsActivity material", () => {
    const activity = {
      "@type": "Activity",
      name: "Activity without materials",
      hasPart: [],
    }

    expect(resolveActivityGoogleClassroom(activity, new Map())).toEqual({
      postTitle: { en: "Activity without materials", es: "Activity without materials" },
      postInstructions: { en: "", es: "" },
      materials: [],
    })
  })

  it("does not include lmsActivity-only materials in materials[]", () => {
    const activity = {
      "@type": "Activity",
      name: "Activity with instructions only",
      hasPart: [{ "@id": "material-1", "@type": "Material" }],
    }

    const materialNodesById = new Map([
      [
        "material-1",
        {
          "@type": "Material",
          "@id": "material-1",
          inLanguage: "en-US",
          name: "Instructions material",
          lmsActivity: {
            title: "Instructions title",
            content: "Do the thing.",
            language: "en-US",
            accessResource: "assets/lms_activity/example.json",
          },
          resolvedRepresentations: [
            {
              id: "lms",
              encodingFormat: "application/vnd.ocx.lmsActivity+json",
              lmsLoadingGuidance: "Optional",
              accessKind: "packageAsset",
              accessResource: "assets/lms_activity/example.json",
              legacyUrl: "file:///tmp/example.json",
              legacyMaterialType: "material",
            },
          ],
        },
      ],
    ])

    const result = resolveActivityGoogleClassroom(activity, materialNodesById)

    expect(result.materials).toEqual([])
    expect(result.postInstructions.en).toBe("Do the thing.")
  })

  it("maps Google Drive material to https legacy materials[] entry", () => {
    const driveUrl =
      "https://drive.google.com/open?id=1_H35J0MaY3_4oUdqypMfWG3sKk4DrR0r5G6Cxt7Gq4s"
    const activity = {
      "@type": "Activity",
      name: "Revisit and explain collision types",
      hasPart: [{ "@id": "material-drive", "@type": "Material", name: "Explicando una colisión" }],
    }

    const materialNodesById = new Map([
      [
        "material-drive",
        {
          "@type": "Material",
          "@id": "material-drive",
          name: "Explicando una colisión",
          inLanguage: "en-US",
          resolvedRepresentations: [
            {
              id: "drive",
              encodingFormat: "application/octet-stream",
              lmsLoadingGuidance: "Required",
              accessKind: "googleDrive",
              accessResource: driveUrl,
              legacyUrl: driveUrl,
              legacyMaterialType: "material",
            },
            {
              id: "markdown",
              encodingFormat: "text/markdown",
              lmsLoadingGuidance: "Optional",
              accessKind: "packageAsset",
              accessResource: "assets/markdown/example.md",
              legacyUrl: "file:///tmp/example.md",
              legacyMaterialType: "material",
            },
          ],
        },
      ],
    ])

    expect(resolveActivityGoogleClassroom(activity, materialNodesById).materials).toEqual([
      {
        version: "English",
        object: {
          title: "Explicando una colisión",
          url: driveUrl,
          type: "material",
        },
      },
    ])
  })

  it("maps package PDF material to file:// legacy materials[] entry", () => {
    const pdfPath = path.join(
      "alex/test-data/science-grade-8.ocx",
      "assets/pdf/8.2-Lesson-9-Handout-Self-Assessment-for-Classroom.pdf"
    )
    const fileUrl = pathToFileURL(path.resolve(pdfPath)).href
    const activity = {
      "@type": "Activity",
      name: "Navigation",
      hasPart: [{ "@id": "material-pdf", "@type": "Material" }],
    }

    const materialNodesById = new Map([
      [
        "material-pdf",
        {
          "@type": "Material",
          "@id": "material-pdf",
          name: "So.l9.ho3",
          inLanguage: "en-US",
          resolvedRepresentations: [
            {
              id: "pdf",
              encodingFormat: "application/pdf",
              lmsLoadingGuidance: "Recommended",
              accessKind: "packageAsset",
              accessResource: "assets/pdf/8.2-Lesson-9-Handout-Self-Assessment-for-Classroom.pdf",
              legacyUrl: fileUrl,
              legacyMaterialType: "material",
            },
          ],
        },
      ],
    ])

    expect(resolveActivityGoogleClassroom(activity, materialNodesById).materials).toEqual([
      {
        version: "English",
        object: {
          title: "So.l9.ho3",
          url: fileUrl,
          type: "material",
        },
      },
    ])
  })

  it("maps inLanguage to legacy version labels", () => {
    expect(mapInLanguageToVersion("en-US")).toBe("English")
    expect(mapInLanguageToVersion("es-US")).toBe("Spanish")
  })
})
