"use client";

import { useMutation, useQuery } from "@blitzjs/rpc"

import getGoogleExportRedirectUrl from "../../public-bundles/mutations/getGoogleExportRedirectUrl"
import getBundle from "../../public-bundles/queries/getPublicBundle";

import { formatCourseNameWithLanguage } from "src/constants/languages";

type PublicBundleGoogleClassroomProps = {
  bundleId: number
  language: string
}

type importMetadata = {
  full_course_name: string
  grade: string
  subject: string
  unit: string
}

export const PublicBundleGoogleClassroom = ({ bundleId, language }: PublicBundleGoogleClassroomProps) => {
  const [getGoogleExportRedirectUrlMutation] = useMutation(getGoogleExportRedirectUrl);
  const [bundle] = useQuery(
    getBundle,
    { id: bundleId },
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  const handleExport = async () => {
    try {
      const {redirectUrl, error} = await getGoogleExportRedirectUrlMutation({
        id: bundle.id,
        localUrlBase: window.location.origin,
        language,
      });

      if (error) {
        alert(error);
        return;
      }

      window.location.assign(redirectUrl!);
    } catch (error) {
      console.error(error);
      alert("Failed to export bundle.");
    }
  }

  const importMetadata = bundle.importMetadata as importMetadata;

  const courseName = formatCourseNameWithLanguage(importMetadata.full_course_name, language);

  return (
    <div>
      <h2>Export this unit to Google Classroom</h2>

      <h3>{courseName}</h3>

      <p style={{ marginBottom: "1rem" }}>
        Sign in with your Google account to create a new Google Classroom course with this unit.
      </p>

      <button
        type="button"
        onClick={handleExport}
      >
        Sync with Google Classroom
      </button>
    </div>
  )
}
