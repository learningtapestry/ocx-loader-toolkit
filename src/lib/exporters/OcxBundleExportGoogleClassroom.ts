import {
  BundleExport,
  ExportDestination,
  Prisma,
  PrismaClient,
} from "@prisma/client"
import db from "db"

import OcxBundle from "src/lib/OcxBundle"
import OcxNode from "src/lib/OcxNode"
import OcxNodeExport from "src/lib/OcxNodeExport"

import { buildAttachments } from "./googleClassroom/buildAttachments"
import { BuiltCoursework } from "./googleClassroom/buildCoursework"
import { GoogleClassroomData } from "./googleClassroom/types"
import { stripHtml } from "./googleClassroom/stripHtml"
import GoogleClassroomRepository from "./repositories/GoogleClassroomRepository"

// TODO(refactor): consider destination-agnostic OcxBundleExport base if more exporters are added
export default class OcxBundleExportGoogleClassroom {
  prismaBundleExport: BundleExport
  googleClassroomRepository: GoogleClassroomRepository

  constructor(
    prismaBundleExport: BundleExport,
    googleClassroomRepository: GoogleClassroomRepository,
  ) {
    this.prismaBundleExport = prismaBundleExport
    this.googleClassroomRepository = googleClassroomRepository
  }

  get googleClassroomCourseId(): string {
    return (this.metadata.googleClassroomCourseId as string) || (this.metadata.id as string)
  }

  get googleClassroomStagingFolderId(): string {
    return this.metadata.googleClassroomStagingFolderId as string
  }

  get metadata() {
    return this.prismaBundleExport.metadata as Prisma.JsonObject
  }

  async exportActivity(
    activityNode: OcxNode,
    builtCoursework: BuiltCoursework,
  ) {
    const { postType, payload } = builtCoursework
    const courseId = this.googleClassroomCourseId
    const googleClassroomData = activityNode.metadata.googleClassroom as
      | GoogleClassroomData
      | undefined

    const materials = await buildAttachments(googleClassroomData?.materials, {
      stagingFolderId: this.googleClassroomStagingFolderId,
      repository: this.googleClassroomRepository,
    })

    const exportPayload = {
      ...payload,
      materials,
    }

    let gcResponse: Prisma.JsonObject

    if (postType === "assignment") {
      gcResponse = await this.googleClassroomRepository.createCourseWork(courseId, exportPayload)
    } else {
      gcResponse = await this.googleClassroomRepository.createCourseWorkMaterial(
        courseId,
        exportPayload,
      )
    }

    console.log(
      `[${this.prismaBundleExport.id}] Exported ${postType}:`,
      exportPayload.title,
    )

    return this.createOcxNodeExport(activityNode, gcResponse)
  }

  async createOcxNodeExport(ocxNode: OcxNode, metadata: Prisma.JsonObject) {
    const prismaNodeExport = await db.nodeExport.create({
      data: {
        idOnDestination: metadata.id!.toString(),
        metadata,
        node: {
          connect: {
            id: ocxNode.dbId,
          },
        },
        bundleExport: {
          connect: {
            id: this.prismaBundleExport.id,
          },
        },
      },
    })

    return new OcxNodeExport(prismaNodeExport)
  }
}

function deriveCourseName(courseNode: OcxNode): string {
  const unitNode = courseNode.children[0]

  if (unitNode) {
    const alternateName = unitNode.metadata.alternateName as string
    const about = (unitNode.metadata.about as string) || (unitNode.metadata.name as string) || ""
    return `Unit ${alternateName}: ${about}`
  }

  return courseNode.ocxName
}

function deriveCourseDescription(courseNode: OcxNode): string | undefined {
  const description = stripHtml(
    (courseNode.metadata.description as string) || (courseNode.metadata.about as string),
  )

  return description || undefined
}

export async function createExportOcxBundleToGoogleClassroom(
  dbClient: PrismaClient,
  bundleExport: BundleExport,
) {
  const exportDestination = (await dbClient.exportDestination.findUnique({
    where: {
      id: bundleExport.exportDestinationId,
    },
  }))! as ExportDestination

  const googleClassroomRepository = new GoogleClassroomRepository(exportDestination)

  const metadata = bundleExport.metadata as Prisma.JsonObject
  const bundle = (await dbClient.bundle.findUnique({
    where: {
      id: bundleExport.bundleId,
    },
    include: {
      nodes: true,
    },
  }))!

  const ocxBundle = new OcxBundle(bundle, bundle.nodes)
  const courseNode = ocxBundle.rootNodes[0]

  const courseName =
    (metadata.newCourseName as string) ||
    (metadata.courseName as string) ||
    deriveCourseName(courseNode)

  const courseDescription = deriveCourseDescription(courseNode)

  const course = await googleClassroomRepository.createCourse(courseName, courseDescription)

  console.log(`[${bundleExport.id}] Created Google Classroom course:`, course.name)

  const stagingFolder = await googleClassroomRepository.createStagingFolder(course.name)

  console.log(`[${bundleExport.id}] Created Google Classroom staging folder:`, stagingFolder.id)

  const updatedBundleExport = await dbClient.bundleExport.update({
    where: {
      id: bundleExport.id,
    },
    data: {
      // TODO(refactor): store selective course fields only — spreading API response can clobber metadata keys
      metadata: {
        ...metadata,
        ...course,
        googleClassroomCourseId: course.id,
        googleClassroomStagingFolderId: stagingFolder.id,
      },
    },
  })

  return new OcxBundleExportGoogleClassroom(updatedBundleExport, googleClassroomRepository)
}
