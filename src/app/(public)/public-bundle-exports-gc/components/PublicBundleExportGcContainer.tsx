"use client";

import { useMutation, useQuery } from "@blitzjs/rpc"

import getBundleExport from "../../public-bundle-exports/queries/getPublicBundleExport";
import exportToGoogleClassroomCourse from "../mutations/exportToGoogleClassroomCourse";

import { PublicBundleExportGc } from "./PublicBundleExportGc"
import NewBundleExportToGoogleClassroom from "./NewBundleExportToGoogleClassroom"

type PublicBundleExportGcContainerProps = {
  bundleExportId: number,
  token: string,
}

export const PublicBundleExportGcContainer = ({bundleExportId, token}: PublicBundleExportGcContainerProps) => {
  const [bundleExport, {setQueryData, refetch}] = useQuery(
    getBundleExport,
    { id: bundleExportId },
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  const [exportToGoogleClassroomCourseMutation] = useMutation(exportToGoogleClassroomCourse);

  const startGoogleClassroomExport = async (newCourseName: string) => {
    const updatedBundleExport = await exportToGoogleClassroomCourseMutation({
      bundleExportId,
      token,
      newCourseName,
    });

    setQueryData(updatedBundleExport);
  }

  if (bundleExport.token !== token) {
    return <div>Invalid token</div>
  }

  return <div>
    {bundleExport.state === 'waiting_user_input' && <NewBundleExportToGoogleClassroom
      bundleExport={bundleExport}
      startExport={startGoogleClassroomExport}
    />}
    {bundleExport.state !== 'waiting_user_input' && <PublicBundleExportGc bundleExport={bundleExport} refetch={refetch} />}
  </div>
}
