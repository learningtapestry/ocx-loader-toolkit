export const envVars = {
  clientName: process.env.NEXT_PUBLIC_CLIENT_NAME ?? 'Default Client',
  clientNameNonDefault: process.env.NEXT_PUBLIC_CLIENT_NAME
} as const