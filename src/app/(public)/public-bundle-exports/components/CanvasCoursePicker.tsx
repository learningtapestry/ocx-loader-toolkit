"use client";

import { useState } from "react";
import { useQuery } from "@blitzjs/rpc";
import getCanvasCourses from "../queries/getCanvasCourses";

type CanvasCoursePickerProps = {
  bundleExport: any,
  onCoursePicked: (courseId: number) => void,
}

export default function CanvasCoursePicker({ bundleExport, onCoursePicked }: CanvasCoursePickerProps) {
  const [courses, { isLoading, error }] = useQuery(getCanvasCourses, { bundleExportId: bundleExport.id });
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  if (isLoading) return <div>Loading courses...</div>;
  if (error) return <div>Error: {error.toString()}</div>;

  const handleConfirmSelection = () => {
    if (selectedCourseId !== null) {
      onCoursePicked(selectedCourseId);
    }
  }

  return (
    <div className="mt-4">
      <h3>Choose a course</h3>
      <fieldset>
        {courses.length > 0 ? (
          courses.map((course) => (
            <label key={course.id}>
              <input
                type="radio"
                name="course"
                value={course.id}
                checked={selectedCourseId === Number(course.id)}
                onChange={() => setSelectedCourseId(Number(course.id))}
              />
              {course.course_code}/{course.name}
            </label>
          ))
        ) : (
          <p>No active courses found for your Canvas account</p>
        )}
      </fieldset>
      <button onClick={handleConfirmSelection} disabled={selectedCourseId === null}>
        Sync with Canvas
      </button>
    </div>
  );
}
