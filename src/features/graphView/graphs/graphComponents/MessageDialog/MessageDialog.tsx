import "./MessageDialog.css";

import { faInfoCircle, faWarning } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactNode } from "react";

export interface MessageDialogProps {
  type: "error" | "warning" | "info";
  position: "center" | "corner";
  title?: string;
  body: ReactNode;
}

export default function MessageDialog({
  type,
  position,
  title,
  body,
}: MessageDialogProps) {
  return (
    <div className={`message-dialog-container ${type} ${position}`}>
      <div className="message-dialog shadow-sm">
        <span className="message-dialog-icon">
          <FontAwesomeIcon icon={type === "info" ? faInfoCircle : faWarning} />
        </span>
        <div className="message-dialog-body">
          {title && <h6 className="message-dialog-title">{title}</h6>}
          <span className="message-dialog-description">{body}</span>
        </div>
      </div>
    </div>
  );
}
