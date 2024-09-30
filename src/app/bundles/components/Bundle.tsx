"use client";
import { useState, useEffect } from 'react';
import { Prisma } from "@prisma/client"

import Link from "next/link";
import { useRouter } from "next/navigation";

import { setQueryData, useMutation, useQuery } from "@blitzjs/rpc"

import deleteBundle from "../mutations/deleteBundle";
import importBundle from "../mutations/importBundle";
import exportBundle from "../mutations/exportBundle"
import importBundleFromZipFile from "../mutations/importBundleFromZipFile";
import importLegacyOSEUnit from "../mutations/importLegacyOSEUnit";
import getBundle from "../queries/getBundle";

import OcxBundle from "@/src/app/lib/OcxBundle";

import Node from "./Node";
import BundleNodeTypes from "./BundleNodeTypes"
import BundleNodeProperties from "./BundleNodeProperties"
import ExportDialog from "./ExportDialog"

import { useUiStore } from "@/src/app/stores/UiStore"

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
  const [selectedExportDestination, setSelectedExportDestination] = useState<number | null>(null);

  const ocxBundle = new OcxBundle(bundle, bundle.nodes);

  useEffect(() => {
    setNodeTypes(ocxBundle.allCombinedTypes);
  }, [ocxBundle.allCombinedTypes]);

  const handleExport = async (exportDestinationId: number) => {
    try {
      const courseUrl = await exportBundleMutation({
        id: bundle.id,
        exportDestinationId: exportDestinationId,
      })
      alert("Bundle exported successfully to " + courseUrl);
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
            {bundle.exports.map((exportedBundle) => (
              <li key={exportedBundle.id}>
                <a href={exportedBundle.exportUrl || '#'} target="_blank" rel="noreferrer">{exportedBundle.exportUrl || 'no url'}</a>
              </li>
            ))}
          </ul>

        </div>

        <ExportDialog
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          onExport={handleExport}
        />
      </div>
    </>
  )
}

interface Destination {
  id: number
  name: string
}
