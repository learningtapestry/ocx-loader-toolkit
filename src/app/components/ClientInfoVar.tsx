"use client"
import { useMutation } from "@blitzjs/rpc"
import getClientInfoVars, { ClientInfoVarsResponse } from "src/app/mutations/getClientInfoVars"
import { useEffect, useState } from "react";

interface ClientInfoProps {
  field: keyof ClientInfoVarsResponse; // Ensures only valid keys can be passed
}

export function ClientInfoVar({ field }: ClientInfoProps) {
  const [getClientInfoVarsMutation, { isLoading, error }] = useMutation(getClientInfoVars);
  
  const [clientInfoVars, setClientInfoVars] = useState<ClientInfoVarsResponse | null>(null);

  useEffect(() => {
    (async () => {
      const result = await getClientInfoVarsMutation({});
      setClientInfoVars(result);
    })();
  }, []);

  if (isLoading) return "Loading...";
  if (error) return "Error";

  return clientInfoVars?.[field] || "#";
}
