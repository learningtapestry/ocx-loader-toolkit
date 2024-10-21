"use client";

import { useQuery, useMutation } from "@blitzjs/rpc"

import getBundleExport from "../queries/getPublicBundleExport";
import exportToCanvasCourse from "../mutations/exportToCanvasCourse";

import { PublicBundleExport } from "./PublicBundleExport"
import NewBundleExportToCanvas from "./NewBundleExportToCanvas"

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

  const startExportWithNewCourse = async (courseName: string) => {
    const updatedBundleExport = await exportToCanvasCourseMutation({
      bundleExportId,
      token,
      newCourseName: courseName,
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

  if (bundleExport.token !== token) {
    return <div>Invalid token</div>
  }

  return <div>
    {bundleExport.state === 'waiting_user_input' && <NewBundleExportToCanvas
      bundleExport={bundleExport}
      startExportWithNewCourse={startExportWithNewCourse}
      startExportWithExistingCourse={startExportWithExistingCourse}
    />}
    {bundleExport.state !== 'waiting_user_input' && <PublicBundleExport bundleExport={bundleExport} refetch={refetch} />}
  </div>
}
