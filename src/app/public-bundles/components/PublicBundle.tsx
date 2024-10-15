"use client";
import { useState, useEffect, useRef } from 'react';
import { BundleExport, Prisma } from "@prisma/client"

import { useRouter } from "next/navigation";

import { setQueryData, useMutation, useQuery } from "@blitzjs/rpc"

import exportBundle from "../mutations/exportBundle"
import getBundle from "../queries/getPublicBundle";

import OcxBundle from "src/lib/OcxBundle";

import ExportUpdateModal from "./ExportUpdateModal";

import { useUiStore } from "src/app/stores/UiStore"

import { BundleExportUpdate } from "src/app/jobs/BundleExportUpdate"

export const PublicBundle = ({ bundleId }: { bundleId: number }) => {
  const setNodeTypes = useUiStore(state => state.setNodeTypes);

  const router = useRouter();
  const [exportBundleMutation] = useMutation(exportBundle);
  const [bundle, { refetch }] = useQuery(
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

  const ocxBundle = new OcxBundle(bundle, bundle.nodes);

  useEffect(() => {
    setNodeTypes(ocxBundle.allCombinedTypes);
  }, [ocxBundle.allCombinedTypes]);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const handleExport = async (exportDestinationId: number) => {
    try {
      const bundleExport : BundleExport = await exportBundleMutation({
        id: bundle.id,
        exportDestinationId: exportDestinationId,
      })

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
          <button
            type="button"
            onClick={() => alert('export')}
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
