import { ClientInfoVar } from "@/src/app/components/ClientInfoVar";
import React from "react";

interface ExportUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportProgress: {
    status: string;
    progress: number;
    totalActivities: number;
  };
  exportUrl: string;
}

const ExportUpdateModal: React.FC<ExportUpdateModalProps> = ({
                                                               isOpen,
                                                               onClose,
                                                               exportProgress,
                                                               exportUrl,
                                                             }) => {
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
        <h2>Syncing Progress</h2>
        {exportProgress.status === "exporting" && (
          <div>
            <p>
              { exportProgress.totalActivities === 0 && "Starting..."

              }
              {
                exportProgress.totalActivities > 0 && `Syncing activities: ${exportProgress.progress} / ${exportProgress.totalActivities}`
              }
            </p>
            <progress
              value={exportProgress.progress}
              max={exportProgress.totalActivities}
              style={{ width: "100%", marginBottom: "1rem" }}
            />
          </div>
        )}
        {exportProgress.status === "exported" && (
          <div>
            <p><ClientInfoVar field="clientName"/> Unit loaded successfully!</p>
            <a
              href={exportUrl}
              target="_blank"
              rel="noreferrer"
              style={{ display: "block", marginBottom: "1rem", color: "blue" }}
            >
              View Unit on Canvas
            </a>
          </div>
        )}
        {exportProgress.status === "failed" && (
          <p style={{ color: "red", marginBottom: "1rem" }}>
            Export failed. Please try again.
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ExportUpdateModal;
