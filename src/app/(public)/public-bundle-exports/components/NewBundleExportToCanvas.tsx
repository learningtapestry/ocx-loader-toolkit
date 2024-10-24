"use client"

import { Suspense, useState } from "react"

import { Prisma } from "@prisma/client"

import CanvasCoursePicker from "./CanvasCoursePicker"

type BundleExportWithBundle = Prisma.BundleExportGetPayload<{
  include: { bundle: true };
}>;

type NewBundleExportToCanvasProps = {
  bundleExport: BundleExportWithBundle,
  startExportWithNewCourse: (courseName: string, courseCode: string) => void,
  startExportWithExistingCourse: (courseId: number) => void,
}

export default function NewBundleExportToCanvas({bundleExport, startExportWithNewCourse, startExportWithExistingCourse}: NewBundleExportToCanvasProps) {
  const [createNewCourse, setCreateNewCourse] = useState(true);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');

  const handStartExportWithCourseName = () => {
    if (createNewCourse) {
      if (!newCourseName) {
        alert('Please enter a new course name');
        return;
      }

      if (!newCourseCode) {
        alert('Please enter a new course code');
        return;
      }

      startExportWithNewCourse(newCourseName, newCourseCode);
    }
  }

  return <div>
    <h2>Where should we export {bundleExport.bundle.name}?</h2>

    <section>
      <div>
        <label>
          <input
            type="radio"
            checked={createNewCourse}
            onChange={() => setCreateNewCourse(true)}
          />
          Create new Canvas course
        </label>
        <label>
          <input
            type="radio"
            checked={!createNewCourse}
            onChange={() => setCreateNewCourse(false)}
          />
          Export to existing Canvas course
        </label>
      </div>
    </section>

    {createNewCourse && (
      <div>
        <label htmlFor="newCourseName">New course name:</label>

        <input
          type="text"
          id="newCourseName"
          value={newCourseName}
          onChange={(e) => setNewCourseName(e.target.value)}
          placeholder="Enter new course name"
        />

        <label htmlFor="newCourseCode">New course code:</label>

        <input
          type="text"
          id="newCourseCode"
          value={newCourseCode}
          onChange={(e) => setNewCourseCode(e.target.value)}
          placeholder="Enter new course code"
        />

        <button onClick={handStartExportWithCourseName}>Export</button>
      </div>
    )}

    {!createNewCourse && (
      <Suspense fallback={<div>Loading courses...</div>}>
        <CanvasCoursePicker
          bundleExport={bundleExport}
          onCoursePicked={(courseId) => {
            startExportWithExistingCourse(courseId);
          }}
        />
      </Suspense>
    )}
  </div>
}
