"use client";
import { useState, useEffect, useRef } from 'react';

import ExportUpdatesWidget from "./ExportUpdatesWidget";

import { BundleExportUpdate } from "src/app/jobs/BundleExportUpdate"

import { Prisma } from "@prisma/client"

type BundleExportWithBundle = Prisma.BundleExportGetPayload<{
  include: { bundle: true };
}>;

type PublicBundleExportProps = {
  bundleExport: BundleExportWithBundle,
  refetch: () => void,
}

export const PublicBundleExport = ({ bundleExport }: PublicBundleExportProps) => {
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

  return (
    <>
      <div>
        <h1>Loading {(bundleExport.bundle.importMetadata as { full_course_name: string })!.full_course_name}</h1>

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
            View Unit on Canvas
          </a>
        )}

        {
          showProgress && <ExportUpdatesWidget
            exportProgress={exportProgress}
            exportUrl={exportUrl}
          />
        }
      </div>
    </>
  )
}

