"use client";
import { useState, useEffect, useRef } from 'react';

import { useRouter } from "next/navigation";

import { useMutation, useQuery } from "@blitzjs/rpc"

import getExportRedirectUrl from "../mutations/getExportRedirectUrl"
import getBundle from "../queries/getPublicBundle";

import ExportUpdateModal from "./ExportUpdateModal";

export const PublicBundle = ({ bundleId }: { bundleId: number }) => {
  const router = useRouter();
  const [getExportRedirectUrlMutation] = useMutation(getExportRedirectUrl);
  const [bundle] = useQuery(
    getBundle,
    { id: bundleId },
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  const [isExportUpdateModalOpen, setIsExportUpdateModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState({ status: '', progress: 0, totalActivities: 0 });
  const [exportUrl, setExportUrl] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const [destinationUrl, setDestinationUrl] = useState('');

  const handleExport = async () => {
    if (!destinationUrl) {
      alert("Please enter a destination canvas URL");
      return;
    }

    try {
      const {redirectUrl, error} = await getExportRedirectUrlMutation({
        id: bundle.id,
        canvasUrl: destinationUrl,
        localUrlBase: window.location.origin
      });

      if (error) {
        alert(error);
        return;
      }

      window.location.assign(redirectUrl!);
      //
      // setIsExportUpdateModalOpen(true);
      // setExportProgress({ status: 'exporting', progress: 0, totalActivities: 0 });
      //
      // eventSourceRef.current = new EventSource(`/api/bundle-export-updates?bundleExportId=${bundleExport.id}`);
      // eventSourceRef.current.onmessage = (event) => {
      //   const data = JSON.parse(event.data) as BundleExportUpdate;
      //
      //   console.log(data);
      //
      //   if (data.status === "exported") {
      //     setExportProgress(prev => ({ ...prev, status: 'exported' }));
      //     setExportUrl(data.exportUrl || '');
      //     eventSourceRef.current?.close();
      //   } else if (data.status === "failed") {
      //     setExportProgress(prev => ({ ...prev, status: 'failed' }));
      //     eventSourceRef.current?.close();
      //   } else if (data.status === "exporting") {
      //     setExportProgress({
      //       status: 'exporting',
      //       progress: data.progress,
      //       totalActivities: data.totalActivities
      //     });
      //   }
      // }
    } catch (error) {
      console.error(error);
      alert("Failed to export bundle.");
    }
  }

  return (
    <>
      <div>
        <h1>Bundle {bundle.name}</h1>

        <div>
          <input
            type="text"
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            placeholder="Enter Canvas URL"
            style={{ marginRight: "0.5rem" }}
          />

          <button
            type="button"
            onClick={handleExport}
            style={{ marginLeft: "0.5rem" }}
          >
            Export Bundle
          </button>
        </div>

        <ExportUpdateModal
          isOpen={isExportUpdateModalOpen}
          onClose={() => setIsExportUpdateModalOpen(false)}
          exportProgress={exportProgress}
          exportUrl={exportUrl}
        />
      </div>
    </>
  )
}

interface Destination {
  id: number
  name: string
}
