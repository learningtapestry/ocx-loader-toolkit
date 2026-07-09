import db from "db"

import { BundleExport } from "@prisma/client"
import { JsonObject } from "type-fest"

import { publishBundleExportUpdate } from "src/app/jobs/BundleExportUpdate"
import OcxBundle from "src/lib/OcxBundle"

import {
  buildCoursework,
  countExportableActivities,
} from "./googleClassroom/buildCoursework"
import { GoogleClassroomData, normalizePostType } from "./googleClassroom/types"
import OcxBundleExportGoogleClassroom, {
  createExportOcxBundleToGoogleClassroom,
} from "./OcxBundleExportGoogleClassroom"

export default class GoogleClassroomExporter {
  prismaBundleExport: BundleExport
  courseUrl: string | null = null

  constructor(prismaBundleExport: BundleExport) {
    this.prismaBundleExport = prismaBundleExport
  }

  async exportAll(): Promise<string | null> {
    let activityNodesExported = 0
    let totalActivityNodes = 0

    try {
      console.log(`[${this.prismaBundleExport.id}] Google Classroom exportAll started`)

      await db.bundleExport.update({
        where: {
          id: this.prismaBundleExport.id,
        },
        data: {
          state: "exporting",
        },
      })

      const ocxBundleExport = await createExportOcxBundleToGoogleClassroom(
        db,
        this.prismaBundleExport,
      )

      this.prismaBundleExport = ocxBundleExport.prismaBundleExport

      const courseId = ocxBundleExport.googleClassroomCourseId
      this.courseUrl = `https://classroom.google.com/c/${courseId}`

      // TODO(refactor): reuse bundle/nodes from createExportOcxBundleToGoogleClassroom — same load runs twice per export
      const bundle = (await db.bundle.findUnique({
        where: {
          id: this.prismaBundleExport.bundleId,
        },
        include: {
          nodes: true,
        },
      }))!

      const ocxBundle = new OcxBundle(bundle, bundle.nodes)
      const courseNode = ocxBundle.rootNodes[0]
      const language =
        ((this.prismaBundleExport.metadata as JsonObject).language as "en" | "es") || "en"

      totalActivityNodes = countExportableActivities(courseNode)

      publishBundleExportUpdate(this.prismaBundleExport.id, {
        status: "exporting",
        progress: activityNodesExported,
        totalActivities: totalActivityNodes,
      })

      for (const unitNode of courseNode.children) {
        for (const lessonNode of unitNode.children) {
          // TODO(refactor): Unit parentCourseType in buildTitle unused until walker supports unit-level posts
          const parentCourseType = "Lesson" as const

          for (const activityNode of lessonNode.children) {
            // TODO(refactor): consolidate postType skip/ambiguous-warn with buildCoursework — duplicated rules drift easily
            const googleClassroomData = activityNode.metadata
              .googleClassroom as GoogleClassroomData | undefined

            if (!googleClassroomData) {
              continue
            }

            const rawPostType = googleClassroomData.postType
            const postType = normalizePostType(rawPostType)

            if (!postType) {
              if (
                rawPostType &&
                (rawPostType.includes(",") || rawPostType.toLowerCase().includes("choose one"))
              ) {
                console.warn(
                  `[${this.prismaBundleExport.id}] Skipping activity with ambiguous postType:`,
                  rawPostType,
                  activityNode.ocxName,
                )
              }
              continue
            }

            const builtCoursework = buildCoursework(
              activityNode,
              lessonNode,
              parentCourseType,
              language,
            )

            if (!builtCoursework) {
              continue
            }

            console.log(
              `[${this.prismaBundleExport.id}] Exporting activity:`,
              builtCoursework.payload.title,
            )

            await ocxBundleExport.exportActivity(activityNode, builtCoursework)
            activityNodesExported++;

            publishBundleExportUpdate(this.prismaBundleExport.id, {
              status: "exporting",
              progress: activityNodesExported,
              totalActivities: totalActivityNodes,
            })
          }
        }
      }

      await db.bundleExport.update({
        where: {
          id: this.prismaBundleExport.id,
        },
        data: {
          exportUrl: this.courseUrl,
          state: "exported",
        },
      })

      publishBundleExportUpdate(this.prismaBundleExport.id, {
        status: "exported",
        progress: totalActivityNodes,
        totalActivities: totalActivityNodes,
        exportUrl: this.courseUrl,
      })

      console.log(
        `[${this.prismaBundleExport.id}] Google Classroom course exported - URL: ${this.courseUrl} (${activityNodesExported}/${totalActivityNodes} activities)`,
      )

      if (totalActivityNodes > 0 && activityNodesExported === 0) {
        console.warn(
          `[${this.prismaBundleExport.id}] Google Classroom export completed with 0 activities exported despite ${totalActivityNodes} exportable activities in bundle`,
        )
      }

      return this.courseUrl
    } catch (error: any) {
      console.error(
        `[${this.prismaBundleExport.id}] Error exporting to Google Classroom:`,
        error,
      )

      await db.bundleExport.update({
        where: {
          id: this.prismaBundleExport.id,
        },
        data: {
          state: "failed",
        },
      })

      publishBundleExportUpdate(this.prismaBundleExport.id, {
        status: "failed",
        progress: activityNodesExported,
        totalActivities: totalActivityNodes,
      })

      throw error
    }
  }
}
