"use client";

import { useState, useEffect, useRef } from 'react';

import { useMutation, useQuery } from "@blitzjs/rpc"

import getExportRedirectUrl from "../mutations/getExportRedirectUrl"
import getBundle from "../queries/getPublicBundle";

import ExportUpdateModal from "./ExportUpdateModal";

import { languages } from "src/constants/languages";

import { ClientInfoVar } from '@/src/app/components/ClientInfoVar';

type PublicBundleProps = {
  bundleId: number
  language: string
}

type importMetadata = {
  full_course_name: string
  grade: string
  subject: string
  unit: string
}

export const PublicBundle = ({ bundleId, language }: PublicBundleProps) => {
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
  const [destinationUrlValid, setDestinationUrlValid] = useState(false);

  const handleDestinationUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDestinationUrl(e.target.value);
    setDestinationUrlValid(e.target.value.trim().length > 0);
  }

  const handleExport = async () => {
    if (!destinationUrl) {
      alert("Please enter a destination canvas URL");
      return;
    }

    try {
      const {redirectUrl, error} = await getExportRedirectUrlMutation({
        id: bundle.id,
        canvasUrl: destinationUrl,
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

  const languageDescription = language !== 'en' && languages[language] ? ` [${languages[language]}]` : '';
  const courseName = importMetadata.full_course_name + languageDescription;

  const clientName = ClientInfoVar({field: "clientName"})

  return (
    <>
      <div>
        <h2>Create a Canvas Version</h2>

        <h3>{courseName}</h3>

        <div>
          <input
            type="text"
            value={destinationUrl}
            onChange={handleDestinationUrlChange}
            placeholder={`Enter URL of the Canvas instance where you want to load this ${clientName} unit: https://mydistrictname.instructure.com`}
            style={{ marginRight: "0.5rem" }}
          />

          <button
            type="button"
            onClick={handleExport}
            style={{ marginLeft: "0.5rem" }}
            disabled={!destinationUrlValid}
          >
            Sync with Canvas
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
