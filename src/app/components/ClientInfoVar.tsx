"use client"
import { useQuery } from "@blitzjs/rpc"
import getClientInfoVars, { ClientInfoVarsResponse } from "src/app/queries/getClientInfoVars"

interface ClientInfoProps {
  field: keyof ClientInfoVarsResponse; // Ensures only valid keys can be passed
}

export function ClientInfoVar({ field }: ClientInfoProps) {
  const [clientInfoVars] = useQuery(getClientInfoVars, {});

  return clientInfoVars?.[field] || "#";
}
