"use client"

import { useState } from 'react';
import { BundleExport } from "@prisma/client"

type NewBundleExportToCanvasProps = {
  bundleExport: BundleExport,
  startExportWithNewCourse: (courseName: string) => void,
}

export default function NewBundleExportToCanvas({bundleExport, startExportWithNewCourse}: NewBundleExportToCanvasProps) {
  const [createNewCourse, setCreateNewCourse] = useState(true);
  const [newCourseName, setNewCourseName] = useState('');

  const onStartExport = () => {
    if (createNewCourse) {
      if (!newCourseName) {
        alert('Please enter a new course name');
        return;
      }

      startExportWithNewCourse(newCourseName);
    } else {
      // TODO
    }
  }

  return <div>
    <h2>Choose the Canvas course to export {bundleExport.name}</h2>

    <div>
      <label>
        <input
          type="radio"
          checked={createNewCourse}
          onChange={() => setCreateNewCourse(true)}
        />
        Create new course
      </label>
      <label>
        <input
          type="radio"
          checked={!createNewCourse}
          onChange={() => setCreateNewCourse(false)}
        />
        Export to existing course
      </label>
    </div>

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

        <button onClick={onStartExport}>Export</button>
      </div>
    )}

    {!createNewCourse && (
      <div>
        TODO load existing courses from Canvas
      </div>
    )}
  </div>
}
