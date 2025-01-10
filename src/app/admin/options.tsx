import { SecurePassword } from "@blitzjs/auth/secure-password";

import { NextAdminOptions } from "@premieroctet/next-admin";
import PasswordInput from "./components/PasswordInput";

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
    BundleImportSource: {},
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
      label: "Next-Admin Documentation",
      url: "https://next-admin.js.org",
    },
  ],
  defaultColorScheme: "dark",
};