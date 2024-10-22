"use client";
import { useState, useEffect, useRef } from 'react';
import { BundleExport, Prisma } from "@prisma/client"

import Link from "next/link";
import { useRouter } from "next/navigation";

import { setQueryData, useMutation, useQuery } from "@blitzjs/rpc"

import deleteBundle from "../mutations/deleteBundle";
import importBundle from "../mutations/importBundle";
import exportBundle from "../mutations/exportBundle"
import importBundleFromZipFile from "../mutations/importBundleFromZipFile";
import importLegacyOSEUnit from "../mutations/importLegacyOSEUnit";
import getBundle from "../queries/getBundle";

import OcxBundle from "src/lib/OcxBundle";

import Node from "./Node";
import BundleNodeTypes from "./BundleNodeTypes"
import BundleNodeProperties from "./BundleNodeProperties"
import ExportDialog from "./ExportDialog"
import ExportUpdateModal from "./ExportUpdateModal";

import { useUiStore } from "src/app/stores/UiStore"

import { BundleExportUpdate } from "src/app/jobs/BundleExportUpdate"

export const Bundle = ({ bundleId }: { bundleId: number }) => {
  const setNodeTypes = useUiStore(state => state.setNodeTypes);

  const router = useRouter();
  const [deleteBundleMutation] = useMutation(deleteBundle);
  const [importBundleMutation] = useMutation(importBundle);
  const [importBundleFromZipFileMutation] = useMutation(importBundleFromZipFile);
  const [importLegacyOSEUnitMutation] = useMutation(importLegacyOSEUnit);
  const [exportBundleMutation] = useMutation(exportBundle);
  const [bundle, { refetch }] = useQuery(
    getBundle,
    { id: bundleId },
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  const [showSitemap, setShowSitemap] = useState(false);
  const toggleSitemapVerb = showSitemap ? "Hide" : "Show";

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
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
      setIsExportDialogOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to export bundle.");
    }
  }

  return (
    <>
      <div>
        <h1>Bundle {bundle.name}</h1>

        <BundleNodeTypes ocxBundle={ocxBundle} />
        <BundleNodeProperties ocxBundle={ocxBundle} refetchBundle={refetch} />

        {ocxBundle.rootNodes.map((node) => (
          <Node key={node.ocxId} node={node} refetchBundle={refetch} />
        ))}

        {bundle.parsedSitemap && (
          <div>
            <h2>
              Parsed Sitemap{" "}
              <button onClick={() => setShowSitemap(!showSitemap)}>
                {toggleSitemapVerb} Sitemap
              </button>
            </h2>

            {showSitemap && <pre>{JSON.stringify(bundle.parsedSitemap, null, 2)}</pre>}
          </div>
        )}

        {(ocxBundle.prismaBundle.errors as Prisma.JsonObject[])?.length > 0 && (
          <div style={{ color: "red" }}>
            <h2>Errors</h2>
            <pre>{JSON.stringify(ocxBundle.prismaBundle.errors, null, 2)}</pre>
          </div>
        )}

        <div>
          <Link href={`/bundles/${bundle.id}/edit`}>Edit</Link>

          <button
            type="button"
            onClick={async () => {
              const updatedBundle = await importBundleMutation({ id: bundle.id })
              await setQueryData(getBundle, { id: bundle.id }, updatedBundle)
            }}
            style={{ marginLeft: "0.5rem" }}
          >
            Load Data
          </button>

          <button
            type="button"
            onClick={async () => {
              if (window.confirm("This will be deleted")) {
                await deleteBundleMutation({ id: bundle.id });
                router.push("/bundles");
              }
            }}
            style={{ marginLeft: "0.5rem" }}
          >
            Delete
          </button>

          <button
            type="button"
            onClick={async () => {
              const zip = await ocxBundle.exportZip();

              const link = document.createElement('a');
              link.href = window.URL.createObjectURL(zip);
              link.download = 'bundle.ocx.zip';

              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            style={{ marginLeft: "0.5rem" }}
          >Download zip</button>

          <button
            type="button"
            onClick={async () => {
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.accept = '.zip';

              fileInput.addEventListener('change', async () => {
                const file = fileInput.files?.[0];

                if (file) {
                  const reader = new FileReader();
                  reader.readAsDataURL(file);

                  reader.onload = async () => {
                    const updatedBundle = await importBundleFromZipFileMutation({ id: bundle.id, zipDataUrl: reader.result as string});
                    await setQueryData(getBundle, { id: bundle.id }, updatedBundle);
                  }
                }
              });

              fileInput.click();
            }}
            style={{ marginLeft: "0.5rem" }}
          >
            Import zip
          </button>

          <button
            type="button"
            onClick={async () => {
              const url = prompt('Enter the URL of the legacy OSE OCX');

              if (url) {
                await importLegacyOSEUnitMutation({id: bundle.id, unitUrl: url });

                window.location.reload();
              }
            }}
            style={{ marginLeft: "0.5rem" }}
          >
            Import Legacy OSE
          </button>

          <button
            type="button"
            onClick={() => setIsExportDialogOpen(true)}
            style={{ marginLeft: "0.5rem" }}
          >
            Export Bundle
          </button>
        </div>

        <div>
          <h2>Exports</h2>
          <ul>
            {bundle.exports.map((bundleExport) => (
              <li key={bundleExport.id}>
                {bundleExport.state} -
                <a href={bundleExport.exportUrl || '#'} target="_blank" rel="noreferrer">{bundleExport.exportUrl || 'no url'}</a>
              </li>
            ))}
          </ul>

        </div>

        <ExportDialog
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          onExport={handleExport}
        />

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
