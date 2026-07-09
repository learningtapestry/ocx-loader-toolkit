"use client";
import { useState, useEffect, useRef } from 'react';

import ExportUpdatesWidget from "../../public-bundle-exports/components/ExportUpdatesWidget";

import { BundleExportUpdate } from "src/app/jobs/BundleExportUpdate"

import { Prisma } from "@prisma/client"
import { JsonObject } from '@prisma/client/runtime/library';

type BundleExportWithRelations = Prisma.BundleExportGetPayload<{
  include: { bundle: true, exportDestination: true };
}>;

type PublicBundleExportGcProps = {
  bundleExport: BundleExportWithRelations,
  refetch: () => void,
}

export const PublicBundleExportGc = ({ bundleExport }: PublicBundleExportGcProps) => {
  const [exportProgress, setExportProgress] = useState<{ status: keyof typeof exportStateMapping, progress: number, totalActivities: number }>({
    status: bundleExport.state as keyof typeof exportStateMapping,
    progress: 0,
    totalActivities: 0
  });
  const [exportUrl, setExportUrl] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!bundleExport) {
      return;
    }

    if (bundleExport.state !== 'exported' && bundleExport.state !== 'failed') {
      setExportProgress({ status: 'exporting', progress: 0, totalActivities: 0 });
      setShowProgress(true);

      eventSourceRef.current = new EventSource(`/api/bundle-export-updates?bundleExportId=${bundleExport.id}`);
      eventSourceRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data) as BundleExportUpdate;

        if (data.status === "exported") {
          setExportProgress(prev => ({ ...prev, status: 'exported' }));
          setExportUrl(data.exportUrl || '');
          eventSourceRef.current?.close();
        } else if (data.status === "failed") {
          setExportProgress(prev => ({ ...prev, status: 'failed' }));
          eventSourceRef.current?.close();
        } else if (data.status === "exporting") {
          setExportProgress({
            status: 'exporting',
            progress: data.progress,
            totalActivities: data.totalActivities
          });
        }
      }
    }
  }, [bundleExport?.id]);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const exportStateMapping = {
    exporting: 'syncing',
    exported: 'loaded',
    failed: 'failed'
  };

  const exportedLinkText = "View course in Google Classroom";

  return (
    <>
      <div>
        <h2>Loading {(bundleExport.metadata as JsonObject).courseName as string}</h2>

        <p>
          Destination: Google Classroom
        </p>

        <p>
          Status: {exportStateMapping[exportProgress.status]}
        </p>

        {bundleExport.state === 'exported' && (
          <a
            href={bundleExport.exportUrl!}
            target="_blank"
            rel="noreferrer"
            style={{ display: "block", marginBottom: "1rem", color: "blue" }}
          >
            {exportedLinkText}
          </a>
        )}

        {
          showProgress && <ExportUpdatesWidget
            exportProgress={exportProgress}
            exportUrl={exportUrl}
            exportedLinkText={exportedLinkText}
          />
        }
      </div>
    </>
  )
}
