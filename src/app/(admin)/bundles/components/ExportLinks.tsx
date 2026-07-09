import React from 'react';
import Link from "next/link";
import { Bundle } from "@prisma/client"

import { languages } from 'src/constants/languages';

const generateLegacyOSEPublicBundleLink = (bundle: Bundle, language: string): string | null => {
  const importMetadata = bundle.importMetadata as { grade?: string, unit?: string };
  const grade = importMetadata.grade;
  const unit = importMetadata.unit;

  if (!grade || !unit) {
    return null;
  }
  return `/public-bundles/from-import/${bundle.importSourceId}/grade%20${grade}/${unit}/${language}`;
};

const generateLegacyOSEGoogleClassroomLink = (bundle: Bundle, language: string): string | null => {
  const importMetadata = bundle.importMetadata as { grade?: string, unit?: string };
  const grade = importMetadata.grade;
  const unit = importMetadata.unit;

  if (!grade || !unit) {
    return null;
  }
  return `/public-bundles-gc/from-import/${bundle.importSourceId}/grade%20${grade}/${unit}/${language}`;
};

interface ExportLinksProps {
  bundle: Bundle;
}

const ExportLinks = ({ bundle }: ExportLinksProps) => {
  const languageEntries = Object.entries(languages);

  return (
    <div className="export-links">
      Export:
      <div style={{ marginTop: "0.5rem" }}>
        <strong>Canvas:</strong>
        <ul>
          {languageEntries.map(([code, label]) => {
            const link = generateLegacyOSEPublicBundleLink(bundle, code)

            if (!link) return null

            return (
              <li key={`canvas-${code}`}>
                <Link href={link as any}>
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
      <div style={{ marginTop: "0.5rem" }}>
        <strong>Google Classroom:</strong>
        <ul>
          {languageEntries.map(([code, label]) => {
            const link = generateLegacyOSEGoogleClassroomLink(bundle, code)

            if (!link) return null

            return (
              <li key={`gc-${code}`}>
                <Link href={link as any}>
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  );
};

export default ExportLinks;
