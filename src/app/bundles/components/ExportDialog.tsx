import React, { useState } from "react";

import getExportDestinations from "../queries/getAllExportDestinations";
import { useQuery } from "@blitzjs/rpc"

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (exportDestinationId: number) => Promise<void>;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, onExport }) => {
  const [exportDestinations] = useQuery(getExportDestinations, null);

  const [selectedExportDestination, setSelectedExportDestination] = useState<number | null>(null);

  const handleExport = async () => {
    if (selectedExportDestination === null) {
      alert("Please select an export destination.");
      return;
    }

    await onExport(selectedExportDestination);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
          width: "300px",
        }}
      >
        <h2>Select Export Destination</h2>
        <select
          value={selectedExportDestination ?? ""}
          onChange={(e) => setSelectedExportDestination(Number(e.target.value))}
          style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
        >
          <option value="" disabled>
            Select destination
          </option>
          {exportDestinations.map((dest) => (
            <option key={dest.id} value={dest.id}>
              {dest.name}
            </option>
          ))}
        </select>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ marginRight: "0.5rem" }}
          >
            Cancel
          </button>
          <button onClick={handleExport}>Export</button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;

