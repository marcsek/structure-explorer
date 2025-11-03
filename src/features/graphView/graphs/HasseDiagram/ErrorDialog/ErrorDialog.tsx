import "./ErrorDialog.css";

import { faWarning } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function ErrorDialog() {
  return (
    <div className="error-dialog-container">
      <div className="error-dialog">
        <span className="error-dialog-icon">
          <FontAwesomeIcon icon={faWarning} />
        </span>
        <div className="error-dialog-body">
          <h6 className="error-dialog-title">Invalid poset</h6>
          <span className="error-dialog-description">
            This predicate’s interpretation does not form a valid poset. Adjust
            it to enable this editor.
          </span>
        </div>
      </div>
    </div>
  );
}
