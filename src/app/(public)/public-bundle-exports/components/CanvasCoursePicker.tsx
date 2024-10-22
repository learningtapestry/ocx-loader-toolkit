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
  };

  return (
    <div>
      <h2>Choose course</h2>
      <ul>
        {courses?.map((course) => (
          <li key={course.id}>
            <label>
              <input
                type="radio"
                name="course"
                value={course.id}
                checked={selectedCourseId == Number(course.id)}
                onChange={() => setSelectedCourseId(Number(course.id))}
              />
              {course.name} {course.course_code}
            </label>
          </li>
        ))}
      </ul>
      <button
        onClick={handleConfirmSelection}
        disabled={selectedCourseId === null}
      >
        Export to selected course
      </button>
    </div>
  );
}
