"use client";

import { useState, useEffect, useRef } from 'react';

import { useMutation, useQuery } from "@blitzjs/rpc"

import getExportRedirectUrl from "../mutations/getExportRedirectUrl"
import getGoogleExportRedirectUrl from "../mutations/getGoogleExportRedirectUrl"
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

type ExportDestination = "canvas" | "google-classroom";

export const PublicBundle = ({ bundleId, language }: PublicBundleProps) => {
  const [getExportRedirectUrlMutation] = useMutation(getExportRedirectUrl);
  const [getGoogleExportRedirectUrlMutation] = useMutation(getGoogleExportRedirectUrl);
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

  const [destination, setDestination] = useState<ExportDestination>("canvas");
  const [destinationUrl, setDestinationUrl] = useState('');
  const [destinationUrlValid, setDestinationUrlValid] = useState(false);

  const handleDestinationUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDestinationUrl(e.target.value);
    setDestinationUrlValid(e.target.value.trim().length > 0);
  }

  const handleExport = async () => {
    try {
      if (destination === "canvas") {
        if (!destinationUrl) {
          alert("Please enter a destination canvas URL");
          return;
        }

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
      } else {
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
      }
    } catch (error) {
      console.error(error);
      alert("Failed to export bundle.");
    }
  }

  const importMetadata = bundle.importMetadata as importMetadata;

  const languageDescription = language !== 'en' && languages[language] ? ` [${languages[language]}]` : '';
  const courseName = importMetadata.full_course_name + languageDescription;

  const clientName = ClientInfoVar({field: "clientName"})

  const exportDisabled = destination === "canvas" ? !destinationUrlValid : false;

  return (
    <>
      <div>
        <h2>Export this unit</h2>

        <h3>{courseName}</h3>

        <section style={{ marginBottom: "1rem" }}>
          <div>
            <label style={{ marginRight: "1rem" }}>
              <input
                type="radio"
                checked={destination === "canvas"}
                onChange={() => setDestination("canvas")}
              />
              Sync with Canvas
            </label>
            <label>
              <input
                type="radio"
                checked={destination === "google-classroom"}
                onChange={() => setDestination("google-classroom")}
              />
              Sync with Google Classroom
            </label>
          </div>
        </section>

        {destination === "canvas" && (
          <div>
            <input
              type="text"
              value={destinationUrl}
              onChange={handleDestinationUrlChange}
              placeholder={`Enter URL of the Canvas instance where you want to load this ${clientName} unit: https://mydistrictname.instructure.com`}
              style={{ marginRight: "0.5rem" }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleExport}
          style={{ marginTop: "0.5rem" }}
          disabled={exportDisabled}
        >
          {destination === "canvas" ? "Sync with Canvas" : "Sync with Google Classroom"}
        </button>

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
