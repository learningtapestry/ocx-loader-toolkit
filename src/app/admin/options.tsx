import { SecurePassword } from "@blitzjs/auth/secure-password";

import { NextAdminOptions } from "@premieroctet/next-admin";
import PasswordInput from "./components/PasswordInput";
import {Ctx} from "blitz"

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
              console.log("before DB");
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
      // actions: [
      //   {
      //     type: "server",
      //     title: "Sync all bundles",
      //     id: "sync-all-bundles",
      //     action: async (ids) => {
      //       const id = ids[0] as number;
      //       if (window.confirm("This will import all bundles from the source")) {
      //         const bundles = await importFromBundleImportSourceMutation({ id: id }, {} as Ctx);

      //         if (bundles) {
      //           alert(`Created ${bundles} import jobs`)
      //         }
      //       }
      //     },
      //     successMessage: "sync bundles job started",
      //     errorMessage: "sync bundles job failed to start",
      //   },
      // ]
    },
    CanvasInstance: {},
    Token: {},
    Bundle: {},
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