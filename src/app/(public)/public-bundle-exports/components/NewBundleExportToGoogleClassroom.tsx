"use client"

import { Prisma } from "@prisma/client"

import { GOOGLE_CLASSROOM_PLACEHOLDER_COURSE_NAME } from "@/src/lib/exporters/repositories/callGoogleClassroom"

type BundleExportWithBundle = Prisma.BundleExportGetPayload<{
  include: { bundle: true };
}>;

type NewBundleExportToGoogleClassroomProps = {
  bundleExport: BundleExportWithBundle,
  startExport: () => void,
}

export default function NewBundleExportToGoogleClassroom({
  startExport,
}: NewBundleExportToGoogleClassroomProps) {
  return (
    <div>
      <h2>Export to Google Classroom</h2>

      <p>
        A new Google Classroom course named <strong>{GOOGLE_CLASSROOM_PLACEHOLDER_COURSE_NAME}</strong> will be created in your account.
      </p>

      <button type="button" onClick={startExport}>
        Start export
      </button>
    </div>
  )
}
