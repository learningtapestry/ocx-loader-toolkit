"use client"

import { useState } from "react"

import { Prisma } from "@prisma/client"
import { JsonObject } from "@prisma/client/runtime/library"

type BundleExportWithBundle = Prisma.BundleExportGetPayload<{
  include: { bundle: true }
}>

type NewBundleExportToGoogleClassroomProps = {
  bundleExport: BundleExportWithBundle,
  startExport: (newCourseName: string) => void,
}

export default function NewBundleExportToGoogleClassroom({
  bundleExport,
  startExport,
}: NewBundleExportToGoogleClassroomProps) {
  const courseName = (bundleExport.metadata as JsonObject).courseName as string
  const [newCourseName, setNewCourseName] = useState(courseName || "")

  const handleStartExport = () => {
    // TODO(refactor): drop alert — disabled button already blocks empty course name
    if (!newCourseName.trim()) {
      alert("Please enter a course name")
      return
    }

    startExport(newCourseName.trim())
  }

  return (
    <div>
      <h2>Export to Google Classroom</h2>

      <p>
        A new Google Classroom course will be created in your account.
      </p>

      <label htmlFor="newCourseName">Course name:</label>

      <input
        type="text"
        id="newCourseName"
        value={newCourseName}
        onChange={(e) => setNewCourseName(e.target.value)}
        placeholder="Enter course name"
      />

      <button type="button" onClick={handleStartExport} disabled={!newCourseName.trim()}>
        Start export
      </button>
    </div>
  )
}
