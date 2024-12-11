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

interface ExportLinksProps {
  bundle: Bundle;
}

const ExportLinks = ({ bundle }: ExportLinksProps) => {
  const languageEntries = Object.entries(languages);

  return (
    <div className="export-links">
      Export:
      <ul>
        {languageEntries.map(([code, label]) => {
          const link = generateLegacyOSEPublicBundleLink(bundle, code)

          if (!link) return null

          return (
            <li>
              <React.Fragment key={code}>
                <Link href={link as any}>
                  {label}
                </Link>
              </React.Fragment>
            </li>
          )
        })}
      </ul>
    </div>
  );
};

export default ExportLinks;
