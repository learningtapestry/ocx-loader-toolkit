"use client";

import { useQuery, useMutation } from "@blitzjs/rpc"

import getBundleExport from "../queries/getPublicBundleExport";
import exportToCanvasNewCourse from "../mutations/exportToCanvasNewCourse";

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

  const [exportToCanvasNewCourseMutation] = useMutation(exportToCanvasNewCourse);

  const startExportWithNewCourse = async (courseName: string) => {
    const updatedBundleExport = await exportToCanvasNewCourseMutation({
      bundleExportId,
      token,
      courseName,
    });

    setQueryData(updatedBundleExport);
  }

  if (bundleExport.token !== token) {
    return <div>Invalid token</div>
  }

  return <div>
    {bundleExport.state === 'waiting_user_input' && <NewBundleExportToCanvas bundleExport={bundleExport} startExportWithNewCourse={startExportWithNewCourse} />}
    {bundleExport.state !== 'waiting_user_input' && <PublicBundleExport bundleExport={bundleExport} refetch={refetch} />}
  </div>
}
