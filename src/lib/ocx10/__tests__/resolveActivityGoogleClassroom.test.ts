import { describe, expect, it } from "vitest"

import { resolveActivityGoogleClassroom } from "../resolveActivityGoogleClassroom"

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
})
