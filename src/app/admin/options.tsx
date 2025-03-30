import { SecurePassword } from "@blitzjs/auth/secure-password";

import { NextAdminOptions } from "@premieroctet/next-admin";
import PasswordInput from "./components/PasswordInput";

import db from "@/db"
import LcmsOpenSciEdLegacyImporter from "@/src/lib/importers/LcmsOpenSciEdLegacyImporter"
import ImportBundleJob from "../jobs/importBundleJob";

export const options: NextAdminOptions = {
  title: "⚡️ Admin Panel",
  model: {
    User: {
      aliases: {
        newPassword: "Password",
      },
      edit: {
        display: [
          "name",
          "email",
          "newPassword",
          "role",
          "tokens",
          "sessions",
          "exportDestinations",
          "bundleExports",
          "createdAt",
          "updatedAt",
        ],
        customFields: {
          newPassword: {
            input: <PasswordInput />,
            required: true,
          },
        },
        hooks: {
          beforeDb: async (data, mode, request) => {
            try {
              const newPassword = data.newPassword;
              
              if (newPassword) {
                data.hashedPassword = await SecurePassword.hash(newPassword as string);
              }
        
              return data;
            } catch (error) {
              console.error("Error in beforeDb hook:", error);
              throw error; // Rethrow to ensure the error is propagated
            }
          },
        },
      }
    },
    Session: {},
    BundleImportSource: {
      actions: [
        {
          type: "server",
          title: "Sync all bundles",
          id: "sync-all-bundles",
          action: async (ids) => {
            const id = ids[0] as number;
            const bundleImportSource = await db.bundleImportSource.findUnique({ where: { id } })

            if (!bundleImportSource) throw new Error("Bundle Import Source not found")

            const importer = new LcmsOpenSciEdLegacyImporter(bundleImportSource)

            const bundlesToUpdate = await importer.importAllBundlesWithJobs()

            return {
              type: "success",
              message: `Created ${bundlesToUpdate} import jobs`,
            };
          },
        },
      ]
    },
    CanvasInstance: {},
    Token: {},
    Bundle: {
      actions: [
        {
          type: "server",
          title: "Sync bundle",
          id: "sync-bundle",
          action: async (ids) => {
            const id = ids[0] as number;
            const bundle = await db.bundle.findUnique({ where: { id } });

            if (!bundle || !bundle.importSourceId || !bundle.sitemapUrl) {
              throw new Error("Bundle or required fields not found");
            }

            await ImportBundleJob.enqueueJob({
              bundleImportSourceId: bundle.importSourceId,
              ocxUrl: bundle.sitemapUrl,
            });

            return {
              type: "success",
              message: `Created import job for bundle ${bundle.id}`,
            };
          },
        }
      ]
    },
    Node: {},
    ExportDestination: {},
    BundleExport: {},
    NodeExport: {},
  },
  pages: {
    "/custom": {
      title: "Custom page",
      icon: "PresentationChartBarIcon",
    },
  },
  sidebar: {
    groups: [
      {
        title: "Users",
        models: ["User", "Session"],
      },
      {
        title: "Configuration",
        models: ["BundleImportSource", "CanvasInstance"],
      },
    ],
  },
  externalLinks: [
    {
      label: "Root page",
      url: "/",
    },
    {
      label: "Custom bundles view",
      url: "/bundles",
    },
    {
      label: "Custom bundle import sources view",
      url: "/bundle-import-sources",
    },
    {
      label: "Next-Admin Documentation",
      url: "https://next-admin.js.org",
    },
  ],
  defaultColorScheme: "dark",
};