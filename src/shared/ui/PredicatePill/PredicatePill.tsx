import "./PredicatePill.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

interface PredicatePillProps extends Omit<
  React.HTMLAttributes<HTMLLabelElement>,
  "color" | "onChange"
> {
  predicate: string;
  color: string;
  selected?: boolean;
  hovered?: boolean;
  onChange?: () => void;
}

export function PredicatePill({
  predicate,
  color,
  selected = false,
  hovered = false,
  onChange,
  ...props
}: PredicatePillProps) {
  return (
    <label
      {...props}
      className={`predicate-pill ${hovered ? "hovered" : ""} ${!onChange ? "readonly" : ""} ${props.className ?? ""}`}
      style={{ color, ...props.style }}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onChange}
        readOnly={!onChange}
      />
      <span className="predicate-pill-indicator">
        {selected && <FontAwesomeIcon icon={faCheck} />}
      </span>
      <p style={{ color: selected ? color : "" }}>{predicate}</p>
    </label>
  );
}
