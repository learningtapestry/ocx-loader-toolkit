"use client";
import { useState, useEffect, useRef } from 'react';

import ExportUpdateModal from "./ExportUpdateModal";

import { BundleExportUpdate } from "@/src/app/jobs/BundleExportUpdate"

import { Prisma } from "@prisma/client"

type BundleExportWithBundle = Prisma.BundleExportGetPayload<{
  include: { bundle: true };
}>;

type PublicBundleExportProps = {
  bundleExport: BundleExportWithBundle,
  refetch: () => void,
}

export const PublicBundleExport = ({ bundleExport, refetch }: PublicBundleExportProps) => {
  const [isExportUpdateModalOpen, setIsExportUpdateModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState({ status: '', progress: 0, totalActivities: 0 });
  const [exportUrl, setExportUrl] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!bundleExport) {
      return;
    }

    console.log(bundleExport);

    if (bundleExport.state !== 'exported' && bundleExport.state !== 'failed') {

      setIsExportUpdateModalOpen(true);
      setExportProgress({ status: 'exporting', progress: 0, totalActivities: 0 });

      eventSourceRef.current = new EventSource(`/api/bundle-export-updates?bundleExportId=${bundleExport.id}`);
      eventSourceRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data) as BundleExportUpdate;

        console.log(data);

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

  const handleModalClose = () => {
    setIsExportUpdateModalOpen(false);
    refetch();
  }

  return (
    <>
      <div>
        <h1>Exporting Bundle {bundleExport.bundle.name}</h1>

        <p>
          Status: {bundleExport.state}
        </p>

        {bundleExport.state === 'exported' && (
          <a
            href={bundleExport.exportUrl!}
            target="_blank"
            rel="noreferrer"
            style={{ display: "block", marginBottom: "1rem", color: "blue" }}
          >
            View Export
          </a>
        )}

        <ExportUpdateModal
          isOpen={isExportUpdateModalOpen}
          onClose={handleModalClose}
          exportProgress={exportProgress}
          exportUrl={exportUrl}
        />
      </div>
    </>
  )
}

