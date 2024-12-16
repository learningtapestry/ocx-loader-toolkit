import { withBlitz } from "@blitzjs/next";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const nextConfig = {
  experimental: {
    typedRoutes: true,
    swcPlugins: [
      [
        "next-superjson-plugin",
        {
          excluded: [],
        },
      ],
    ],
  },
  // Access environment variables
  env: {
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
  },
  transpilePackages: ["@premieroctet/next-admin"],
};

export default withBlitz(nextConfig);
