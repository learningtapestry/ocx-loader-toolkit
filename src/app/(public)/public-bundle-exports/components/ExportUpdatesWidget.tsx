import React from "react";

interface ExportUpdatesWidgetProps {
  exportProgress: {
    status: string;
    progress: number;
    totalActivities: number;
  };
  exportUrl: string;
}

const ExportUpdatesWidget: React.FC<ExportUpdatesWidgetProps> = ({
                                                               exportProgress,
                                                               exportUrl,
                                                             }) => {

  return (
     <div>
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
          <p>{process.env.NEXT_PUBLIC_CLIENT_NAME} Unit loaded successfully!</p>
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
    </div>
  );
};

export default ExportUpdatesWidget;
