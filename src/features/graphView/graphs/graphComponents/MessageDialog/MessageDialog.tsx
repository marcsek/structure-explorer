import "./MessageDialog.css";

import { faWarning } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function MessageDialog({
  type,
  position,
  title,
  body,
}: {
  type: "error" | "warning" | "info";
  position: "center" | "corner";
  title?: string;
  body: string;
}) {
  return (
    <div className={`error-dialog-container ${type} ${position}`}>
      <div className="error-dialog shadow-sm">
        <span className="error-dialog-icon">
          <FontAwesomeIcon icon={faWarning} />
        </span>
        <div className="error-dialog-body">
          {title && <h6 className="error-dialog-title">{title}</h6>}
          <span className="error-dialog-description">{body}</span>
        </div>
      </div>
    </div>
  );
}
