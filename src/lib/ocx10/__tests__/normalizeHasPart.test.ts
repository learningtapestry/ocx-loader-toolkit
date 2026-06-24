import { describe, expect, it } from "vitest"

import { normalizeHasPart } from "../normalizeHasPart"
import { Ocx10Activity, Ocx10Material } from "../types"

describe("normalizeHasPart", () => {
  it("keeps Material links instead of recording skippedLink errors", () => {
    const activity: Ocx10Activity = {
      "@id": "activity-1",
      "@type": "Activity",
      hasPart: [
        {
          link: {
            "@id": "material-1",
            "@type": "Material",
          },
        },
      ],
    }

    const materialsById = new Map<string, Ocx10Material>([
      [
        "material-1",
        {
          "@id": "material-1",
          "@type": "Material",
          name: "Handout",
        },
      ],
    ])

    const result = normalizeHasPart(
      activity["@id"],
      activity.hasPart,
      new Map([[activity["@id"], activity]]),
      materialsById
    )

    expect(result.skippedLinks).toEqual([])
    expect(result.hasPart).toEqual([
      {
        "@id": "material-1",
        "@type": "Material",
        name: "Handout",
      },
    ])
  })
})
