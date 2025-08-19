import React from "react"
import { BundleImportSource } from "@prisma/client"

interface PeriodicImportStatusProps {
  importSource: BundleImportSource
}

export function PeriodicImportStatus({ importSource }: PeriodicImportStatusProps) {
  if (importSource.type !== "satchel") {
    return null
  }

  const accessData = importSource.accessData as any
  const intervalMinutes = accessData?.interval_minutes || 60
  const lastCheck = importSource.lastCheck

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
      <h3 className="text-sm font-medium text-blue-900 mb-2">Satchel Import Status</h3>
      <div className="space-y-1 text-sm text-blue-800">
        <div>
          <span className="font-medium">Satchel URL:</span> {importSource.baseUrl || "Not configured"}
        </div>
        <div>
          <span className="font-medium">Interval:</span> {intervalMinutes} minutes
        </div>
        <div>
          <span className="font-medium">Last Check:</span>{" "}
          {lastCheck ? new Date(lastCheck).toLocaleString() : "Never"}
        </div>
        <div>
          <span className="font-medium">Status:</span>{" "}
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        </div>
      </div>
    </div>
  )
} 