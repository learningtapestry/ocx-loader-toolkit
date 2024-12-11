"use client"

import { Suspense, useState } from "react"

import { Prisma } from "@prisma/client"

import CanvasCoursePicker from "./CanvasCoursePicker"
import { JsonObject } from "@prisma/client/runtime/library";

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

  const courseName = (bundleExport.metadata as JsonObject).courseName as string;

  return <div>
    <h2>Where should we load {courseName}?</h2>

    <section>
      <div>
        <label>
          <input
            type="radio"
            checked={createNewCourse}
            onChange={() => setCreateNewCourse(true)}
          />
          Create a new Canvas course
        </label>
        <label>
          <input
            type="radio"
            checked={!createNewCourse}
            onChange={() => setCreateNewCourse(false)}
          />
          Sync with an existing Canvas course
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

        <button onClick={handStartExportWithCourseName}>Sync with Canvas</button>
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
