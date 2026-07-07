"use client";

import { useMutation, useQuery } from "@blitzjs/rpc"

import getBundleExport from "../queries/getPublicBundleExport";
import exportToCanvasCourse from "../mutations/exportToCanvasCourse";
import exportToGoogleClassroomCourse from "../mutations/exportToGoogleClassroomCourse";

import { PublicBundleExport } from "./PublicBundleExport"
import NewBundleExportToCanvas from "./NewBundleExportToCanvas"
import NewBundleExportToGoogleClassroom from "./NewBundleExportToGoogleClassroom"

type PublicBundleExportContainerProps = {
  bundleExportId: number,
  token: string,
}

export const PublicBundleExportContainer = ({bundleExportId, token}: PublicBundleExportContainerProps) => {
  const [bundleExport, {setQueryData, refetch}] = useQuery(
    getBundleExport,
    { id: bundleExportId },
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  const [exportToCanvasCourseMutation] = useMutation(exportToCanvasCourse);
  const [exportToGoogleClassroomCourseMutation] = useMutation(exportToGoogleClassroomCourse);

  const startExportWithNewCourse = async (courseName: string, courseCode: string) => {
    const updatedBundleExport = await exportToCanvasCourseMutation({
      bundleExportId,
      token,
      newCourseName: courseName,
      newCourseCode: courseCode
    });

    setQueryData(updatedBundleExport);
  }

  const startExportWithExistingCourse = async (courseId: number) => {
    const updatedBundleExport = await exportToCanvasCourseMutation({
      bundleExportId,
      token,
      existingCourseId: courseId,
    });

    setQueryData(updatedBundleExport);
  }

  const startGoogleClassroomExport = async () => {
    const updatedBundleExport = await exportToGoogleClassroomCourseMutation({
      bundleExportId,
      token,
    });

    setQueryData(updatedBundleExport);
  }

  if (bundleExport.token !== token) {
    return <div>Invalid token</div>
  }

  const isGoogleClassroom = bundleExport.exportDestination.type.startsWith("google-classroom");

  return <div>
    {bundleExport.state === 'waiting_user_input' && !isGoogleClassroom && <NewBundleExportToCanvas
      bundleExport={bundleExport}
      startExportWithNewCourse={startExportWithNewCourse}
      startExportWithExistingCourse={startExportWithExistingCourse}
    />}
    {bundleExport.state === 'waiting_user_input' && isGoogleClassroom && <NewBundleExportToGoogleClassroom
      bundleExport={bundleExport}
      startExport={startGoogleClassroomExport}
    />}
    {bundleExport.state !== 'waiting_user_input' && <PublicBundleExport bundleExport={bundleExport} refetch={refetch} />}
  </div>
}
