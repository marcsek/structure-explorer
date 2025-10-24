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
          <h6 className="error-dialog-title">Not a valid poset</h6>
          <span className="error-dialog-description">
            Current filters make this predicate's interpretation not form a
            valid poset. Adjust filters or reset the interpretation to fix it.
          </span>
        </div>
      </div>
    </div>
  );
}
